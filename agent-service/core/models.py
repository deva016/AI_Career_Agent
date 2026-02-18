"""
Pydantic models for validating LLM JSON responses.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


class JobAnalysis(BaseModel):
    """Parsed job description analysis."""
    required_skills: List[str] = Field(default_factory=list)
    preferred_qualifications: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    culture: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)


class SkillGapAnalysis(BaseModel):
    """Skill gap analysis result."""
    matching_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class CompanyResearch(BaseModel):
    """Company research findings."""
    values: List[str] = Field(default_factory=list)
    products: List[str] = Field(default_factory=list)
    recent_news: List[str] = Field(default_factory=list)
    culture_notes: List[str] = Field(default_factory=list)


class InterviewQuestion(BaseModel):
    """Interview question with metadata."""
    question: str
    type: str  # behavioral, technical, cultural
    context: str = ""
    ideal_answer_points: List[str] = Field(default_factory=list)


def parse_llm_json(json_str: str, model: type[BaseModel], fallback: Optional[BaseModel] = None) -> BaseModel:
    """
    Safely parse LLM JSON response with validation.
    
    Args:
        json_str: JSON string from LLM
        model: Pydantic model class to validate against
        fallback: Fallback instance if parsing fails
        
    Returns:
        Validated model instance or fallback
    """
    import json
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        # Try parsing as JSON
        data = json.loads(json_str)
        
        # Validate with Pydantic
        return model.model_validate(data)
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        logger.error(f"Invalid JSON: {json_str[:200]}")
        if fallback:
            return fallback
        return model()
    except Exception as e:
        logger.error(f"Validation error: {e}")
        if fallback:
            return fallback
        return model()
