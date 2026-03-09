#!/usr/bin/env python
"""Initialize database with collections and indexes"""

from pymongo import MongoClient, ASCENDING, DESCENDING
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def init_database():
    """Initialize database collections and indexes"""
    print(f"Connecting to MongoDB: {settings.MONGODB_URL}")
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # Create collections (they'll be created automatically on first insert)
    # But we'll create indexes
    
    # Patients collection
    db.patients.create_index("patient_id", unique=True)
    db.patients.create_index("email", unique=True, sparse=True)
    db.patients.create_index("phone")
    
    # Therapists collection
    db.therapists.create_index("therapist_id", unique=True)
    db.therapists.create_index("email", unique=True)
    
    # Treatments collection
    db.treatments.create_index("treatment_id", unique=True)
    db.treatments.create_index("name")
    db.treatments.create_index("category")
    
    # Symptoms collection
    db.symptoms.create_index("symptom_id", unique=True)
    db.symptoms.create_index("patient_id")
    db.symptoms.create_index([("created_at", DESCENDING)])
    
    # Recommendations collection
    db.recommendations.create_index("recommendation_id", unique=True)
    db.recommendations.create_index("patient_id")
    db.recommendations.create_index([("created_at", DESCENDING)])
    
    # Appointments collection
    db.appointments.create_index("appointment_id", unique=True)
    db.appointments.create_index("patient_id")
    db.appointments.create_index([("date", ASCENDING), ("time", ASCENDING)])
    db.appointments.create_index("status")
    
    print("✅ Database initialized successfully")
    print(f"   Database: {settings.DATABASE_NAME}")
    print("   Indexes created for all collections")
    
    client.close()

if __name__ == "__main__":
    init_database()