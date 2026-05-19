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
import logging

logger = logging.getLogger(__name__)


class LLMClient:
    """
    OpenRouter-based LLM client with streaming support.
    Automatically selects model based on configured mode (free/paid).
    """
    
    def __init__(self, mode: Optional[Literal["free", "paid"]] = None):
        self.settings = get_settings()
        self.mode = mode or self.settings.default_model_mode
        self.model = self.settings.free_model if self.mode == "free" else self.settings.paid_model
        
        # Initialize primary and backup clients
        self.providers = []
        
        # 1. Gemini (Primary)
        if self.settings.gemini_api_key:
            self.providers.append({
                "name": "Gemini",
                "client": AsyncOpenAI(
                    api_key=self.settings.gemini_api_key,
                    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
                ),
                "model": self.settings.gemini_model,
                "is_openrouter": False
            })

        # 2. OpenRouter (Backup)
        if self.settings.openrouter_api_key:
            self.providers.append({
                "name": "OpenRouter",
                "client": AsyncOpenAI(
                    api_key=self.settings.openrouter_api_key,
                    base_url=self.settings.openrouter_base_url,
                ),
                "model": self.model,
                "is_openrouter": True
            })
        
        # Token counter (approximate)
        
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
        temperature: Optional[float] = None,
        max_tokens: int = 2048,
        max_retries: int = None, # Calculated based on providers
        on_retry: Optional[callable] = None,
    ) -> str:
        import asyncio
        import random
        from openai import RateLimitError, APIError, APITimeoutError, NotFoundError, BadRequestError
        
        temp = temperature if temperature is not None else self.settings.temperature
        provider_idx = 0
        current_messages = messages
        system_instruction_hack_applied = False
        
        # We try each provider up to 2 times before moving to the next
        # total attempts = num_providers * 2 (max 6)
        total_attempts = len(self.providers) * 2
        
        for attempt in range(total_attempts):
            provider = self.providers[provider_idx]
            active_client = provider["client"]
            active_model = provider["model"]
            
            # Linear failover: move to next provider every 2 attempts
            # But only if we haven't already moved forward due to a hard failure
            if attempt > 0 and attempt % 2 == 0:
                if provider_idx < len(self.providers) - 1:
                    provider_idx += 1
                    provider = self.providers[provider_idx]
                    active_client = provider["client"]
                    active_model = provider["model"]
                    
                    msg = f"Primary failed. Switching to backup provider: {provider['name']}..."
                    logger.warning(msg)
                    if on_retry: await on_retry(msg)

            try:
                response = await asyncio.wait_for(
                    active_client.chat.completions.create(
                        model=active_model,
                        messages=current_messages,
                        temperature=temp,
                        max_tokens=max_tokens,
                        extra_headers={
                            "HTTP-Referer": "https://ai-career-agent.vercel.app",
                            "X-Title": "AI Career Agent"
                        } if provider["is_openrouter"] else {}
                    ),
                    timeout=60.0
                )
                return response.choices[0].message.content
            except (RateLimitError, NotFoundError, BadRequestError, APIError) as e:
                error_msg = str(e).lower()
                
                if ("developer instruction" in error_msg or "system message" in error_msg) and not system_instruction_hack_applied:
                    logger.warning(f"System instructions rejected by {provider['name']}. Applying fallback...")
                    new_messages = []
                    system_content = ""
                    first_user_idx = -1
                    for i, msg in enumerate(messages):
                        if msg["role"] == "system":
                            system_content += msg["content"] + "\n\n"
                        elif msg["role"] == "user" and first_user_idx == -1:
                            first_user_idx = i
                    if system_content:
                        for i, msg in enumerate(messages):
                            if msg["role"] == "system": continue
                            if i == first_user_idx:
                                new_messages.append({
                                    "role": "user", 
                                    "content": f"INSTRUCTIONS:\n{system_content}USER REQUEST: {msg['content']}"
                                })
                            else:
                                new_messages.append(msg)
                        current_messages = new_messages
                        system_instruction_hack_applied = True
                        continue

                # Handling Hard Failures (Invalid Key, Quota Hit) -> Skip Provider Immediately
                is_hard_failure = any(x in error_msg for x in ["402", "payment", "quota", "invalid", "400", "401"])
                
                if is_hard_failure:
                    logger.error(f"Hard failure on {provider['name']}: {error_msg}")
                    if len(self.providers) > provider_idx + 1:
                        provider_idx += 1
                        msg = f"{provider['name']} failed (Hard Error). Skipping to {self.providers[provider_idx]['name']}..."
                        if on_retry: await on_retry(msg)
                        continue 
                    else:
                        raise Exception(f"All providers exhausted. Last error ({provider['name']}): {e}") from e

                # Handling Soft Failures (Rate Limit, Transient API Error) -> Backoff or Cascade
                wait_time = (2 ** (attempt % 2)) + random.uniform(0.5, 1.5)
                msg = f"{provider['name']} API issue. Retrying in {wait_time:.1f}s..."
                logger.warning(msg)
                if on_retry: await on_retry(msg)
                
                await asyncio.sleep(wait_time)
                continue

            except (APITimeoutError, asyncio.TimeoutError) as e:
                logger.warning(f"Timeout on {provider['name']} (attempt {attempt+1})")
                if attempt < total_attempts - 1:
                    await asyncio.sleep(1)
                    continue
                raise Exception(f"Timed out after {total_attempts} attempts across providers") from e
                
            except Exception as e:
                logger.error(f"Unexpected error on {provider['name']}: {e}")
                raise e
        
        raise Exception("Max attempts reached across all providers.")
    
    async def chat_stream(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a chat completion response.
        """
        from openai import APIError
        
        current_messages = messages
        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=current_messages,
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
            error_msg = str(e).lower()
            if "developer instruction" in error_msg or "system message" in error_msg:
                # Merge system messages into the first user message
                new_messages = []
                system_content = ""
                first_user_idx = -1
                
                for i, msg in enumerate(messages):
                    if msg["role"] == "system":
                        system_content += msg["content"] + "\n\n"
                    elif msg["role"] == "user" and first_user_idx == -1:
                        first_user_idx = i
                
                if system_content:
                    for i, msg in enumerate(messages):
                        if msg["role"] == "system":
                            continue
                        if i == first_user_idx:
                            new_messages.append({
                                "role": "user", 
                                "content": f"INSTRUCTIONS:\n{system_content}USER REQUEST: {msg['content']}"
                            })
                        else:
                            new_messages.append(msg)
                    
                    # Retry with the merged messages (not recursive to avoid infinite loops)
                    stream = await self.client.chat.completions.create(
                        model=self.model,
                        messages=new_messages,
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
                    return

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
        temperature=settings.temperature,
        streaming=True,
    )


# Convenience function
async def quick_llm(prompt: str, system: Optional[str] = None) -> str:
    """Quick one-off LLM call."""
    client = LLMClient()
    return await client.simple_prompt(prompt, system)
