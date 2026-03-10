from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid

class SymptomBase(BaseModel):
    symptom_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    description: str
    duration: Optional[str] = None
    pain_area: Optional[str] = None
    had_injury: bool = False

class SymptomCreate(SymptomBase):
    """Schema for creating a symptom record"""
    cleaned_text: Optional[str] = None
    severity_score: Optional[int] = None

class Symptom(SymptomBase):
    """Schema for symptom response"""
    cleaned_text: Optional[str] = None
    severity_score: Optional[int] = None
    createdAt: datetime = Field(default_factory=datetime.now)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }