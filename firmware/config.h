#ifndef APP_CONFIG_H
#define APP_CONFIG_H

#include "driver/gpio.h"
#include "hal/adc_types.h"
#include "driver/i2c_master.h"
#include "driver/uart.h"

// ---- Backend server (FastAPI) ----
// Update this to your backend's actual LAN IP/port.
#define SERVER_BASE_URL    "https://vitala-api.onrender.com"
#define HAZARD_ENDPOINT    SERVER_BASE_URL "/api/v1/telemetry/hazard"
#define VITALS_ENDPOINT    SERVER_BASE_URL "/api/v1/telemetry/vitals"
#define MOTION_ENDPOINT    SERVER_BASE_URL "/api/v1/telemetry/motion"
#define LOCATION_ENDPOINT  SERVER_BASE_URL "/api/v1/telemetry/location"
#define DOCTOR_NOTE_ENDPOINT SERVER_BASE_URL "/api/v1/doctor/notes/" NODE_ID "/latest"

// ---- Node identity ----
// Sent in every POST so the backend can key state per hardware node.
// Give each physical unit a unique id if you deploy more than one.
#define NODE_ID             "ESP32-NODE-04"

// ---- Sensor / bus pins ----
// DHT22 confirmed working on GPIO27 after the GPIO4 timeout investigation.
#define DHT22_GPIO          GPIO_NUM_27
#define MQ135_ADC_CHANNEL   ADC_CHANNEL_6    // GPIO34 on most ESP32 dev boards (ADC1)

#define I2C_MASTER_NUM      I2C_NUM_0
// GPIO18/19 caused "not usable, maybe conflict with others" + I2C
// timeouts on this board (ESP32-WROOM-32) - moved to GPIO21/22, the
// conventional ESP32 I2C default pins. Rewire SDA -> 21, SCL -> 22 on
// the MAX30102, MPU6050, and SSD1306 (they all share this one bus).
#define I2C_MASTER_SDA      GPIO_NUM_21
#define I2C_MASTER_SCL      GPIO_NUM_22
#define I2C_MASTER_FREQ_HZ  400000

// ---- GPS (GY-NEO6MV2 / NEO-6M) ----
// Uses a UART, not the I2C bus. Wire module TX -> GPS_UART_RX_GPIO and
// module RX -> GPS_UART_TX_GPIO (module RX is unused by this app but
// still needs to be wired for uart_set_pin to be happy).
#define GPS_UART_NUM        UART_NUM_1
#define GPS_UART_TX_GPIO    GPIO_NUM_17
#define GPS_UART_RX_GPIO    GPIO_NUM_16
#define GPS_UART_BAUD       9600    // NEO-6M default NMEA baud rate

// ---- Task intervals (ms) ----
#define DHT22_INTERVAL_MS      10000   // DHT22 temp/humidity
#define MQ135_INTERVAL_MS      2000    // MQ135 gas sensor
#define MAX30102_INTERVAL_MS   10000   // MAX30102 HR/SpO2
#define MPU6050_INTERVAL_MS    1000    // MPU6050 accel/gyro
#define GPS_INTERVAL_MS         1000   // NEO-6M emits ~1 fix/sec
#define OLED_REFRESH_MS        2000    // local display refresh
#define DASHBOARD_POLL_MS      2000    // local web dashboard auto-refresh

#endif
