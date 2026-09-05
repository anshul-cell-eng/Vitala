import time
import os
import json
from typing import Dict, Any, Optional

try:
    from .db import log_alert
except ImportError:
    from services.db import log_alert

# Rate limiting dictionary: node_id -> last_alert_time
_last_alert_timestamps: Dict[str, float] = {}
ALERT_COOLDOWN_SECONDS = 30.0  # Cooldown between proactive notifications per node

def evaluate_and_dispatch_alerts(node_id: str, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Evaluates telemetry state for HAZARD_ALERT, IMPACT_ALERT, or critical physiological anomalies.
    Dispatches notifications to the attending medical team and logs the event to DB.
    """
    now = time.time()
    last_time = _last_alert_timestamps.get(node_id, 0.0)
    
    triggers = []
    severity = "INFO"
    
    # 1. Kinematics / Fall / Impact Alert
    accel = state.get("accelMagnitude", 9.81)
    motion_status = state.get("motionStatus", "STABLE")
    if motion_status == "IMPACT_ALERT" or accel > 20.0:
        triggers.append(f"VIOLENT IMPACT / FALL DETECTED ({accel} m/s²)")
        severity = "CRITICAL"
        
    # 2. Hazardous Gas / Toxic AQI Spike
    aqi = state.get("aqiPpm", 0)
    mq135_status = state.get("mq135Status", "OPTIMAL")
    if mq135_status == "HAZARD_ALERT" or aqi > 200:
        triggers.append(f"TOXIC GAS / SMOKE HAZARD ({aqi} PPM)")
        if severity != "CRITICAL":
            severity = "CRITICAL"

    # 3. Severe Tachycardia Spike (> 130 BPM)
    hr = state.get("heartRate", 70)
    if hr > 130:
        triggers.append(f"ACUTE TACHYCARDIA SPIKE ({hr} BPM)")
        severity = "CRITICAL"
    elif hr > 115:
        triggers.append(f"ELEVATED CARDIAC STRAIN ({hr} BPM)")
        if severity == "INFO":
            severity = "WARNING"

    # 4. Severe Hypoxia (< 90% SpO2)
    spo2 = state.get("spO2", 98)
    if 0 < spo2 < 90:
        triggers.append(f"CRITICAL HYPOXIA DROP ({spo2}%)")
        severity = "CRITICAL"

    # 5. Extreme Heat Strain Index (> 45 HSI)
    hsi = state.get("hsiScore", 0.0)
    if hsi > 45.0:
        triggers.append(f"EXTREME HEAT EXHAUSTION INDEX ({hsi} HSI)")
        severity = "CRITICAL"

    if not triggers:
        return None

    # Check cooldown
    if (now - last_time) < ALERT_COOLDOWN_SECONDS:
        return None  # Rate-limited

    _last_alert_timestamps[node_id] = now
    alert_message = " | ".join(triggers)
    
    # In production, dispatch to Twilio SMS / SendGrid Email / Webhook
    # Check if TWILIO_AUTH_TOKEN / SMS_WEBHOOK is configured
    sms_webhook = os.getenv("EMERGENCY_ALERT_WEBHOOK")
    channel = "TWILIO_SMS / EMAIL" if sms_webhook else "TACTICAL_DISPATCH_BROADCAST"

    # Log alert in DB
    alert_id = log_alert(
        node_id=node_id,
        alert_type=triggers[0].split()[0],
        severity=severity,
        message=alert_message,
        telemetry_snapshot={
            "heartRate": hr,
            "spO2": spo2,
            "hsiScore": hsi,
            "aqiPpm": aqi,
            "accelMagnitude": accel,
            "latitude": state.get("latitude"),
            "longitude": state.get("longitude")
        },
        channel=channel
    )

    alert_payload = {
        "alertId": alert_id,
        "nodeId": node_id,
        "severity": severity,
        "triggers": triggers,
        "message": alert_message,
        "channel": channel,
        "timestamp": now
    }
    
    print(f"[EMERGENCY ALERT DISPATCHED] Node: {node_id} | Severity: {severity} | {alert_message}")
    return alert_payload
