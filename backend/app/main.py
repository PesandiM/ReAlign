import sys

class _SE:
    pass
class _ER:
    pass
class _FakeMain:
    SimilarityEngine = _SE
    EnsembleRecommender = _ER

sys.modules['__mp_main__'] = _FakeMain()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from .core.config import settings
from .core.database import db
from .api.endpoints import (
    patients, appointments, predictions, 
    similarity, recommendations, treatments,
    therapists,  staff, auth
)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Treatment Prediction and Appointment Scheduling API"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(patients.router, prefix="/api/v1")
app.include_router(appointments.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(similarity.router, prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(treatments.router, prefix="/api/v1")
app.include_router(therapists.router, prefix="/api/v1")
app.include_router(staff.router, prefix="/api/v1")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "endpoints": [
            "/docs",
            "/redoc",
            "/api/v1/patients",
            "/api/v1/therapists",
            "/api/v1/appointments",
            "/api/v1/treatments",
            "/api/v1/recommendations",
            "/api/v1/predict/severity",
            "/api/v1/predict/treatment",
            "/api/v1/predict/complete",
            "/api/v1/similarity/find",
            "/api/v1/similarity/recommend"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected" if db.db else "disconnected",
        "timestamp": datetime.now().isoformat()
    }
@app.on_event("startup")
async def startup_event():
    """Connect to database on startup"""
    db.connect()

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown"""
    db.close()