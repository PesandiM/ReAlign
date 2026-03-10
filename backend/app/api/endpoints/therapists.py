from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import uuid

from ...core.database import db

router = APIRouter(prefix="/therapists", tags=["therapists"])

TREATMENT_CATEGORIES = [
    "CHIRO", "MASSAGE", "GUA_SHA", "STRETCHING", "CUPPING", "WELLNESS", "NUTRITION"
]


# ── Models ────────────────────────────────────────────────────────────────────

class TherapistCreate(BaseModel):
    name: str
    bio: Optional[str] = ""
    gender: Optional[str] = ""
    specialities: Optional[List[str]] = []   # list of treatment categories
    is_available: bool = True

class TherapistUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    gender: Optional[str] = None
    specialities: Optional[List[str]] = None
    is_available: Optional[bool] = None

class Therapist(BaseModel):
    therapist_id: str
    name: str
    bio: Optional[str] = ""
    gender: Optional[str] = ""
    specialities: Optional[List[str]] = []
    is_available: bool = True
    createdAt: Optional[datetime] = None

class AvailabilityCreate(BaseModel):
    date: str
    start_time: str
    end_time: str
    is_booked: bool = False

class Availability(BaseModel):
    availability_id: str
    therapist_id: str
    date: str
    start_time: str
    end_time: str
    is_booked: bool = False
    createdAt: Optional[datetime] = None


# ── helpers ───────────────────────────────────────────────────────────────────

async def _to_list(cursor) -> list:
    return [doc async for doc in cursor]

def _clean(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


# ── Therapist CRUD ────────────────────────────────────────────────────────────

@router.get("/", response_model=List[Therapist])
async def get_therapists(include_inactive: bool = False):
    col = db.get_collection("therapists")
    query = {} if include_inactive else {"is_available": True}
    docs = await _to_list(col.find(query, {"_id": 0}))
    return [Therapist(**d) for d in docs]


@router.post("/", response_model=Therapist)
async def create_therapist(data: TherapistCreate):
    col = db.get_collection("therapists")

    # Validate specialities
    invalid = [s for s in (data.specialities or []) if s not in TREATMENT_CATEGORIES]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid specialities: {invalid}")

    doc = data.dict()
    doc["therapist_id"] = str(uuid.uuid4())
    doc["createdAt"] = datetime.utcnow()

    await col.insert_one(doc)
    return Therapist(**_clean(doc))


@router.get("/{therapist_id}", response_model=Therapist)
async def get_therapist(therapist_id: str):
    col = db.get_collection("therapists")
    doc = await col.find_one({"therapist_id": therapist_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Therapist not found")
    return Therapist(**doc)


@router.put("/{therapist_id}", response_model=Therapist)
async def update_therapist(therapist_id: str, data: TherapistUpdate):
    col = db.get_collection("therapists")

    existing = await col.find_one({"therapist_id": therapist_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Therapist not found")

    update = {k: v for k, v in data.dict().items() if v is not None}

    if "specialities" in update:
        invalid = [s for s in update["specialities"] if s not in TREATMENT_CATEGORIES]
        if invalid:
            raise HTTPException(status_code=400, detail=f"Invalid specialities: {invalid}")

    update["updatedAt"] = datetime.utcnow()
    await col.update_one({"therapist_id": therapist_id}, {"$set": update})

    updated = await col.find_one({"therapist_id": therapist_id}, {"_id": 0})
    return Therapist(**updated)


@router.delete("/{therapist_id}")
async def deactivate_therapist(therapist_id: str):
    col = db.get_collection("therapists")
    result = await col.update_one(
        {"therapist_id": therapist_id},
        {"$set": {"is_available": False, "updatedAt": datetime.utcnow()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Therapist not found")
    return {"message": "Therapist deactivated"}


# ── Availability ──────────────────────────────────────────────────────────────

@router.post("/{therapist_id}/availability")
async def add_availability(therapist_id: str, data: AvailabilityCreate):
    col = db.get_collection("availability")
    doc = data.dict()
    doc["availability_id"] = str(uuid.uuid4())
    doc["therapist_id"] = therapist_id
    doc["createdAt"] = datetime.utcnow()
    await col.insert_one(doc)
    return Availability(**_clean(doc))


@router.get("/{therapist_id}/availability")
async def get_therapist_availability(therapist_id: str):
    col = db.get_collection("availability")
    docs = await _to_list(
        col.find(
            {"therapist_id": therapist_id, "is_booked": False},
            {"_id": 0}
        ).sort([("date", 1), ("start_time", 1)])
    )
    return [Availability(**d) for d in docs]