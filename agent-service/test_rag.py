import asyncio
from rag.retriever import RAGRetriever, ChunkType
from rag.embeddings import embeddings

async def test():
    user_id = "f0e8c7bc-2c45-4c1c-a292-228bdcf88f87"
    retriever = RAGRetriever(user_id)
    
    # Simulating a search for "Data Analyst"
    query = "Data Analyst at ReWorks Solutions. Technical skills in Python, SQL, Tableau."
    
    print(f"Testing retrieval for query: '{query}'")
    chunks = await retriever.retrieve(query, min_similarity=0.1) # Lower threshold for testing
    
    print(f"Found {len(chunks)} chunks total.")
    for c in chunks:
        print(f"  [{c.chunk_type.value}] Similarity: {c.similarity:.4f} | Content: {c.content[:100]}...")

if __name__ == "__main__":
    asyncio.run(test())
