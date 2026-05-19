import logging
import sys
import os
from logging.handlers import RotatingFileHandler

def setup_logging():
    """Configure logging to both stdout and a file."""
    # Prevent duplicate handlers
    root = logging.getLogger()
    if root.handlers:
        return
        
    log_formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    
    # Ensure log directory exists if needed (using current dir here)
    log_file = "agent-service.log"
    
    file_handler = RotatingFileHandler(log_file, maxBytes=1048576, backupCount=5)
    file_handler.setFormatter(log_formatter)
    
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setFormatter(log_formatter)
    
    root.setLevel(logging.INFO)
    root.addHandler(file_handler)
    root.addHandler(stdout_handler)
    
    # Capture uvicorn logs
    for logger_name in ["uvicorn", "uvicorn.error", "uvicorn.access"]:
        l = logging.getLogger(logger_name)
        l.handlers = [] # Clear existing to avoid double logs
        l.addHandler(file_handler)
        l.addHandler(stdout_handler)
        l.propagate = False
