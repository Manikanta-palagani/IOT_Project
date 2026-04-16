# Smart Home Security Monitoring System

Full-stack smart home security platform built with the MERN stack, Socket.io, Tailwind CSS, Nodemailer, JWT authentication, and an ESP32 PIR sensor.

## Structure

- `backend/` Express API, MongoDB Atlas, auth, security events, users, mail alerts
- `frontend/` React + Vite security dashboard and admin console
- `esp32/` Arduino sketch for ESP32 motion alerts and heartbeat pings

## Backend setup

1. Copy `backend/.env.example` to `backend/.env`
2. Set your MongoDB Atlas URI, JWT secret, and Gmail app password, using the 16-character app password without spaces
3. Set `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` in your local environment if you want to override the default admin seed values
4. Install backend dependencies and start the server

## Frontend setup

1. Copy `frontend/.env.example` to `frontend/.env`
2. Set the API and Socket.io URLs
3. Install frontend dependencies and run the Vite app

## Vercel deployment

This repository is configured to deploy the React frontend on Vercel from the repository root.

1. Import the GitHub repository into Vercel
2. Keep the project using the root directory so Vercel picks up `vercel.json`
3. Add `VITE_API_URL` and `VITE_SOCKET_URL` in the Vercel project environment settings, pointing to your deployed backend API
4. Deploy the frontend build output from `frontend/dist`

The backend Express and Socket.io server should be deployed separately on a Node-compatible host.

## ESP32 setup

1. Open `esp32/esp32_motion_alert.ino` in the Arduino IDE
2. Enter Wi-Fi credentials and your backend URL
3. Connect the PIR sensor, LED, and buzzer to the configured GPIO pins
4. Upload to the board so it can publish intrusion events and periodic heartbeat posts
