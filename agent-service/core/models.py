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
    Handles markdown code blocks and common formatting issues.
    """
    import json
    import logging
    import re
    
    logger = logging.getLogger(__name__)
    
    # 1. Clean the string
    cleaned_str = json_str.strip()
    
    # 2. Extract JSON from markdown blocks if present
    # Matches ```json {..} ``` or ``` {..} ```
    markdown_match = re.search(r'```(?:json)?\s*(.*?)\s*```', cleaned_str, re.DOTALL)
    if markdown_match:
        cleaned_str = markdown_match.group(1).strip()
    
    try:
        # Try parsing as JSON
        data = json.loads(cleaned_str)
        
        # Validate with Pydantic
        return model.model_validate(data)
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        logger.error(f"Failed string (first 500 chars): {cleaned_str[:500]}")
        if fallback:
            return fallback
        return model()
    except Exception as e:
        logger.error(f"Validation error: {e}")
        logger.error(f"Data was: {cleaned_str[:500]}")
        if fallback:
            return fallback
        return model()
