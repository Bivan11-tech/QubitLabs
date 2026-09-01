"""Algorithm template endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..quantum.algorithms import TEMPLATES, get_template
from ..quantum.simulator import run_simulation
from ..quantum.validation import CircuitValidationError

router = APIRouter(prefix="/api/v1", tags=["algorithms"])

@router.get("/templates")
def list_templates() -> dict:
    return {"templates": sorted(TEMPLATES)}

@router.get("/templates/{algo_name}")
def get_algorithm_template(algo_name: str) -> dict:
    try:
        template = get_template(algo_name)
    except CircuitValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    result = run_simulation(template)
    result["template"] = template.model_dump()
    return result