from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

def require_instructor(current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    role = db.query(models.Role).filter(models.Role.id == current_user.role_id).first()
    if role.name != "instructor":
        raise HTTPException(status_code=403, detail="Instructor role required")
    return current_user

@router.post("/", response_model=schemas.ScenarioResponse)
def create_scenario(scenario: schemas.ScenarioCreate, db: Session = Depends(get_db), user: models.User = Depends(require_instructor)):
    db_scenario = models.Scenario(**scenario.model_dump())
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

@router.get("/", response_model=List[schemas.ScenarioResponse])
def get_scenarios(db: Session = Depends(get_db), user: models.User = Depends(require_instructor)):
    return db.query(models.Scenario).all()

@router.get("/{scenario_id}", response_model=schemas.ScenarioResponse)
def get_scenario(scenario_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_instructor)):
    scenario = db.query(models.Scenario).filter(models.Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario

@router.put("/{scenario_id}", response_model=schemas.ScenarioResponse)
def update_scenario(scenario_id: int, updated: schemas.ScenarioCreate, db: Session = Depends(get_db), user: models.User = Depends(require_instructor)):
    scenario = db.query(models.Scenario).filter(models.Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    for key, value in updated.model_dump().items():
        setattr(scenario, key, value)
    
    db.commit()
    db.refresh(scenario)
    return scenario
