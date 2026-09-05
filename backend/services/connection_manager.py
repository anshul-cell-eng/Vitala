import time
import asyncio
from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect

try:
    from .hsi_engine import calculate_hsi
    from .db import log_telemetry_entry, get_latest_doctor_note, get_telemetry_history
    from .alerting_service import evaluate_and_dispatch_alerts
    from ..utils.helpers import status_for_aqi, status_for_motion
except ImportError:
    from services.hsi_engine import calculate_hsi
    from services.db import log_telemetry_entry, get_latest_doctor_note, get_telemetry_history
    from services.alerting_service import evaluate_and_dispatch_alerts
    from utils.helpers import status_for_aqi, status_for_motion

def default_node_state(node_id: str) -> dict:
    """Seed state for a node before receiving live data, with DB history fallback."""
    history = get_telemetry_history(node_id, limit=1)
    if history:
        last = history[0]
        latest_note = get_latest_doctor_note(node_id)
        last["latestDoctorNote"] = latest_note
        return last

    latest_note = get_latest_doctor_note(node_id)
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
        "latestDoctorNote": latest_note,
        "timestamp": time.time(),
    }

class ConnectionManager:
    def __init__(self):
        self.dashboard_clients: Set[WebSocket] = set()
        self.node_states: Dict[str, dict] = {
            "ESP32-NODE-04": default_node_state("ESP32-NODE-04")
        }

    async def connect_dashboard(self, websocket: WebSocket):
        await websocket.accept()
        self.dashboard_clients.add(websocket)
        for node_data in self.node_states.values():
            await websocket.send_json(node_data)

    def disconnect_dashboard(self, websocket: WebSocket):
        self.dashboard_clients.discard(websocket)

    async def broadcast_telemetry(self, data: dict):
        """Broadcasts real-time hardware data to all connected Web/Vercel dashboards."""
        for client in list(self.dashboard_clients):
            try:
                await client.send_json(data)
            except (WebSocketDisconnect, RuntimeError):
                self.disconnect_dashboard(client)

    async def apply_update(self, node_id: str, fields: dict):
        """Merges partial sensor readings, evaluates alerts, persists to DB, and broadcasts."""
        state = self.node_states.get(node_id, default_node_state(node_id))
        state.update(fields)
        state["connectionStatus"] = "LIVE_HARDWARE"

        if "aqiPpm" in fields:
            state["mq135Status"] = status_for_aqi(state["aqiPpm"])

        if any(k in fields for k in ["accelX", "accelY", "accelZ"]):
            magnitude = (state["accelX"]**2 + state["accelY"]**2 + state["accelZ"]**2) ** 0.5
            state["accelMagnitude"] = round(magnitude, 2)
            state["motionStatus"] = status_for_motion(magnitude)

        state["hsiScore"] = calculate_hsi(
            state["ambientTemp"], state["humidity"], state["heartRate"]
        )
        state["timestamp"] = time.time()

        # Attach latest doctor note
        state["latestDoctorNote"] = get_latest_doctor_note(node_id)

        self.node_states[node_id] = state

        # 1. Persist telemetry update to SQLite/Postgres DB
        log_telemetry_entry(node_id, state)

        # 2. Check for emergency hazard/impact alerts and proactive dispatch
        alert = evaluate_and_dispatch_alerts(node_id, state)
        if alert:
            await self.broadcast_telemetry({
                "type": "emergency_alert",
                "alert": alert
            })

        # 3. Broadcast updated telemetry state to all connected dashboard websockets
        await self.broadcast_telemetry(state)

manager = ConnectionManager()
