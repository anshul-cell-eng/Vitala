#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "esp_log.h"
#include "driver/i2c_master.h"

#include "wifi_app.h"
#include "http_app.h"
#include "dht22.h"
#include "mq135.h"
#include "max30102.h"
#include "mpu6050.h"
#include "ssd1306.h"
#include "neo6mv2.h"
#include "config.h"

static const char *TAG = "MAIN";

// dashboard_status_t (defined in http_app.h) already covers every sensor
// this app reads, so it doubles as the app's internal sensor cache -
// no separate struct to keep in sync.
typedef dashboard_status_t sensor_data_t;

static sensor_data_t s_data = {0};
static SemaphoreHandle_t s_data_lock;
static i2c_master_bus_handle_t s_i2c_bus;

static esp_err_t i2c_master_init(void)
{
    i2c_master_bus_config_t bus_config = {
        .i2c_port = I2C_MASTER_NUM,
        .sda_io_num = I2C_MASTER_SDA,
        .scl_io_num = I2C_MASTER_SCL,
        .clk_source = I2C_CLK_SRC_DEFAULT,
        .glitch_ignore_cnt = 7,
        .flags.enable_internal_pullup = true,
    };
    return i2c_new_master_bus(&bus_config, &s_i2c_bus);
}

// DHT22 - every 10s. Posts to the hazard endpoint along with the
// most recently cached MQ135 reading.
static void dht22_task(void *arg)
{
    while (1) {
        float temp = 0, hum = 0;
        esp_err_t err = dht22_read(DHT22_GPIO, &temp, &hum);
        if (err == ESP_OK) {
            float ppm;
            xSemaphoreTake(s_data_lock, portMAX_DELAY);
            s_data.temperature = temp;
            s_data.humidity = hum;
            ppm = s_data.mq135_ppm;
            http_app_update_status(&s_data);
            xSemaphoreGive(s_data_lock);

            ESP_LOGI(TAG, "DHT22: %.1fC  %.1f%%RH", temp, hum);
            http_post_hazard(temp, hum, ppm);
        } else {
            ESP_LOGW(TAG, "DHT22 read failed: %s", esp_err_to_name(err));
        }
        vTaskDelay(pdMS_TO_TICKS(DHT22_INTERVAL_MS));
    }
}

// MQ135 - every 2s. Just updates the cached ppm value; it's sent to the
// backend piggybacked on the next DHT22 hazard POST.
static void mq135_task(void *arg)
{
    while (1) {
        float ppm = 0;
        if (mq135_read_ppm(&ppm) == ESP_OK) {
            xSemaphoreTake(s_data_lock, portMAX_DELAY);
            s_data.mq135_ppm = ppm;
            http_app_update_status(&s_data);
            xSemaphoreGive(s_data_lock);
            ESP_LOGI(TAG, "MQ135: %.1f ppm", ppm);
        } else {
            ESP_LOGW(TAG, "MQ135 read failed");
        }
        vTaskDelay(pdMS_TO_TICKS(MQ135_INTERVAL_MS));
    }
}

// MAX30102 - every 10s. Posts HR/SpO2 straight to the vitals endpoint.
static void max30102_task(void *arg)
{
    while (1) {
        max30102_reading_t r = {0};
        if (max30102_poll(&r) == ESP_OK && r.finger_present) {
            xSemaphoreTake(s_data_lock, portMAX_DELAY);
            s_data.heart_rate = r.heart_rate;
            s_data.spo2 = r.spo2;
            s_data.vitals_valid = true;
            http_app_update_status(&s_data);
            xSemaphoreGive(s_data_lock);

            ESP_LOGI(TAG, "HR: %.0f bpm  SpO2: %.0f%%", r.heart_rate, r.spo2);
            http_post_vitals(r.heart_rate, r.spo2);
        } else {
            xSemaphoreTake(s_data_lock, portMAX_DELAY);
            s_data.vitals_valid = false;
            http_app_update_status(&s_data);
            xSemaphoreGive(s_data_lock);
            ESP_LOGW(TAG, "No finger detected on MAX30102");
        }
        vTaskDelay(pdMS_TO_TICKS(MAX30102_INTERVAL_MS));
    }
}

// MPU6050 - every 1s. Posts accel/gyro straight to the motion endpoint,
// and caches the reading too (OLED + local dashboard show it).
static void mpu6050_task(void *arg)
{
    while (1) {
        mpu6050_reading_t r = {0};
        if (mpu6050_read(&r) == ESP_OK) {
            xSemaphoreTake(s_data_lock, portMAX_DELAY);
            s_data.accel_x = r.accel_x;
            s_data.accel_y = r.accel_y;
            s_data.accel_z = r.accel_z;
            s_data.gyro_x = r.gyro_x;
            s_data.gyro_y = r.gyro_y;
            s_data.gyro_z = r.gyro_z;
            http_app_update_status(&s_data);
            xSemaphoreGive(s_data_lock);

            ESP_LOGI(TAG, "Accel: %.2f %.2f %.2f m/s^2  Gyro: %.1f %.1f %.1f dps",
                     r.accel_x, r.accel_y, r.accel_z, r.gyro_x, r.gyro_y, r.gyro_z);
            http_post_motion(r.accel_x, r.accel_y, r.accel_z, r.gyro_x, r.gyro_y, r.gyro_z);
        } else {
            ESP_LOGW(TAG, "MPU6050 read failed");
        }
        vTaskDelay(pdMS_TO_TICKS(MPU6050_INTERVAL_MS));
    }
}

// GY-NEO6MV2 GPS - every 1s, matching the module's own fix rate. Posts
// straight to the location endpoint (including no-fix updates, so the
// backend/dashboard can show "no fix" instead of a stale position).
static void gps_task(void *arg)
{
    while (1) {
        gps_reading_t r = {0};
        if (neo6mv2_poll(&r) == ESP_OK) {
            xSemaphoreTake(s_data_lock, portMAX_DELAY);
            s_data.gps_latitude = r.latitude;
            s_data.gps_longitude = r.longitude;
            s_data.gps_altitude_m = r.altitude_m;
            s_data.gps_speed_kmh = r.speed_kmh;
            s_data.gps_satellites = r.satellites;
            s_data.gps_fix_valid = r.fix_valid;
            http_app_update_status(&s_data);
            xSemaphoreGive(s_data_lock);

            if (r.fix_valid) {
                ESP_LOGI(TAG, "GPS: %.6f, %.6f  alt=%.0fm  spd=%.1fkm/h  sats=%d",
                         r.latitude, r.longitude, r.altitude_m, r.speed_kmh, r.satellites);
            } else {
                ESP_LOGI(TAG, "GPS: no fix (sats=%d)", r.satellites);
            }
            http_post_location(r.latitude, r.longitude, r.altitude_m,
                                r.speed_kmh, r.satellites, r.fix_valid);
        } else {
            ESP_LOGW(TAG, "GPS poll failed");
        }
        vTaskDelay(pdMS_TO_TICKS(GPS_INTERVAL_MS));
    }
}

// Refreshes the local OLED with the latest cached readings from all sensors.
static void oled_task(void *arg)
{
    char line[22];
    while (1) {
        sensor_data_t snapshot;
        xSemaphoreTake(s_data_lock, portMAX_DELAY);
        snapshot = s_data;
        xSemaphoreGive(s_data_lock);

        ssd1306_clear();
        snprintf(line, sizeof(line), "TEMP:%.1fC HUM:%.0f%%", snapshot.temperature, snapshot.humidity);
        ssd1306_write_line(0, line);
        snprintf(line, sizeof(line), "CO2:%.0fPPM", snapshot.mq135_ppm);
        ssd1306_write_line(2, line);
        if (snapshot.vitals_valid) {
            snprintf(line, sizeof(line), "HR:%.0f SPO2:%.0f%%", snapshot.heart_rate, snapshot.spo2);
        } else {
            snprintf(line, sizeof(line), "HR:-- SPO2:--");
        }
        ssd1306_write_line(4, line);
        if (snapshot.gps_fix_valid) {
            // Row is 22 chars wide at 6px/glyph - two fixed-point coords
            // with 2 decimals fits comfortably; more precision would wrap.
            snprintf(line, sizeof(line), "%.2f %.2f", snapshot.gps_latitude, snapshot.gps_longitude);
        } else {
            snprintf(line, sizeof(line), "GPS: NO FIX");
        }
        ssd1306_write_line(6, line);
        ssd1306_display();

        vTaskDelay(pdMS_TO_TICKS(OLED_REFRESH_MS));
    }
}

void app_main(void)
{
    s_data_lock = xSemaphoreCreateMutex();

    // Wi-Fi + local status server (the local dashboard is served here even
    // before/without the FastAPI backend being reachable).
    wifi_init_sta();
    wifi_wait_connected();
    start_webserver();

    // I2C bus (shared by MAX30102, MPU6050 and the OLED)
    if (i2c_master_init() != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create I2C bus");
    }

    if (mq135_init(MQ135_ADC_CHANNEL) != ESP_OK) {
        ESP_LOGE(TAG, "MQ135 init failed");
    }
    if (max30102_init(s_i2c_bus) != ESP_OK) {
        ESP_LOGE(TAG, "MAX30102 init failed - check I2C wiring");
    }
    if (mpu6050_init(s_i2c_bus) != ESP_OK) {
        ESP_LOGE(TAG, "MPU6050 init failed - check I2C wiring");
    }
    if (ssd1306_init(s_i2c_bus) != ESP_OK) {
        ESP_LOGE(TAG, "SSD1306 init failed - check I2C wiring");
    }
    if (neo6mv2_init(GPS_UART_NUM, GPS_UART_TX_GPIO, GPS_UART_RX_GPIO, GPS_UART_BAUD) != ESP_OK) {
        ESP_LOGE(TAG, "NEO-6M GPS init failed - check UART wiring");
    }

    xTaskCreate(dht22_task,    "dht22_task",    4096, NULL, 5, NULL);
    xTaskCreate(mq135_task,    "mq135_task",    4096, NULL, 5, NULL);
    xTaskCreate(max30102_task, "max30102_task", 4096, NULL, 5, NULL);
    xTaskCreate(mpu6050_task,  "mpu6050_task",  4096, NULL, 5, NULL);
    xTaskCreate(gps_task,      "gps_task",      4096, NULL, 5, NULL);
    xTaskCreate(oled_task,     "oled_task",     4096, NULL, 4, NULL);
}
