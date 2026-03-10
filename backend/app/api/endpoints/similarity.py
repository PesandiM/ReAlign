from fastapi import APIRouter, HTTPException, Query
from datetime import datetime

from app.api.endpoints.predictions import get_ml_service

router = APIRouter(prefix="/similarity", tags=["similarity"])


@router.post("/find")
async def find_similar_cases(
    symptom_text: str,
    top_k: int = Query(5, ge=1, le=20)
):
    """Find similar historical cases"""
    try:
        svc = get_ml_service()
        sim_engine = svc.ensemble.similarity_engine if svc.ensemble else None
        if sim_engine is None:
            raise HTTPException(status_code=503, detail="Similarity engine not available")

        results, match_quality = sim_engine.find_similar(symptom_text, top_k=top_k)

        similar_cases = []
        for r in results:
            similar_cases.append({
                'symptom': r['text'][:150],
                'similarity': r['similarity'],
                'treatment': r.get('metadata', {}).get('treatment_3class', 'UNKNOWN'),
                'age': r.get('metadata', {}).get('age'),
                'gender': r.get('metadata', {}).get('gender')
            })

        return {
            "success": True,
            "data": {
                "query": symptom_text,
                "similar_cases": similar_cases,
                "match_quality": match_quality,
                "total_matches": len(results)
            },
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend")
async def get_similarity_recommendation(symptom_text: str):
    """Get treatment recommendation based on similarity"""
    try:
        svc = get_ml_service()
        sim_engine = svc.ensemble.similarity_engine if svc.ensemble else None
        if sim_engine is None:
            raise HTTPException(status_code=503, detail="Similarity engine not available")

        result = sim_engine.get_recommendation(symptom_text)
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))