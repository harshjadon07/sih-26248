from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role_id: int

class UserResponse(UserBase):
    id: int
    role_id: int
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class ScenarioBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_template: bool = False
    configuration: str = "{}"

class ScenarioCreate(ScenarioBase):
    pass

class ScenarioResponse(ScenarioBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ExerciseResponse(BaseModel):
    id: int
    scenario_id: int
    status: str
    started_at: Optional[datetime]
    last_resumed_at: Optional[datetime]
    accumulated_sim_time: int
    
    class Config:
        from_attributes = True
