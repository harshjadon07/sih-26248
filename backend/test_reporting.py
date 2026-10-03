import pytest
from fastapi.testclient import TestClient
from main import app
import json

def get_instructor_token(client):
    response = client.post("/token", data={"username": "instructor1", "password": "password123"})
    return response.json()["access_token"]

def test_aar_and_exports():
    with TestClient(app) as client:
        token = get_instructor_token(client)
        headers = {"Authorization": f"Bearer {token}"}
        
        # 1. Create scenario & exercise
        config = {"communication_disruptions": {"dropout_rate": 0.0, "delay_ms": 0}}
        resp = client.post("/scenarios/", headers=headers, json={"name": "Export Test", "configuration": json.dumps(config)})
        scenario_id = resp.json()["id"]
        resp = client.post(f"/exercises/{scenario_id}?seed=42", headers=headers)
        exercise_id = resp.json()["id"]
        
        # 2. Trigger an event
        client.post(f"/exercises/{exercise_id}/start", headers=headers)
        resp_trigger = client.post(f"/exercises/{exercise_id}/trigger_event", headers=headers, json={"message": "Intel update"})
        assert resp_trigger.status_code == 200
        
        # 3. Test AAR JSON
        aar_resp = client.get(f"/exercises/{exercise_id}/aar", headers=headers)
        assert aar_resp.status_code == 200
        aar_data = aar_resp.json()
        assert "exercise" in aar_data
        assert "events" in aar_data
        assert len(aar_data["events"]) > 0
        
        # 4. Test CSV Export
        csv_resp = client.get(f"/exercises/{exercise_id}/export/csv", headers=headers)
        assert csv_resp.status_code == 200
        assert "text/csv" in csv_resp.headers["content-type"]
        assert "Intel update" in csv_resp.text
        
        # 5. Test PDF Export
        pdf_resp = client.get(f"/exercises/{exercise_id}/export/pdf", headers=headers)
        assert pdf_resp.status_code == 200
        assert "application/pdf" in pdf_resp.headers["content-type"]
        # Valid PDF header
        assert pdf_resp.content.startswith(b"%PDF")
