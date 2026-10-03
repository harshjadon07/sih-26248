from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
import uvicorn

import models
import schemas
import auth
from database import engine, get_db
from routers import scenarios, exercises

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="COMMAND-X Backend")

app.include_router(scenarios.router)
app.include_router(exercises.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def seed_demo_data():
    db = next(get_db())
    # Seed roles
    roles = ["instructor", "team_leader", "team_member"]
    for role_name in roles:
        if not db.query(models.Role).filter(models.Role.name == role_name).first():
            db.add(models.Role(name=role_name))
    db.commit()

    # Seed users
    instructor_role = db.query(models.Role).filter(models.Role.name == "instructor").first()
    tl_role = db.query(models.Role).filter(models.Role.name == "team_leader").first()
    tm_role = db.query(models.Role).filter(models.Role.name == "team_member").first()

    users = [
        {"username": "instructor1", "password": "password123", "role_id": instructor_role.id},
        {"username": "leader1", "password": "password123", "role_id": tl_role.id},
        {"username": "member1", "password": "password123", "role_id": tm_role.id},
    ]

    for u in users:
        if not db.query(models.User).filter(models.User.username == u["username"]).first():
            hashed = auth.get_password_hash(u["password"])
            db.add(models.User(username=u["username"], hashed_password=hashed, role_id=u["role_id"]))
    db.commit()


@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
    
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": role.name}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@app.get("/instructor/dashboard")
def instructor_dashboard(current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    role = db.query(models.Role).filter(models.Role.id == current_user.role_id).first()
    if role.name != "instructor":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return {"message": "Welcome to the instructor dashboard"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
