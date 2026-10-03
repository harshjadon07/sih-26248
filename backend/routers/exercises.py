from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import models, schemas, auth
from database import get_db
import engine
import json

router = APIRouter(prefix="/exercises", tags=["exercises"])

def require_instructor(current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    role = db.query(models.Role).filter(models.Role.id == current_user.role_id).first()
    if role.name != "instructor":
        raise HTTPException(status_code=403, detail="Instructor role required")
    return current_user

@router.post("/{scenario_id}", response_model=schemas.ExerciseResponse)
def create_exercise(scenario_id: int, seed: int = 42, db: Session = Depends(get_db), user: models.User = Depends(require_instructor)):
    scenario = db.query(models.Scenario).filter(models.Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    exercise = models.Exercise(
        scenario_id=scenario.id,
        random_seed=seed,
        configuration_snapshot=scenario.configuration
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise

@router.post("/{exercise_id}/start", response_model=schemas.ExerciseResponse)
def start_exercise(exercise_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_instructor)):
    exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    if exercise.status != "planned":
        raise HTTPException(status_code=400, detail="Can only start planned exercises")
        
    now = datetime.now(timezone.utc)
    exercise.status = "active"
    exercise.started_at = now
    exercise.last_resumed_at = now
    db.commit()
    db.refresh(exercise)
    return exercise

@router.post("/{exercise_id}/pause", response_model=schemas.ExerciseResponse)
def pause_exercise(exercise_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_instructor)):
    exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not exercise or exercise.status != "active":
        raise HTTPException(status_code=400, detail="Exercise not active")
        
    now = datetime.now(timezone.utc)
    elapsed_ms = int((now - exercise.last_resumed_at.replace(tzinfo=timezone.utc)).total_seconds() * 1000)
    exercise.accumulated_sim_time += elapsed_ms
    exercise.status = "paused"
    exercise.last_resumed_at = None
    db.commit()
    db.refresh(exercise)
    return exercise

@router.post("/{exercise_id}/resume", response_model=schemas.ExerciseResponse)
def resume_exercise(exercise_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_instructor)):
    exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not exercise or exercise.status != "paused":
        raise HTTPException(status_code=400, detail="Exercise not paused")
        
    exercise.status = "active"
    exercise.last_resumed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(exercise)
    return exercise

@router.post("/{exercise_id}/trigger_event")
def trigger_event(exercise_id: int, event_payload: dict, db: Session = Depends(get_db), user: models.User = Depends(require_instructor)):
    exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
        
    sim_time = engine.get_current_sim_time(exercise)
    
    config = json.loads(exercise.configuration_snapshot or "{}")
    modified_payload, delay_ms, dropped = engine.process_disruptions(event_payload, config, exercise.random_seed)
    
    event = models.Event(
        exercise_id=exercise.id,
        event_type="instructor_trigger",
        payload=json.dumps(modified_payload),
        scheduled_time=sim_time + delay_ms if not dropped else None,
        actual_time=None, # Will be set when delivered
        generation_time=datetime.now(timezone.utc),
        send_time=datetime.now(timezone.utc) if not dropped else None
    )
    db.add(event)
    db.commit()
    return {"message": "Event triggered", "dropped": dropped, "delay_ms": delay_ms}

@router.get("/{exercise_id}/aar")
def get_aar_data(exercise_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_instructor)):
    exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
        
    events = db.query(models.Event).filter(models.Event.exercise_id == exercise_id).all()
    decisions = db.query(models.Decision).filter(models.Decision.exercise_id == exercise_id).all()
    
    return {
        "exercise": schemas.ExerciseResponse.model_validate(exercise).model_dump(),
        "events": [{c.name: getattr(e, c.name) for c in e.__table__.columns} for e in events],
        "decisions": [{c.name: getattr(d, c.name) for d in d.__table__.columns} for d in decisions]
    }

from fastapi.responses import Response, StreamingResponse
import csv
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

@router.get("/{exercise_id}/export/csv")
def export_csv(exercise_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_instructor)):
    events = db.query(models.Event).filter(models.Event.exercise_id == exercise_id).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Type", "ScheduledTime", "ActualTime", "Payload", "GenerationTime", "DeliveryTime"])
    
    for e in events:
        writer.writerow([e.id, e.event_type, e.scheduled_time, e.actual_time, e.payload, e.generation_time, e.delivery_time])
        
    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=exercise_{exercise_id}_events.csv"
    return response

@router.get("/{exercise_id}/export/pdf")
def export_pdf(exercise_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_instructor)):
    events = db.query(models.Event).filter(models.Event.exercise_id == exercise_id).all()
    
    output = io.BytesIO()
    p = canvas.Canvas(output, pagesize=letter)
    
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, 750, f"COMMAND-X After-Action Review (Exercise {exercise_id})")
    
    p.setFont("Helvetica", 12)
    y = 720
    for e in events:
        if y < 50:
            p.showPage()
            y = 750
        p.drawString(100, y, f"Event {e.id}: {e.event_type} | Time: {e.actual_time}ms | Delivered: {e.delivery_time}")
        y -= 20
        
    p.save()
    output.seek(0)
    
    response = StreamingResponse(output, media_type="application/pdf")
    response.headers["Content-Disposition"] = f"attachment; filename=exercise_{exercise_id}_aar.pdf"
    return response
