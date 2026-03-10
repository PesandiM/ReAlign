from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, date
import uuid

from app.core.database import db
from app.models.appointment import Appointment, AppointmentCreate
from app.models.availability import Availability

router = APIRouter(prefix="/appointments", tags=["appointments"])

@router.post("/", response_model=Appointment)
async def create_appointment(appointment_data: AppointmentCreate):
    """Create a new appointment"""
    appointments_collection = db.get_collection("appointments")
    
    # Check if patient exists
    patients_collection = db.get_collection("patients")
    patient = await patients_collection.find_one({"patient_id": appointment_data.patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if treatment exists
    treatments_collection = db.get_collection("treatments")
    treatment = await treatments_collection.find_one({"treatment_id": appointment_data.treatment_id})
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    
    # Check if time slot is available
    if appointment_data.therapist_id:
        availability_collection = db.get_collection("availability")
        slot = await availability_collection.find_one({
            "therapist_id": appointment_data.therapist_id,
            "date": appointment_data.date,
            "start_time": appointment_data.time,
            "is_booked": False
        })
        if not slot:
            raise HTTPException(status_code=400, detail="Selected time slot not available")
    
    # Create appointment
    appointment_dict = appointment_data.dict()
    appointment_dict["appointment_id"] = str(uuid.uuid4())
    appointment_dict["created_at"] = datetime.utcnow()
    appointment_dict["status"] = "pending"
    
    await appointments_collection.insert_one(appointment_dict)
    
    # Mark availability as booked if therapist specified
    if appointment_data.therapist_id:
        availability_collection = db.get_collection("availability")
        await availability_collection.update_one(
            {
                "therapist_id": appointment_data.therapist_id,
                "date": appointment_data.date,
                "start_time": appointment_data.time
            },
            {"$set": {"is_booked": True}}
        )
    
    return Appointment(**appointment_dict)

@router.get("/", response_model=List[Appointment])
async def get_appointments(
    patient_id: Optional[str] = None,
    therapist_id: Optional[str] = None,
    date: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100
):
    """Get appointments with filters"""
    collection = db.get_collection("appointments")
    
    query = {}
    if patient_id:
        query["patient_id"] = patient_id
    if therapist_id:
        query["therapist_id"] = therapist_id
    if date:
        query["date"] = date
    if status:
        query["status"] = status
    
    cursor = collection.find(query).sort([("date", 1), ("time", 1)]).limit(limit)
    appointments = await cursor.to_list(length=limit)
    
    # Enrich with patient and treatment details
    patients_collection = db.get_collection("patients")
    treatments_collection = db.get_collection("treatments")
    therapists_collection = db.get_collection("therapists")
    
    for apt in appointments:
        # Add patient info
        patient = await patients_collection.find_one(
            {"patient_id": apt.get("patient_id")},
            {"_id": 0, "name": 1, "email": 1, "phone": 1}
        )
        if patient:
            apt["patient"] = patient
        
        # Add treatment info
        treatment = await treatments_collection.find_one(
            {"treatment_id": apt.get("treatment_id")},
            {"_id": 0, "name": 1, "category": 1, "duration": 1, "price": 1}
        )
        if treatment:
            apt["treatment"] = treatment
        
        # Add therapist info
        if apt.get("therapist_id"):
            therapist = await therapists_collection.find_one(
                {"therapist_id": apt.get("therapist_id")},
                {"_id": 0, "name": 1, "specialization": 1}
            )
            if therapist:
                apt["therapist"] = therapist
    
    return [Appointment(**a) for a in appointments]

@router.get("/{appointment_id}", response_model=Appointment)
async def get_appointment(appointment_id: str):
    """Get appointment by ID"""
    collection = db.get_collection("appointments")
    appointment = await collection.find_one({"appointment_id": appointment_id})
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return Appointment(**appointment)

@router.put("/{appointment_id}/confirm")
async def confirm_appointment(appointment_id: str):
    """Confirm an appointment"""
    collection = db.get_collection("appointments")
    
    result = await collection.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"status": "confirmed", "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return {"message": "Appointment confirmed", "appointment_id": appointment_id}

@router.put("/{appointment_id}/cancel")
async def cancel_appointment(appointment_id: str, reason: Optional[str] = None):
    """Cancel an appointment"""
    appointments_collection = db.get_collection("appointments")
    
    # Get appointment to free up availability
    appointment = await appointments_collection.find_one({"appointment_id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Free up availability if therapist was assigned
    if appointment.get("therapist_id"):
        availability_collection = db.get_collection("availability")
        await availability_collection.update_one(
            {
                "therapist_id": appointment["therapist_id"],
                "date": appointment["date"],
                "start_time": appointment["time"]
            },
            {"$set": {"is_booked": False}}
        )
    
    # Update appointment status
    result = await appointments_collection.update_one(
        {"appointment_id": appointment_id},
        {
            "$set": {
                "status": "cancelled", 
                "cancellation_reason": reason,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Appointment cancelled", "appointment_id": appointment_id}

@router.put("/{appointment_id}/complete")
async def complete_appointment(appointment_id: str):
    """Mark appointment as completed"""
    collection = db.get_collection("appointments")
    
    result = await collection.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"status": "completed", "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return {"message": "Appointment marked as completed", "appointment_id": appointment_id}

@router.put("/{appointment_id}/reschedule")
async def reschedule_appointment(
    appointment_id: str,
    new_date: str,
    new_time: str,
    therapist_id: Optional[str] = None
):
    """Reschedule an appointment"""
    appointments_collection = db.get_collection("appointments")
    
    # Get current appointment
    appointment = await appointments_collection.find_one({"appointment_id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check if new time slot is available
    availability_collection = db.get_collection("availability")
    therapist = therapist_id or appointment.get("therapist_id")
    
    if therapist:
        slot = await availability_collection.find_one({
            "therapist_id": therapist,
            "date": new_date,
            "start_time": new_time,
            "is_booked": False
        })
        if not slot:
            raise HTTPException(status_code=400, detail="New time slot not available")
    
    # Free up old slot
    if appointment.get("therapist_id"):
        await availability_collection.update_one(
            {
                "therapist_id": appointment["therapist_id"],
                "date": appointment["date"],
                "start_time": appointment["time"]
            },
            {"$set": {"is_booked": False}}
        )
    
    # Book new slot
    if therapist:
        await availability_collection.update_one(
            {
                "therapist_id": therapist,
                "date": new_date,
                "start_time": new_time
            },
            {"$set": {"is_booked": True}}
        )
    
    # Update appointment
    await appointments_collection.update_one(
        {"appointment_id": appointment_id},
        {
            "$set": {
                "date": new_date,
                "time": new_time,
                "therapist_id": therapist,
                "status": "confirmed",
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "Appointment rescheduled successfully",
        "appointment_id": appointment_id,
        "new_date": new_date,
        "new_time": new_time
    }

@router.get("/available-slots")
async def get_available_slots(
    date: str,
    treatment_id: Optional[str] = None,
    therapist_id: Optional[str] = None
):
    """Get available appointment slots for a given date"""
    availability_collection = db.get_collection("availability")
    
    query = {
        "date": date,
        "is_booked": False
    }
    
    if therapist_id:
        query["therapist_id"] = therapist_id
    elif treatment_id:
        # Find therapists who offer this treatment
        therapists_collection = db.get_collection("therapists")
        # This assumes therapists have a treatments array field
        therapists = await therapists_collection.find(
            {"treatments": treatment_id, "is_available": True}
        ).to_list(length=100)
        therapist_ids = [t["therapist_id"] for t in therapists]
        if therapist_ids:
            query["therapist_id"] = {"$in": therapist_ids}
    
    cursor = availability_collection.find(query).sort("start_time", 1)
    slots = await cursor.to_list(length=100)
    
    # Group by therapist
    result = {}
    for slot in slots:
        therapist_id = slot["therapist_id"]
        if therapist_id not in result:
            # Get therapist info
            therapists_collection = db.get_collection("therapists")
            therapist = await therapists_collection.find_one(
                {"therapist_id": therapist_id},
                {"_id": 0, "name": 1, "specialization": 1}
            )
            result[therapist_id] = {
                "therapist": therapist,
                "slots": []
            }
        
        result[therapist_id]["slots"].append({
            "start_time": slot["start_time"],
            "end_time": slot["end_time"],
            "availability_id": slot["availability_id"]
        })
    
    return {
        "date": date,
        "available_slots": list(result.values())
    }