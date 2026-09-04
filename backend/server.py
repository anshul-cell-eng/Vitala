import time
import asyncio
import json
import math
from typing import Dict, Set, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="VITALA Tactical Telemetry API - SIH26181")

# Enable CORS for the Web App
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. Data Models ---
class TelemetryPayload(BaseModel):
    nodeId: str
    heartRate: int
    spO2: int
    ambientTemp: float
    humidity: float
    aqiPpm: int

# Matches the JSON the ESP32 hazard node actually POSTs from http_app.c.
class HazardPayload(BaseModel):
    node_id: str
    temperature: float
    humidity: float
    mq135_ppm: float

# Matches the JSON the ESP32 hazard node actually POSTs from http_app.c.
class VitalsPayload(BaseModel):
    node_id: str
    heart_rate: float
    spo2: float

# Matches the JSON the ESP32 hazard node actually POSTs from http_app.c.
class MotionPayload(BaseModel):
    node_id: str
    accel_x: float
    accel_y: float
    accel_z: float
    gyro_x: float
    gyro_y: float
    gyro_z: float

# Matches the JSON the ESP32 hazard node actually POSTs from http_app.c
# (GY-NEO6MV2 GPS module). fix_valid mirrors the NMEA GGA fix quality
# flag - lat/lon/altitude/speed are only meaningful when it's true.
class LocationPayload(BaseModel):
    node_id: str
    latitude: float
    longitude: float
    altitude_m: float
    speed_kmh: float
    satellites: int
    fix_valid: bool

# --- 2. Heat Strain Index (HSI) Engine ---
def calculate_hsi(temp: float, humidity: float, hr: float) -> float:
    """
    Calculates the AI Heat Strain Index based on design document specs.
    Formula: (0.4 * Temp) + (0.3 * Humidity %) + (0.3 * (Heart Rate - 60))
    """
    hr_factor = max(0, hr - 60) # Ensure no negative impact if HR is below 60
    raw_hsi = (0.4 * temp) + (0.3 * humidity) + (0.3 * hr_factor)
    return round(raw_hsi, 1)

def status_for_aqi(aqi: float) -> str:
    """Shared MQ-135 threshold logic (mirrors the alert thresholds in the PRD)."""
    return "HAZARD_ALERT" if aqi > 200 else "WARNING" if aqi > 100 else "OPTIMAL"

def status_for_motion(magnitude: float) -> str:
    """
    Simple impact/fall heuristic: at rest, accel magnitude sits near 1g
    (~9.81 m/s^2) regardless of orientation. A large deviation above that
    suggests a sudden jolt or impact rather than normal movement.
    """
    return "IMPACT_ALERT" if magnitude > 20.0 else "STABLE"

def default_node_state(node_id: str) -> dict:
    """Seed state for a node we haven't heard a full reading from yet."""
    return {
        "nodeId": node_id,
        "heartRate": 74,
        "spO2": 98,
        "vitalsValid": True,
        "ambientTemp": 24.5,
        "humidity": 48.0,
        "aqiPpm": 42,
        "mq135Status": "OPTIMAL",
        "hsiScore": 28.4,
        "accelX": 0.08, "accelY": 0.12, "accelZ": 9.81,
        "gyroX": 0.2, "gyroY": -0.1, "gyroZ": 0.0,
        "accelMagnitude": 9.81,
        "motionStatus": "STABLE",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "altitudeM": 216.0,
        "speedKmh": 0.0,
        "satellites": 8,
        "gpsFixValid": True,
        "connectionStatus": "LIVE_HARDWARE",
        "timestamp": time.time(),
    }

# --- 3. Connection Manager ---
class ConnectionManager:
    def __init__(self):
        # Store connected dashboard clients listening for data
        self.dashboard_clients: Set[WebSocket] = set()
        # Store the latest state of each node to send to new dashboard clients immediately
        self.node_states: Dict[str, dict] = {
            "ESP32-NODE-04": default_node_state("ESP32-NODE-04")
        }

    async def connect_dashboard(self, websocket: WebSocket):
        await websocket.accept()
        self.dashboard_clients.add(websocket)
        # Instantly send the current state of all known nodes upon connection
        for node_data in self.node_states.values():
            await websocket.send_json(node_data)

    def disconnect_dashboard(self, websocket: WebSocket):
        self.dashboard_clients.remove(websocket)

    async def broadcast_telemetry(self, data: dict):
        """Pushes real-time hardware data to all connected React/Web dashboards."""
        for client in list(self.dashboard_clients):
            try:
                await client.send_json(data)
            except WebSocketDisconnect:
                self.disconnect_dashboard(client)

    async def apply_update(self, node_id: str, fields: dict):
        """
        Merges a partial reading (hazard-only or vitals-only) into the
        node's cached state, recomputes derived fields, and broadcasts
        the merged result.
        """
        state = self.node_states.get(node_id, default_node_state(node_id))
        state.update(fields)
        state["connectionStatus"] = "LIVE_HARDWARE"

        if "aqiPpm" in fields:
            state["mq135Status"] = status_for_aqi(state["aqiPpm"])

        if "accelX" in fields or "accelY" in fields or "accelZ" in fields:
            magnitude = (state["accelX"]**2 + state["accelY"]**2 + state["accelZ"]**2) ** 0.5
            state["accelMagnitude"] = round(magnitude, 2)
            state["motionStatus"] = status_for_motion(magnitude)

        state["hsiScore"] = calculate_hsi(
            state["ambientTemp"], state["humidity"], state["heartRate"]
        )
        state["timestamp"] = time.time()

        self.node_states[node_id] = state
        await self.broadcast_telemetry(state)

manager = ConnectionManager()

# --- 4. WebSocket Endpoints ---

@app.websocket("/ws/dashboard")
async def dashboard_endpoint(websocket: WebSocket):
    """
    Endpoint for the VITALA Dashboard. 
    The frontend connects here to receive the live telemetry stream.
    """
    await manager.connect_dashboard(websocket)
    try:
        while True:
            # Keep connection alive; dashboard primarily listens
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_dashboard(websocket)

@app.websocket("/ws/esp32/{node_id}")
async def esp32_endpoint(websocket: WebSocket, node_id: str):
    """
    Alternate streaming websocket path for hardware nodes.
    """
    await websocket.accept()
    try:
        while True:
            raw_data = await websocket.receive_text()
            payload = json.loads(raw_data)
            
            aqi = payload.get("aqiPpm", 0)
            mq135_status = status_for_aqi(aqi)
            
            hsi_score = calculate_hsi(
                payload.get("ambientTemp", 25.0),
                payload.get("humidity", 50.0),
                payload.get("heartRate", 70)
            )

            enriched_data = {
                "nodeId": node_id,
                "heartRate": payload.get("heartRate", 70),
                "spO2": payload.get("spO2", 98),
                "vitalsValid": True,
                "ambientTemp": payload.get("ambientTemp", 25.0),
                "humidity": payload.get("humidity", 50.0),
                "aqiPpm": aqi,
                "mq135Status": mq135_status,
                "hsiScore": hsi_score,
                "connectionStatus": "LIVE_HARDWARE",
                "timestamp": time.time()
            }

            manager.node_states[node_id] = enriched_data
            await manager.broadcast_telemetry(enriched_data)

    except WebSocketDisconnect:
        print(f"Node {node_id} disconnected.")
        if node_id in manager.node_states:
            manager.node_states[node_id]["connectionStatus"] = "OFFLINE"
            await manager.broadcast_telemetry(manager.node_states[node_id])

# --- 5. REST Ingestion (used by the ESP32 hazard node firmware) ---

@app.post("/api/v1/telemetry/hazard")
async def post_hazard(payload: HazardPayload):
    await manager.apply_update(payload.node_id, {
        "ambientTemp": payload.temperature,
        "humidity": payload.humidity,
        "aqiPpm": payload.mq135_ppm,
    })
    return {"status": "ok"}

@app.post("/api/v1/telemetry/vitals")
async def post_vitals(payload: VitalsPayload):
    await manager.apply_update(payload.node_id, {
        "heartRate": int(payload.heart_rate),
        "spO2": int(payload.spo2),
        "vitalsValid": payload.heart_rate > 0 and payload.spo2 > 0
    })
    return {"status": "ok"}

@app.post("/api/v1/telemetry/motion")
async def post_motion(payload: MotionPayload):
    await manager.apply_update(payload.node_id, {
        "accelX": payload.accel_x,
        "accelY": payload.accel_y,
        "accelZ": payload.accel_z,
        "gyroX": payload.gyro_x,
        "gyroY": payload.gyro_y,
        "gyroZ": payload.gyro_z,
    })
    return {"status": "ok"}

@app.post("/api/v1/telemetry/location")
async def post_location(payload: LocationPayload):
    await manager.apply_update(payload.node_id, {
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "altitudeM": payload.altitude_m,
        "speedKmh": payload.speed_kmh,
        "satellites": payload.satellites,
        "gpsFixValid": payload.fix_valid,
    })
    return {"status": "ok"}

# --- 6. Standard REST API (Fallback / Inspection) ---
@app.get("/api/nodes")
async def get_active_nodes():
    """Returns the current state of all active nodes for initial dashboard load."""
    return {"active_nodes": manager.node_states}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "VITALA Telemetry Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
