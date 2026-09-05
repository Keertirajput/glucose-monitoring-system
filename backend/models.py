from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime

from database import Base


class GlucoseReading(Base):
    __tablename__ = "glucose_readings"

    id = Column(Integer, primary_key=True, index=True)
    glucose = Column(Float, nullable=False)
    unit = Column(String, default="mg/dL")
    status = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)