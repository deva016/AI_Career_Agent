"""
Configuration module for AI Career Agent Service.
Uses Pydantic Settings for environment variable validation.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Literal, Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = Field(..., alias="DATABASE_URL")
    
    # OpenRouter API
    openrouter_api_key: str = Field(..., alias="OPENROUTER_API_KEY")
    openrouter_base_url: str = Field(
        default="https://openrouter.ai/api/v1",
        alias="OPENROUTER_BASE_URL"
    )
    
    # Model Configuration
    default_model_mode: Literal["free", "paid"] = Field(
        default="free",
        alias="DEFAULT_MODEL_MODE"
    )
    free_model: str = Field(
        default="google/gemini-flash-1.5",
        alias="FREE_MODEL"
    )
    paid_model: str = Field(
        default="anthropic/claude-3-5-sonnet",
        alias="PAID_MODEL"
    )
    
    # Backup LLM Providers
    gemini_api_key: Optional[str] = Field(None, alias="GEMINI_API_KEY")
    openai_api_key: Optional[str] = Field(None, alias="OPENAI_API_KEY")
    
    # LLM Configuration
    gemini_model: str = Field(default="gemini-2.0-flash", alias="GEMINI_MODEL")
    openai_model: str = Field(default="gpt-4o", alias="OPENAI_MODEL")
    temperature: float = Field(default=0.7, alias="TEMPERATURE")
    
    # Embedding model (using OpenAI-compatible via OpenRouter)
    embedding_model: str = Field(
        default="openai/text-embedding-3-small",
        alias="EMBEDDING_MODEL"
    )
    
    # CORS
    allowed_origins: str = Field(
        default="http://localhost:3000",
        alias="ALLOWED_ORIGINS"
    )
    
    # Rate Limiting
    max_applications_per_day: int = Field(
        default=15,
        alias="MAX_APPLICATIONS_PER_DAY"
    )
    
    # Server
    port: int = Field(default=8000, alias="PORT")
    
    # Debug mode — set to False in production to disable auth fallback
    debug_mode: bool = Field(default=True, alias="DEBUG_MODE")
    
    @property
    def origins_list(self) -> list[str]:
        """Parse allowed origins into a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    @property
    def current_model(self) -> str:
        """Get the current LLM model based on mode."""
        return self.free_model if self.default_model_mode == "free" else self.paid_model

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


def get_settings() -> Settings:
    """Get settings instance (reads from .env on every call)."""
    return Settings()
