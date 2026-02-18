"""
OpenRouter LLM Client for AI Career Agent.
Provides unified interface for both free and paid models.
"""

from openai import AsyncOpenAI
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import AsyncGenerator, Optional, Literal
import tiktoken

from core.config import get_settings


class LLMClient:
    """
    OpenRouter-based LLM client with streaming support.
    Automatically selects model based on configured mode (free/paid).
    """
    
    def __init__(self, mode: Optional[Literal["free", "paid"]] = None):
        self.settings = get_settings()
        self.mode = mode or self.settings.default_model_mode
        self.model = self.settings.free_model if self.mode == "free" else self.settings.paid_model
        
        # OpenAI-compatible client for OpenRouter
        self.client = AsyncOpenAI(
            api_key=self.settings.openrouter_api_key,
            base_url=self.settings.openrouter_base_url,
        )
        
        # Token counter (approximate)
        try:
            self.encoding = tiktoken.encoding_for_model("gpt-4")
        except:
            self.encoding = tiktoken.get_encoding("cl100k_base")
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text."""
        return len(self.encoding.encode(text))
    
    async def chat(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        max_retries: int = 3,
    ) -> str:
        """
        Send a chat completion request with retry logic.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response
            max_retries: Maximum number of retry attempts
            
        Returns:
            The assistant's response text
            
        Raises:
            Exception: If all retries fail
        """
        import asyncio
        from openai import RateLimitError, APIError, APITimeoutError
        
        last_error = None
        for attempt in range(max_retries):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    extra_headers={
                        "HTTP-Referer": "https://ai-career-agent.vercel.app",
                        "X-Title": "AI Career Agent"
                    }
                )
                return response.choices[0].message.content
            except RateLimitError as e:
                last_error = e
                if attempt < max_retries - 1:
                    # Exponential backoff: 2^attempt seconds
                    wait_time = 2 ** attempt
                    await asyncio.sleep(wait_time)
                    continue
                raise Exception(f"Rate limit exceeded after {max_retries} attempts") from e
            except APITimeoutError as e:
                last_error = e
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)
                    continue
                raise Exception(f"API timeout after {max_retries} attempts") from e
            except APIError as e:
                last_error = e
                # Don't retry on 4xx client errors (except rate limit)
                if hasattr(e, 'status_code') and 400 <= e.status_code < 500:
                    raise Exception(f"API client error: {e}") from e
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)
                    continue
                raise Exception(f"API error after {max_retries} attempts: {e}") from e
            except Exception as e:
                last_error = e
                raise Exception(f"Unexpected error in LLM call: {e}") from e
        
        raise Exception(f"Failed after {max_retries} attempts") from last_error
    
    async def chat_stream(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a chat completion response.
        
        Yields:
            Text chunks as they arrive
            
        Raises:
            Exception: If streaming fails
        """
        from openai import APIError
        
        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
                extra_headers={
                    "HTTP-Referer": "https://ai-career-agent.vercel.app",
                    "X-Title": "AI Career Agent"
                }
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except APIError as e:
            raise Exception(f"Streaming error: {e}") from e
        except Exception as e:
            raise Exception(f"Unexpected streaming error: {e}") from e
    
    async def simple_prompt(self, prompt: str, system: Optional[str] = None) -> str:
        """
        Simple prompt with optional system message.
        
        Args:
            prompt: The user's prompt
            system: Optional system message
            
        Returns:
            The assistant's response
        """
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        
        return await self.chat(messages)


def get_langchain_llm(mode: Optional[Literal["free", "paid"]] = None) -> ChatOpenAI:
    """
    Get a LangChain-compatible ChatOpenAI instance configured for OpenRouter.
    
    Args:
        mode: Override the default model mode
        
    Returns:
        ChatOpenAI instance for use with LangChain/LangGraph
    """
    settings = get_settings()
    use_mode = mode or settings.default_model_mode
    model = settings.free_model if use_mode == "free" else settings.paid_model
    
    return ChatOpenAI(
        model=model,
        openai_api_key=settings.openrouter_api_key,
        openai_api_base=settings.openrouter_base_url,
        default_headers={
            "HTTP-Referer": "https://ai-career-agent.vercel.app",
            "X-Title": "AI Career Agent"
        },
        temperature=0.7,
        streaming=True,
    )


# Convenience function
async def quick_llm(prompt: str, system: Optional[str] = None) -> str:
    """Quick one-off LLM call."""
    client = LLMClient()
    return await client.simple_prompt(prompt, system)
