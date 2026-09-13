from fastapi import APIRouter, HTTPException
from app.services.supabase_client import supabase

router = APIRouter()

# Cache the sources to avoid repeated heavy queries on the vector table
_cached_sources = None

@router.get("/sources")
async def get_knowledge_sources():
    """
    Returns a distinct list of document sources from the knowledge base.
    """
    global _cached_sources
    if _cached_sources is not None:
        return {"sources": _cached_sources}
        
    try:
        # For MVP, fetching metadata and deduplicating.
        # In full production with millions of chunks, an RPC or dedicated trigger table is better.
        res = supabase.table('bio_knowledge').select('metadata').execute()
        
        sources = set()
        for row in res.data:
            meta = row.get('metadata')
            if meta and 'source' in meta:
                # Clean up the path to just get the filename
                path = meta['source']
                filename = path.replace('\\', '/').split('/')[-1]
                # Format nicely (e.g. "Biohacking-6.3.pdf" -> "Biohacking 6.3")
                clean_name = filename.replace('.pdf', '').replace('-', ' ')
                sources.add(clean_name)
                
        _cached_sources = sorted(list(sources))
        return {"sources": _cached_sources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
