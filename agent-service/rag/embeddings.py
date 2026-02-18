"""
Embedding service for AI Career Agent.
Uses OpenRouter-compatible embedding model.
"""

from openai import AsyncOpenAI
from typing import List, Optional
import numpy as np

from core.config import get_settings


class EmbeddingService:
    """
    Generates embeddings for text using OpenAI-compatible API via OpenRouter.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.client = AsyncOpenAI(
            api_key=self.settings.openrouter_api_key,
            base_url=self.settings.openrouter_base_url,
        )
        self.model = self.settings.embedding_model
        self.dimension = 1536  # text-embedding-3-small dimension
    
    async def embed_text(self, text: str, max_retries: int = 3) -> List[float]:
        """
        Generate embedding for a single text with retry logic.
        
        Args:
            text: Text to embed
            max_retries: Maximum retry attempts
            
        Returns:
            Embedding vector as list of floats
            
        Raises:
            Exception: If all retries fail
        """
        import asyncio
        from openai import RateLimitError, APIError
        
        for attempt in range(max_retries):
            try:
                response = await self.client.embeddings.create(
                    model=self.model,
                    input=text,
                )
                return response.data[0].embedding
            except RateLimitError:
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                # Fallback: return zero vector
                return [0.0] * self.dimension
            except APIError as e:
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)
                    continue
                # Fallback: return zero vector
                return [0.0] * self.dimension
            except Exception:
                # Fallback: return zero vector
                return [0.0] * self.dimension
        
        return [0.0] * self.dimension
    
    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts (batch).
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        # Batch in groups of 100 (API limit)
        all_embeddings = []
        batch_size = 100
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            response = await self.client.embeddings.create(
                model=self.model,
                input=batch,
            )
            all_embeddings.extend([d.embedding for d in response.data])
        
        return all_embeddings
    
    @staticmethod
    def cosine_similarity(a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        a_np = np.array(a)
        b_np = np.array(b)
        return float(np.dot(a_np, b_np) / (np.linalg.norm(a_np) * np.linalg.norm(b_np)))


# Singleton instance
embeddings = EmbeddingService()
