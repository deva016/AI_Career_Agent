"""
Async Database Service for AI Career Agent.
Uses asyncpg for high-performance PostgreSQL operations.
"""

import asyncpg
from asyncpg import Pool
from typing import Optional, Any, List, Dict
from contextlib import asynccontextmanager
import json

from core.config import get_settings


class DatabaseService:
    """
    Async database service with connection pooling.
    Provides CRUD operations and vector search capabilities.
    """
    
    _pool: Optional[Pool] = None
    
    @classmethod
    async def get_pool(cls) -> Pool:
        """Get or create the connection pool."""
        if cls._pool is None:
            settings = get_settings()
            try:
                cls._pool = await asyncpg.create_pool(
                    settings.database_url,
                    min_size=2,
                    max_size=10,
                    command_timeout=60,
                )
            except asyncpg.PostgresError as e:
                raise Exception(f"Failed to connect to database: {e}") from e
            except Exception as e:
                raise Exception(f"Unexpected database connection error: {e}") from e
        return cls._pool
    
    @classmethod
    async def close_pool(cls):
        """Close the connection pool."""
        if cls._pool:
            await cls._pool.close()
            cls._pool = None
    
    @classmethod
    @asynccontextmanager
    async def connection(cls):
        """Get a connection from the pool."""
        pool = await cls.get_pool()
        async with pool.acquire() as conn:
            yield conn
    
    # ========== User Operations ==========
    
    @classmethod
    async def get_user(cls, user_id: str) -> Optional[Dict]:
        """Get user by ID."""
        async with cls.connection() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM users WHERE id = $1",
                user_id
            )
            return dict(row) if row else None
    
    # ========== Job Operations ==========
    
    @classmethod
    async def create_job(
        cls,
        user_id: str,
        title: str,
        company: str,
        location: str,
        description: str,
        url: str,
        source: str,
        embedding: Optional[List[float]] = None,
        salary_range: Optional[str] = None,
        job_type: Optional[str] = None,
    ) -> str:
        """Create a new job listing."""
        async with cls.connection() as conn:
            job_id = await conn.fetchval(
                """
                INSERT INTO jobs (user_id, title, company, location, description, job_url, source, embedding, salary_range, job_type)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (user_id, job_url) DO NOTHING
                RETURNING id
                """,
                user_id, title, company, location, description, url, source,
                embedding, salary_range, job_type
            )
            return str(job_id) if job_id else None
    
    @classmethod
    async def get_job_by_id(cls, job_id: str, user_id: str) -> Optional[Dict]:
        """Get a specific job by ID and user_id."""
        async with cls.connection() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM jobs WHERE id = $1 AND user_id = $2",
                job_id, user_id
            )
            return dict(row) if row else None

    @classmethod
    async def get_jobs(
        cls,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None,
    ) -> List[Dict]:
        """Get jobs for a user."""
        async with cls.connection() as conn:
            query = "SELECT * FROM jobs WHERE user_id = $1"
            params = [user_id]
            
            if status:
                query += " AND status = $2"
                params.append(status)
            
            query += " ORDER BY scraped_at DESC LIMIT $%d OFFSET $%d" % (len(params)+1, len(params)+2)
            params.extend([limit, offset])
            
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    @classmethod
    async def search_jobs_by_embedding(
        cls,
        user_id: str,
        embedding: List[float],
        limit: int = 10,
    ) -> List[Dict]:
        """Vector similarity search for jobs."""
        async with cls.connection() as conn:
            rows = await conn.fetch(
                """
                SELECT *, 1 - (embedding <=> $2::vector) as similarity
                FROM jobs
                WHERE user_id = $1 AND embedding IS NOT NULL
                ORDER BY embedding <=> $2::vector
                LIMIT $3
                """,
                user_id, embedding, limit
            )
            return [dict(row) for row in rows]
    
    # ========== Resume Chunk Operations ==========
    
    @classmethod
    async def create_resume_chunk(
        cls,
        user_id: str,
        resume_id: str,
        chunk_type: str,
        content: str,
        embedding: Optional[List[float]] = None,
        metadata: Optional[Dict] = None,
    ) -> str:
        """Create a resume chunk with embedding."""
        async with cls.connection() as conn:
            chunk_id = await conn.fetchval(
                """
                INSERT INTO resume_chunks (user_id, resume_id, chunk_type, content, embedding, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
                """,
                user_id, resume_id, chunk_type, content, embedding,
                json.dumps(metadata) if metadata else None
            )
            return str(chunk_id)
    
    @classmethod
    async def search_resume_chunks(
        cls,
        user_id: str,
        embedding: List[float],
        chunk_types: Optional[List[str]] = None,
        limit: int = 10,
    ) -> List[Dict]:
        """Vector search for resume chunks with optional type filtering."""
        async with cls.connection() as conn:
            query = """
                SELECT *, 1 - (embedding <=> $2::vector) as similarity
                FROM resume_chunks
                WHERE user_id = $1 AND embedding IS NOT NULL
            """
            params = [user_id, embedding]
            
            if chunk_types:
                query += " AND chunk_type = ANY($3)"
                params.append(chunk_types)
            
            query += " ORDER BY embedding <=> $2::vector LIMIT $%d" % (len(params)+1)
            params.append(limit)
            
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    @classmethod
    async def get_resumes(
        cls,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict]:
        """List resumes for a user."""
        async with cls.connection() as conn:
            rows = await conn.fetch(
                "SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
                user_id, limit, offset
            )
            return [dict(row) for row in rows]
    
    # ========== Application Operations ==========
    
    @classmethod
    async def create_application(
        cls,
        user_id: str,
        job_id: str,
        resume_id: Optional[str] = None,
        cover_letter: Optional[str] = None,
        status: str = "pending",
    ) -> str:
        """Create a new application."""
        async with cls.connection() as conn:
            app_id = await conn.fetchval(
                """
                INSERT INTO applications (user_id, job_id, resume_id, cover_letter_url, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
                """,
                user_id, job_id, resume_id, cover_letter, status
            )
            return str(app_id)
    
    @classmethod
    async def update_application_status(
        cls,
        application_id: str,
        status: str,
        notes: Optional[str] = None,
    ) -> bool:
        """Update application status."""
        async with cls.connection() as conn:
            result = await conn.execute(
                """
                UPDATE applications
                SET status = $2, notes = COALESCE($3, notes), updated_at = NOW()
                WHERE id = $1
                """,
                application_id, status, notes
            )
            return result == "UPDATE 1"
    
    @classmethod
    async def get_applications(
        cls,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict]:
        """List applications for a user."""
        async with cls.connection() as conn:
            rows = await conn.fetch(
                """
                SELECT a.*, j.title as job_title, j.company as job_company 
                FROM applications a
                JOIN jobs j ON a.job_id = j.id
                WHERE a.user_id = $1 
                ORDER BY a.applied_at DESC 
                LIMIT $2 OFFSET $3
                """,
                user_id, limit, offset
            )
            return [dict(row) for row in rows]
    
    @classmethod
    async def get_linkedin_posts(
        cls,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict]:
        """List LinkedIn posts for a user."""
        async with cls.connection() as conn:
            query = "SELECT * FROM linkedin_posts WHERE user_id = $1"
            params = [user_id]
            if status:
                query += " AND status = $2"
                params.append(status)
            
            query += f" ORDER BY created_at DESC LIMIT ${len(params)+1} OFFSET ${len(params)+2}"
            params.extend([limit, offset])
            
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    # ========== User Settings Operations ==========
    
    @classmethod
    async def get_user_settings(cls, user_id: str) -> Optional[Dict]:
        """Get user settings including Knowledge Base."""
        async with cls.connection() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM user_settings WHERE user_id = $1",
                user_id
            )
            return dict(row) if row else None
    
    @classmethod
    async def upsert_user_settings(
        cls,
        user_id: str,
        target_roles: Optional[List[str]] = None,
        target_locations: Optional[List[str]] = None,
        knowledge_base: Optional[Dict] = None,
    ) -> bool:
        """Create or update user settings."""
        async with cls.connection() as conn:
            await conn.execute(
                """
                INSERT INTO user_settings (user_id, target_roles, target_locations, knowledge_base)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id) DO UPDATE SET
                    target_roles = COALESCE($2, user_settings.target_roles),
                    target_locations = COALESCE($3, user_settings.target_locations),
                    knowledge_base = COALESCE($4, user_settings.knowledge_base),
                    updated_at = NOW()
                """,
                user_id, target_roles, target_locations,
                json.dumps(knowledge_base) if knowledge_base else None
            )
            return True
    
    # ========== Mission Operations ==========
    
    @classmethod
    async def create_mission(
        cls,
        mission_id: str,
        user_id: str,
        agent_type: str,
        input_data: Dict,
    ) -> str:
        """Create a new mission."""
        async with cls.connection() as conn:
            await conn.execute(
                """
                INSERT INTO missions (id, user_id, agent_type, status, input_data)
                VALUES ($1, $2, $3, $4, $5)
                """,
                mission_id, user_id, agent_type, "pending", json.dumps(input_data)
            )
            return mission_id
    
    @classmethod
    async def get_mission(cls, mission_id: str) -> Optional[Dict]:
        """Get mission by ID."""
        async with cls.connection() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM missions WHERE id = $1",
                mission_id
            )
            if not row:
                return None
            
            mission = dict(row)
            # Parse JSON fields
            for field in ['input_data', 'output_data', 'context', 'events', 'artifacts']:
                if mission.get(field):
                    mission[field] = json.loads(mission[field]) if isinstance(mission[field], str) else mission[field]
            return mission
    
    @classmethod
    async def update_mission(
        cls,
        mission_id: str,
        status: Optional[str] = None,
        current_node: Optional[str] = None,
        progress: Optional[int] = None,
        output_data: Optional[Dict] = None,
        context: Optional[Dict] = None,
        events: Optional[List] = None,
        artifacts: Optional[List] = None,
        error: Optional[str] = None,
        requires_approval: Optional[bool] = None,
        approval_reason: Optional[str] = None,
        user_feedback: Optional[str] = None,
        completed_at: Optional[str] = None,
    ) -> bool:
        """Update mission fields."""
        updates = []
        params = []
        param_idx = 1
        
        field_mapping = {
            'status': status, 'current_node': current_node, 'progress': progress,
            'error': error, 'requires_approval': requires_approval,
            'approval_reason': approval_reason, 'user_feedback': user_feedback,
            'completed_at': completed_at
        }
        
        for field, value in field_mapping.items():
            if value is not None:
                updates.append(f"{field} = ${param_idx}")
                params.append(value)
                param_idx += 1
        
        # Handle JSON fields
        json_fields = {
            'output_data': output_data, 'context': context,
            'events': events, 'artifacts': artifacts
        }
        for field, value in json_fields.items():
            if value is not None:
                updates.append(f"{field} = ${param_idx}")
                params.append(json.dumps(value))
                param_idx += 1
        
        if not updates:
            return False
        
        params.append(mission_id)
        query = f"UPDATE missions SET {', '.join(updates)} WHERE id = ${param_idx}"
        
        async with cls.connection() as conn:
            result = await conn.execute(query, *params)
            return result == "UPDATE 1"
    
    @classmethod
    async def list_missions(
        cls,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
        summary: bool = True
    ) -> List[Dict]:
        """List missions for a user. Optimized for performance by excluding large fields in summary mode."""
        async with cls.connection() as conn:
            if summary:
                # Exclude large context and input_data for list view
                fields = "id, user_id, agent_type, status, current_node, progress, artifacts, events, created_at"
            else:
                fields = "*"
                
            query = f"SELECT {fields} FROM missions WHERE user_id = $1"
            params = [user_id]
            
            if status:
                query += " AND status = $2"
                params.append(status)
            
            query += f" ORDER BY created_at DESC LIMIT ${len(params)+1} OFFSET ${len(params)+2}"
            params.extend([limit, offset])
            
            rows = await conn.fetch(query, *params)
            missions = []
            
            # Fields that need JSON parsing
            json_fields = ['artifacts', 'events'] if summary else ['input_data', 'output_data', 'context', 'events', 'artifacts']
            
            for row in rows:
                mission = dict(row)
                for field in json_fields:
                    if mission.get(field):
                        mission[field] = json.loads(mission[field]) if isinstance(mission[field], str) else mission[field]
                missions.append(mission)
            return missions

    @classmethod
    async def get_dashboard_stats(cls, user_id: str) -> Dict[str, Any]:
        """Get summary statistics for the dashboard KPI strip."""
        async with cls.connection() as conn:
            jobs_count = await conn.fetchval(
                "SELECT count(*) FROM jobs WHERE user_id = $1", user_id
            ) or 0
            apps_count = await conn.fetchval(
                "SELECT count(*) FROM applications WHERE user_id = $1", user_id
            ) or 0
            resumes_count = await conn.fetchval(
                "SELECT count(*) FROM resumes WHERE user_id = $1", user_id
            ) or 0
            active_missions = await conn.fetchval(
                "SELECT count(*) FROM missions WHERE user_id = $1 AND status IN ('running', 'pending', 'waiting_approval')",
                user_id,
            ) or 0

            # Estimated time saved: 30min per app, 45min per resume
            time_saved_hrs = round((apps_count * 0.5) + (resumes_count * 0.75), 1)

            return {
                "jobs_found": jobs_count,
                "applications_sent": apps_count,
                "resumes_generated": resumes_count,
                "active_missions": active_missions,
                "time_saved_hrs": time_saved_hrs,
            }


# Singleton instance
db = DatabaseService()
