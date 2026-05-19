from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from core.auth import get_current_user

router = APIRouter()


class AnalyzeAnswerRequest(BaseModel):
    question: str
    answer: str
    role_context: Optional[str] = None


class AnalyzeAnswerResponse(BaseModel):
    score: int          # 0-100
    feedback: str       # Main narrative feedback
    strengths: list[str]
    improvements: list[str]
    suggested_revision: str


@router.get("/generate-question")
async def generate_question(user_id: str = Depends(get_current_user)):
    """Generate a random behavioral interview question based on user context."""
    from core.llm import LLMClient
    from core.database import db
    llm = LLMClient()
    
    # Try to get user settings for context
    settings = await db.get_user_settings(user_id)
    target_roles = settings.get("target_roles") if settings else None
    role = target_roles[0] if target_roles else "Software Engineer"
    
    prompt = f"Generate 1 high-impact behavioral interview question for a {role} role. Return only the question text."
    question = await llm.simple_prompt(prompt)
    
    return {
        "question": question,
        "difficulty": "Hard",
        "category": "Behavioral",
        "role": role
    }

@router.post("/analyze", response_model=AnalyzeAnswerResponse)
async def analyze_answer(
    request: AnalyzeAnswerRequest,
    user_id: str = Depends(get_current_user),
):
    """
    Analyze an interview answer using the STAR method framework,
    returning structured feedback with score, strengths, and improvements.
    """
    from core.llm import LLMClient
    import json

    llm = LLMClient()

    system_prompt = (
        "You are an expert interview coach. Evaluate the candidate's answer using the STAR method. "
        "Be constructive and specific. Return ONLY valid JSON. "
        "JSON keys: score (int), feedback (string), strengths (array of strings), improvements (array of strings), suggested_revision (string)."
    )

    user_prompt = (
        f"Interview Question: {request.question}\n\n"
        f"Candidate Answer: {request.answer}\n"
        + (f"\nRole Context: {request.role_context}" if request.role_context else "")
    )

    try:
        raw = await llm.chat(
            [{"role": "system", "content": system_prompt},
             {"role": "user", "content": user_prompt}],
            temperature=0.4,
            max_tokens=800,
        )
    except Exception as e:
        print(f"CRITICAL LLM ERROR IN INTERVIEW: {e}")
        import traceback
        traceback.print_exc()
        raise

    # Strip markdown fences if present
    clean = raw.strip()
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
    clean = clean.strip()

    try:
        data = json.loads(clean)
    except Exception as e:
        print(f"DEBUG: JSON Parse Error: {str(e)}")
        print(f"DEBUG: Cleaned response: {clean}")
        # Fallback if JSON parsing fails
        data = {
            "score": 70,
            "feedback": raw[:500],
            "strengths": ["Clear communication"],
            "improvements": ["Add more quantifiable results"],
            "suggested_revision": "Consider restructuring with explicit Situation → Task → Action → Result flow.",
        }

    return AnalyzeAnswerResponse(
        score=int(data.get("score", 70)),
        feedback=data.get("feedback", ""),
        strengths=data.get("strengths", []),
        improvements=data.get("improvements", []),
        suggested_revision=data.get("suggested_revision", ""),
    )
