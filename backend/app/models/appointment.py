from datetime import datetime, date, time
from typing import Optional
from pydantic import BaseModel, Field
import uuid

class AppointmentBase(BaseModel):
    appointment_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    treatment_id: str
    therapist_id: Optional[str] = None
    date: date
    time: time
    status: str = "pending"  # pending, confirmed, completed, cancelled

class AppointmentCreate(AppointmentBase):
    """Schema for creating an appointment"""
    pass

class Appointment(AppointmentBase):
    """Schema for appointment response"""
    createdAt: datetime = Field(default_factory=datetime.now)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            time: lambda v: v.strftime("%H:%M")
        }