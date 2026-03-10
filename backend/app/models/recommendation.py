from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field
import uuid

class SimilarCase(BaseModel):
    """Similar case for explainability"""
    symptom: str
    treatment: str
    similarity: float

class RecommendationBase(BaseModel):
    """Recommendation schema"""
    rec_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    symptom_id: str
    treatment_category: str
    confidence: float
    alternatives: Optional[List[Dict]] = None
    similar_cases: Optional[List[SimilarCase]] = None

class RecommendationCreate(RecommendationBase):
    """Schema for creating a recommendation"""
    pass

class Recommendation(RecommendationBase):
    """Schema for recommendation response"""
    createdAt: datetime = Field(default_factory=datetime.now)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }