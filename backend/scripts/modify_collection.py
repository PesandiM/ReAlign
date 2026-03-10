import sys
import os
from pymongo import MongoClient
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def add_role_field():
    """Add role field to users collection"""
    print(f"Connecting to MongoDB: {settings.MONGODB_URL}")
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # Update all users without role field to have default role 'patient'
    result = db.users.update_many(
        {"role": {"$exists": False}},
        {"$set": {"role": "patient"}}
    )
    
    print(f"Updated {result.modified_count} users with default role 'patient'")
    
    # Show current users
    users = db.users.find({}, {"_id": 0, "email": 1, "role": 1})
    print("\nCurrent users:")
    for user in users:
        print(f"  • {user.get('email')} - Role: {user.get('role', 'NOT SET')}")
    
    client.close()

if __name__ == "__main__":
    add_role_field()