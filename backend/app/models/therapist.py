from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid

class TherapistBase(BaseModel):
    therapist_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    bio: Optional[str] = None
    is_available: bool = True

class TherapistCreate(TherapistBase):
    """Schema for creating a therapist"""
    pass

class Therapist(TherapistBase):
    """Schema for therapist response"""
    createdAt: datetime = Field(default_factory=datetime.now)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }