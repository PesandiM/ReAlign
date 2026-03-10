from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid

class UserBase(BaseModel):
    name: str
    email: str
    password: str
    role: str  # 'patient', 'admin'
    lastLogin: Optional[datetime] = None

class UserCreate(UserBase):
    pass

class User(UserBase):
    userId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    createdAt: datetime = Field(default_factory=datetime.now)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }