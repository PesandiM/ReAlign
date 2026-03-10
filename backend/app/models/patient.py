from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid

class PatientBase(BaseModel):
    patient_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    contact_no: str
    age: int
    gender: str  # 'Male', 'Female', 'Non Binary'

class PatientCreate(PatientBase):
    """Schema for creating a patient"""
    password: str  # For creating user account

class Patient(PatientBase):
    """Schema for patient response"""
    user_id: Optional[str] = None  # Reference to User collection
    createdAt: datetime = Field(default_factory=datetime.now)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }