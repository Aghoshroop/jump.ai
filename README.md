---
title: Jump AI
emoji: 🏃
colorFrom: blue
colorTo: green
sdk: docker
app_port: 8000
---

# Jump AI

AI-powered long jump technique analysis application.

## Prerequisites
- Node.js 18+
- Python 3.9+
- A side-view long jump video

## Installation

### 1. Backend (Python)
Navigate to the `backend` directory:
```bash
cd backend
pip install -r requirements.txt
```

### 2. Frontend (React)
Navigate to the `frontend` directory:
```bash
cd frontend
npm install
```

## Running the Application

### 1. Start the Backend API
In the `backend` directory:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start the Frontend
In the `frontend` directory:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Architecture
- **Frontend**: React + TypeScript + Vite. Vanilla CSS.
- **Backend**: FastAPI + Python.
- **Pose Estimation**: MediaPipe Pose Landmarker.
- **Biomechanics**: Custom calculations for joint angles and posture.
- **Scoring**: Rule-based deterministic scoring engine.

## Note on Video Processing
Videos are uploaded to `backend/uploads`. Extracted frames and coordinates are stored in `backend/outputs`.

## Demo Mode
Not implemented in MVP, but can be added in future iterations by placing a sample video in uploads and serving preset JSON results.
