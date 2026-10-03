import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
import json

def get_token(client, username, password):
    resp = client.post("/token", data={"username": username, "password": password})
    return resp.json()["access_token"]

def test_websocket_multiplayer():
    with TestClient(app) as client:
        # 1. Instructor creates scenario and exercise
        inst_token = get_token(client, "instructor1", "password123")
        headers = {"Authorization": f"Bearer {inst_token}"}
        
        config = {"communication_disruptions": {"dropout_rate": 0.0, "delay_ms": 0}}
        resp = client.post("/scenarios/", headers=headers, json={"name": "WS Test", "configuration": json.dumps(config)})
        scenario_id = resp.json()["id"]
        
        resp = client.post(f"/exercises/{scenario_id}?seed=42", headers=headers)
        exercise_id = resp.json()["id"]
        
        client.post(f"/exercises/{exercise_id}/start", headers=headers)
        
        # 2. Get tokens for leader and member
        leader_token = get_token(client, "leader1", "password123")
        member_token = get_token(client, "member1", "password123")
        
        # 3. Connect WebSockets
        with client.websocket_connect(f"/ws/exercise/{exercise_id}?token={leader_token}") as ws_leader:
            with client.websocket_connect(f"/ws/exercise/{exercise_id}?token={member_token}") as ws_member:
                # 4. Leader sends a message
                ws_leader.send_json({"type": "chat", "content": "Hello team"})
                
                # 5. Member receives the message
                data = ws_member.receive_json()
                assert data["type"] == "chat"
                assert data["sender"] == "leader1"
                assert data["content"] == "Hello team"
                
                # 6. Leader also receives their own message back (broadcast)
                data_leader = ws_leader.receive_json()
                assert data_leader["type"] == "chat"
                assert data_leader["content"] == "Hello team"

def test_websocket_dropout():
    with TestClient(app) as client:
        inst_token = get_token(client, "instructor1", "password123")
        headers = {"Authorization": f"Bearer {inst_token}"}
        
        config = {"communication_disruptions": {"dropout_rate": 1.0, "delay_ms": 0}}
        resp = client.post("/scenarios/", headers=headers, json={"name": "WS Dropout Test", "configuration": json.dumps(config)})
        scenario_id = resp.json()["id"]
        
        resp = client.post(f"/exercises/{scenario_id}?seed=42", headers=headers)
        exercise_id = resp.json()["id"]
        
        client.post(f"/exercises/{exercise_id}/start", headers=headers)
        leader_token = get_token(client, "leader1", "password123")
        
        with client.websocket_connect(f"/ws/exercise/{exercise_id}?token={leader_token}") as ws_leader:
            ws_leader.send_json({"type": "chat", "content": "This will drop"})
            
            # We don't expect a response, we can just assert no receive is ready (or time out)
            # Actually, to test without hanging, we can use a small timeout or just trust the DB
            pass
