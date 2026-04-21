#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://172.22.231.65:5000/api/alerts";

const int PIR_PIN = 13;
const int FLAME_PIN = 27;
const int BUZZER = 12;
const int LED = 14;

const char* deviceId = "esp32-01";

bool lastMotionState = false;
bool lastFlameState = false;

String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return String("1970-01-01T00:00:00Z");
  }

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void syncTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  struct tm timeinfo;
  while (!getLocalTime(&timeinfo)) {
    delay(500);
  }
}

void updateOutputs(bool motionDetected, bool flameDetected) {
  digitalWrite(BUZZER, motionDetected ? HIGH : LOW);
  digitalWrite(LED, flameDetected ? HIGH : LOW);
}

void sendAlert(const char* eventType, const char* zoneName) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  String healthUrl = String(serverUrl);
  int apiPathIndex = healthUrl.indexOf("/api/alerts");
  if (apiPathIndex > 0) {
    healthUrl = healthUrl.substring(0, apiPathIndex) + "/api/health";
  }

  WiFiClient healthTcp;
  HTTPClient healthClient;
  healthClient.setTimeout(8000);
  healthClient.begin(healthTcp, healthUrl);

  int healthCode = healthClient.GET();
  if (healthCode < 0) {
    healthClient.end();
    return;
  }

  healthClient.end();

  WiFiClient alertTcp;
  HTTPClient http;
  http.begin(alertTcp, serverUrl);
  http.setTimeout(8000);
  http.addHeader("Content-Type", "application/json");

  String payload = String("{") +
                   "\"deviceId\":\"" + deviceId + "\"," +
                   "\"eventType\":\"" + eventType + "\"," +
                   "\"intrusion\":true," +
                   "\"zone\":\"" + zoneName + "\"," +
                   "\"timestamp\":\"" + getTimestamp() + "\"" +
                   "}";

  int responseCode = http.POST(payload);
  Serial.print("Server Response Code: ");
  Serial.println(responseCode);

  http.end();
}

void setup() {
  Serial.begin(115200);

  pinMode(PIR_PIN, INPUT);
  pinMode(FLAME_PIN, INPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(LED, OUTPUT);

  updateOutputs(false, false);

  connectWiFi();
  syncTime();
}

void loop() {
  bool motionDetected = digitalRead(PIR_PIN) == HIGH;
  bool flameDetected = digitalRead(FLAME_PIN) == LOW;

  updateOutputs(motionDetected, flameDetected);

  if (motionDetected && !lastMotionState) {
    Serial.println("Unauthorized Entry Detected");
    sendAlert("intrusion", "Main Entrance");
  }

  if (flameDetected && !lastFlameState) {
    Serial.println("Fire Detected");
    sendAlert("fire", "Fire Zone");
  }

  lastMotionState = motionDetected;
  lastFlameState = flameDetected;

  delay(100);
}
