#include <string.h>
#include <stdio.h>
#include <esp_http_server.h>
#include <esp_http_client.h>
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "esp_log.h"
#include "http_app.h"
#include "config.h"

static const char *TAG = "HTTP_APP";

// Thread-safe cache of the latest sensor snapshot, fed by
// http_app_update_status() and read by the /api/status handler. Separate
// from main.c's own s_data so the web server never has to reach into
// another module's lock.
static dashboard_status_t s_status = {0};
static SemaphoreHandle_t s_status_lock;

void http_app_update_status(const dashboard_status_t *status)
{
    if (!status || !s_status_lock) {
        return;
    }
    xSemaphoreTake(s_status_lock, portMAX_DELAY);
    s_status = *status;
    xSemaphoreGive(s_status_lock);
}

// ---------------------------------------------------------------------
// Local dashboard page - a self-contained HTML/CSS/JS status page served
// directly by the ESP32, no WiFi backend or internet connection required.
// It polls /api/status every couple seconds rather than using a
// WebSocket, which keeps the on-device HTTP server simple. Uses only
// system fonts (no CDN) so it still renders with zero WAN access -
// just the ESP's own IP on the LAN.
// ---------------------------------------------------------------------
static const char *DASHBOARD_HTML =
"<!DOCTYPE html>"
"<html lang=\"en\"><head>"
"<meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
"<title>Node Status</title>"
"<style>"
":root{--bg:#0C0B09;--bg-elev:#151310;--line:#2A2519;--text:#F3EFE6;--text-dim:#9C9484;"
"--olive:#8A9A44;--olive-dim:rgba(138,154,68,0.14);--ochre:#CC9736;--ochre-dim:rgba(204,151,54,0.14);"
"--vermilion:#D14B2E;--vermilion-dim:rgba(209,75,46,0.16);--mono:ui-monospace,'SFMono-Regular',Consolas,monospace;"
"--sans:system-ui,-apple-system,sans-serif;}"
"*{box-sizing:border-box;}body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);"
"min-height:100vh;}"
"header{padding:16px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;"
"justify-content:space-between;flex-wrap:wrap;gap:10px;}"
"header h1{font-size:15px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:0;}"
"header h1 span{color:var(--vermilion);}"
".conn{font-family:var(--mono);font-size:11px;padding:5px 10px;border-radius:20px;border:1px solid var(--line);"
"display:flex;align-items:center;gap:7px;}"
".conn .dot{width:7px;height:7px;border-radius:50%;background:var(--text-dim);}"
".conn.live{color:var(--olive);border-color:rgba(138,154,68,.35);background:var(--olive-dim);}"
".conn.live .dot{background:var(--olive);}"
".conn.off{color:var(--vermilion);border-color:rgba(209,75,46,.35);background:var(--vermilion-dim);}"
".conn.off .dot{background:var(--vermilion);}"
"main{max-width:900px;margin:0 auto;padding:22px 18px 50px;}"
".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;}"
".card{background:var(--bg-elev);border:1px solid var(--line);border-radius:10px;padding:16px 16px 14px;}"
".label{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;"
"color:var(--text-dim);display:block;margin-bottom:8px;}"
".value{font-family:var(--mono);font-size:30px;font-weight:700;}"
".unit{font-family:var(--mono);font-size:11px;color:var(--text-dim);margin-left:4px;}"
".sub{font-family:var(--mono);font-size:11px;color:var(--text-dim);margin-top:8px;"
"padding-top:8px;border-top:1px solid rgba(255,255,255,.05);}"
".sub b{color:var(--text);}"
".badge{font-family:var(--mono);font-size:10px;padding:2px 7px;border-radius:10px;border:1px solid var(--line);"
"float:right;text-transform:uppercase;}"
".badge.ok{color:var(--olive);border-color:rgba(138,154,68,.4);}"
".badge.nofix{color:var(--vermilion);border-color:rgba(209,75,46,.4);}"
"footer{text-align:center;padding:18px;font-family:var(--mono);font-size:10px;color:var(--text-dim);}"
"</style></head><body>"
"<header><h1>NODE<span>-STATUS</span></h1>"
"<div class=\"conn off\" id=\"conn\"><span class=\"dot\"></span><span id=\"connLabel\">Connecting&hellip;</span></div>"
"</header>"
"<main><div class=\"grid\" id=\"grid\"></div></main>"
"<footer>Served locally by this ESP32 &middot; polling /api/status</footer>"
"<script>"
"const grid=document.getElementById('grid');"
"const conn=document.getElementById('conn'),connLabel=document.getElementById('connLabel');"
"function card(label,value,unit,sub,badge){"
"return '<div class=\"card\"><span class=\"label\">'+label+(badge?'<span class=\"badge '+badge.cls+'\">'+badge.text+'</span>':'')+"
"'</span><span class=\"value\">'+value+'</span><span class=\"unit\">'+(unit||'')+'</span>'+(sub?'<div class=\"sub\">'+sub+'</div>':'')+'</div>';"
"}"
"function fmt(v,d){return (v===undefined||v===null)?'--':Number(v).toFixed(d===undefined?1:d);}"
"function render(s){"
"grid.innerHTML=["
"card('Temperature',fmt(s.temperature,1),'&deg;C'),"
"card('Humidity',fmt(s.humidity,0),'%RH'),"
"card('Gas (MQ-135)',fmt(s.mq135_ppm,0),'PPM'),"
"card('Heart Rate',s.vitals_valid?fmt(s.heart_rate,0):'--','BPM'),"
"card('SpO2',s.vitals_valid?fmt(s.spo2,0):'--','%'),"
"card('Motion',fmt(Math.sqrt(s.accel_x*s.accel_x+s.accel_y*s.accel_y+s.accel_z*s.accel_z),2),'m/s&sup2;',"
"'accel <b>'+fmt(s.accel_x,1)+'</b>/<b>'+fmt(s.accel_y,1)+'</b>/<b>'+fmt(s.accel_z,1)+'</b> &middot; '+"
"'gyro <b>'+fmt(s.gyro_x,0)+'</b>/<b>'+fmt(s.gyro_y,0)+'</b>/<b>'+fmt(s.gyro_z,0)+'</b>'),"
"card('GPS Position',s.gps_fix_valid?(Number(s.gps_latitude).toFixed(5)+', '+Number(s.gps_longitude).toFixed(5)):'NO FIX','',"
"'alt <b>'+fmt(s.gps_altitude_m,0)+'m</b> &middot; speed <b>'+fmt(s.gps_speed_kmh,1)+'km/h</b> &middot; sats <b>'+(s.gps_satellites??0)+'</b>',"
"{cls:s.gps_fix_valid?'ok':'nofix',text:s.gps_fix_valid?'FIX':'NO FIX'}),"
"].join('');"
"}"
"async function poll(){"
"try{"
"const r=await fetch('/api/status',{cache:'no-store'});"
"if(!r.ok)throw new Error('bad status');"
"const s=await r.json();"
"render(s);"
"conn.className='conn live';connLabel.textContent='Live';"
"}catch(e){"
"conn.className='conn off';connLabel.textContent='Offline';"
"}"
"}"
"poll();setInterval(poll,2000);"
"</script></body></html>";

static esp_err_t root_get_handler(httpd_req_t *req)
{
    httpd_resp_set_type(req, "text/html");
    httpd_resp_send(req, DASHBOARD_HTML, HTTPD_RESP_USE_STRLEN);
    return ESP_OK;
}

static httpd_uri_t uri_get = {
    .uri      = "/",
    .method   = HTTP_GET,
    .handler  = root_get_handler,
    .user_ctx = NULL
};

// JSON snapshot for the dashboard page's polling loop. Built by hand with
// snprintf, matching the style already used for the outbound telemetry
// payloads below rather than pulling in a JSON library for one endpoint.
static esp_err_t status_get_handler(httpd_req_t *req)
{
    dashboard_status_t snapshot;
    xSemaphoreTake(s_status_lock, portMAX_DELAY);
    snapshot = s_status;
    xSemaphoreGive(s_status_lock);

    char payload[512];
    snprintf(payload, sizeof(payload),
             "{"
             "\"temperature\":%.1f,\"humidity\":%.1f,\"mq135_ppm\":%.1f,"
             "\"heart_rate\":%.0f,\"spo2\":%.0f,\"vitals_valid\":%s,"
             "\"accel_x\":%.2f,\"accel_y\":%.2f,\"accel_z\":%.2f,"
             "\"gyro_x\":%.1f,\"gyro_y\":%.1f,\"gyro_z\":%.1f,"
             "\"gps_latitude\":%.6f,\"gps_longitude\":%.6f,\"gps_altitude_m\":%.1f,"
             "\"gps_speed_kmh\":%.1f,\"gps_satellites\":%d,\"gps_fix_valid\":%s"
             "}",
             snapshot.temperature, snapshot.humidity, snapshot.mq135_ppm,
             snapshot.heart_rate, snapshot.spo2, snapshot.vitals_valid ? "true" : "false",
             snapshot.accel_x, snapshot.accel_y, snapshot.accel_z,
             snapshot.gyro_x, snapshot.gyro_y, snapshot.gyro_z,
             snapshot.gps_latitude, snapshot.gps_longitude, snapshot.gps_altitude_m,
             snapshot.gps_speed_kmh, snapshot.gps_satellites, snapshot.gps_fix_valid ? "true" : "false");

    httpd_resp_set_type(req, "application/json");
    httpd_resp_send(req, payload, HTTPD_RESP_USE_STRLEN);
    return ESP_OK;
}

static httpd_uri_t uri_status = {
    .uri      = "/api/status",
    .method   = HTTP_GET,
    .handler  = status_get_handler,
    .user_ctx = NULL
};

void start_webserver(void)
{
    if (!s_status_lock) {
        s_status_lock = xSemaphoreCreateMutex();
    }

    httpd_handle_t server = NULL;
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();

    ESP_LOGI(TAG, "Starting HTTP Server on port %d", config.server_port);
    if (httpd_start(&server, &config) == ESP_OK) {
        httpd_register_uri_handler(server, &uri_get);
        httpd_register_uri_handler(server, &uri_status);
    } else {
        ESP_LOGE(TAG, "Failed to start HTTP Server");
    }
}

// ---------------------------------------------------------------------
// Outbound POSTs to the FastAPI backend
// ---------------------------------------------------------------------
static esp_err_t http_post_json(const char *url, const char *json_payload)
{
    esp_http_client_config_t config = {
        .url = url,
        .method = HTTP_METHOD_POST,
        .timeout_ms = 5000,
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);
    if (!client) {
        ESP_LOGE(TAG, "Failed to init HTTP client for %s", url);
        return ESP_FAIL;
    }

    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_post_field(client, json_payload, strlen(json_payload));

    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK) {
        ESP_LOGI(TAG, "POST %s -> HTTP %d", url, esp_http_client_get_status_code(client));
    } else {
        ESP_LOGW(TAG, "POST %s failed: %s", url, esp_err_to_name(err));
    }

    esp_http_client_cleanup(client);
    return err;
}

void http_post_hazard(float temperature, float humidity, float mq135_ppm)
{
    char payload[192];
    // Field names/types here must match HazardPayload in Main.py exactly.
    snprintf(payload, sizeof(payload),
             "{\"node_id\":\"%s\",\"temperature\":%.2f,\"humidity\":%.2f,\"mq135_ppm\":%.2f}",
             NODE_ID, temperature, humidity, mq135_ppm);
    http_post_json(HAZARD_ENDPOINT, payload);
}

void http_post_vitals(float heart_rate, float spo2)
{
    char payload[128];
    // Field names/types here must match VitalsPayload in Main.py exactly.
    snprintf(payload, sizeof(payload),
             "{\"node_id\":\"%s\",\"heart_rate\":%.1f,\"spo2\":%.1f}",
             NODE_ID, heart_rate, spo2);
    http_post_json(VITALS_ENDPOINT, payload);
}

void http_post_motion(float ax, float ay, float az, float gx, float gy, float gz)
{
    char payload[256];
    // Field names/types here must match MotionPayload in Main.py exactly.
    snprintf(payload, sizeof(payload),
             "{\"node_id\":\"%s\",\"accel_x\":%.3f,\"accel_y\":%.3f,\"accel_z\":%.3f,"
             "\"gyro_x\":%.2f,\"gyro_y\":%.2f,\"gyro_z\":%.2f}",
             NODE_ID, ax, ay, az, gx, gy, gz);
    http_post_json(MOTION_ENDPOINT, payload);
}

void http_post_location(double latitude, double longitude, float altitude_m,
                         float speed_kmh, int satellites, bool fix_valid)
{
    char payload[224];
    // Field names/types here must match LocationPayload in Main.py exactly.
    snprintf(payload, sizeof(payload),
             "{\"node_id\":\"%s\",\"latitude\":%.6f,\"longitude\":%.6f,\"altitude_m\":%.1f,"
             "\"speed_kmh\":%.1f,\"satellites\":%d,\"fix_valid\":%s}",
             NODE_ID, latitude, longitude, altitude_m, speed_kmh, satellites,
             fix_valid ? "true" : "false");
    http_post_json(LOCATION_ENDPOINT, payload);
}
