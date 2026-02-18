"""
ATS Platform Detection Module
"""

from enum import Enum
import re
from typing import Optional


class ATSPlatform(str, Enum):
    GREENHOUSE = "greenhouse"
    LEVER = "lever"
    WORKDAY = "workday"
    ASHBY = "ashby"
    BAMBOOHR = "bamboohr"
    SMARTRECRUITERS = "smartrecruiters"
    ICIMS = "icims"
    JOBVITE = "jobvite"
    UNKNOWN = "unknown"


def detect_ats_platform(url: str) -> ATSPlatform:
    """
    Detect the ATS platform from the job URL.
    """
    url_lower = url.lower()
    
    if "boards.greenhouse.io" in url_lower or "boards.eu.greenhouse.io" in url_lower:
        return ATSPlatform.GREENHOUSE
    elif "jobs.lever.co" in url_lower:
        return ATSPlatform.LEVER
    elif "myworkdayjobs.com" in url_lower:
        return ATSPlatform.WORKDAY
    elif "ashbyhq.com" in url_lower:
        return ATSPlatform.ASHBY
    elif "bamboohr.com" in url_lower:
        return ATSPlatform.BAMBOOHR
    elif "smartrecruiters.com" in url_lower:
        return ATSPlatform.SMARTRECRUITERS
    elif "icims.com" in url_lower:
        return ATSPlatform.ICIMS
    elif "jobvite.com" in url_lower:
        return ATSPlatform.JOBVITE
    
    return ATSPlatform.UNKNOWN
