from datetime import date, time, datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid

class AvailabilityBase(BaseModel):
    availability_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    therapist_id: str
    date: date
    start_time: time
    end_time: time
    is_booked: bool = False

class AvailabilityCreate(AvailabilityBase):
    """Schema for creating availability"""
    pass

class Availability(AvailabilityBase):
    """Schema for availability response"""
    createdAt: datetime = Field(default_factory=datetime.now)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            time: lambda v: v.strftime("%H:%M")
        }