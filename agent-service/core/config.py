"""
Configuration module for AI Career Agent Service.
Uses Pydantic Settings for environment variable validation.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from typing import Literal


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


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
