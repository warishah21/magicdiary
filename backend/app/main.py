from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.services.ai import get_diary_response
from app.database import Base, engine, get_db
from app import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Magic Diary API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_or_create_default_user(db: Session) -> models.User:
    """Temporary stand-in until real auth exists in the next milestone."""
    user = db.query(models.User).filter(models.User.username == "default_user").first()
    if not user:
        user = models.User(username="default_user", hashed_password="placeholder")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@app.get("/health")
def health_check():
    return {"status": "the diary is listening"}


class DiaryEntry(BaseModel):
    text: str


MEMORY_WINDOW = 5  # how many past entries to include as context

@app.post("/diary-response")
def diary_response(entry: DiaryEntry, db: Session = Depends(get_db)):
    if not entry.text.strip():
        raise HTTPException(status_code=400, detail="No text to respond to.")

    user = get_or_create_default_user(db)

    # Pull recent entries for context, then flip to oldest-first for a coherent timeline
    recent = (
        db.query(models.DiaryEntry)
        .filter(models.DiaryEntry.user_id == user.id)
        .order_by(models.DiaryEntry.created_at.desc())
        .limit(MEMORY_WINDOW)
        .all()
    )
    past_texts = [e.entry_text for e in reversed(recent)]

    try:
        reply = get_diary_response(entry.text, past_entries=past_texts)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


    return {"reply": reply}


@app.get("/entries")
def get_entries(db: Session = Depends(get_db)):
    """Returns all saved diary pages, newest first."""
    user = get_or_create_default_user(db)
    entries = (
        db.query(models.DiaryEntry)
        .filter(models.DiaryEntry.user_id == user.id)
        .order_by(models.DiaryEntry.created_at.desc())
        .all()
    )
    return [
        {"id": e.id, "entry_text": e.entry_text, "ai_reply": e.ai_reply, "created_at": e.created_at}
        for e in entries
    ]