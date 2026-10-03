import pytest
from fastapi.testclient import TestClient
from main import app
import time
import json

def get_instructor_token(client):
    response = client.post(
        "/token",
        data={"username": "instructor1", "password": "password123"}
    )
    return response.json()["access_token"]

def test_scenario_crud_and_exercise_flow():
    with TestClient(app) as client:
        token = get_instructor_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        
        # 1. Create Scenario
        config = {
            "communication_disruptions": {
                "dropout_rate": 0.0,
                "delay_ms": 100
            }
        }
        resp = client.post("/scenarios/", headers=headers, json={
            "name": "Test Scenario",
            "description": "A test scenario",
            "is_template": False,
            "configuration": json.dumps(config)
        })
        assert resp.status_code == 200
        scenario_id = resp.json()["id"]
        
        # 2. Create Exercise
        resp = client.post(f"/exercises/{scenario_id}?seed=42", headers=headers)
        assert resp.status_code == 200
        exercise_id = resp.json()["id"]
        
        # 3. Start Exercise
        resp = client.post(f"/exercises/{exercise_id}/start", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "active"
        
        # 4. Trigger Event
        resp = client.post(f"/exercises/{exercise_id}/trigger_event", headers=headers, json={"message": "Intel update"})
        assert resp.status_code == 200
        assert resp.json()["dropped"] == False
        assert resp.json()["delay_ms"] == 100
        
        # 5. Pause Exercise
        time.sleep(0.1) # Simulate some time passing
        resp = client.post(f"/exercises/{exercise_id}/pause", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "paused"
        assert resp.json()["accumulated_sim_time"] > 0
        
        # 6. Resume Exercise
        resp = client.post(f"/exercises/{exercise_id}/resume", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "active"

def test_communication_disruptions():
    with TestClient(app) as client:
        token = get_instructor_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        
        # Config with 100% dropout
        config = {
            "communication_disruptions": {
                "dropout_rate": 1.0,
                "delay_ms": 0
            }
        }
        resp = client.post("/scenarios/", headers=headers, json={
            "name": "Disrupted Scenario",
            "configuration": json.dumps(config)
        })
        scenario_id = resp.json()["id"]
        
        resp = client.post(f"/exercises/{scenario_id}?seed=42", headers=headers)
        exercise_id = resp.json()["id"]
        
        client.post(f"/exercises/{exercise_id}/start", headers=headers)
        
        # Trigger event, it should drop
        resp = client.post(f"/exercises/{exercise_id}/trigger_event", headers=headers, json={"message": "Will drop"})
        assert resp.status_code == 200
        assert resp.json()["dropped"] == True
