"""QubitLabs quantum engine — FastAPI application entrypoint.

Run from the repository root:

    backend/.venv/bin/python -m uvicorn backend.main:app --reload

or after activating the backend virtualenv:

    cd backend && uvicorn main:app --reload   (needs an __init__ path setup)

The app is configured from backend/.env (see .env.example). The Gemini key is
read from the environment only and is never exposed to any client.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()  # also try the current working directory

from .api.ai import router as ai_router
from .api.algorithms import router as algorithms_router
from .api.challenges import router as challenges_router
from .api.health import router as health_router
from .api.simulation import router as simulation_router

app = FastAPI(title="Quantum Engine Backend API", version="1.0.0")

_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
origins = [
    o.strip()
    for o in os.getenv("FRONTEND_URL", _default_origins).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(simulation_router)
app.include_router(ai_router)
app.include_router(algorithms_router)
app.include_router(challenges_router)