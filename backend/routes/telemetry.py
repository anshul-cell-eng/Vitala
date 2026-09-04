import time
import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

try:
    from ..models.schemas import HazardPayload, VitalsPayload, MotionPayload, LocationPayload
    from ..services.connection_manager import manager
    from ..services.hsi_engine import calculate_hsi
    from ..utils.helpers import status_for_aqi
except ImportError:
    from models.schemas import HazardPayload, VitalsPayload, MotionPayload, LocationPayload
    from services.connection_manager import manager
    from services.hsi_engine import calculate_hsi
    from utils.helpers import status_for_aqi

router = APIRouter(tags=["Telemetry Ingestion & Streams"])

@router.post("/api/v1/telemetry/hazard")
async def post_hazard(payload: HazardPayload):
    await manager.apply_update(payload.node_id, {
        "ambientTemp": payload.temperature,
        "humidity": payload.humidity,
        "aqiPpm": payload.mq135_ppm,
    })
    return {"status": "ok"}

@router.post("/api/v1/telemetry/vitals")
async def post_vitals(payload: VitalsPayload):
    await manager.apply_update(payload.node_id, {
        "heartRate": int(payload.heart_rate),
        "spO2": int(payload.spo2),
        "vitalsValid": payload.heart_rate > 0 and payload.spo2 > 0
    })
    return {"status": "ok"}

@router.post("/api/v1/telemetry/motion")
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

@router.post("/api/v1/telemetry/location")
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

@router.get("/api/nodes")
async def get_active_nodes():
    """Returns the current state of all active nodes for dashboard initialization."""
    return {"active_nodes": manager.node_states}

@router.websocket("/ws/dashboard")
async def dashboard_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for VITALA frontend dashboard.
    Streams live hardware telemetry as each sensor fires.
    """
    await manager.connect_dashboard(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_dashboard(websocket)

@router.websocket("/ws/esp32/{node_id}")
async def esp32_endpoint(websocket: WebSocket, node_id: str):
    """Alternate streaming websocket path for hardware nodes."""
    await websocket.accept()
    try:
        while True:
            raw_data = await websocket.receive_text()
            payload = json.loads(raw_data)
            
            aqi = payload.get("aqiPpm", 0)
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
                "mq135Status": status_for_aqi(aqi),
                "hsiScore": hsi_score,
                "connectionStatus": "LIVE_HARDWARE",
                "timestamp": time.time()
            }

            manager.node_states[node_id] = enriched_data
            await manager.broadcast_telemetry(enriched_data)

    except WebSocketDisconnect:
        if node_id in manager.node_states:
            manager.node_states[node_id]["connectionStatus"] = "OFFLINE"
            await manager.broadcast_telemetry(manager.node_states[node_id])
