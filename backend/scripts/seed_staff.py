from pymongo import MongoClient
import os
import sys
import uuid
from datetime import datetime, time

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def seed_therapists():
    """Seed initial therapist data"""
    print(f"Connecting to MongoDB: {settings.MONGODB_URL}")
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # Therapist data (no login credentials)
    therapists = [
        {
            "therapist_id": str(uuid.uuid4()),
            "name": "Dr. Sarah Chen",
            "bio": "Dr. Chen specializes in spinal adjustments and sports injuries with over 10 years of experience.",
            "is_available": True,
            "createdAt": datetime.now()
        },
        {
            "therapist_id": str(uuid.uuid4()),
            "name": "Michael Perera",
            "bio": "Certified massage therapist specializing in deep tissue, sports massage, and myofascial release.",
            "is_available": True,
            "createdAt": datetime.now()
        },
        {
            "therapist_id": str(uuid.uuid4()),
            "name": "Dr. Amal Fernando",
            "bio": "Dr. Fernando focuses on rehabilitation and movement therapy for post-injury recovery.",
            "is_available": True,
            "createdAt": datetime.now()
        }
    ]
    
    # Insert therapists
    result = db.therapists.insert_many(therapists)
    print(f"✅ Inserted {len(result.inserted_ids)} therapists")
    
    # Sample availability
    from datetime import date, timedelta
    import random
    
    availability = []
    for therapist in therapists:
        # Add 5 days of availability
        for i in range(5):
            avail_date = date.today() + timedelta(days=i+1)
            
            # Morning slot
            availability.append({
                "availability_id": str(uuid.uuid4()),
                "therapist_id": therapist["therapist_id"],
                "date": avail_date.isoformat(),
                "start_time": "09:00",
                "end_time": "12:00",
                "is_booked": False,
                "createdAt": datetime.now()
            })
            
            # Afternoon slot
            availability.append({
                "availability_id": str(uuid.uuid4()),
                "therapist_id": therapist["therapist_id"],
                "date": avail_date.isoformat(),
                "start_time": "14:00",
                "end_time": "17:00",
                "is_booked": False,
                "createdAt": datetime.now()
            })
    
    result = db.availability.insert_many(availability)
    print(f"✅ Inserted {len(result.inserted_ids)} availability slots")
    
    client.close()
    print("✅ Therapist seeding completed")

if __name__ == "__main__":
    seed_therapists()