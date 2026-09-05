import time
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException

try:
    from ..models.schemas import DoctorNotePayload, DoctorNoteResponse
    from ..services.db import (
        save_doctor_note, get_doctor_notes, get_latest_doctor_note,
        get_telemetry_history, get_alert_logs
    )
    from ..services.connection_manager import manager
except ImportError:
    from models.schemas import DoctorNotePayload, DoctorNoteResponse
    from services.db import (
        save_doctor_note, get_doctor_notes, get_latest_doctor_note,
        get_telemetry_history, get_alert_logs
    )
    from services.connection_manager import manager

router = APIRouter(tags=["Doctor Clinical Notes & Telemetry History"])

@router.post("/api/v1/doctor/note", response_model=DoctorNoteResponse)
async def post_doctor_note(payload: DoctorNotePayload):
    """
    Submits a clinical observation and actionable recommendation for a patient node.
    Persists to DB, updates the patient state, and broadcasts immediately over WebSocket
    to all active dashboards and the wearable wrist interface.
    """
    saved_note = save_doctor_note(
        node_id=payload.node_id,
        doctor_id=payload.doctor_id,
        doctor_name=payload.doctor_name or "Attending Physician",
        note=payload.note,
        recommendation=payload.recommendation,
        severity=payload.severity or "INFO"
    )

    if not saved_note or "id" not in saved_note:
        raise HTTPException(status_code=500, detail="Failed to persist doctor note to database")

    # Update in-memory node state so any status poll returns it
    if payload.node_id in manager.node_states:
        manager.node_states[payload.node_id]["latestDoctorNote"] = saved_note

    # Broadcast note write-back over WebSocket
    broadcast_packet = {
        "type": "doctor_note",
        "node_id": payload.node_id,
        "doctor_id": payload.doctor_id,
        "doctor_name": payload.doctor_name or "Attending Physician",
        "note": payload.note,
        "recommendation": payload.recommendation,
        "severity": payload.severity or "INFO",
        "timestamp": saved_note.get("timestamp", time.time())
    }
    await manager.broadcast_telemetry(broadcast_packet)

    return {
        "status": "ok",
        "note_id": saved_note["id"],
        "data": saved_note,
        "broadcast_dispatched": True
    }

@router.get("/api/v1/doctor/notes")
async def list_doctor_notes(node_id: str = Query("ESP32-NODE-04", description="Hardware node ID"), limit: int = 20):
    """Retrieves all clinical notes and prescriptions recorded for a patient node."""
    notes = get_doctor_notes(node_id=node_id, limit=limit)
    return {
        "node_id": node_id,
        "total_notes": len(notes),
        "notes": notes
    }

@router.get("/api/v1/doctor/notes/{node_id}/latest")
async def get_node_latest_doctor_note(node_id: str):
    """
    Lightweight endpoint optimized for ESP32 wrist devices, OLED displays,
    and low-bandwidth tactical radios to fetch the latest doctor instruction.
    """
    latest = get_latest_doctor_note(node_id)
    if not latest:
        return {
            "node_id": node_id,
            "has_note": False,
            "recommendation": "Normal vitals. Continue standard mission protocol.",
            "doctor": "System Autonomic AI",
            "timestamp": time.time()
        }
    return {
        "node_id": node_id,
        "has_note": True,
        "doctor": latest.get("doctorName", "Attending Physician"),
        "doctor_id": latest.get("doctorId"),
        "note": latest.get("note"),
        "recommendation": latest.get("recommendation"),
        "severity": latest.get("severity", "INFO"),
        "timestamp": latest.get("timestamp")
    }

@router.get("/api/v1/telemetry/history")
async def query_telemetry_history(
    node_id: str = Query("ESP32-NODE-04", description="Hardware node ID"),
    limit: int = Query(50, ge=1, le=500),
    hours: float = Query(24.0, ge=0.1, le=168.0)
):
    """
    Returns time-series historical telemetry log from SQLite/Postgres.
    Allows clinicians and doctors to scroll back through a patient's day/week.
    """
    history = get_telemetry_history(node_id=node_id, limit=limit, hours=hours)
    
    # Calculate key statistical aggregates
    valid_hr = [h["heartRate"] for h in history if h.get("heartRate")]
    valid_spo2 = [h["spO2"] for h in history if h.get("spO2")]
    valid_hsi = [h["hsiScore"] for h in history if h.get("hsiScore")]
    
    stats = {
        "sampleCount": len(history),
        "avgHeartRate": round(sum(valid_hr) / len(valid_hr), 1) if valid_hr else 0,
        "minHeartRate": min(valid_hr) if valid_hr else 0,
        "maxHeartRate": max(valid_hr) if valid_hr else 0,
        "avgSpO2": round(sum(valid_spo2) / len(valid_spo2), 1) if valid_spo2 else 0,
        "minSpO2": min(valid_spo2) if valid_spo2 else 0,
        "peakHsi": max(valid_hsi) if valid_hsi else 0.0,
    }

    return {
        "node_id": node_id,
        "query_hours": hours,
        "stats": stats,
        "history": history
    }

@router.get("/api/v1/alerts/history")
async def query_alert_history(node_id: str = Query("ESP32-NODE-04", description="Hardware node ID"), limit: int = 20):
    """Retrieves emergency hazard, impact, and critical medical dispatch logs."""
    alerts = get_alert_logs(node_id=node_id, limit=limit)
    return {
        "node_id": node_id,
        "count": len(alerts),
        "alerts": alerts
    }
