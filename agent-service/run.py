import uvicorn
import logging
import sys

if __name__ == "__main__":
    from core.logging_config import setup_logging
    setup_logging()
    
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        reload_dirs=["app", "agents", "core", "rag", "scrapers", "graphs"],
        reload_excludes=["*.log"], 
        access_log=False 
    )
