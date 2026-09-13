import openai
from typing import List, Dict, Any

from app.services.supabase_client import supabase
from app.core.config import settings

# Point to local Ollama instance
client = openai.OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama" # required but ignored
)

def get_embedding(text: str) -> List[float]:
    """Generates an embedding vector for the given text using local Ollama."""
    try:
        response = client.embeddings.create(
            input=text,
            model="nomic-embed-text" # Standard Ollama embedding model
        )
        vec = response.data[0].embedding
        
        # Pad the vector to 1536 dimensions to match the DB schema which expects OpenAI size
        if len(vec) < 1536:
            vec = vec + [0.0] * (1536 - len(vec))
        elif len(vec) > 1536:
            vec = vec[:1536]
            
        return vec
    except Exception as e:
        print(f"Embedding error: {e}")
        # fallback zero vector just to not crash
        return [0.0] * 1536

def search_bio_knowledge(query: str, match_threshold: float = 0.5, match_count: int = 5) -> List[Dict[str, Any]]:
    """
    Searches the bio_knowledge table in Supabase via pgvector RPC.
    Returns matched content chunks.
    """
    try:
        embedding = get_embedding(query)
        
        # Calling the Supabase RPC function defined in schema.sql
        response = supabase.rpc(
            "match_bio_knowledge",
            {
                "query_embedding": embedding,
                "match_threshold": match_threshold,
                "match_count": match_count
            }
        ).execute()
        
        return response.data
    except Exception as e:
        print(f"Error in RAG search: {e}")
        return []
