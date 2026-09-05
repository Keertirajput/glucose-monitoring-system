from pydantic import BaseModel, Field


class GlucoseCreate(BaseModel):
    glucose: float = Field(..., gt=0)


class GlucoseResponse(BaseModel):
    id: int
    glucose: float
    unit: str
    status: str
    timestamp: str

    class Config:
        from_attributes = True