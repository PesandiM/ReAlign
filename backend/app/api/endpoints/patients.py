from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
import uuid
from pydantic import BaseModel

from app.core.database import db
from app.models.patient import Patient, PatientCreate
from app.models.symptom import Symptom, SymptomCreate
from app.models.recommendation import Recommendation
from app.models.appointment import Appointment
from app.api.services.email_service import (
    send_appointment_requested,
    send_appointment_confirmed,
    send_appointment_rejected,
)

router = APIRouter(prefix="/patients", tags=["patients"])

class AppointmentRequestBody(BaseModel):
    treatment_id: str
    preferred_date: str          # ISO date string e.g. "2026-03-15"
    preferred_time: str          # e.g. "10:00"
    therapist_gender: str = "No Preference"   # 'Male' | 'Female' | 'No Preference'
    notes: str = ""

@router.post("/", response_model=Patient)
async def create_patient(patient_data: PatientCreate):
    """Create a new patient"""
    collection = db.get_collection("patients")
    
    # Check if patient already exists
    existing = await collection.find_one({"email": patient_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Patient with this email already exists")
    
    # Create patient
    patient_dict = patient_data.dict()
    patient_dict["patient_id"] = str(uuid.uuid4())
    patient_dict["created_at"] = datetime.utcnow()
    
    await collection.insert_one(patient_dict)
    
    # Also create user account for login
    users_collection = db.get_collection("users")
    user_dict = {
        "userId": str(uuid.uuid4()),
        "name": patient_data.name,
        "email": patient_data.email,
        "password": "placeholder",  # This should be hashed in production
        "role": "patient",
        "patient_id": patient_dict["patient_id"],
        "createdAt": datetime.utcnow()
    }
    await users_collection.insert_one(user_dict)
    
    return Patient(**patient_dict)

@router.delete("/{patient_id}")
async def delete_patient(patient_id: str):
    """Delete a patient (soft delete by marking inactive)"""
    collection = db.get_collection("patients")
    
    result = await collection.update_one(
        {"patient_id": patient_id},
        {"$set": {"is_active": False, "deleted_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {"message": "Patient deactivated successfully"}

# ========== SYMPTOM MANAGEMENT ==========

@router.post("/{patient_id}/symptoms", response_model=Symptom)
async def add_patient_symptom(patient_id: str, symptom_data: SymptomCreate):
    """Add a symptom record for a patient"""
    # Check if patient exists
    patients_collection = db.get_collection("patients")
    patient = await patients_collection.find_one({"patient_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Create symptom
    symptoms_collection = db.get_collection("symptoms")
    symptom_dict = symptom_data.dict()
    symptom_dict["symptom_id"] = str(uuid.uuid4())
    symptom_dict["patient_id"] = patient_id
    symptom_dict["created_at"] = datetime.utcnow()
    
    await symptoms_collection.insert_one(symptom_dict)
    
    return Symptom(**symptom_dict)

@router.get("/{patient_id}/symptoms", response_model=List[Symptom])
async def get_patient_symptoms(
    patient_id: str, 
    limit: int = 20,
    skip: int = 0
):
    """Get patient's symptom history"""
    collection = db.get_collection("symptoms")
    cursor = collection.find(
        {"patient_id": patient_id}
    ).sort("created_at", -1).skip(skip).limit(limit)
    
    symptoms = await cursor.to_list(length=limit)
    return [Symptom(**s) for s in symptoms]

# ========== RECOMMENDATION MANAGEMENT ==========

@router.get("/{patient_id}/recommendations", response_model=List[Recommendation])
async def get_patient_recommendations(
    patient_id: str,
    limit: int = 20
):
    """Get all recommendations for a patient"""
    collection = db.get_collection("recommendations")
    cursor = collection.find(
        {"patient_id": patient_id}
    ).sort("created_at", -1).limit(limit)
    
    recommendations = await cursor.to_list(length=limit)
    return [Recommendation(**r) for r in recommendations]

@router.get("/{patient_id}/recommendations/latest", response_model=Recommendation)
async def get_latest_recommendation(patient_id: str):
    """Get the most recent recommendation for a patient"""
    collection = db.get_collection("recommendations")
    recommendation = await collection.find_one(
        {"patient_id": patient_id},
        sort=[("created_at", -1)]
    )
    
    if not recommendation:
        raise HTTPException(status_code=404, detail="No recommendations found")
    
    return Recommendation(**recommendation)

# ========== APPOINTMENT MANAGEMENT ==========

async def find_patient(identifier: str):
    """Find patient by patient_id OR by linked userId"""
    col = db.get_collection("patients")
    patient = await col.find_one({"patient_id": identifier})
    if not patient:
        # Try matching via users collection — userId → patient lookup
        users_col = db.get_collection("users")
        user = await users_col.find_one({"userId": identifier})
        if user:
            # Try to find patient by email match
            patient = await col.find_one({"email": user.get("email")})
    return patient


@router.get("/{patient_id}", response_model=Patient)
async def get_patient(patient_id: str):
    patient = await find_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return Patient(**{k: v for k, v in patient.items() if k != "_id"})

@router.put("/{patient_id}", response_model=Patient)
async def update_patient(patient_id: str, patient_data: dict):
    col = db.get_collection("patients")

    patient = await find_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    real_patient_id = patient["patient_id"]

    # Only allow safe fields to be updated
    allowed = {"name", "contact_no", "age", "gender"}
    update_data = {k: v for k, v in patient_data.items() if k in allowed}
    update_data["updated_at"] = datetime.utcnow()

    await col.update_one(
        {"patient_id": real_patient_id},
        {"$set": update_data}
    )

    updated = await col.find_one({"patient_id": real_patient_id})
    return Patient(**{k: v for k, v in updated.items() if k != "_id"})

@router.post("/{patient_id}/appointments/request")
async def request_appointment(patient_id: str, body: AppointmentRequestBody):
    import logging
    logger = logging.getLogger(__name__)

    patient = await find_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    real_patient_id = patient["patient_id"]

    treatments_col = db.get_collection("treatments")
    treatment = await treatments_col.find_one({"treatment_id": body.treatment_id})
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")

    appointments_col = db.get_collection("appointments")
    appointment_dict = {
        "appointment_id":        str(uuid.uuid4()),
        "patient_id":            real_patient_id,
        "treatment_id":          body.treatment_id,
        "date":                  body.preferred_date,
        "time":                  body.preferred_time,
        "therapist_gender_pref": body.therapist_gender,
        "notes":                 body.notes,
        "status":                "pending",
        "therapist_id":          None,
        "created_at":            datetime.utcnow(),
        "updated_at":            datetime.utcnow(),
    }
    await appointments_col.insert_one(appointment_dict)

    contact = patient.get("contact_no", "")
    treatment_name = treatment.get("name", "your treatment")

    import asyncio
    patient_email = patient.get("email", "")
    if patient_email:
        asyncio.get_event_loop().run_in_executor(
            None,
            send_appointment_requested,
            patient_email,
            patient.get("name", "Patient"),
            treatment.get("name", "Treatment"),
            body.preferred_date,
            body.preferred_time,
            appointment_dict["appointment_id"],
        )

    # Queue notification record
    await db.get_collection("notifications").insert_one({
        "type":           "email",
        "event":          "appointment_requested",
        "patient_id":     real_patient_id,
        "appointment_id": appointment_dict["appointment_id"],
        "email":          patient_email,
        "sent_at":        datetime.utcnow(),
        "status":         "queued",
    })

@router.get("/{patient_id}/appointments/upcoming", response_model=List[Appointment])
async def get_upcoming_appointments(patient_id: str):
    """Get patient's upcoming appointments"""
    collection = db.get_collection("appointments")
    today = datetime.now().date().isoformat()
    
    query = {
        "patient_id": patient_id,
        "status": {"$in": ["confirmed", "pending"]},
        "date": {"$gte": today}
    }
    
    cursor = collection.find(query).sort("date", 1).sort("time", 1).limit(10)
    appointments = await cursor.to_list(length=10)
    
    return [Appointment(**a) for a in appointments]

@router.get("/{patient_id}/appointments/past", response_model=List[Appointment])
async def get_past_appointments(patient_id: str):
    """Get patient's past appointments"""
    collection = db.get_collection("appointments")
    today = datetime.now().date().isoformat()
    
    query = {
        "patient_id": patient_id,
        "status": "completed",
        "date": {"$lt": today}
    }
    
    cursor = collection.find(query).sort("date", -1).sort("time", -1).limit(20)
    appointments = await cursor.to_list(length=20)
    
    return [Appointment(**a) for a in appointments]

# ========== PATIENT STATISTICS ==========

@router.get("/{patient_id}/stats")
async def get_patient_statistics(patient_id: str):
    """Get patient statistics"""
    appointments_collection = db.get_collection("appointments")
    symptoms_collection = db.get_collection("symptoms")
    recommendations_collection = db.get_collection("recommendations")
    
    # Count appointments
    total_appointments = await appointments_collection.count_documents(
        {"patient_id": patient_id}
    )
    
    upcoming_appointments = await appointments_collection.count_documents({
        "patient_id": patient_id,
        "status": {"$in": ["confirmed", "pending"]},
        "date": {"$gte": datetime.now().date().isoformat()}
    })
    
    completed_appointments = await appointments_collection.count_documents({
        "patient_id": patient_id,
        "status": "completed"
    })
    
    # Count symptoms
    total_symptoms = await symptoms_collection.count_documents(
        {"patient_id": patient_id}
    )
    
    # Count recommendations
    total_recommendations = await recommendations_collection.count_documents(
        {"patient_id": patient_id}
    )
    
    # Get most common treatment
    pipeline = [
        {"$match": {"patient_id": patient_id}},
        {"$group": {"_id": "$treatment_category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    
    cursor = recommendations_collection.aggregate(pipeline)
    most_common = await cursor.to_list(length=1)
    
    return {
        "patient_id": patient_id,
        "statistics": {
            "total_appointments": total_appointments,
            "upcoming_appointments": upcoming_appointments,
            "completed_appointments": completed_appointments,
            "total_symptoms": total_symptoms,
            "total_recommendations": total_recommendations,
            "most_common_treatment": most_common[0]["_id"] if most_common else None
        }
    }

@router.put("/appointments/{appointment_id}/cancel")
async def cancel_appointment(appointment_id: str):
    """Patient cancels their own appointment"""
    col = db.get_collection("appointments")

    result = await col.update_one(
        {"appointment_id": appointment_id, "status": {"$in": ["pending", "confirmed"]}},
        {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found or cannot be cancelled"
        )

    return {"message": "Appointment cancelled", "appointment_id": appointment_id}