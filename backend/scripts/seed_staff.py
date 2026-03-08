# backend/scripts/seed_staff.py
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

async def seed_staff():
    # Connect to MongoDB
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("DATABASE_NAME", "realign_db")]
    
    # Sample staff data
    staff_members = [
        {
            "name": "Dr. Sarah Smith",
            "email": "sarah.smith@chirohouse.lk",
            "phone": "+94 77 123 4567",
            "specialization": "CHIRO",
            "experience": 12,
            "bio": "Dr. Smith specializes in sports injuries and spinal rehabilitation with over 12 years of experience.",
            "hashed_password": "$2b$12$K8ZxQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8",  # password: password123
            "createdAt": datetime.now(),
            "availability": []
        },
        {
            "name": "Dr. Michael Chen",
            "email": "michael.chen@chirohouse.lk",
            "phone": "+94 77 234 5678",
            "specialization": "PHYSIO",
            "experience": 8,
            "bio": "Dr. Chen is an expert in physiotherapy and rehabilitation, helping patients recover from injuries.",
            "hashed_password": "$2b$12$K8ZxQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8",
            "createdAt": datetime.now(),
            "availability": []
        },
        {
            "name": "Emma Wilson",
            "email": "emma.wilson@chirohouse.lk",
            "phone": "+94 77 345 6789",
            "specialization": "MASSAGE",
            "experience": 5,
            "bio": "Emma specializes in deep tissue and sports massage therapy.",
            "hashed_password": "$2b$12$K8ZxQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8",
            "createdAt": datetime.now(),
            "availability": []
        },
        {
            "name": "Dr. James Brown",
            "email": "james.brown@chirohouse.lk",
            "phone": "+94 77 456 7890",
            "specialization": "CHIRO",
            "experience": 15,
            "bio": "Dr. Brown has extensive experience in chiropractic care for chronic pain management.",
            "hashed_password": "$2b$12$K8ZxQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8",
            "createdAt": datetime.now(),
            "availability": []
        },
        {
            "name": "Dr. Lisa Kumar",
            "email": "lisa.kumar@chirohouse.lk",
            "phone": "+94 77 567 8901",
            "specialization": "PHYSIO",
            "experience": 6,
            "bio": "Dr. Kumar focuses on post-surgery rehabilitation and sports physiotherapy.",
            "hashed_password": "$2b$12$K8ZxQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8",
            "createdAt": datetime.now(),
            "availability": []
        }
    ]
    
    # Clear existing staff
    await db.staff.delete_many({})
    
    # Insert new staff
    result = await db.staff.insert_many(staff_members)
    print(f"Inserted {len(result.inserted_ids)} staff members")
    
    # Generate availability for next 7 days
    today = datetime.now()
    for staff_id in result.inserted_ids:
        availability = []
        for i in range(7):
            date = today + timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            
            # Generate time slots
            slots = []
            times = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]
            for time in times:
                slots.append({
                    "startTime": time,
                    "endTime": str(int(time[:2]) + 1) + ":00",
                    "isBooked": False
                })
            
            availability.append({
                "date": date_str,
                "slots": slots
            })
        
        await db.staff.update_one(
            {"_id": staff_id},
            {"$set": {"availability": availability}}
        )
    
    print("Availability generated for next 7 days")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_staff())