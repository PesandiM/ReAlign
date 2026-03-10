from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
import uuid

from ...models.treatment import Treatment, TreatmentCreate
from ...core.database import db

router = APIRouter(prefix="/treatments", tags=["treatments"])

async def _to_list(cursor) -> list:
    return [doc async for doc in cursor]


@router.get("/", response_model=List[Treatment])
async def get_treatments(
    category: Optional[str] = None,
    active_only: bool = True
):
    collection = db.get_collection("treatments")

    query = {}
    if active_only:
        query["isActive"] = True
    if category:
        query["category"] = category

    docs = await _to_list(collection.find(query, {"_id": 0}).sort("name", 1))
    return [Treatment(**doc) for doc in docs]


@router.get("/categories")
async def get_categories():
    collection = db.get_collection("treatments")
    pipeline = [
        {"$match": {"isActive": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    cursor = collection.aggregate(pipeline)
    result = await _to_list(cursor)
    return [{"category": item["_id"], "count": item["count"]} for item in result]


@router.get("/{treatment_id}", response_model=Treatment)
async def get_treatment(treatment_id: str):
    collection = db.get_collection("treatments")
    treatment = await collection.find_one({"treatment_id": treatment_id}, {"_id": 0})
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    return Treatment(**treatment)


@router.post("/", response_model=Treatment)
async def create_treatment(treatment_data: TreatmentCreate):
    collection = db.get_collection("treatments")

    existing = await collection.find_one({"name": treatment_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Treatment with this name already exists")

    treatment_dict = treatment_data.dict()
    treatment_dict["treatment_id"] = str(uuid.uuid4())

    await collection.insert_one(treatment_dict)
    return Treatment(**treatment_dict)


@router.put("/{treatment_id}", response_model=Treatment)
async def update_treatment(treatment_id: str, treatment_data: TreatmentCreate):
    collection = db.get_collection("treatments")

    existing = await collection.find_one({"treatment_id": treatment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Treatment not found")

    await collection.update_one(
        {"treatment_id": treatment_id},
        {"$set": treatment_data.dict()}
    )

    updated = await collection.find_one({"treatment_id": treatment_id}, {"_id": 0})
    return Treatment(**updated)


@router.delete("/{treatment_id}")
async def delete_treatment(treatment_id: str):
    collection = db.get_collection("treatments")

    result = await collection.update_one(
        {"treatment_id": treatment_id},
        {"$set": {"isActive": False}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Treatment not found")

    return {"message": "Treatment deactivated successfully"}


@router.post("/{treatment_id}/activate")
async def activate_treatment(treatment_id: str):
    collection = db.get_collection("treatments")

    result = await collection.update_one(
        {"treatment_id": treatment_id},
        {"$set": {"isActive": True}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Treatment not found")

    return {"message": "Treatment activated successfully"}