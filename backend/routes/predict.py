from fastapi import APIRouter, HTTPException

try:
    from ..models.schemas import PredictRequest, PredictResponse
    from ..services.risk_assessment import classify_threat_state
except ImportError:
    from models.schemas import PredictRequest, PredictResponse
    from services.risk_assessment import classify_threat_state

router = APIRouter(tags=["AI / TinyML Inference Engine"])

@router.post("/api/v1/predict", response_model=PredictResponse)
@router.post("/predict", response_model=PredictResponse)
async def predict_risk(request: PredictRequest):
    """
    Evaluates multi-modal physiological and environmental inputs to classify
    active disaster hazard mode and compute Heat Strain Index (HSI).
    """
    try:
        result = classify_threat_state(
            temp=request.ambientTemp if request.ambientTemp is not None else 24.5,
            humidity=request.humidity if request.humidity is not None else 48.0,
            hr=request.heartRate if request.heartRate is not None else 74.0,
            spo2=request.spO2 if request.spO2 is not None else 98.0,
            aqi=request.aqiPpm if request.aqiPpm is not None else 42.0,
            accel_mag=request.accelMagnitude if request.accelMagnitude is not None else 9.81
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
