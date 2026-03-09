from pymongo import MongoClient
import os
from dotenv import load_dotenv
import sys

print("=" * 50)
print("🔍 DEBUGGING MODE")
print("=" * 50)

# Show current directory
print(f"\n Current directory: {os.getcwd()}")

# List files in current directory
print("\n Files in current directory:")
for file in os.listdir('.'):
    if file.endswith('.py') or file == '.env':
        print(f"   - {file}")

# Try to load .env with explicit path
env_path = os.path.join(os.getcwd(), '.env')
print(f"\n Looking for .env at: {env_path}")
print(f"   .env exists: {os.path.exists(env_path)}")

# Load .env file
load_dotenv(env_path, verbose=True)

# Get environment variables
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "realign_db")

print(f"\n Environment variables loaded:")
print(f"   MONGODB_URL: {'Found' if MONGODB_URL else 'Not found'}")
print(f"   DATABASE_NAME: {DATABASE_NAME}")

if MONGODB_URL:
    # Show first 20 chars of URL (with password hidden)
    safe_preview = MONGODB_URL[:20] + "..." if len(MONGODB_URL) > 20 else MONGODB_URL
    print(f"   URL preview: {safe_preview}")
    
    # Check if URL is Atlas format (should have mongodb+srv://)
    if 'mongodb+srv://' in MONGODB_URL:
        print("   ✓ URL format looks like Atlas")
    else:
        print("   URL doesn't look like Atlas format - should start with 'mongodb+srv://'")
else:
    print("\n MONGODB_URL is empty or not found!")
    print("   Please check your .env file content")
    sys.exit(1)

print("\n" + "=" * 50)
print("🔌 Attempting MongoDB Connection")
print("=" * 50)

try:
    # Connect to MongoDB
    print(f"\nConnecting to MongoDB Atlas...")
    client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
    
    # Test the connection
    client.admin.command('ping')
    print(" Successfully connected to MongoDB Atlas!")
    
    # Get database
    db = client[DATABASE_NAME]
    
    # Show database info
    print(f"\n Database Info:")
    print(f"   Name: {db.name}")
    
    # List collections
    collections = db.list_collection_names()
    if collections:
        print(f"   Collections: {collections}")
    else:
        print("   Collections: None (ready to create)")
    
    # Show connection details
    print(f"\n Connection Details:")
    print(f"   Host: {client.HOST}")
    print(f"   Port: {client.PORT}")
    
    # Close connection
    client.close()
    print("\n Connection closed successfully!")
    
except Exception as e:
    print(f"\n Connection failed: {e}")
    
    # Additional debugging for common issues
    print("\n Common Issues:")
    if 'localhost' in str(e):
        print("   • Still trying to connect to localhost - .env file not being read!")
        print("   • Make sure your .env file has the EXACT format:")
        print('     MONGODB_URL=mongodb+srv://PesandiW:LaonNf1hz7dAJUdu@realign-cluster.7kfty9m.mongodb.net/?appName=ReAlign-Cluster')
        print("   • No spaces, no quotes, no angle brackets")
    if 'Authentication' in str(e):
        print("   • Authentication failed - check username/password")
    if 'timed out' in str(e):
        print("   • Connection timeout - check your internet and IP whitelist")