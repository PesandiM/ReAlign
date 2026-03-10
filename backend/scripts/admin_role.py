import sys
import os
import uuid
from datetime import datetime
from pymongo import MongoClient
from passlib.context import CryptContext

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    print(f"Connecting to MongoDB: {settings.MONGODB_URL}")
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    admin_email = "admin@chirohouse.lk"
    admin_password = "admin@chirohouse"
    
    # Check if admin already exists
    existing = db.users.find_one({"email": admin_email})
    if existing:
        print(f"Admin user already exists with email: {admin_email}")
        client.close()
        return
    
    # Hash password
    hashed_password = pwd_context.hash(admin_password)
    
    # Create admin user
    admin_user = {
        "userId": str(uuid.uuid4()),
        "name": "System Admin",
        "email": admin_email,
        "password": hashed_password,
        "role": "admin",  # Admin role
        "createdAt": datetime.now(),
        "lastLogin": None
    }
    
    db.users.insert_one(admin_user)
    
    print(f"Admin user created successfully!")
    print(f"   Email: {admin_email}")
    print(f"   Password: {admin_password}")
    print(f"   Role: admin")
    
    client.close()

if __name__ == "__main__":
    create_admin()