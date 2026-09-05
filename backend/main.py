from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import GlucoseReading
from schemas import GlucoseCreate


# ----------------------------------------
# DATABASE
# ----------------------------------------

Base.metadata.create_all(bind=engine)


# ----------------------------------------
# FASTAPI APP
# ----------------------------------------

app = FastAPI(
    title="IoT Glucose Monitoring System",
    description="Backend API for real-time glucose monitoring",
    version="1.0.0"
)


# ----------------------------------------
# CORS
# ----------------------------------------

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------
# HOME
# ----------------------------------------

@app.get("/")
def home():
    return {
        "message": "Glucose Monitoring API is running"
    }


# ----------------------------------------
# GET LATEST GLUCOSE
# ----------------------------------------

@app.get("/glucose")
def get_glucose(db: Session = Depends(get_db)):

    reading = (
        db.query(GlucoseReading)
        .order_by(GlucoseReading.timestamp.desc())
        .first()
    )

    if reading is None:
        return {
            "message": "No glucose readings available"
        }

    return {
        "glucose": reading.glucose,
        "unit": reading.unit,
        "status": reading.status,
        "timestamp": reading.timestamp
    }


# ----------------------------------------
# POST NEW GLUCOSE READING
# ----------------------------------------

@app.post("/glucose")
def add_glucose(
    data: GlucoseCreate,
    db: Session = Depends(get_db)
):

    glucose = data.glucose

    # Demo/project thresholds
    if glucose < 70:
        status = "Low"

    elif glucose > 180:
        status = "High"

    else:
        status = "Normal"

    reading = GlucoseReading(
        glucose=glucose,
        unit="mg/dL",
        status=status
    )

    db.add(reading)
    db.commit()
    db.refresh(reading)

    return {
        "message": "Glucose reading added",
        "id": reading.id,
        "glucose": reading.glucose,
        "unit": reading.unit,
        "status": reading.status,
        "timestamp": reading.timestamp
    }


# ----------------------------------------
# GET GLUCOSE HISTORY
# ----------------------------------------

@app.get("/glucose/history")
def get_glucose_history(
    db: Session = Depends(get_db)
):

    readings = (
        db.query(GlucoseReading)
        .order_by(GlucoseReading.timestamp.asc())
        .all()
    )

    return [
        {
            "id": reading.id,
            "glucose": reading.glucose,
            "unit": reading.unit,
            "status": reading.status,
            "timestamp": reading.timestamp
        }

        for reading in readings
    ]
# ----------------------------------------
# GET AVERAGE GLUCOSE
# ----------------------------------------

@app.get("/glucose/average")
def get_average_glucose(
    db: Session = Depends(get_db)
):

    readings = db.query(GlucoseReading).all()

    if not readings:
        return {
            "average": 0,
            "unit": "mg/dL"
        }

    total = sum(reading.glucose for reading in readings)

    average = total / len(readings)

    return {
        "average": round(average, 2),
        "unit": "mg/dL",
        "readings_count": len(readings)
    }
# ----------------------------------------
# GET GLUCOSE ALERTS
# ----------------------------------------

@app.get("/glucose/alerts")
def get_glucose_alerts(
    db: Session = Depends(get_db)
):

    readings = (
        db.query(GlucoseReading)
        .order_by(GlucoseReading.timestamp.desc())
        .all()
    )

    alerts = []

    for reading in readings:

        if reading.glucose < 70:

            alerts.append({
                "id": reading.id,
                "glucose": reading.glucose,
                "status": "Low",
                "message": "Low glucose detected",
                "timestamp": reading.timestamp
            })

        elif reading.glucose > 180:

            alerts.append({
                "id": reading.id,
                "glucose": reading.glucose,
                "status": "High",
                "message": "High glucose detected",
                "timestamp": reading.timestamp
            })

    return alerts