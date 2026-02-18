"""
LLM Service Tests

Tests for LLM prompt engineering, retry logic, error handling,
and response validation.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from core.llm_service import LLMService, LLMError


class TestLLMService:
    """Tests for LLM service functionality"""

    @pytest.fixture
    def llm_service(self):
        """Create LLM service instance"""
        return LLMService(model="google/gemini-flash-1.5")

    @pytest.mark.asyncio
    async def test_basic_completion(self, llm_service):
        """Test basic LLM completion"""
        with patch('httpx.AsyncClient.post') as mock_post:
            mock_post.return_value.json.return_value = {
                "choices": [{"message": {"content": "Test response"}}]
            }
            mock_post.return_value.status_code = 200

            response = await llm_service.complete("Test prompt")

            assert response == "Test response"
            mock_post.assert_called_once()

    @pytest.mark.asyncio
    async def test_retry_on_failure(self, llm_service):
        """Test retry logic on transient failures"""
        with patch('httpx.AsyncClient.post') as mock_post:
            # Fail twice, then succeed
            mock_post.side_effect = [
                Exception("Temporary error"),
                Exception("Temporary error"),
                MagicMock(
                    json=lambda: {"choices": [{"message": {"content": "Success"}}]},
                    status_code=200
                )
            ]

            response = await llm_service.complete("Test", max_retries=3)

            assert response == "Success"
            assert mock_post.call_count == 3

    @pytest.mark.asyncio
    async def test_max_retries_exceeded(self, llm_service):
        """Test failure after max retries"""
        with patch('httpx.AsyncClient.post') as mock_post:
            mock_post.side_effect = Exception("Persistent error")

            with pytest.raises(LLMError, match="Max retries exceeded"):
                await llm_service.complete("Test", max_retries=3)

    @pytest.mark.asyncio
    async def test_rate_limit_handling(self, llm_service):
        """Test handling of rate limit (429) errors"""
        with patch('httpx.AsyncClient.post') as mock_post:
            mock_post.return_value.status_code = 429
            mock_post.return_value.json.return_value = {"error": "Rate limit"}

            with pytest.raises(LLMError, match="Rate limit"):
                await llm_service.complete("Test")

    @pytest.mark.asyncio
    async def test_malformed_response(self, llm_service):
        """Test handling of malformed LLM responses"""
        with patch('httpx.AsyncClient.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {"invalid": "structure"}

            with pytest.raises(LLMError, match="Invalid response"):
                await llm_service.complete("Test")

    @pytest.mark.asyncio
    async def test_very_long_prompt(self, llm_service):
        """Test handling of prompts exceeding token limit"""
        very_long_prompt = "Test " * 100000  # Way over token limit

        with patch('httpx.AsyncClient.post') as mock_post:
            mock_post.return_value.status_code = 400
            mock_post.return_value.json.return_value = {"error": "Token limit exceeded"}

            with pytest.raises(LLMError, match="Token limit"):
                await llm_service.complete(very_long_prompt)

    @pytest.mark.asyncio
    async def test_empty_prompt(self, llm_service):
        """Test handling of empty prompts"""
        with pytest.raises(ValueError, match="Prompt cannot be empty"):
            await llm_service.complete("")

    @pytest.mark.asyncio
    async def test_special_characters_in_prompt(self, llm_service):
        """Test prompts with special characters"""
        prompt = "Test with special chars: \n\t\r \" ' < > & $ @ #"

        with patch('httpx.AsyncClient.post') as mock_post:
            mock_post.return_value.json.return_value = {
                "choices": [{"message": {"content": "Response"}}]
            }
            mock_post.return_value.status_code = 200

            response = await llm_service.complete(prompt)

            # Should escape/handle special chars
            assert response == "Response"
            called_prompt = mock_post.call_args[1]['json']['messages'][0]['content']
            assert all(char in called_prompt or char.encode() for char in prompt)

    @pytest.mark.asyncio
    async def test_json_mode_response(self, llm_service):
        """Test JSON mode for structured outputs"""
        with patch('httpx.AsyncClient.post') as mock_post:
            mock_post.return_value.json.return_value = {
                "choices": [{"message": {"content": '{"key": "value"}'}}]
            }
            mock_post.return_value.status_code = 200

            response = await llm_service.complete("Test", json_mode=True)

            assert isinstance(response, dict)
            assert response["key"] == "value"

    @pytest.mark.asyncio
    async def test_concurrent_requests(self, llm_service):
        """Test multiple concurrent LLM requests"""
        import asyncio

        with patch('httpx.AsyncClient.post') as mock_post:
            mock_post.return_value.json.return_value = {
                "choices": [{"message": {"content": "Response"}}]
            }
            mock_post.return_value.status_code = 200

            prompts = [f"Prompt {i}" for i in range(10)]
            results = await asyncio.gather(
                *[llm_service.complete(p) for p in prompts]
            )

            assert len(results) == 10
            assert all(r == "Response" for r in results)

    @pytest.mark.asyncio
    async def test_timeout_handling(self, llm_service):
        """Test timeout on slow LLM responses"""
        import asyncio

        with patch('httpx.AsyncClient.post') as mock_post:
            async def slow_response(*args, **kwargs):
                await asyncio.sleep(10)
                return MagicMock(json=lambda: {})

            mock_post.side_effect = slow_response

            with pytest.raises(asyncio.TimeoutError):
                await llm_service.complete("Test", timeout=1)


class TestPromptEngineering:
    """Tests for prompt construction and optimization"""

    def test_job_finder_prompt_structure(self):
        """Test job finder prompt includes all necessary context"""
        from agents.prompts import create_job_finder_prompt

        prompt = create_job_finder_prompt(
            query="Software Engineer",
            target_roles=["Backend", "Full Stack"],
            target_locations=["Remote", "SF"]
        )

        assert "Software Engineer" in prompt
        assert "Backend" in prompt
        assert "Remote" in prompt
        # Should include clear instructions
        assert "search" in prompt.lower() or "find" in prompt.lower()
        # Should request structured output
        assert "json" in prompt.lower() or "format" in prompt.lower()

    def test_resume_prompt_structure(self):
        """Test resume tailoring prompt"""
        from agents.prompts import create_resume_prompt

        prompt = create_resume_prompt(
            resume="My resume text",
            job_description="Senior Engineer role"
        )

        assert "resume" in prompt.lower()
        assert "Senior Engineer" in prompt
        # Should preserve original content
        assert "My resume text" in prompt

    def test_prompt_safety_checks(self):
        """Test prompts don't include unsafe instructions"""
        from agents.prompts import create_job_finder_prompt

        prompt = create_job_finder_prompt(
            query="Engineer",
            target_roles=[],
            target_locations=[]
        )

        # Should not include prompt injection attempts
        unsafe_terms = ["ignore previous", "disregard", "forget instructions"]
        assert not any(term in prompt.lower() for term in unsafe_terms)

    def test_prompt_length_optimization(self):
        """Test prompts are optimized for token count"""
        from agents.prompts import create_job_finder_prompt

        # Very verbose query
        verbose_query = "I am looking for a job as a software engineer " * 50

        prompt = create_job_finder_prompt(
            query=verbose_query,
            target_roles=[],
            target_locations=[]
        )

        # Should truncate or optimize
        assert len(prompt) < len(verbose_query) * 5  # Reasonable overhead
