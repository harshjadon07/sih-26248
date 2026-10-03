# COMMAND-X

Collaborative Operational Readiness & Multi-domain Assessment under Network Disruption.

## Prerequisites

- Node.js
- Python 3.9+

## Setup

### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic pydantic-settings passlib[bcrypt] python-jose[cryptography] pytest httpx websockets python-multipart
   ```
4. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```
   (The database will be automatically initialized and seeded with demo accounts on startup).

**Demo Accounts:**
- `instructor1` / `password123`
- `leader1` / `password123`
- `member1` / `password123`

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Testing

To run backend tests:
```bash
cd backend
pytest test_main.py
```

To run frontend build checks:
```bash
cd frontend
npm run build
```
