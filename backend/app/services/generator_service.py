import openai
import instructor
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import date, timedelta
import uuid
import json

from app.core.config import settings
from app.services.supabase_client import supabase
from app.services.rag_service import search_bio_knowledge
from app.models.schemas import ProfileSchema, TierType, PlanStatusType

# Patch OpenAI client with instructor, pointing to local Ollama
client = instructor.from_openai(
    openai.OpenAI(
        base_url="http://localhost:11434/v1",
        api_key="ollama" # required but ignored
    ),
    mode=instructor.Mode.JSON
)

class AIGeneratedIngredient(BaseModel):
    item: str
    qty: str
    category: str

class Macros(BaseModel):
    p: float = Field(description="Grams of protein")
    f: float = Field(description="Grams of fat")
    c: float = Field(description="Grams of carbohydrates")

class AIGeneratedMeal(BaseModel):
    type: str = Field(description="'breakfast', 'lunch', 'dinner', 'snack', or 'pre_workout'")
    name: str
    ingredients: List[AIGeneratedIngredient]
    macros: Macros
    biohack_tip: str

class AIGeneratedDay(BaseModel):
    macros_total: Macros
    notes: str
    meals: List[AIGeneratedMeal]

def generate_day_plan(profile: ProfileSchema, day_number: int, phase_context: str, rag_context: str, weekday_name: str) -> AIGeneratedDay:
    """Uses LLM to generate a single day's meal plan based on user profile and RAG context."""
    
    biometrics = profile.biometrics or {}
    schedule_prompt = ""
    workout_schedule = biometrics.get('workoutSchedule')
    workout_type = biometrics.get('workoutType')
    
    if workout_schedule:
        schedule_prompt = f"\nCRITICAL INSTRUCTION: Today is {weekday_name}. The user's workout schedule is: '{workout_schedule}' (Protocol: {workout_type}). IF the user works out on {weekday_name} based on this schedule, YOU MUST optimize meal timing for the workout (e.g. include a 'pre_workout' meal, adjust macros around the workout, and provide a relevant biohack_tip regarding workout fueling/recovery). If they do not work out on {weekday_name}, structure this as a rest day."
    else:
        schedule_prompt = f"\nToday is {weekday_name}. Structure a normal day."

    prompt = f"""
    You are an elite Biohacker Nutritionist AI.
    Generate a 1-day meal plan for a user with the following profile:
    Goal: {profile.goal}
    Diet: {profile.diet_type}
    Intolerances: {', '.join(profile.intolerances) if profile.intolerances else 'None'}
    Biometrics: {json.dumps(profile.biometrics) if profile.biometrics else 'Not provided'}
    {schedule_prompt}
    
    Phase Context: {phase_context}
    
    Relevant Biohacking Knowledge:
    {rag_context}
    
    Make sure the plan aligns strictly with their diet, goals, and avoids intolerances.
    Return strictly according to the requested JSON schema.
    CRITICAL: Output ONLY the final populated JSON data with real values. DO NOT output JSON schema definitions ($defs, $ref).
    """
    
    response = client.chat.completions.create(
        model="llama3", # Using local Ollama model
        response_model=AIGeneratedDay,
        messages=[
            {"role": "system", "content": "You are a world-class performance nutritionist and biohacker. Keep biohack_tip sentences under 15 words."},
            {"role": "user", "content": prompt}
        ],
        max_retries=2,
        extra_body={"options": {"num_ctx": 8192}}
    )
    return response

def background_generate_full_plan(user_id: uuid.UUID, tier: TierType, profile: ProfileSchema):
    """
    Background task to generate 84 days (12 weeks) of plan.
    For MVP: To avoid token limits and high costs, we will generate 7 unique days per phase (4 phases, 3 weeks each),
    and replicate the days across the phase. Or generate entirely unique 84 days if required (can be slow).
    For now, let's generate 7 days and cycle them for the 84-day Protocol to be fast and reliable.
    """
    try:
        # Create User Plan
        plan_res = supabase.table("user_plans").insert({
            "user_id": str(user_id),
            "title": f"{profile.goal or 'BioHax'} Protocol",
            "start_date": str(date.today()),
            "end_date": str(date.today() + timedelta(days=83)),
        }).execute()
        
        if not plan_res.data:
            print("Failed to create plan")
            return
            
        plan_id = plan_res.data[0]['id']

        # Determine number of days
        # if Protocol = 90 days detailed (we'll do 84 for exactly 12 weeks)
        # if Coach = 14 detailed, 70 blueprint
        total_days = 84
        detailed_days = 84 if tier == TierType.protocol_one_time else 14
        
        # We can implement a 4-phase program (3 weeks each)
        phases = [
            {"name": "Phase 1: Adaptation", "start_week": 1, "end_week": 3, "desc": "Adjusting the engine"},
            {"name": "Phase 2: Optimization", "start_week": 4, "end_week": 6, "desc": "Enhancing fat oxidation and recovery"},
            {"name": "Phase 3: Deep Autophagy / Growth", "start_week": 7, "end_week": 9, "desc": "Maximizing primary goal"},
            {"name": "Phase 4: Maintenance & Beyond", "start_week": 10, "end_week": 12, "desc": "Solidifying habits"}
        ]
        
        # 1. RAG Search Context based on user goal
        rag_results = search_bio_knowledge(f"Optimal nutrition protocol for {profile.goal} with {profile.diet_type} diet")
        rag_context = "\n".join([r['content'] for r in rag_results]) if rag_results else "Use standard nutrition science."
        # Truncate RAG context so Llama 3 8B doesn't run out of memory/tokens midway through the JSON
        rag_context = rag_context[:1000]

        current_day = 0
        
        for p_idx, p in enumerate(phases):
            print(f"> Processing Phase {p_idx+1}: {p['name']}")
            # Create Phase
            phase_res = supabase.table("plan_phases").insert({
                "plan_id": plan_id,
                "phase_name": p["name"],
                "start_week": p["start_week"],
                "end_week": p["end_week"],
                "description": p["desc"],
                "target_macros": {"p": 150, "f": 80, "c": 100} # Mock target
            }).execute()
            
            # Generate 7 base days for this phase to recycle, and insert them immediately
            base_days = []
            for d in range(7):
                if current_day + d < detailed_days:
                    # Generate detailed
                    base_date = date.today() + timedelta(days=current_day + d)
                    weekday_name = base_date.strftime('%A')
                    
                    print(f"   => AI Generating Day {d+1}/7 ({weekday_name}) for phase {p_idx+1}... (This takes 10-30s based on GPU)")
                    base_day = generate_day_plan(profile, d+1, p["desc"], rag_context, weekday_name)
                    print(f"      [Success] Day {d+1} generated!")
                    base_days.append(base_day)
                else:
                    base_days.append("blueprint")
                    
                # Immediately duplicate this specific day across the 3 weeks of the phase
                # This ensures real-time DB updates while the user waits!
                for week in range(3):
                    day_offset = current_day + (week * 7) + d
                    log_date = date.today() + timedelta(days=day_offset)
                    status = 'detailed' if day_offset < detailed_days else 'blueprint'
                    
                    if status == 'detailed':
                        generated_day = base_days[d]
                        
                        log_res = supabase.table("daily_logs").insert({
                            "user_id": str(user_id),
                            "plan_id": plan_id,
                            "date": str(log_date),
                            "status": status,
                            "macros_total": generated_day.macros_total.dict(),
                            "notes": generated_day.notes
                        }).execute()
                        
                        if log_res.data:
                            log_id = log_res.data[0]['id']
                            for meal in generated_day.meals:
                                supabase.table("meals").insert({
                                    "daily_log_id": log_id,
                                    "type": meal.type,
                                    "name": meal.name,
                                    "ingredients": [i.dict() for i in meal.ingredients],
                                    "macros": meal.macros.dict(),
                                    "biohack_tip": meal.biohack_tip
                                }).execute()
                    else:
                        supabase.table("daily_logs").insert({
                            "user_id": str(user_id),
                            "plan_id": plan_id,
                            "date": str(log_date),
                            "status": status,
                        }).execute()
            
            current_day += 21
            
        print(f"Generated plan for user {user_id}")
    except Exception as e:
        print(f"Failed to generate plan for {user_id}: {e}")

class PremiumAdviceResponse(BaseModel):
    advice: str
    sources: List[str]

def generate_premium_advice(profile: ProfileSchema, query: str) -> PremiumAdviceResponse:
    """Generates personalized biohacking advice for premium users based on the Knowledge Base."""
    
    # 1. Retrieve knowledge
    rag_results = search_bio_knowledge(query)
    
    if not rag_results:
        return PremiumAdviceResponse(
            advice="I couldn't find specific biohacking protocols for this query in my current knowledge base, but standard nutritional advice still applies.",
            sources=[]
        )
        
    rag_context = "\n\n".join([f"Source: Content:\n{r['content']}" for r in rag_results])
    
    prompt = f"""
    You are an elite Biohacker Nutritionist AI.
    Provide actionable, cutting-edge advice to a premium user based ONLY on the provided Biohacking Knowledge.
    
    User Profile:
    Goal: {profile.goal}
    Diet: {profile.diet_type}
    
    User Query: {query}
    
    Relevant Biohacking Knowledge:
    {rag_context}
    
    Instructions:
    1. Answer the query directly using the provided knowledge.
    2. Be concise, scientific, and actionable.
    3. Do not invent protocols not found in the knowledge base.
    """
    
    # Basic OpenAI ChatCompletion (doesn't need instructor if we just want a string, but we can use it for structured response)
    response = client.chat.completions.create(
        model="llama3",
        response_model=PremiumAdviceResponse,
        messages=[
            {"role": "system", "content": "You are a world-class performance nutritionist and biohacker."},
            {"role": "user", "content": prompt}
        ],
        max_retries=2
    )
    
    return response
