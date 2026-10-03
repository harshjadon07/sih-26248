from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # instructor, team_leader, team_member
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role_id = Column(Integer, ForeignKey("roles.id"))
    
    role = relationship("Role", back_populates="users")
    participants = relationship("Participant", back_populates="user")
    decisions = relationship("Decision", back_populates="user")
    audit_records = relationship("AuditRecord", back_populates="user")

class Scenario(Base):
    __tablename__ = "scenarios"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    is_template = Column(Boolean, default=False)
    configuration = Column(Text) # JSON string: initial conditions, participants, scheduled events, objectives
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    exercises = relationship("Exercise", back_populates="scenario")

class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"))
    status = Column(String, default="planned") # planned, active, paused, completed
    started_at = Column(DateTime, nullable=True)
    last_resumed_at = Column(DateTime, nullable=True)
    accumulated_sim_time = Column(Integer, default=0) # milliseconds
    random_seed = Column(Integer, default=0)
    configuration_snapshot = Column(Text) # JSON snapshot of scenario configuration
    
    scenario = relationship("Scenario", back_populates="exercises")
    participants = relationship("Participant", back_populates="exercise")
    events = relationship("Event", back_populates="exercise")

class Participant(Base):
    __tablename__ = "participants"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    participant_role = Column(String) # Role in the exercise, distinct from system role
    
    user = relationship("User", back_populates="participants")
    exercise = relationship("Exercise", back_populates="participants")

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    event_type = Column(String)
    payload = Column(Text) # JSON string
    
    # Simulation timestamps (in sim milliseconds)
    scheduled_time = Column(Integer, nullable=True)
    actual_time = Column(Integer, nullable=True)
    
    # Real-world auditable timestamps
    generation_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    send_time = Column(DateTime, nullable=True)
    delivery_time = Column(DateTime, nullable=True)
    ack_time = Column(DateTime, nullable=True)
    action_time = Column(DateTime, nullable=True)
    
    exercise = relationship("Exercise", back_populates="events")

class Decision(Base):
    __tablename__ = "decisions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    rationale = Column(Text)
    confidence_level = Column(Integer)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="decisions")
    exercise = relationship("Exercise")

class AuditRecord(Base):
    __tablename__ = "audit_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    target = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="audit_records")
