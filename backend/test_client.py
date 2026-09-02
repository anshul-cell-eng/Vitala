import time
import urllib.request
import json

BASE_URL = 'http://127.0.0.1:8000'
NODE_ID = 'ESP32-NODE-04'

def post_json(endpoint, data):
    url = f'{BASE_URL}{endpoint}'
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            print(f'POST {endpoint} -> HTTP {resp.status}')
    except Exception as e:
        print(f'POST {endpoint} failed: {e}')

if __name__ == '__main__':
    print('Simulating ESP32 Hardware Telemetry stream...')
    for i in range(5):
        # 1. Hazard
        post_json('/api/v1/telemetry/hazard', {
            'node_id': NODE_ID,
            'temperature': 26.5 + (i * 0.4),
            'humidity': 52.0 - (i * 0.5),
            'mq135_ppm': 45.0 + (i * 2.0)
        })
        # 2. Vitals
        post_json('/api/v1/telemetry/vitals', {
            'node_id': NODE_ID,
            'heart_rate': 76.0 + i,
            'spo2': 98.0
        })
        # 3. Motion
        post_json('/api/v1/telemetry/motion', {
            'node_id': NODE_ID,
            'accel_x': 0.12,
            'accel_y': 0.08,
            'accel_z': 9.82,
            'gyro_x': 0.1,
            'gyro_y': -0.2,
            'gyro_z': 0.05
        })
        # 4. Location
        post_json('/api/v1/telemetry/location', {
            'node_id': NODE_ID,
            'latitude': 28.6139,
            'longitude': 77.2090,
            'altitude_m': 216.5,
            'speed_kmh': 0.0,
            'satellites': 9,
            'fix_valid': True
        })
        time.sleep(1)
