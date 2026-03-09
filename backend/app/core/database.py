from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from .config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    
    def __init__(self):
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        try:
            self.client = MongoClient(settings.MONGODB_URL)
            self.db = self.client[settings.DATABASE_NAME]
            # Test connection
            self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {settings.DATABASE_NAME}")
        except ConnectionFailure as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise
    
    def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    def get_collection(self, name):
        """Get collection by name"""
        return self.db[name]

# Singleton instance
db = Database()