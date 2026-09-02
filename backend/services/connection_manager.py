import asyncio
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect

try:
    from .hsi_engine import calculate_hsi
    from ..utils.helpers import status_for_aqi, status_for_motion
except ImportError:
    from services.hsi_engine import calculate_hsi
    from utils.helpers import status_for_aqi, status_for_motion

def default_node_state(node_id: str) -> dict:
    """Seed state for a node before receiving live data."""
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
        "timestamp": asyncio.get_event_loop().time(),
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
        """Merges partial sensor readings and broadcasts computed state."""
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
        state["timestamp"] = asyncio.get_event_loop().time()

        self.node_states[node_id] = state
        await self.broadcast_telemetry(state)

manager = ConnectionManager()
