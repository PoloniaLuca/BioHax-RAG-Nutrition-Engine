from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
import uuid

class PlanStatusType(str, Enum):
    detailed = 'detailed'
    blueprint = 'blueprint'

class TierType(str, Enum):
    free = 'free'
    protocol_one_time = 'protocol_one_time'
    coach_sub = 'coach_sub'

class ProfileSchema(BaseModel):
    id: uuid.UUID
    email: Optional[str] = None
    diet_type: Optional[str] = None
    goal: Optional[str] = None
    biometrics: Optional[Dict[str, Any]] = None
    intolerances: Optional[List[str]] = None
    subscription_tier: TierType = TierType.free

class UserPlanSchema(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    start_date: date
    end_date: date
    is_active: bool = True

class DailyLogSchema(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    plan_id: uuid.UUID
    date: date
    status: PlanStatusType = PlanStatusType.detailed
    macros_total: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class IngredientSchema(BaseModel):
    item: str
    qty: str
    category: str

class MealSchema(BaseModel):
    type: str # 'breakfast', 'lunch', 'dinner', 'snack', 'pre_workout'
    name: str
    ingredients: List[IngredientSchema]
    macros: Dict[str, Any]
    biohack_tip: Optional[str] = None

class GeneratePlanRequest(BaseModel):
    user_id: uuid.UUID
    tier: TierType
    profile_data: ProfileSchema
