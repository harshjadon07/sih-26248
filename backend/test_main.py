from fastapi.testclient import TestClient
from main import app

def test_login_and_access_protected_route():
    with TestClient(app) as client:
        # Login as instructor
        response = client.post(
            "/token",
            data={"username": "instructor1", "password": "password123"}
        )
        assert response.status_code == 200
        token = response.json()["access_token"]
        
        # Access instructor dashboard
        auth_headers = {"Authorization": f"Bearer {token}"}
        dash_response = client.get("/instructor/dashboard", headers=auth_headers)
        assert dash_response.status_code == 200
        assert dash_response.json() == {"message": "Welcome to the instructor dashboard"}

def test_unauthorized_access():
    with TestClient(app) as client:
        # Login as team member
        response = client.post(
            "/token",
            data={"username": "member1", "password": "password123"}
        )
        assert response.status_code == 200
        token = response.json()["access_token"]
        
        # Access instructor dashboard
        auth_headers = {"Authorization": f"Bearer {token}"}
        dash_response = client.get("/instructor/dashboard", headers=auth_headers)
        assert dash_response.status_code == 403
