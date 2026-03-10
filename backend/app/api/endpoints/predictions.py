from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging

from app.core.config import settings
from app.api.services.ml_service import MLService, parse_duration
from app.core.database import db
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predict", tags=["predictions"])

# ── Lazy singleton ────────────────────────────────────────────────────────────
_ml_service: Optional[MLService] = None

def get_ml_service() -> MLService:
    global _ml_service
    if _ml_service is None:
        _ml_service = MLService(models_dir=settings.MODELS_DIR)
    return _ml_service


# ── Request / Response models ─────────────────────────────────────────────────
class PredictRequest(BaseModel):
    symptom_text: str
    age: int = 30
    gender: int = 2          # 1=female, 2=male, 3=non-binary
    had_injury: int = 0
    duration: Optional[str] = None
    patient_id: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/treatment")
async def predict_treatment(req: PredictRequest):
    """Predict treatment category from symptoms"""
    try:
        svc = get_ml_service()
        duration_days = parse_duration(req.duration)
        result = svc.predict_treatment(
            symptom_text=req.symptom_text,
            age=req.age,
            gender=req.gender,
            had_injury=req.had_injury,
            duration_days=duration_days
        )
        return {
            "success": True,
            "data": {
                "recommendation":       result["primary"],
                "recommendation_label": result["primary_label"],
                "description":          result["primary_description"],
                "confidence":           result["confidence"],
                "alternatives":         result["alternatives"],
                "evidence": {
                    "similar_cases":  result["similar_cases"],
                    "match_quality":  "HIGH" if result["rf_confidence"] > 0.5 else "MEDIUM",
                    "total_matches":  len(result["similar_cases"]),
                }
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Treatment prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/severity")
async def predict_severity(req: PredictRequest):
    """Predict symptom severity"""
    try:
        svc = get_ml_service()
        result = svc.predict_severity(req.symptom_text)
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Severity prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/complete")
async def complete_analysis(req: PredictRequest):
    """Full analysis: severity + treatment + similar cases — saves to DB if patient_id given"""
    try:
        svc = get_ml_service()
        result = svc.complete_analysis(
            symptom_text=req.symptom_text,
            age=req.age,
            gender=req.gender,
            had_injury=req.had_injury,
            duration=req.duration
        )

        # ── Hernia safety check ───────────────────────────────────────────────
        hernia_warning = None
        symptom_lower = req.symptom_text.lower()
        rec = result.get('treatment', {}).get('recommendation', '')

        HERNIA_KEYWORDS = ['hernia', 'hernia surgery', 'hernia repair', 'abdominal surgery']
        if any(kw in symptom_lower for kw in HERNIA_KEYWORDS):
            hernia_warning = (
                "We are currently unable to offer treatment to patients who have recently "
                "undergone hernia surgery. Please consult your GP or surgeon before booking. "
                "We recommend waiting at least 3 months post-surgery."
            )
        elif rec == 'MANUAL_THERAPY' and req.had_injury == 1:
            # Flag for staff review if manual therapy recommended with injury history
            result['treatment']['staff_review_required'] = True

        if hernia_warning:
            result['hernia_warning'] = hernia_warning

        # ── Save symptom check to DB ──────────────────────────────────────────
        if req.patient_id:
            gender_label = {1: "Female", 2: "Male", 3: "Non Binary"}.get(req.gender, "Unknown")

            symptom_doc = {
                "symptom_id":   str(uuid.uuid4()),
                "patient_id":   req.patient_id,
                "symptom_text": req.symptom_text,
                "age":          req.age,
                "gender":       gender_label,
                "had_injury":   bool(req.had_injury),
                "duration":     req.duration,
                "created_at":   datetime.utcnow(),
            }
            await db.get_collection('symptoms').insert_one(symptom_doc)

            # Save recommendation
            treatment = result.get("treatment", {})
            severity  = result.get("severity", {})
            rec_doc = {
                "recommendation_id":    str(uuid.uuid4()),
                "patient_id":           req.patient_id,
                "symptom_id":           symptom_doc["symptom_id"],
                "symptom_text":         req.symptom_text,
                "recommended_treatment": treatment.get("recommendation"),
                "treatment_label":      treatment.get("recommendation_label"),
                "treatment_description": treatment.get("description"),
                "alternatives":         treatment.get("alternatives", []),
                "severity_score":       severity.get("score"),
                "severity_level":       severity.get("level"),
                "confidence":           treatment.get("confidence"),
                "created_at":           datetime.utcnow(),
            }
            await db.get_collection('recommendations').insert_one(rec_doc)
            logger.info(f"Saved symptom check for patient {req.patient_id}")

        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Complete analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))