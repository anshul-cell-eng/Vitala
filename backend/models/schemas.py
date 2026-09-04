from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator

# --- Ingestion Payloads (matching ESP32 firmware & flexible naming) ---

class HazardPayload(BaseModel):
    node_id: str = Field("ESP32-NODE-04", description="Unique hardware node identifier (e.g., ESP32-NODE-04)")
    temperature: float = Field(..., description="DHT22 ambient temperature in Celsius")
    humidity: float = Field(..., description="DHT22 relative humidity in %")
    mq135_ppm: float = Field(..., description="MQ-135 calibrated air quality in PPM")

    @model_validator(mode='before')
    @classmethod
    def normalize_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if 'nodeId' in data and 'node_id' not in data: data['node_id'] = data['nodeId']
            if 'temp' in data and 'temperature' not in data: data['temperature'] = data['temp']
            if 'ambientTemp' in data and 'temperature' not in data: data['temperature'] = data['ambientTemp']
            if 'hum' in data and 'humidity' not in data: data['humidity'] = data['hum']
            if 'aqiPpm' in data and 'mq135_ppm' not in data: data['mq135_ppm'] = data['aqiPpm']
            if 'gasPpm' in data and 'mq135_ppm' not in data: data['mq135_ppm'] = data['gasPpm']
        return data

class VitalsPayload(BaseModel):
    node_id: str = Field("ESP32-NODE-04", description="Unique hardware node identifier")
    heart_rate: float = Field(..., description="MAX30102 Heart Rate in BPM")
    spo2: float = Field(..., description="MAX30102 Blood Oxygen Saturation in %")

    @model_validator(mode='before')
    @classmethod
    def normalize_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if 'nodeId' in data and 'node_id' not in data: data['node_id'] = data['nodeId']
            if 'heartRate' in data and 'heart_rate' not in data: data['heart_rate'] = data['heartRate']
            if 'bpm' in data and 'heart_rate' not in data: data['heart_rate'] = data['bpm']
            if 'spO2' in data and 'spo2' not in data: data['spo2'] = data['spO2']
        return data

class MotionPayload(BaseModel):
    node_id: str = Field("ESP32-NODE-04", description="Unique hardware node identifier")
    accel_x: float = Field(..., description="MPU-6050 X-axis acceleration in m/s^2")
    accel_y: float = Field(..., description="MPU-6050 Y-axis acceleration in m/s^2")
    accel_z: float = Field(..., description="MPU-6050 Z-axis acceleration in m/s^2")
    gyro_x: float = Field(0.0, description="MPU-6050 X-axis gyroscope in dps")
    gyro_y: float = Field(0.0, description="MPU-6050 Y-axis gyroscope in dps")
    gyro_z: float = Field(0.0, description="MPU-6050 Z-axis gyroscope in dps")

    @model_validator(mode='before')
    @classmethod
    def normalize_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if 'nodeId' in data and 'node_id' not in data: data['node_id'] = data['nodeId']
            if 'accelX' in data and 'accel_x' not in data: data['accel_x'] = data['accelX']
            if 'accelY' in data and 'accel_y' not in data: data['accel_y'] = data['accelY']
            if 'accelZ' in data and 'accel_z' not in data: data['accel_z'] = data['accelZ']
            if 'gyroX' in data and 'gyro_x' not in data: data['gyro_x'] = data['gyroX']
            if 'gyroY' in data and 'gyro_y' not in data: data['gyro_y'] = data['gyroY']
            if 'gyroZ' in data and 'gyro_z' not in data: data['gyro_z'] = data['gyroZ']
        return data

class LocationPayload(BaseModel):
    node_id: str = Field("ESP32-NODE-04", description="Unique hardware node identifier")
    latitude: float = Field(..., description="GPS latitude in decimal degrees")
    longitude: float = Field(..., description="GPS longitude in decimal degrees")
    altitude_m: float = Field(216.0, description="GPS altitude in meters")
    speed_kmh: float = Field(0.0, description="GPS ground speed in km/h")
    satellites: int = Field(8, description="Number of locked satellites")
    fix_valid: bool = Field(True, description="True if valid NMEA fix acquired")

    @model_validator(mode='before')
    @classmethod
    def normalize_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if 'nodeId' in data and 'node_id' not in data: data['node_id'] = data['nodeId']
            if 'lat' in data and 'latitude' not in data: data['latitude'] = data['lat']
            if 'lon' in data and 'longitude' not in data: data['longitude'] = data['lon']
            if 'lng' in data and 'longitude' not in data: data['longitude'] = data['lng']
            if 'altitudeM' in data and 'altitude_m' not in data: data['altitude_m'] = data['altitudeM']
            if 'altitude' in data and 'altitude_m' not in data: data['altitude_m'] = data['altitude']
            if 'speedKmh' in data and 'speed_kmh' not in data: data['speed_kmh'] = data['speedKmh']
            if 'fixValid' in data and 'fix_valid' not in data: data['fix_valid'] = data['fixValid']
        return data

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
