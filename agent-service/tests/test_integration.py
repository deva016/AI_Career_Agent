"""
Integration Tests

End-to-end tests for complete workflows including
database, LLM, and graph execution.
"""

import pytest
import asyncio
from agents.job_finder import JobFinderAgent
from agents.resume import ResumeAgent
from core.database import DatabaseService


@pytest.mark.integration
class TestEndToEndWorkflows:
    """Integration tests requiring real services"""

    @pytest.fixture
    async def setup_db(self):
        """Set up test database"""
        # Use test database
        await DatabaseService.get_pool()
        yield
        # Clean up
        await DatabaseService.close_pool()

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_complete_job_search_workflow(self, setup_db):
        """Test complete job finder workflow (requires real LLM)"""
        agent = JobFinderAgent(
            query="Python Developer",
            target_roles=["Backend Developer", "Full Stack Engineer"],
            target_locations=["Remote"],
            user_id="integration-test-user"
        )

        result = await agent.execute()

        # Verify complete workflow
        assert result['mission_id'] is not None
        assert result['status'] in ['completed', 'failed']
        assert 'jobs' in result
        
        # Verify database persistence
        saved_mission = await DatabaseService.get_mission(result['mission_id'])
        assert saved_mission is not None
        assert saved_mission['user_id'] == "integration-test-user"

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_resume_tailoring_workflow(self, setup_db):
        """Test complete resume tailoring workflow"""
        sample_resume = """
        John Doe
        Software Engineer
        
        Experience:
        - Built web applications using Python and React
        - Managed databases with PostgreSQL
        """

        job_desc = """
        Senior Backend Engineer
        
        Requirements:
        - 5+ years Python experience
        - PostgreSQL expertise
        - RESTful API design
        """

        agent = ResumeAgent(
            resume_text=sample_resume,
            job_description=job_desc,
            user_id="integration-test-user"
        )

        result = await agent.execute()

        assert result['status'] == 'completed'
        assert 'tailored_resume' in result
        assert result['match_score'] > 50
        # Verify tailored resume includes JD keywords
        assert 'Python' in result['tailored_resume']

    @pytest.mark.asyncio
    async def test_mission_state_persistence(self, setup_db):
        """Test that mission state is persisted correctly"""
        mission_id = await DatabaseService.create_mission(
            user_id="test-user",
            mission_type="test",
            config={"test": True}
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
    async def test_concurrent_missions_isolation(self, setup_db):
        """Test that concurrent missions don't interfere"""
        agents = [
            JobFinderAgent(
                query=f"Engineer {i}",
                target_roles=[],
                target_locations=[],
                user_id=f"user-{i}"
            )
            for i in range(5)
        ]

        results = await asyncio.gather(*[agent.execute() for agent in agents])

        # Each mission should have unique ID
        mission_ids = [r['mission_id'] for r in results]
        assert len(mission_ids) == len(set(mission_ids))

        # Each mission should be isolated
        for i, result in enumerate(results):
            saved = await DatabaseService.get_mission(result['mission_id'])
            assert saved['user_id'] == f"user-{i}"

    @pytest.mark.asyncio
    async def test_error_recovery(self, setup_db):
        """Test system recovery from errors"""
        # Trigger an error (malformed input)
        agent = JobFinderAgent(
            query="",  # Invalid empty query
            target_roles=[],
            target_locations=[],
            user_id="test-user"
        )

        with pytest.raises(ValueError):
            await agent.execute()

        # Verify system is still functional
        valid_agent = JobFinderAgent(
            query="Valid query",
            target_roles=[],
            target_locations=[],
            user_id="test-user"
        )

        result = await valid_agent.execute()
        assert result['status'] in ['completed', 'failed']


@pytest.mark.integration
class TestPerformance:
    """Performance and stress tests"""

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_high_load_handling(self):
        """Test system under high concurrent load"""
        # Create 50 concurrent missions
        agents = [
            JobFinderAgent(
                query=f"Query {i}",
                target_roles=[],
                target_locations=[],
                user_id=f"user-{i}"
            )
            for i in range(50)
        ]

        import time
        start = time.time()
        results = await asyncio.gather(*[agent.execute() for agent in agents])
        duration = time.time() - start

        # All should complete
        assert len(results) == 50
        # Should complete in reasonable time (< 5 min)
        assert duration < 300

    @pytest.mark.asyncio
    async def test_memory_leak_detection(self):
        """Test for memory leaks in repeated executions"""
        import gc
        import sys

        # Get initial memory
        gc.collect()
        initial_objects = len(gc.get_objects())

        # Run 100 missions
        for i in range(100):
            agent = JobFinderAgent(
                query=f"Test {i}",
                target_roles=[],
                target_locations=[],
                user_id="test-user"
            )
            await agent.execute()

        # Force garbage collection
        gc.collect()
        final_objects = len(gc.get_objects())

        # Should not have significant memory growth
        growth = final_objects - initial_objects
        assert growth < 10000  # Reasonable threshold


@pytest.mark.integration
class TestDataValidation:
    """Tests for data validation and sanitization"""

    @pytest.mark.asyncio
    async def test_xss_prevention(self):
        """Test XSS prevention in inputs/outputs"""
        malicious_script = "<script>alert('XSS')</script>"

        agent = JobFinderAgent(
            query=malicious_script,
            target_roles=[malicious_script],
            target_locations=[malicious_script],
            user_id="test-user"
        )

        result = await agent.execute()

        # Should sanitize script tags
        assert "<script>" not in str(result)
        assert "alert" not in str(result) or "sanitized" in str(result).lower()

    @pytest.mark.asyncio
    async def test_sql_injection_prevention(self):
        """Test SQL injection prevention"""
        malicious_query = "'; DROP TABLE missions; --"

        agent = JobFinderAgent(
            query=malicious_query,
            target_roles=[],
            target_locations=[],
            user_id="test-user"
        )

        result = await agent.execute()

        # Should not execute SQL
        # Verify missions table still exists
        missions = await DatabaseService.list_missions(user_id="test-user")
        assert missions is not None

    @pytest.mark.asyncio
    async def test_path_traversal_prevention(self):
        """Test path traversal prevention in file operations"""
        malicious_path = "../../etc/passwd"

        # Attempt to use malicious path in resume
        agent = ResumeAgent(
            resume_text=malicious_path,
            job_description="Test",
            user_id="test-user"
        )

        result = await agent.execute()

        # Should not access filesystem
        assert "passwd" not in str(result)
        assert "../" not in str(result) or "sanitized" in str(result).lower()
