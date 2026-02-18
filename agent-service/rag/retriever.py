"""
Typed, Ranked RAG Retriever for AI Career Agent.
Implements priority-based retrieval with type filtering.
"""

from typing import List, Dict, Optional, Literal
from dataclasses import dataclass
from enum import Enum

from core.database import db
from rag.embeddings import embeddings


class ChunkType(str, Enum):
    """Types of resume chunks with priority ordering."""
    EXPERIENCE = "experience"      # Priority 1
    PROJECT = "project"            # Priority 2
    SKILL = "skill"                # Priority 3
    EDUCATION = "education"        # Priority 4
    CERTIFICATION = "certification"  # Priority 5
    SUMMARY = "summary"            # Priority 6
    OTHER = "other"                # Priority 7


# Default retrieval limits per type
DEFAULT_LIMITS = {
    ChunkType.EXPERIENCE: 4,
    ChunkType.PROJECT: 3,
    ChunkType.SKILL: 3,
    ChunkType.EDUCATION: 2,
    ChunkType.CERTIFICATION: 2,
    ChunkType.SUMMARY: 1,
    ChunkType.OTHER: 2,
}


@dataclass
class RetrievedChunk:
    """A retrieved resume chunk with metadata."""
    id: str
    chunk_type: ChunkType
    content: str
    similarity: float
    metadata: Optional[Dict] = None
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "type": self.chunk_type.value,
            "content": self.content,
            "similarity": self.similarity,
            "metadata": self.metadata,
        }


class RAGRetriever:
    """
    Typed, Ranked RAG retrieval system.
    
    Features:
    - Priority ordering (experience > projects > skills)
    - Top-K per type (configurable limits)
    - JD keyword boosting
    - Metric injection
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
    
    async def retrieve(
        self,
        query: str,
        limits: Optional[Dict[ChunkType, int]] = None,
        boost_keywords: Optional[List[str]] = None,
        min_similarity: float = 0.5,
    ) -> List[RetrievedChunk]:
        """
        Retrieve relevant resume chunks for a query.
        
        Args:
            query: The search query (e.g., job description)
            limits: Override default limits per chunk type
            boost_keywords: Keywords to boost in ranking
            min_similarity: Minimum similarity threshold
            
        Returns:
            Ranked list of retrieved chunks
        """
        # Use default limits if not provided
        type_limits = limits or DEFAULT_LIMITS
        
        # Generate query embedding
        query_embedding = await embeddings.embed_text(query)
        
        # Retrieve chunks for each type
        all_chunks: List[RetrievedChunk] = []
        
        for chunk_type, limit in type_limits.items():
            chunks = await db.search_resume_chunks(
                user_id=self.user_id,
                embedding=query_embedding,
                chunk_types=[chunk_type.value],
                limit=limit,
            )
            
            for chunk in chunks:
                if chunk.get("similarity", 0) >= min_similarity:
                    all_chunks.append(RetrievedChunk(
                        id=str(chunk["id"]),
                        chunk_type=chunk_type,
                        content=chunk["content"],
                        similarity=chunk.get("similarity", 0),
                        metadata=chunk.get("metadata"),
                    ))
        
        # Apply keyword boosting if provided
        if boost_keywords:
            for chunk in all_chunks:
                boost = sum(
                    0.05 for kw in boost_keywords
                    if kw.lower() in chunk.content.lower()
                )
                chunk.similarity = min(1.0, chunk.similarity + boost)
        
        # Sort by type priority, then similarity
        type_priority = {t: i for i, t in enumerate(ChunkType)}
        all_chunks.sort(key=lambda c: (type_priority[c.chunk_type], -c.similarity))
        
        return all_chunks
    
    async def retrieve_for_job(
        self,
        job_description: str,
        job_title: str,
        required_skills: Optional[List[str]] = None,
    ) -> Dict[str, List[RetrievedChunk]]:
        """
        Retrieve resume chunks optimized for a specific job.
        
        Args:
            job_description: Full job description text
            job_title: Job title for context
            required_skills: Extracted skills to boost
            
        Returns:
            Dict grouping chunks by type
        """
        # Combine job info for embedding
        query = f"{job_title}\n\n{job_description}"
        
        # Retrieve with skill boosting
        chunks = await self.retrieve(
            query=query,
            boost_keywords=required_skills,
        )
        
        # Group by type
        grouped: Dict[str, List[RetrievedChunk]] = {}
        for chunk in chunks:
            type_key = chunk.chunk_type.value
            if type_key not in grouped:
                grouped[type_key] = []
            grouped[type_key].append(chunk)
        
        return grouped
    
    def format_for_prompt(
        self,
        chunks: List[RetrievedChunk],
        include_metadata: bool = False,
    ) -> str:
        """
        Format retrieved chunks for LLM prompt.
        
        Args:
            chunks: List of retrieved chunks
            include_metadata: Whether to include metadata
            
        Returns:
            Formatted string for LLM context
        """
        sections = []
        current_type = None
        
        for chunk in chunks:
            if chunk.chunk_type != current_type:
                current_type = chunk.chunk_type
                sections.append(f"\n## {current_type.value.upper()}")
            
            content = chunk.content
            if include_metadata and chunk.metadata:
                content = f"{content} [{chunk.metadata}]"
            
            sections.append(f"- {content}")
        
        return "\n".join(sections)


async def get_retriever(user_id: str) -> RAGRetriever:
    """Factory function to create a retriever for a user."""
    return RAGRetriever(user_id)
