import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from agents.job_finder import run_job_finder
from agents.resume_agent import run_resume_agent
from graphs.state import AgentState, MissionStatus

# Mock data
MOCK_JOBS = [
    {
        "id": "job-1",
        "title": "Software Engineer",
        "company": "Tech Corp",
        "description": "Python role",
        "url": "http://example.com/job1"
    }
]

@pytest.fixture
def mock_db_fixture():
    with patch('agents.job_finder.db') as mock_db:
        mock_db.update_mission = AsyncMock()
        mock_db.get_jobs = AsyncMock(return_value=[])
        mock_db.create_job = AsyncMock(return_value="job-123")
        yield mock_db

@pytest.fixture
def mock_llm_fixture():
    with patch('agents.job_finder.get_langchain_llm') as mock_llm:
        yield mock_llm

@pytest.fixture
def mock_embeddings():
    with patch('agents.job_finder.embeddings') as mock_embed:
        mock_embed.embed_texts = AsyncMock(return_value=[[0.1] * 1536])
        yield mock_embed

@pytest.mark.asyncio
async def test_run_job_finder(mock_db_fixture, mock_llm_fixture, mock_embeddings):
    # Run agent
    state = await run_job_finder(
        user_id="user-123",
        query="python developer",
        target_roles=["developer"],
        target_locations=["remote"]
    )
    
    # Assertions
    assert state is not None
    assert state["status"] in [MissionStatus.COMPLETED, MissionStatus.RUNNING, MissionStatus.EXECUTING]

@pytest.mark.asyncio
async def test_run_resume_agent():
    # Mock dependencies specifically for resume agent
    with patch('agents.resume_agent.db') as mock_db, \
         patch('agents.resume_agent.LLMClient') as mock_llm_client, \
         patch('agents.resume_agent.RAGRetriever') as mock_retriever:
        
        # Setup mocks
        mock_db.get_jobs = AsyncMock(return_value=[])
        
        mock_llm_instance = AsyncMock()
        mock_llm_instance.simple_prompt.return_value = '{"required_skills": ["python"], "preferred_qualifications": [], "responsibilities": [], "culture": [], "keywords": []}'
        mock_llm_client.return_value = mock_llm_instance
        
        mock_retriever_instance = MagicMock()
        mock_retriever_instance.retrieve_for_job = AsyncMock(return_value={})
        mock_retriever_instance.format_for_prompt.return_value = ""
        mock_retriever.return_value = mock_retriever_instance
        
        # Run agent
        state = await run_resume_agent(
            user_id="user-123",
            job_title="Software Engineer",
            company="Tech Corp",
            job_description="Python role"
        )
        
        # Assertions
        assert state is not None
        # It should pause at review in happy path
        assert state["status"] == MissionStatus.NEEDS_REVIEW
