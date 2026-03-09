from typing import Generator
from ..core.database import db

def get_db() -> Generator:
    """Dependency to get database"""
    try:
        yield db
    finally:
        pass

def get_patients_collection():
    """Get patients collection"""
    return db.get_collection("patients")

def get_appointments_collection():
    """Get appointments collection"""
    return db.get_collection("appointments")

def get_symptoms_collection():
    """Get symptoms collection"""
    return db.get_collection("symptoms")

def get_recommendations_collection():
    """Get recommendations collection"""
    return db.get_collection("recommendations")

def get_treatments_collection():
    """Get treatments collection"""
    return db.get_collection("treatments")

def get_therapists_collection():
    """Get therapists collection"""
    return db.get_collection("therapists")