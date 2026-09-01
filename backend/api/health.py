from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(tags=["health"])

@router.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "quantum-engine", "version": "1.0.0"}