# COMMAND-X

**Collaborative Operational Readiness & Multi-domain Assessment under Network Disruption**

A functional web-based training simulation platform designed to train teams in making decisions under uncertainty, dealing with network disruptions, and reviewing event-driven scenarios.

## Architecture

* **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router.
* **Backend**: Python 3.9+, FastAPI, SQLAlchemy, WebSockets.
* **Database**: SQLite (local development), modularly designed to scale to PostgreSQL.
* **Exports**: ReportLab for PDF, built-in CSV for structured logs.

The backend acts as the authoritative source of truth. All communication and simulation progression is routed through a central server-managed clock, ensuring consistent deterministic testing and real-time disruption behavior (delayed or dropped messages).

## Prerequisites

- Node.js (v18+ recommended)
- Python 3.9+

## Installation & Setup

### 1. Database & Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic pydantic-settings bcrypt python-jose[cryptography] pytest httpx websockets python-multipart reportlab
   ```
4. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
   Modify `.env` to set your custom `SECRET_KEY`.

### 2. Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Starting the Platform

1. **Start Backend**:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
   *(On startup, the SQLite database `sql_app.db` is initialized automatically, and demo data is seeded).*

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

## Demo Credentials & Seed Data

The following accounts are automatically seeded into the database for demonstration purposes:

| Role | Username | Password |
|---|---|---|
| **Instructor** | `instructor1` | `password123` |
| **Team Leader** | `leader1` | `password123` |
| **Team Member** | `member1` | `password123` |

Additionally, a pre-configured template called **"Demo Scenario: Operation Cyber Storm"** is automatically loaded for the Instructor to use, featuring a 20% dropout rate and 2000ms delay.

## Testing

**Backend Unit & Integration Tests**:
```bash
cd backend
pytest test_main.py test_engine.py test_websockets.py test_reporting.py
```

**Frontend Build Tests**:
```bash
cd frontend
npm run build
```

## Limitations & Future Enhancements (Phase 5+)

- **PostgreSQL Migration**: The system currently uses SQLite for zero-config setups. A production deployment requires swapping the SQLAlchemy `DATABASE_URL` to PostgreSQL and potentially utilizing `alembic` for schema migrations.
- **Complex UI Disruption Logic**: Currently, the simulation engine calculates dropouts and delays accurately per the schedule, but the UI lacks rich visualizations of real-time map/radar layers (e.g., Leaflet fictional maps).
- **Security Check**: This development version disables strict CORS for ease of local testing (`allow_origins=["*"]`). In production, this must be restricted to the deployed frontend domain.

## Deployment Requirements

- A production ASGI server (e.g., Gunicorn with Uvicorn workers) for the backend.
- A static file host (e.g., Nginx, AWS S3, or Vercel) for the Vite-built frontend.
- A scalable PostgreSQL instance.
- Properly rotated JWT secret keys in the production `.env`.
