from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List
import json
import asyncio
from datetime import datetime, timezone

import models, auth, engine
from database import SessionLocal

router = APIRouter(tags=["websockets"])

class ConnectionManager:
    def __init__(self):
        # exercise_id -> list of dicts {"ws": WebSocket, "user": models.User}
        self.active_connections: Dict[int, List[dict]] = {}

    async def connect(self, ws: WebSocket, exercise_id: int, user: models.User):
        await ws.accept()
        if exercise_id not in self.active_connections:
            self.active_connections[exercise_id] = []
        self.active_connections[exercise_id].append({"ws": ws, "user": user})

    def disconnect(self, ws: WebSocket, exercise_id: int):
        if exercise_id in self.active_connections:
            self.active_connections[exercise_id] = [c for c in self.active_connections[exercise_id] if c["ws"] != ws]

    async def broadcast_to_exercise(self, exercise_id: int, message: dict):
        if exercise_id in self.active_connections:
            for connection in self.active_connections[exercise_id]:
                try:
                    await connection["ws"].send_json(message)
                except Exception:
                    pass

    async def send_to_role(self, exercise_id: int, role_name: str, message: dict, db: Session):
        if exercise_id in self.active_connections:
            for connection in self.active_connections[exercise_id]:
                user = connection["user"]
                role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
                if role and role.name == role_name:
                    try:
                        await connection["ws"].send_json(message)
                    except Exception:
                        pass

manager = ConnectionManager()

def get_user_from_token(token: str, db: Session):
    try:
        user = auth.get_current_user(token, db)
        return user
    except Exception:
        return None

@router.websocket("/ws/exercise/{exercise_id}")
async def websocket_endpoint(websocket: WebSocket, exercise_id: int, token: str = Query(...)):
    db = SessionLocal()
    user = get_user_from_token(token, db)
    if not user:
        await websocket.close(code=1008) # Policy Violation
        db.close()
        return

    exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not exercise:
        await websocket.close(code=1008)
        db.close()
        return

    await manager.connect(websocket, exercise_id, user)
    
    # Broadcast connection event to instructors
    await manager.send_to_role(exercise_id, "instructor", {
        "type": "system",
        "message": f"User {user.username} connected."
    }, db)

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            msg_type = payload.get("type")
            
            # Refresh exercise state
            exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
            if exercise.status != "active":
                await websocket.send_json({"type": "error", "message": "Exercise is not active"})
                continue

            sim_time = engine.get_current_sim_time(exercise)
            config = json.loads(exercise.configuration_snapshot or "{}")

            if msg_type == "chat":
                # Process through disruption engine
                modified_payload, delay_ms, dropped = engine.process_disruptions(payload, config, exercise.random_seed)
                
                # Persist event
                event = models.Event(
                    exercise_id=exercise_id,
                    event_type="chat",
                    payload=json.dumps(modified_payload),
                    scheduled_time=sim_time + delay_ms if not dropped else None,
                    generation_time=datetime.now(timezone.utc),
                    send_time=datetime.now(timezone.utc) if not dropped else None
                )
                db.add(event)
                db.commit()
                db.refresh(event)

                if dropped:
                    continue # Do nothing, it was dropped

                async def deliver_message(evt_id, delay, msg_payload):
                    await asyncio.sleep(delay / 1000.0)
                    # Once delayed, broadcast
                    db_local = SessionLocal()
                    evt = db_local.query(models.Event).filter(models.Event.id == evt_id).first()
                    if evt:
                        evt.actual_time = engine.get_current_sim_time(exercise)
                        evt.delivery_time = datetime.now(timezone.utc)
                        db_local.commit()
                        
                        broadcast_msg = {
                            "type": "chat",
                            "sender": user.username,
                            "content": msg_payload.get("content"),
                            "event_id": evt_id,
                            "sim_time": evt.actual_time
                        }
                        await manager.broadcast_to_exercise(exercise_id, broadcast_msg)
                    db_local.close()

                asyncio.create_task(deliver_message(event.id, delay_ms, modified_payload))

            elif msg_type == "decision":
                decision = models.Decision(
                    user_id=user.id,
                    exercise_id=exercise_id,
                    rationale=payload.get("rationale", ""),
                    confidence_level=payload.get("confidence", 0),
                    timestamp=datetime.now(timezone.utc)
                )
                db.add(decision)
                db.commit()
                await manager.send_to_role(exercise_id, "instructor", {
                    "type": "decision_submitted",
                    "user": user.username,
                    "rationale": decision.rationale
                }, db)

    except WebSocketDisconnect:
        manager.disconnect(websocket, exercise_id)
        await manager.send_to_role(exercise_id, "instructor", {
            "type": "system",
            "message": f"User {user.username} disconnected."
        }, db)
    finally:
        db.close()
