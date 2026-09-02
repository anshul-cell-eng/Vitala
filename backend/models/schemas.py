from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Ingestion Payloads (matching ESP32 firmware) ---

class HazardPayload(BaseModel):
    node_id: str = Field(..., description="Unique hardware node identifier (e.g., ESP32-NODE-04)")
    temperature: float = Field(..., description="DHT22 ambient temperature in Celsius")
    humidity: float = Field(..., description="DHT22 relative humidity in %")
    mq135_ppm: float = Field(..., description="MQ-135 calibrated air quality in PPM")

class VitalsPayload(BaseModel):
    node_id: str = Field(..., description="Unique hardware node identifier")
    heart_rate: float = Field(..., description="MAX30102 Heart Rate in BPM")
    spo2: float = Field(..., description="MAX30102 Blood Oxygen Saturation in %")

class MotionPayload(BaseModel):
    node_id: str = Field(..., description="Unique hardware node identifier")
    accel_x: float = Field(..., description="MPU-6050 X-axis acceleration in m/s^2")
    accel_y: float = Field(..., description="MPU-6050 Y-axis acceleration in m/s^2")
    accel_z: float = Field(..., description="MPU-6050 Z-axis acceleration in m/s^2")
    gyro_x: float = Field(..., description="MPU-6050 X-axis gyroscope in dps")
    gyro_y: float = Field(..., description="MPU-6050 Y-axis gyroscope in dps")
    gyro_z: float = Field(..., description="MPU-6050 Z-axis gyroscope in dps")

class LocationPayload(BaseModel):
    node_id: str = Field(..., description="Unique hardware node identifier")
    latitude: float = Field(..., description="GPS latitude in decimal degrees")
    longitude: float = Field(..., description="GPS longitude in decimal degrees")
    altitude_m: float = Field(..., description="GPS altitude in meters")
    speed_kmh: float = Field(..., description="GPS ground speed in km/h")
    satellites: int = Field(..., description="Number of locked satellites")
    fix_valid: bool = Field(..., description="True if valid NMEA fix acquired")

# --- AI Prediction & Inference Models ---

class PredictRequest(BaseModel):
    heartRate: Optional[float] = Field(74.0, description="Heart Rate in BPM")
    spO2: Optional[float] = Field(98.0, description="SpO2 in %")
    ambientTemp: Optional[float] = Field(24.5, description="Ambient Temperature in C")
    humidity: Optional[float] = Field(48.0, description="Relative Humidity in %")
    aqiPpm: Optional[float] = Field(42.0, description="Air quality in PPM")
    accelMagnitude: Optional[float] = Field(9.81, description="Acceleration magnitude in m/s^2")

class PredictResponse(BaseModel):
    status: str
    hsiScore: float
    riskLevel: str
    activeMode: str
    modeDescription: str
    recommendations: list[str]
    inferenceLatencyMs: float

# --- Node State Schema ---

class NodeState(BaseModel):
    nodeId: str
    heartRate: float
    spO2: float
    vitalsValid: bool
    ambientTemp: float
    humidity: float
    aqiPpm: float
    mq135Status: str
    hsiScore: float
    accelX: float
    accelY: float
    accelZ: float
    gyroX: float
    gyroY: float
    gyroZ: float
    accelMagnitude: float
    motionStatus: str
    latitude: float
    longitude: float
    altitudeM: float
    speedKmh: float
    satellites: int
    gpsFixValid: bool
    connectionStatus: str
    timestamp: float
