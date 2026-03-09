from pymongo import MongoClient, ASCENDING, DESCENDING
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def create_collections():
    """Create all collections for ReAlign"""
    print(f"Connecting to MongoDB: {settings.MONGODB_URL}")
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print(f"\n Creating collections in database: {settings.DATABASE_NAME}")
    
    # Create collections (they'll be created automatically on first insert)
    # But we'll explicitly create them with validation
    
    # 1. Users collection (for login credentials)
    print("\n Creating users collection...")
    db.create_collection("users")
    db.users.create_index("userId", unique=True)
    db.users.create_index("email", unique=True)
    print("    users collection created with indexes")
    
    # 2. Patients collection
    print("\n Creating patients collection...")
    db.create_collection("patients")
    db.patients.create_index("patient_id", unique=True)
    db.patients.create_index("user_id")
    db.patients.create_index("email", unique=True)
    print("   patients collection created with indexes")
    
    # 3. Therapists collection (for availability only)
    print("\n Creating therapists collection...")
    db.create_collection("therapists")
    db.therapists.create_index("therapist_id", unique=True)
    print("   therapists collection created with indexes")
    
    # 4. Treatments collection
    print("\n Creating treatments collection...")
    db.create_collection("treatments")
    db.treatments.create_index("treatment_id", unique=True)
    db.treatments.create_index("name")
    db.treatments.create_index("category")
    print("   treatments collection created with indexes")
    
    # 5. Appointments collection
    print("\n Creating appointments collection...")
    db.create_collection("appointments")
    db.appointments.create_index("appointment_id", unique=True)
    db.appointments.create_index("patient_id")
    db.appointments.create_index([("date", ASCENDING), ("time", ASCENDING)])
    db.appointments.create_index("status")
    print("    appointments collection created with indexes")
    
    # 6. Availability collection
    print("\n Creating availability collection...")
    db.create_collection("availability")
    db.availability.create_index("availability_id", unique=True)
    db.availability.create_index("therapist_id")
    db.availability.create_index([("date", ASCENDING), ("start_time", ASCENDING)])
    print("   availability collection created with indexes")
    
    # 7. Symptoms collection
    print("\n Creating symptoms collection...")
    db.create_collection("symptoms")
    db.symptoms.create_index("symptom_id", unique=True)
    db.symptoms.create_index("patient_id")
    db.symptoms.create_index([("createdAt", DESCENDING)])
    print("   symptoms collection created with indexes")
    
    # 8. Recommendations collection
    print("\n Creating recommendations collection...")
    db.create_collection("recommendations")
    db.recommendations.create_index("rec_id", unique=True)
    db.recommendations.create_index("patient_id")
    db.recommendations.create_index([("createdAt", DESCENDING)])
    print("   recommendations collection created with indexes")
    
    print("\n" + "="*50)
    print("ALL COLLECTIONS CREATED SUCCESSFULLY!")
    print("="*50)
    print(f"\nDatabase: {settings.DATABASE_NAME}")
    print("Collections created:")
    print("  • users")
    print("  • patients")
    print("  • therapists")
    print("  • treatments")
    print("  • appointments")
    print("  • availability")
    print("  • symptoms")
    print("  • recommendations")
    
    client.close()

if __name__ == "__main__":
    create_collections()