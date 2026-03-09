from pymongo import MongoClient
import os
import sys
import uuid
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def seed_treatments():
    """Seed treatment data from The Chiro House price chart"""
    print(f"Connecting to MongoDB: {settings.MONGODB_URL}")
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # Clear existing treatments (optional)
    db.treatments.delete_many({})
    
    # Treatment data from price chart
    treatments = [
        # ALIGN - Chiropractic Care
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "New Patient Consultation (Adult)",
            "category": "CHIRO",
            "subCategory": "Consultation",
            "target": "Adult",
            "price": 12000.00,
            "duration": 60,
            "description": "Comprehensive initial assessment including health history review, physical examination, and personalized treatment plan for adult patients.",
            "isActive": True
        },
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "New Patient Consultation (Pediatric)",
            "category": "CHIRO",
            "subCategory": "Consultation",
            "target": "Pediatric (0-14)",
            "price": 10000.00,
            "duration": 45,
            "description": "Gentle, child-friendly initial assessment for patients aged 0-14. Includes developmental screening and age-appropriate chiropractic evaluation.",
            "isActive": True
        },
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "Chiropractic Follow-up (Adult)",
            "category": "CHIRO",
            "subCategory": "Follow-up",
            "target": "Adult",
            "price": 9000.00,
            "duration": 30,
            "description": "Regular adjustment session to maintain spinal alignment and address ongoing concerns. Includes progress assessment and treatment adjustment.",
            "isActive": True
        },
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "Chiropractic Follow-up (Pediatric)",
            "category": "CHIRO",
            "subCategory": "Follow-up",
            "target": "Pediatric (0-14)",
            "price": 7000.00,
            "duration": 20,
            "description": "Gentle follow-up adjustment for children, monitoring development and addressing any discomfort in a calming environment.",
            "isActive": True
        },
        
        # RELEASE - Bodywork Therapies
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "Massage Therapy (90 min)",
            "category": "MASSAGE",
            "subCategory": "Therapeutic Massage",
            "target": "Adult",
            "price": 13000.00,
            "duration": 90,
            "description": "Extended full-body therapeutic massage combining Swedish, deep tissue, and relaxation techniques for maximum stress relief and muscle recovery.",
            "isActive": True
        },
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "Massage Therapy (60 min)",
            "category": "MASSAGE",
            "subCategory": "Therapeutic Massage",
            "target": "Adult",
            "price": 10000.00,
            "duration": 60,
            "description": "Standard therapeutic massage targeting specific problem areas. Perfect for regular maintenance and stress reduction.",
            "isActive": True
        },
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "Gua Sha Treatment",
            "category": "GUA_SHA",
            "subCategory": "Body Treatment",
            "duration": 30,
            "price": 5000.00,
            "description": "Traditional Chinese healing technique using guided scraping tools to improve circulation, reduce muscle tension, and promote healing.",
            "target": "Adult",
            "isActive": True
        },
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "Facial Gua Sha",
            "category": "GUA_SHA",
            "subCategory": "Facial",
            "duration": 30,
            "price": 10000.00,
            "description": "Gentle facial sculpting technique that promotes lymphatic drainage, reduces puffiness, and enhances natural glow. Includes facial massage and gua sha tools.",
            "target": "Adult",
            "isActive": True
        },
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "Assisted Stretch Therapy",
            "category": "STRETCHING",
            "subCategory": "Therapeutic Stretching",
            "duration": 45,
            "price": 9000.00,
            "description": "One-on-one assisted stretching session to improve flexibility, reduce muscle tension, and enhance range of motion. Therapist guides you through targeted stretches.",
            "target": "Adult",
            "isActive": True
        },
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "Dry Cupping",
            "category": "CUPPING",
            "subCategory": "Body Treatment",
            "duration": 30,
            "price": 5000.00,
            "description": "Ancient therapy using suction cups to increase blood flow, reduce muscle tension, and promote healing. Can be combined with massage for enhanced results.",
            "target": "Adult",
            "isActive": True
        },
        
        # THRIVE - Wellness & Movement
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "Yoga Therapy",
            "category": "WELLNESS",
            "subCategory": "Movement",
            "duration": 60,
            "price": 10000.00,
            "description": "Therapeutic yoga session tailored to your specific needs. Combines gentle movements, breathing techniques, and mindfulness to address physical discomfort and stress.",
            "target": "Adult",
            "isActive": True
        },
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "Essentrics Session",
            "category": "WELLNESS",
            "subCategory": "Movement",
            "duration": 45,
            "price": 9000.00,
            "description": "Dynamic stretching and strengthening workout that rebalances the entire body. Improves posture, flexibility, and muscle tone through fluid movements.",
            "target": "Adult",
            "isActive": True
        },
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "Tension + Trauma Release Exercise",
            "category": "WELLNESS",
            "subCategory": "Therapeutic",
            "duration": 60,
            "price": 9000.00,
            "description": "Gentle exercises designed to release deep muscular tension and stress from the body. Helps regulate nervous system and promote relaxation.",
            "target": "Adult",
            "isActive": True
        },
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "Holistic Nutrition (Initial Assessment)",
            "category": "NUTRITION",
            "subCategory": "Consultation",
            "duration": 90,
            "price": 16000.00,
            "description": "Comprehensive nutritional assessment including dietary analysis, health history review, and personalized nutrition plan to support your wellness goals.",
            "target": "Adult",
            "isActive": True
        },
        {
            "treatment_id": str(uuid.uuid4()),
            "name": "Holistic Nutrition (Follow-up)",
            "category": "NUTRITION",
            "subCategory": "Follow-up",
            "duration": 45,
            "price": 7000.00,
            "description": "Follow-up consultation to review progress, adjust nutrition plan, and provide ongoing support for your wellness journey.",
            "target": "Adult",
            "isActive": True
        }
    ]
    
    # Insert treatments
    result = db.treatments.insert_many(treatments)
    print(f" Inserted {len(result.inserted_ids)} treatments")
    
    print("\n" + "="*50)
    print(" TREATMENT DATA SEEDED SUCCESSFULLY!")
    print("="*50)
    print("\n Treatments added by category:")
    
    # Group by category for display
    categories = {}
    for t in treatments:
        cat = t['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(t['name'])
    
    for cat, names in categories.items():
        print(f"\n  {cat}:")
        for name in names:
            print(f"    • {name}")
    
    client.close()

if __name__ == "__main__":
    seed_treatments()