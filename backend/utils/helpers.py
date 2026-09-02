def status_for_aqi(aqi: float) -> str:
    """MQ-135 threshold classification."""
    return "HAZARD_ALERT" if aqi > 200 else "WARNING" if aqi > 100 else "OPTIMAL"

def status_for_motion(magnitude: float) -> str:
    """Fall / Impact heuristic from accelerometer magnitude."""
    return "IMPACT_ALERT" if magnitude > 20.0 else "STABLE"
