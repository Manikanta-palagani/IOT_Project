#include <WiFi.h>
#include <HTTPClient.h>

// -------------------- Pins --------------------
#define PIR_PIN 13
#define BUZZER 12
#define LED 14

// -------------------- WiFi --------------------
const char* ssid = "Mani";
const char* password = "Mani123456";

// -------------------- Backend API --------------------
const char* serverUrl = "http://172.22.231.65:5000/api/alerts";

// To avoid sending alerts repeatedly
bool lastMotionState = LOW;

void setup() {
  Serial.begin(115200);

  pinMode(PIR_PIN, INPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(LED, OUTPUT);

  digitalWrite(BUZZER, LOW);
  digitalWrite(LED, LOW);

  Serial.println("Connecting to WiFi...");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected Successfully");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());

  Serial.println("Security System Ready...");
}

void sendAlert() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  String jsonData =
    "{\"deviceId\":\"esp32-01\"," 
    "\"motion\":true,"
    "\"type\":\"intrusion\","
    "\"zone\":\"Main Entrance\","
    "\"timestamp\":\"2026-04-06T12:00:00Z\"}";

  int responseCode = http.POST(jsonData);

  Serial.print("Server Response Code: ");
  Serial.println(responseCode);

  String response = http.getString();
  Serial.println(response);

  http.end();
}

void loop() {
  bool motion = digitalRead(PIR_PIN);

  if (motion == HIGH) {
    digitalWrite(BUZZER, HIGH);
    digitalWrite(LED, HIGH);

    if (lastMotionState == LOW) {
      Serial.println("Unauthorized Entry Detected!");
      sendAlert();
    }
  } else {
    digitalWrite(BUZZER, LOW);
    digitalWrite(LED, LOW);

    if (lastMotionState == HIGH) {
      Serial.println("Zone Secure");
    }
  }

  lastMotionState = motion;
}