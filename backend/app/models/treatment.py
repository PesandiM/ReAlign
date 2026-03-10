from typing import Optional
from pydantic import BaseModel, Field
import uuid

class TreatmentBase(BaseModel):
    treatment_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    subCategory: Optional[str] = None
    target: Optional[str] = None
    price: float
    duration: int
    isActive: bool = True

class TreatmentCreate(TreatmentBase):
    """Schema for creating a treatment"""
    pass

class Treatment(TreatmentBase):
    """Schema for treatment response"""
    pass