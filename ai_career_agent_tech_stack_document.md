# AI Career Agent — Tech Stack Document

## 1. Purpose
This document defines the approved technology stack, rationale, and deployment model for the AI Career Agent SaaS. The objective is to ensure the system is built entirely on free-tier compatible, scalable, and production-grade technologies.

---

## 2. Architecture Overview
```
Browser (User)
     ↓
Next.js (Vercel)
     ↓ API
Python Agent Service (Railway)
     ↓
Neon PostgreSQL (pgvector + blob)
     ↓
Playwright Worker
     ↓
OpenRouter (LLM)
```

---

## 3. Frontend & API Layer
**Technology:** Next.js, Tailwind CSS, shadcn/ui  
**Hosting:** Vercel (Free Tier)

**Responsibilities**
- User dashboard UI
- API routes to communicate with agent service
- Authentication handling
- Display of jobs, resumes, applications, and insights

**Rationale**
- Full-stack capability in a single framework
- Server Actions remove need for separate backend
- Seamless deployment on free hosting

---

## 4. Database Layer
**Technology:** PostgreSQL on Neon

**Responsibilities**
- Store users, jobs, resumes, applications
- Store embeddings using pgvector
- Store resume PDFs using Neon Blob storage

**Rationale**
- Unified relational + vector + file storage
- Eliminates need for Supabase, Chroma, or S3
- Highly scalable and production ready

---

## 5. Vector Search (RAG)
**Technology:** pgvector (Postgres extension)

**Responsibilities**
- Resume to JD semantic matching
- Skill gap detection
- Context retrieval for LLM prompts

**Rationale**
- No separate vector database required
- Fast SQL-based similarity search
- Industry-standard for AI SaaS

---

## 6. AI Agent Layer
**Technology:** Python, LangChain, LangGraph  
**Hosting:** Railway (Free Tier)

**Agents Implemented**
- Job Finder Agent
- Resume & Cover Letter Agent (RAG)
- LinkedIn Content Agent
- Application Automation Agent
- Skill Gap Analysis Agent
- Interview Preparation Agent

**Rationale**
- Python ecosystem best suited for agent workflows
- LangGraph enables multi-agent orchestration
- Easy integration with Playwright and pgvector

---

## 7. Browser Automation
**Technology:** Playwright

**Responsibilities**
- Scrape job portals and career pages
- Auto-fill job application forms
- Upload resumes

**Execution Context**
- Runs within the Railway agent worker

---

## 8. LLM Access
**Technology:** OpenRouter

**Responsibilities**
- Access to open-source LLMs for resume, cover letter, and content generation

**Rationale**
- Free usage of OSS models
- No dependency on paid APIs

---

## 9. Authentication
**Technology:** NextAuth (within Next.js)

**Providers**
- Google OAuth
- LinkedIn OAuth

---

## 10. Scheduling & Automation
**Technology:** GitHub Actions (cron workflows)

**Responsibilities**
- Daily job scraping
- Resume generation runs
- LinkedIn post scheduling

---

## 11. Hosting Model
| Component | Platform | Free Tier |
|---|---|---|
| Web App | Vercel | Yes |
| Agent Service | Railway | Yes |
| Database | Neon | Yes |
| Scheduler | GitHub Actions | Yes |

---

## 12. Free Tier Compatibility Review
All selected technologies provide sufficient free-tier capacity to support:
- Daily job scraping
- Resume generation
- Application tracking
- LinkedIn content generation

No paid services are required for MVP deployment.

---

## 13. Scalability Considerations
- Can migrate Neon to paid plan without code changes
- Railway can scale worker instances
- Next.js can scale automatically on Vercel
- pgvector supports large embedding datasets

---

## 14. Conclusion
This tech stack ensures the AI Career Agent is built using modern, scalable, and production-grade tools while remaining fully operable within free-tier limits. The architecture supports future evolution into a multi-user SaaS product without requiring redesign.

