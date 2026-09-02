def calculate_hsi(temp: float, humidity: float, hr: float) -> float:
    """
    Calculates the AI Heat Strain Index based on design document specs.
    Formula: (0.4 * Temp) + (0.3 * Humidity %) + (0.3 * max(0, Heart Rate - 60))
    """
    hr_factor = max(0.0, hr - 60.0)
    raw_hsi = (0.4 * temp) + (0.3 * humidity) + (0.3 * hr_factor)
    return round(raw_hsi, 1)
