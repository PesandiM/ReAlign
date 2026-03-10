from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime

# Use absolute imports from app, not from . (which would cause circular import)
from app.core.database import db
from app.models.recommendation import Recommendation, RecommendationCreate, SimilarCase

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("/patient/{patient_id}", response_model=List[Recommendation])
async def get_patient_recommendations(patient_id: str):
    """Get patient's recommendations"""
    collection = db.get_collection("recommendations")
    cursor = collection.find(
        {"patient_id": patient_id},
        {"_id": 0}
    ).sort("createdAt", -1).limit(20)
    
    return [Recommendation(**doc) for doc in cursor]

@router.get("/{rec_id}/similar")
async def get_similar_cases(rec_id: str):
    """Get similar cases for a recommendation"""
    collection = db.get_collection("recommendations")
    rec = collection.find_one({"rec_id": rec_id}, {"_id": 0})
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    return {
        "recommendationId": rec_id,
        "similarCases": rec.get("similar_cases", [])
    }