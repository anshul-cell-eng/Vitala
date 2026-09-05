import os
import sqlite3
import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

DB_PATH = os.getenv("DATABASE_PATH", str(Path(__file__).resolve().parent.parent / "vitala_telemetry.db"))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema for telemetry history, doctor notes, and alert logs."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Telemetry History Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT NOT NULL,
            timestamp REAL NOT NULL,
            heart_rate REAL,
            spo2 REAL,
            vitals_valid INTEGER DEFAULT 1,
            ambient_temp REAL,
            humidity REAL,
            aqi_ppm REAL,
            mq135_status TEXT,
            hsi_score REAL,
            accel_x REAL,
            accel_y REAL,
            accel_z REAL,
            gyro_x REAL,
            gyro_y REAL,
            gyro_z REAL,
            accel_magnitude REAL,
            motion_status TEXT,
            latitude REAL,
            longitude REAL,
            altitude_m REAL,
            speed_kmh REAL,
            satellites INTEGER,
            gps_fix_valid INTEGER DEFAULT 1,
            connection_status TEXT DEFAULT 'LIVE_HARDWARE'
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_node_time ON telemetry_history (node_id, timestamp DESC)")

    # 2. Doctor Notes & Write-Back Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS doctor_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            doctor_name TEXT DEFAULT 'Attending Physician',
            note TEXT NOT NULL,
            recommendation TEXT NOT NULL,
            severity TEXT DEFAULT 'INFO',
            timestamp REAL NOT NULL,
            acknowledged_by_wearer INTEGER DEFAULT 0
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_doctor_notes_node ON doctor_notes (node_id, timestamp DESC)")

    # 3. Emergency Alert Logs Table (Twilio / SMS / Email triggers)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alert_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT NOT NULL,
            alert_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT NOT NULL,
            telemetry_snapshot TEXT,
            channel TEXT DEFAULT 'WEB_ALERT',
            delivered INTEGER DEFAULT 1,
            timestamp REAL NOT NULL
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_node ON alert_logs (node_id, timestamp DESC)")

    conn.commit()
    conn.close()

# Auto-initialize tables on module import
init_db()

def log_telemetry_entry(node_id: str, data: Dict[str, Any]):
    """Persists a telemetry snapshot to SQLite."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        ts = data.get("timestamp", time.time())
        cursor.execute("""
            INSERT INTO telemetry_history (
                node_id, timestamp, heart_rate, spo2, vitals_valid,
                ambient_temp, humidity, aqi_ppm, mq135_status, hsi_score,
                accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z,
                accel_magnitude, motion_status, latitude, longitude,
                altitude_m, speed_kmh, satellites, gps_fix_valid, connection_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            node_id,
            ts,
            data.get("heartRate"),
            data.get("spO2"),
            1 if data.get("vitalsValid", True) else 0,
            data.get("ambientTemp"),
            data.get("humidity"),
            data.get("aqiPpm"),
            data.get("mq135Status", "OPTIMAL"),
            data.get("hsiScore", 0.0),
            data.get("accelX"),
            data.get("accelY"),
            data.get("accelZ"),
            data.get("gyroX"),
            data.get("gyroY"),
            data.get("gyroZ"),
            data.get("accelMagnitude"),
            data.get("motionStatus", "STABLE"),
            data.get("latitude"),
            data.get("longitude"),
            data.get("altitudeM"),
            data.get("speedKmh"),
            data.get("satellites", 8),
            1 if data.get("gpsFixValid", True) else 0,
            data.get("connectionStatus", "LIVE_HARDWARE")
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error logging telemetry to DB: {e}")

def get_telemetry_history(node_id: str, limit: int = 50, hours: float = 24.0) -> List[Dict[str, Any]]:
    """Fetches chronological telemetry history for a patient / node."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cutoff = time.time() - (hours * 3600)
        cursor.execute("""
            SELECT * FROM telemetry_history
            WHERE node_id = ? AND timestamp >= ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (node_id, cutoff, limit))
        rows = cursor.fetchall()
        conn.close()
        
        result = []
        for r in rows:
            result.append({
                "id": r["id"],
                "nodeId": r["node_id"],
                "timestamp": r["timestamp"],
                "heartRate": r["heart_rate"],
                "spO2": r["spo2"],
                "vitalsValid": bool(r["vitals_valid"]),
                "ambientTemp": r["ambient_temp"],
                "humidity": r["humidity"],
                "aqiPpm": r["aqi_ppm"],
                "mq135Status": r["mq135_status"],
                "hsiScore": r["hsi_score"],
                "accelX": r["accel_x"],
                "accelY": r["accel_y"],
                "accelZ": r["accel_z"],
                "gyroX": r["gyro_x"],
                "gyroY": r["gyro_y"],
                "gyroZ": r["gyro_z"],
                "accelMagnitude": r["accel_magnitude"],
                "motionStatus": r["motion_status"],
                "latitude": r["latitude"],
                "longitude": r["longitude"],
                "altitudeM": r["altitude_m"],
                "speedKmh": r["speed_kmh"],
                "satellites": r["satellites"],
                "gpsFixValid": bool(r["gps_fix_valid"]),
                "connectionStatus": r["connection_status"]
            })
        return result
    except Exception as e:
        print(f"Error querying telemetry history: {e}")
        return []

def save_doctor_note(node_id: str, doctor_id: str, doctor_name: str, note: str, recommendation: str, severity: str = "INFO") -> Dict[str, Any]:
    """Stores a doctor recommendation in DB."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        ts = time.time()
        cursor.execute("""
            INSERT INTO doctor_notes (
                node_id, doctor_id, doctor_name, note, recommendation, severity, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (node_id, doctor_id, doctor_name, note, recommendation, severity, ts))
        note_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return {
            "id": note_id,
            "nodeId": node_id,
            "doctorId": doctor_id,
            "doctorName": doctor_name,
            "note": note,
            "recommendation": recommendation,
            "severity": severity,
            "timestamp": ts,
            "acknowledged": False
        }
    except Exception as e:
        print(f"Error saving doctor note: {e}")
        return {}

def get_doctor_notes(node_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieves all doctor notes and prescriptions for a node."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM doctor_notes
            WHERE node_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (node_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [{
            "id": r["id"],
            "nodeId": r["node_id"],
            "doctorId": r["doctor_id"],
            "doctorName": r["doctor_name"],
            "note": r["note"],
            "recommendation": r["recommendation"],
            "severity": r["severity"],
            "timestamp": r["timestamp"],
            "acknowledged": bool(r["acknowledged_by_wearer"])
        } for r in rows]
    except Exception as e:
        print(f"Error retrieving doctor notes: {e}")
        return []

def get_latest_doctor_note(node_id: str) -> Optional[Dict[str, Any]]:
    """Lightweight function for the ESP32 wrist display or status poll."""
    notes = get_doctor_notes(node_id, limit=1)
    return notes[0] if notes else None

def log_alert(node_id: str, alert_type: str, severity: str, message: str, telemetry_snapshot: Optional[dict] = None, channel: str = "AUTOMATED_DISPATCH") -> int:
    """Logs an emergency trigger alert."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        ts = time.time()
        snapshot_json = json.dumps(telemetry_snapshot or {})
        cursor.execute("""
            INSERT INTO alert_logs (
                node_id, alert_type, severity, message, telemetry_snapshot, channel, delivered, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
        """, (node_id, alert_type, severity, message, snapshot_json, channel, ts))
        alert_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return alert_id
    except Exception as e:
        print(f"Error logging alert: {e}")
        return 0

def get_alert_logs(node_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieves past alert dispatches."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM alert_logs
            WHERE node_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (node_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [{
            "id": r["id"],
            "nodeId": r["node_id"],
            "alertType": r["alert_type"],
            "severity": r["severity"],
            "message": r["message"],
            "telemetrySnapshot": json.loads(r["telemetry_snapshot"] or "{}"),
            "channel": r["channel"],
            "delivered": bool(r["delivered"]),
            "timestamp": r["timestamp"]
        } for r in rows]
    except Exception as e:
        print(f"Error retrieving alert logs: {e}")
        return []
