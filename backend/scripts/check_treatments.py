from pymongo import MongoClient
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

def check_treatments():
    """Display all treatments grouped by category"""
    print(f"Connecting to MongoDB: {settings.MONGODB_URL}")
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    treatments = list(db.treatments.find({}, {"_id": 0}).sort("category", 1))
    
    print(f"\nTREATMENTS IN DATABASE ({len(treatments)} total)")
    print("="*60)
    
    categories = {}
    for t in treatments:
        cat = t.get('category', 'OTHER')
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(t)
    
    for cat, items in categories.items():
        print(f"\n{cat} ({len(items)} treatments):")
        print("-" * 40)
        for t in items:
            price = t.get('price', 0)
            duration = t.get('duration', 0)
            status = "✅ Active" if t.get('isActive', True) else "❌ Inactive"
            print(f"  • {t['name']}")
            print(f"    Price: LKR {price:,.0f} | Duration: {duration} min | {status}")
    
    client.close()

if __name__ == "__main__":
    check_treatments()