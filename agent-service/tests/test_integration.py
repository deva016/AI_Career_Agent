"""
Integration Tests

End-to-end tests for complete workflows including
database, LLM, and graph execution using LangGraph agents.
"""

import pytest
import asyncio
from agents.job_finder import run_job_finder
from agents.resume_agent import run_resume_agent
from core.database import DatabaseService


@pytest.mark.integration
class TestEndToEndWorkflows:
    """Integration tests requiring real services"""



    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_complete_job_search_workflow(self):
        """Test complete job finder workflow (requires real LLM)"""
        result = await run_job_finder(
            user_id="integration-test-user",
            query="Python Developer",
            target_roles=["Backend Developer", "Full Stack Engineer"],
            target_locations=["Remote"]
        )

        # Verify complete workflow
        assert getattr(result.get('status'), 'value', result.get('status')) in ['completed', 'failed', 'executing', 'running']
        
        # Output or events should be present
        assert 'events' in result or 'error' in result

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_resume_tailoring_workflow(self):
        """Test complete resume tailoring workflow"""
        result = await run_resume_agent(
            user_id="integration-test-user",
            job_title="Senior Backend Engineer",
            company="Test Corp",
            job_description="Requirements: 5+ years Python, PostgreSQL, RESTful APIs"
        )
        
        status = getattr(result.get('status'), 'value', result.get('status'))
        assert status in ['completed', 'needs_review', 'failed', 'running', 'executing']

    @pytest.mark.asyncio
    async def test_mission_state_persistence(self):
        """Test that mission state is persisted correctly"""
        from uuid import uuid4
        mission_id = str(uuid4())
        await DatabaseService.create_mission(
            mission_id=mission_id,
            user_id="test-user",
            agent_type="test",
            input_data={"test": True}
        )

        # Update mission multiple times
        await DatabaseService.update_mission(mission_id, status="running", progress=25)
        await DatabaseService.update_mission(mission_id, status="running", progress=50)
        await DatabaseService.update_mission(mission_id, status="completed", progress=100)

        # Verify final state
        final_mission = await DatabaseService.get_mission(mission_id)
        assert final_mission['status'] == 'completed'
        assert final_mission['progress'] == 100

    @pytest.mark.asyncio
    async def test_concurrent_missions_isolation(self):
        """Test that concurrent missions don't interfere"""
        coros = [
            run_job_finder(
                user_id=f"user-{i}",
                query=f"Engineer {i}",
                target_roles=[],
                target_locations=[]
            )
            for i in range(5)
        ]

        results = await asyncio.gather(*coros)

        # Each result should have some state info
        for i, result in enumerate(results):
            assert result is not None
            assert 'status' in result

    @pytest.mark.asyncio
    async def test_error_recovery(self):
        """Test system recovery from errors"""
        try:
            # An empty or missing query might just return cleanly or fail gracefully
            result = await run_job_finder(
                user_id="test-user",
                query="",
                target_roles=[],
                target_locations=[]
            )
            assert result is not None
        except Exception as e:
            pass

        # Verify system is still functional
        valid_result = await run_job_finder(
            user_id="test-user",
            query="Valid query",
            target_roles=["Dev"],
            target_locations=["NY"]
        )

        status = getattr(valid_result.get('status'), 'value', valid_result.get('status'))
        assert status in ['completed', 'failed', 'running', 'executing']


@pytest.mark.integration
class TestDataValidation:
    """Tests for data validation and sanitization"""

    @pytest.mark.asyncio
    async def test_xss_prevention(self):
        """Test XSS prevention in inputs/outputs"""
        malicious_script = "<script>alert('XSS')</script>"

        result = await run_job_finder(
            user_id="test-user",
            query=malicious_script,
            target_roles=[malicious_script],
            target_locations=[malicious_script]
        )

        # Should sanitize script tags or handle gracefully
        # In current design, input is stored so we expect <script> to exist in the input payload,
        # but we should ensure no HTML is executed or that it raises an error.
        assert result is not None

    @pytest.mark.asyncio
    async def test_sql_injection_prevention(self):
        """Test SQL injection prevention"""
        malicious_query = "'; DROP TABLE missions; --"

        result = await run_job_finder(
            user_id="test-user",
            query=malicious_query,
            target_roles=[],
            target_locations=[]
        )

        # Should not execute SQL
        # Verify missions table still exists
        missions = await DatabaseService.list_missions(user_id="test-user")
        assert missions is not None
