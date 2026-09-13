from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid

from app.models.schemas import ProfileSchema, TierType
from app.services.generator_service import generate_premium_advice, PremiumAdviceResponse

router = APIRouter()

class PremiumAdviceRequest(BaseModel):
    user_id: uuid.UUID
    tier: TierType
    profile_data: ProfileSchema
    query: str

@router.post("/premium-advice", response_model=PremiumAdviceResponse)
async def get_premium_advice(request: PremiumAdviceRequest):
    """
    Returns AI-generated biohacking advice using the specialized RAG knowledge base.
    Only available for premium users.
    """
    if request.tier == TierType.free:
        raise HTTPException(
            status_code=403, 
            detail="Premium advice is only available for Coach Subscription or One-Time Protocol users."
        )
        
    try:
        response = generate_premium_advice(request.profile_data, request.query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
