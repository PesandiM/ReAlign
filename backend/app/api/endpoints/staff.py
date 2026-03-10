from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, date, timedelta
import uuid
import logging

from ...models.therapist import Therapist, TherapistCreate
from ...models.treatment import Treatment, TreatmentCreate
from ...models.appointment import Appointment
from ...models.availability import Availability, AvailabilityCreate
from ...models.user import User
from ...core.database import db

router = APIRouter(prefix="/staff", tags=["staff"])

logger = logging.getLogger(__name__)


async def _to_list(cursor) -> list:
    return [doc async for doc in cursor]

# ========== DASHBOARD OVERVIEW ==========

@router.get("/dashboard")
async def get_staff_dashboard():
    appointments_col  = db.get_collection("appointments")
    therapists_col    = db.get_collection("therapists")
    treatments_col    = db.get_collection("treatments")
    users_col         = db.get_collection("users")

    today     = date.today().isoformat()

    today_appointments   = await _to_list(appointments_col.find({"date": today},           {"_id": 0}).sort("time", 1))
    pending_appointments = await _to_list(appointments_col.find({"status": "pending"},     {"_id": 0}).sort("date", 1).limit(20))

    total_therapists  = await therapists_col.count_documents({})
    active_therapists = await therapists_col.count_documents({"is_available": True})
    total_treatments  = await treatments_col.count_documents({"isActive": True})
    total_users       = await users_col.count_documents({})
    total_patients    = await users_col.count_documents({"role": "patient"})

    return {
        "overview": {
            "today_appointments":   len(today_appointments),
            "pending_appointments": len(pending_appointments),
            "active_therapists":    active_therapists,
            "total_therapists":     total_therapists,
            "total_treatments":     total_treatments,
            "total_users":          total_users,
            "total_patients":       total_patients,
        },
        "today_appointments":   today_appointments,
        "pending_appointments": pending_appointments[:5],
    }

# ========== APPOINTMENT MANAGEMENT ==========

@router.get("/appointments/pending")
async def get_pending_appointments(limit: int = Query(50, ge=1, le=100)):
    col        = db.get_collection("appointments")
    patients   = db.get_collection("patients")
    treatments = db.get_collection("treatments")

    pending = await _to_list(
        col.find({"status": "pending"}, {"_id": 0})
           .sort([("date", 1), ("time", 1)])
           .limit(limit)
    )

    for appt in pending:
        patient = await patients.find_one(
            {"patient_id": appt["patient_id"]},
            {"_id": 0, "name": 1, "contact_no": 1, "email": 1}
        )
        if patient:
            appt["patient"] = patient

        treatment = await treatments.find_one(
            {"treatment_id": appt["treatment_id"]},
            {"_id": 0, "name": 1, "category": 1, "duration": 1, "price": 1}
        )
        if treatment:
            appt["treatment"] = treatment

    return pending


@router.get("/appointments/all")
async def get_all_appointments(
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=200)
):
    col        = db.get_collection("appointments")
    patients   = db.get_collection("patients")
    treatments = db.get_collection("treatments")

    query = {}
    if status and status != "all":
        query["status"] = status

    appointments = await _to_list(
        col.find(query, {"_id": 0})
           .sort([("date", -1), ("time", 1)])
           .limit(limit)
    )

    for appt in appointments:
        patient = await patients.find_one(
            {"patient_id": appt.get("patient_id")},
            {"_id": 0, "name": 1, "contact_no": 1, "email": 1}
        )
        if patient:
            appt["patient"] = patient

        treatment = await treatments.find_one(
            {"treatment_id": appt.get("treatment_id")},
            {"_id": 0, "name": 1, "category": 1, "duration": 1, "price": 1}
        )
        if treatment:
            appt["treatment"] = treatment

    return appointments


@router.put("/appointments/{appointment_id}/approve")
async def approve_appointment(appointment_id: str):
    col = db.get_collection("appointments")

    appointment = await col.find_one({"appointment_id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    await col.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"status": "confirmed", "updated_at": datetime.now()}}
    )

    # Mark all availability slots covered by this appointment as booked
    if appointment.get("therapist_id") and appointment.get("time"):
        from datetime import datetime as dt, timedelta

        # Look up treatment duration (in minutes, default 30)
        duration_mins = 30
        if appointment.get("treatment_id"):
            treatment = await db.get_collection("treatments").find_one(
                {"treatment_id": appointment["treatment_id"]}, {"duration": 1}
            )
            if treatment and treatment.get("duration"):
                try:
                    duration_mins = int(treatment["duration"])
                except (ValueError, TypeError):
                    duration_mins = 30

        # Build list of all 30-min slot start_times this appointment spans
        appt_start = dt.strptime(appointment["time"], "%H:%M")
        appt_end   = appt_start + timedelta(minutes=duration_mins)

        slot_times = []
        cursor = appt_start
        while cursor < appt_end:
            slot_times.append(cursor.strftime("%H:%M"))
            cursor += timedelta(minutes=30)

        # Mark every matching slot as booked and record appointment_id
        avail_col = db.get_collection("availability")
        for slot_time in slot_times:
            await avail_col.update_one(
                {
                    "therapist_id": appointment["therapist_id"],
                    "date":         appointment["date"],
                    "start_time":   slot_time,
                },
                {"$set": {
                    "is_booked":      True,
                    "appointment_id": appointment["appointment_id"],
                }}
            )

        logger.info(
            f"[Approve] Marked {len(slot_times)} slots booked for appointment "
            f"{appointment_id} ({appointment['time']}–{appt_end.strftime('%H:%M')}, {duration_mins}min)"
        )

    return {"message": "Appointment approved", "appointment_id": appointment_id}


@router.put("/appointments/{appointment_id}/reject")
async def reject_appointment(appointment_id: str, reason: Optional[str] = None):
    col = db.get_collection("appointments")

    result = await col.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"status": "cancelled", "rejection_reason": reason, "updated_at": datetime.now()}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"message": "Appointment rejected", "appointment_id": appointment_id}


@router.post("/appointments/{appointment_id}/sms")
async def send_sms_to_patient(appointment_id: str, payload: dict):
    col = db.get_collection("appointments")
    appointment = await col.find_one({"appointment_id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    message = payload.get("message", "")
    logger.info(f"SMS to patient {appointment.get('patient_id')}: {message}")

    await db.get_collection("notifications").insert_one({
        "type":           "sms",
        "appointment_id": appointment_id,
        "patient_id":     appointment.get("patient_id"),
        "message":        message,
        "sent_at":        datetime.now(),
        "status":         "queued",
    })

    return {"message": "SMS queued successfully", "appointment_id": appointment_id}

# ========== THERAPIST MANAGEMENT ==========

@router.get("/therapists", response_model=List[Therapist])
async def get_all_therapists(include_inactive: bool = False):
    col   = db.get_collection("therapists")
    query = {} if include_inactive else {"is_available": True}
    docs  = await _to_list(col.find(query, {"_id": 0}).sort("name", 1))
    return [Therapist(**d) for d in docs]


@router.post("/therapists", response_model=Therapist)
async def create_therapist(therapist_data: TherapistCreate):
    col = db.get_collection("therapists")

    existing = await col.find_one({"name": therapist_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Therapist already exists")

    therapist_dict = therapist_data.dict()
    therapist_dict["therapist_id"] = str(uuid.uuid4())
    therapist_dict["createdAt"]    = datetime.now()

    await col.insert_one(therapist_dict)
    return Therapist(**therapist_dict)


@router.put("/therapists/{therapist_id}")
async def update_therapist(therapist_id: str, therapist_data: TherapistCreate):
    col = db.get_collection("therapists")

    result = await col.update_one(
        {"therapist_id": therapist_id},
        {"$set": therapist_data.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Therapist not found")

    updated = await col.find_one({"therapist_id": therapist_id}, {"_id": 0})
    return Therapist(**updated)


@router.delete("/therapists/{therapist_id}")
async def delete_therapist(therapist_id: str):
    col = db.get_collection("therapists")

    result = await col.update_one(
        {"therapist_id": therapist_id},
        {"$set": {"is_available": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Therapist not found")

    return {"message": "Therapist deactivated successfully"}

# ========== AVAILABILITY MANAGEMENT ==========

@router.post("/therapists/{therapist_id}/availability")
async def set_therapist_availability(
    therapist_id: str,
    availability_slots: List[AvailabilityCreate]
):
    col = db.get_collection("availability")

    therapist = await db.get_collection("therapists").find_one({"therapist_id": therapist_id})
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")

    created_slots = []
    for slot in availability_slots:
        slot_dict = slot.dict()
        slot_dict["availability_id"] = str(uuid.uuid4())
        slot_dict["therapist_id"]    = therapist_id
        slot_dict["is_booked"]       = False
        slot_dict["createdAt"]       = datetime.now()

        await col.insert_one(slot_dict)
        created_slots.append(Availability(**slot_dict))

    return {"message": f"Added {len(created_slots)} availability slots", "slots": created_slots}


@router.get("/therapists/{therapist_id}/availability")
async def get_therapist_availability(
    therapist_id: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    include_booked: bool = True   # default True so frontend can show booked slots
):
    col   = db.get_collection("availability")
    # Return ALL slots (booked + available) so the calendar shows full picture
    query: dict = {"therapist_id": therapist_id}
    if not include_booked:
        query["is_booked"] = False

    if from_date:
        query["date"] = {"$gte": from_date}
    if to_date:
        query.setdefault("date", {})["$lte"] = to_date

    slots = await _to_list(col.find(query, {"_id": 0}).sort([("date", 1), ("start_time", 1)]))

    # Also fetch appointment details for booked slots so frontend can display patient name
    appts_col = db.get_collection("appointments")
    patients_col = db.get_collection("patients")

    result_slots = []
    for slot in slots:
        entry = {
            "availability_id": slot["availability_id"],
            "date":            slot["date"],
            "start_time":      slot["start_time"],
            "end_time":        slot["end_time"],
            "is_booked":       slot.get("is_booked", False),
            "appointment_id":  slot.get("appointment_id"),
        }
        # If booked, enrich with patient name + treatment
        if slot.get("is_booked") and slot.get("appointment_id"):
            appt = await appts_col.find_one(
                {"appointment_id": slot["appointment_id"]},
                {"patient_id": 1, "treatment_id": 1, "time": 1, "date": 1, "_id": 0}
            )
            if appt:
                patient = await patients_col.find_one(
                    {"patient_id": appt.get("patient_id")},
                    {"name": 1, "_id": 0}
                )
                entry["booked_by"] = patient.get("name") if patient else "Patient"
        result_slots.append(entry)

    return result_slots  # flat list — frontend groups by date

# ========== TREATMENT MANAGEMENT ==========

@router.get("/treatments", response_model=List[Treatment])
async def get_all_treatments(include_inactive: bool = False):
    col   = db.get_collection("treatments")
    query = {} if include_inactive else {"isActive": True}
    docs  = await _to_list(col.find(query, {"_id": 0}).sort("name", 1))
    return [Treatment(**d) for d in docs]


@router.post("/treatments", response_model=Treatment)
async def create_treatment(treatment_data: TreatmentCreate):
    col = db.get_collection("treatments")

    existing = await col.find_one({"name": treatment_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Treatment already exists")

    treatment_dict = treatment_data.dict()
    treatment_dict["treatment_id"] = str(uuid.uuid4())

    await col.insert_one(treatment_dict)
    return Treatment(**treatment_dict)


@router.put("/treatments/{treatment_id}")
async def update_treatment(treatment_id: str, treatment_data: TreatmentCreate):
    col = db.get_collection("treatments")

    result = await col.update_one(
        {"treatment_id": treatment_id},
        {"$set": treatment_data.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Treatment not found")

    updated = await col.find_one({"treatment_id": treatment_id}, {"_id": 0})
    return Treatment(**updated)


@router.delete("/treatments/{treatment_id}")
async def delete_treatment(treatment_id: str):
    col = db.get_collection("treatments")

    result = await col.update_one(
        {"treatment_id": treatment_id},
        {"$set": {"isActive": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Treatment not found")

    return {"message": "Treatment deactivated successfully"}


@router.post("/treatments/{treatment_id}/activate")
async def activate_treatment(treatment_id: str):
    col = db.get_collection("treatments")

    result = await col.update_one(
        {"treatment_id": treatment_id},
        {"$set": {"isActive": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Treatment not found")

    return {"message": "Treatment activated successfully"}

# ========== USER MANAGEMENT ==========

@router.get("/users")
async def get_all_users(role: Optional[str] = None):
    col   = db.get_collection("users")
    query = {"role": role} if role else {}

    users = await _to_list(col.find(query, {"_id": 0, "password": 0}).sort("name", 1))

    if not role or role == "patient":
        patients_col = db.get_collection("patients")
        for user in users:
            if user.get("role") == "patient":
                patient = await patients_col.find_one(
                    {"user_id": user["userId"]},
                    {"_id": 0, "contact_no": 1, "age": 1, "gender": 1}
                )
                if patient:
                    user.update(patient)

    return users