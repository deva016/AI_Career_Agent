import io
import logging
from typing import List, Dict, Any, Optional
import PyPDF2
from core.llm import LLMClient
from core.database import db
from rag.embeddings import embeddings
from rag.retriever import ChunkType

logger = logging.getLogger(__name__)

CLASSIFY_CHUNK_PROMPT = """You are a resume data architect. Classify this snippet from a resume into one of these categories:
- experience (work history, roles, responsibilities)
- project (side projects, open source, academic projects)
- skill (technical skills, soft skills, tools)
- education (degrees, certifications, schools)
- summary (professional summary, bio)
- other (awards, volunteer work, etc.)

Snippet:
{snippet}

Respond with only the category name in lowercase.
"""

class ResumeProcessor:
    """
    Handles PDF extraction, chunking, and embedding for resumes.
    """
    
    def __init__(self):
        self.llm = LLMClient()
        
    async def process_resume(self, user_id: str, resume_id: str, pdf_content: bytes) -> bool:
        """
        Full pipeline: extract -> chunk -> classify -> embed -> store.
        """
        try:
            # 1. Extract text from PDF
            text = self.extract_text(pdf_content)
            if not text:
                logger.error("No text extracted from resume PDF")
                return False
                
            # 2. Chunk text (simple approach: split by double newlines or sections)
            raw_chunks = self.chunk_text(text)
            logger.info(f"Generated {len(raw_chunks)} raw chunks from resume")
            
            # 3. Classify and store chunks
            for i, chunk_content in enumerate(raw_chunks):
                if not chunk_content.strip():
                    continue
                    
                # Classify chunk type
                chunk_type_str = await self.llm.simple_prompt(
                    CLASSIFY_CHUNK_PROMPT.format(snippet=chunk_content[:500]),
                    system="You are a specialized classifier. Respond with exactly one word."
                )
                chunk_type_str = chunk_type_str.strip().lower()
                
                # Default to OTHER if classification fails or is invalid
                try:
                    chunk_type = ChunkType(chunk_type_str)
                except ValueError:
                    chunk_type = ChunkType.OTHER
                    
                # Generate embedding
                embedding = await embeddings.embed_text(chunk_content)
                
                # Store in database
                await db.create_resume_chunk(
                    user_id=user_id,
                    resume_id=resume_id,
                    chunk_type=chunk_type.value,
                    content=chunk_content,
                    embedding=embedding,
                    metadata={"index": i, "length": len(chunk_content)}
                )
                
            return True
        except Exception as e:
            logger.error(f"Resume processing failed: {e}")
            return False
            
    def extract_text(self, pdf_bytes: bytes) -> str:
        """Extract plain text from PDF bytes."""
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            return ""
            
    def chunk_text(self, text: str) -> List[str]:
        """
        Split resume text into logical chunks.
        Resumes are usually structured by sections or bullet points.
        """
        # Split by sections common in resumes
        import re
        
        # Heuristic: split by double newline or significant whitespace
        chunks = re.split(r'\n\s*\n', text)
        
        # Further refine: if a chunk is too big, split it by line
        refined_chunks = []
        for chunk in chunks:
            if len(chunk) > 1000:
                # Split huge chunks into smaller ones
                lines = chunk.split('\n')
                sub_chunk = ""
                for line in lines:
                    if len(sub_chunk) + len(line) > 800:
                        refined_chunks.append(sub_chunk.strip())
                        sub_chunk = line + "\n"
                    else:
                        sub_chunk += line + "\n"
                if sub_chunk:
                    refined_chunks.append(sub_chunk.strip())
            else:
                refined_chunks.append(chunk.strip())
                
        return [c for c in refined_chunks if len(c) > 20] # Filter out noise
