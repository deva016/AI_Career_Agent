"""
Phase 15: Artifact & Data Isolation Tests

Tests for the artifact persistence pipeline and multi-user data isolation.
These validate the Phase 13 (Artifact Management) infrastructure.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from graphs.state import Artifact, MissionStatus
from datetime import datetime


class TestArtifactSerialization:
    """Tests for Artifact.to_dict() data integrity"""

    def test_to_dict_includes_content(self):
        """Verify content field is preserved in serialization (Phase 13 bug fix)"""
        art = Artifact(
            id="test-1",
            type="resume",
            name="Test Resume",
            content="# John Doe\n\nSoftware Engineer with 5 years experience.",
        )
        d = art.to_dict()
        assert d["content"] is not None
        assert "John Doe" in d["content"]
        assert d["type"] == "resume"
        assert d["name"] == "Test Resume"

    def test_to_dict_handles_none_content(self):
        """Verify None content doesn't crash serialization"""
        art = Artifact(id="test-2", type="report", name="Empty Report", content=None)
        d = art.to_dict()
        assert d["content"] is None
        assert d["type"] == "report"

    def test_to_dict_handles_non_string_content(self):
        """Verify non-string content (e.g. dict) is stringified"""
        art = Artifact(
            id="test-3",
            type="job_summary",
            name="Summary",
            content={"skills": ["python", "react"]},
        )
        d = art.to_dict()
        assert isinstance(d["content"], str)
        assert "python" in d["content"]

    def test_to_dict_all_fields_present(self):
        """Verify all required fields are in output"""
        art = Artifact(id="test-4", type="cover_letter", name="CL", content="Dear Hiring")
        d = art.to_dict()
        required_keys = {"id", "type", "name", "content", "created_at"}
        assert required_keys.issubset(set(d.keys()))

    def test_to_dict_created_at_is_iso(self):
        """Verify created_at is a valid ISO string"""
        art = Artifact(id="test-5", type="resume", name="R", content="x")
        d = art.to_dict()
        # Should parse without error
        parsed = datetime.fromisoformat(d["created_at"])
        assert parsed.year >= 2025


class TestArtifactPersistenceBridge:
    """Tests for the run_mission_background artifact persistence"""

    @pytest.mark.asyncio
    async def test_artifacts_persisted_to_table(self):
        """Verify mission artifacts are written to the standalone artifacts table"""
        from app.routers.agent import run_mission_background

        mock_art = Artifact(
            id="test-6",
            type="resume",
            name="Tailored Resume",
            content="# Resume Content",
        )

        with patch("app.routers.agent.db") as mock_db, \
             patch("app.routers.agent.execute_agent_mission") as mock_execute:

            # Simulate successful mission with an artifact
            mock_execute.return_value = {
                "status": MissionStatus.COMPLETED,
                "progress": 100,
                "events": [],
                "artifacts": [mock_art],
                "output_data": {},
            }
            mock_db.update_mission = AsyncMock()
            mock_db.create_artifact = AsyncMock()
            mock_db.list_missions = AsyncMock(return_value=[])

            await run_mission_background(
                mission_id="m-123",
                user_id="user-1",
                agent_type="resume",
                params={},
            )

            # Verify create_artifact was called with correct args
            mock_db.create_artifact.assert_called_once()
            call_kwargs = mock_db.create_artifact.call_args
            assert call_kwargs.kwargs.get("user_id") == "user-1" or call_kwargs[1].get("user_id") == "user-1"

    @pytest.mark.asyncio
    async def test_artifact_persistence_failure_doesnt_crash_mission(self):
        """Verify artifact persistence errors don't fail the mission"""
        from app.routers.agent import run_mission_background

        mock_art = Artifact(id="test-7", type="resume", name="R", content="X")

        with patch("app.routers.agent.db") as mock_db, \
             patch("app.routers.agent.execute_agent_mission") as mock_execute:

            mock_execute.return_value = {
                "status": MissionStatus.COMPLETED,
                "progress": 100,
                "events": [],
                "artifacts": [mock_art],
                "output_data": {},
            }
            mock_db.update_mission = AsyncMock()
            mock_db.create_artifact = AsyncMock(side_effect=Exception("DB error"))

            # Should NOT raise — artifact failure is non-fatal
            await run_mission_background(
                mission_id="m-456",
                user_id="user-1",
                agent_type="resume",
                params={},
            )

            # Mission should still complete
            mock_db.update_mission.assert_called()


class TestDatabaseFilters:
    """Tests for get_artifacts() filter functionality"""

    @pytest.mark.asyncio
    async def test_filter_by_mission_id(self):
        """Verify mission_id filter is applied"""
        from core.database import DatabaseService

        with patch.object(DatabaseService, "connection") as mock_conn_ctx:
            mock_conn = AsyncMock()
            mock_conn.fetch = AsyncMock(return_value=[])
            mock_conn_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
            mock_conn_ctx.return_value.__aexit__ = AsyncMock(return_value=None)

            await DatabaseService.get_artifacts(
                user_id="user-1",
                mission_id="m-123",
            )

            # Verify the query contains mission_id filter
            call_args = mock_conn.fetch.call_args
            query = call_args[0][0]
            assert "mission_id" in query

    @pytest.mark.asyncio
    async def test_filter_by_artifact_type(self):
        """Verify type filter is applied"""
        from core.database import DatabaseService

        with patch.object(DatabaseService, "connection") as mock_conn_ctx:
            mock_conn = AsyncMock()
            mock_conn.fetch = AsyncMock(return_value=[])
            mock_conn_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
            mock_conn_ctx.return_value.__aexit__ = AsyncMock(return_value=None)

            await DatabaseService.get_artifacts(
                user_id="user-1",
                artifact_type="resume",
            )

            call_args = mock_conn.fetch.call_args
            query = call_args[0][0]
            assert "type" in query


class TestMultiUserIsolation:
    """Verify multi-user data isolation in artifacts"""

    @pytest.mark.asyncio
    async def test_user_cannot_access_others_artifacts(self):
        """User A should not see User B's artifacts"""
        from core.database import DatabaseService

        with patch.object(DatabaseService, "connection") as mock_conn_ctx:
            mock_conn = AsyncMock()
            mock_conn.fetch = AsyncMock(return_value=[])
            mock_conn_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
            mock_conn_ctx.return_value.__aexit__ = AsyncMock(return_value=None)

            await DatabaseService.get_artifacts(user_id="user-A")

            call_args = mock_conn.fetch.call_args
            query = call_args[0][0]
            params = call_args[0][1:]

            # Query must filter by user_id
            assert "user_id" in query
            assert "user-A" in params

    @pytest.mark.asyncio
    async def test_delete_requires_ownership(self):
        """Verify artifact deletion checks user ownership"""
        from app.routers.artifacts import delete_artifact
        from fastapi import HTTPException

        with patch("app.routers.artifacts.db") as mock_db:
            mock_db.get_artifact = AsyncMock(return_value=None)

            with pytest.raises(HTTPException) as exc_info:
                await delete_artifact(
                    artifact_id="art-123",
                    user_id="wrong-user",
                )

            assert exc_info.value.status_code == 404
