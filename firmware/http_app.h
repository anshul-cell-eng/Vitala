#ifndef HTTP_APP_H
#define HTTP_APP_H

#include <stdbool.h>

// Snapshot of every sensor's latest reading. main.c owns the "real" copy
// (guarded by its own mutex, one field group per task) and pushes updates
// in here via http_app_update_status() after each read; http_app.c keeps
// its own mutex-protected copy so the local web dashboard's /api/status
// handler never has to reach across modules or block a sensor task.
typedef struct {
    // DHT22
    float temperature;
    float humidity;
    // MQ135
    float mq135_ppm;
    // MAX30102
    float heart_rate;
    float spo2;
    bool  vitals_valid;
    // MPU6050
    float accel_x, accel_y, accel_z;
    float gyro_x, gyro_y, gyro_z;
    // GY-NEO6MV2 GPS
    double gps_latitude;
    double gps_longitude;
    float  gps_altitude_m;
    float  gps_speed_kmh;
    int    gps_satellites;
    bool   gps_fix_valid;
} dashboard_status_t;

// Starts the ESP32's own HTTP server: "/" serves a self-contained live
// dashboard (no WiFi backend required, just browse to the ESP's IP), and
// "/api/status" serves the same data as JSON for that page's polling.
void start_webserver(void);

// Thread-safe: call after updating any sensor reading so the local
// dashboard reflects it on its next poll. Callers should pass a full
// current snapshot (main.c's sensor_data_t is laid out for exactly this).
void http_app_update_status(const dashboard_status_t *status);

// Posts a DHT22 + MQ135 reading to the hazard telemetry endpoint.
void http_post_hazard(float temperature, float humidity, float mq135_ppm);

// Posts a MAX30102 HR/SpO2 reading to the vitals telemetry endpoint.
void http_post_vitals(float heart_rate, float spo2);

// Posts an MPU6050 accel/gyro reading to the motion telemetry endpoint.
void http_post_motion(float ax, float ay, float az, float gx, float gy, float gz);

// Posts a GY-NEO6MV2 GPS reading to the location telemetry endpoint.
// Still posts (with fix_valid=false and 0 lat/lon) when there's no fix
// yet, so the backend/dashboard can show "no fix" instead of stale data.
void http_post_location(double latitude, double longitude, float altitude_m,
                         float speed_kmh, int satellites, bool fix_valid);

#endif
