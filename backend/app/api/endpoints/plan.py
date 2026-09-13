from fastapi import APIRouter, BackgroundTasks, HTTPException
from typing import Dict, Any

from app.models.schemas import GeneratePlanRequest
from app.services.generator_service import background_generate_full_plan

router = APIRouter()

@router.post("/generate-plan")
async def generate_plan(request: GeneratePlanRequest, background_tasks: BackgroundTasks):
    """
    Triggers the AI plan generation process in the background.
    Returns immediately so the mobile client can show a loading state.
    """
    try:
        background_tasks.add_task(
            background_generate_full_plan,
            user_id=request.user_id,
            tier=request.tier,
            profile=request.profile_data
        )
        return {"status": "processing", "message": "Analyzing biology and generating protocol..."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
