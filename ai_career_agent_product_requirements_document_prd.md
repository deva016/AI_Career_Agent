# AI Career Agent — Product Requirements Document (PRD)

## 1. Document Control
- **Version:** 1.0
- **Status:** Draft
- **Author:** Product Team
- **Last Updated:** 2026-02-04

---

## 2. Executive Summary
AI Career Agent is a SaaS web application that automates and optimizes the end‑to‑end job search lifecycle using AI agents. The system discovers relevant jobs, tailors resumes and cover letters per job description, assists with applications, optimizes LinkedIn presence, and tracks outcomes in a unified dashboard.

**Primary Outcome:** Reduce manual effort in job search by 80% while improving application quality and consistency.

---

## 3. Product Vision & Goals
### Vision
Empower candidates with an autonomous AI assistant that continuously works on their career growth.

### Goals
1. Automate job discovery and filtering.
2. Generate job‑specific resumes and cover letters using RAG.
3. Assist or automate applications via browser automation.
4. Optimize LinkedIn profile and content cadence.
5. Provide a centralized application tracker and insights.
6. Identify skill gaps from market demand and recommend actions.

---

## 4. Target Users
- Students and early professionals applying to multiple roles.
- Career switchers needing tailored resumes.
- Active job seekers who want daily automation.

---

## 5. User Problems
- Repetitive resume editing per job.
- Writing cover letters repeatedly.
- Missing relevant job postings.
- Poor tracking of applications.
- Inconsistent LinkedIn activity.
- Unclear skill gaps relative to market demand.

---

## 6. Scope
### In Scope (MVP)
- Job scraping and storage
- Resume and cover letter generation (RAG)
- Application tracking
- LinkedIn post generation
- Skill gap insights

### Out of Scope (Phase 1)
- Mobile app
- Chrome extension
- Multi‑tenant enterprise features

---

## 7. High‑Level Architecture
```
Next.js (UI + API)
        ↓
Python Agent Service (LangGraph)
        ↓
PostgreSQL (Neon) with pgvector + blob
        ↓
Playwright Worker
```

---

## 8. Technology Stack
- Frontend/Backend: Next.js, Tailwind, shadcn/ui
- Database: PostgreSQL (Neon)
- Vector Search: pgvector
- Storage: Neon Blob
- Agents: Python, LangChain, LangGraph
- Automation: Playwright
- LLM Access: OpenRouter
- Hosting: Vercel (web), Railway (agents)

---

## 9. Functional Requirements
### 9.1 Job Finder Agent
- Scrape job portals and career pages daily
- Extract and store JD text
- Generate embeddings and store in pgvector

### 9.2 Resume & Cover Letter Agent
- Retrieve relevant resume chunks via vector search
- Generate tailored resume and cover letter per JD
- Export and store PDF in blob storage

### 9.3 Application Agent
- Auto‑fill job forms using Playwright
- Upload resume
- Log application status

### 9.4 LinkedIn Agent
- Suggest headline/about improvements
- Generate scheduled posts from user projects

### 9.5 Skill Gap Agent
- Analyze stored JDs
- Identify frequently required missing skills

### 9.6 Interview Agent
- Generate Q&A from JD content

---

## 10. Data Model
### Tables
**users**: id, name, email, roles, skills, experience

**jobs**: id, title, company, jd_text, embedding, url, created_at

**resumes**: id, user_id, resume_text, embedding, pdf_blob_url

**applications**: id, user_id, job_id, resume_id, status, applied_at

**linkedin_posts**: id, content, scheduled_at, posted

---

## 11. RAG Workflow
1. Embed JD
2. Query similar resume content using pgvector
3. Generate tailored outputs

---

## 12. User Interface (Pages)
- Dashboard
- Jobs Found
- Resumes Generated
- Applications Tracker
- LinkedIn Posts
- Skill Insights
- Settings

---

## 13. Non‑Functional Requirements
- Free‑tier deployable
- Modular microservice design
- Scalable to multi‑user
- Secure authentication
- Sub‑2s vector search response time

---

## 14. Automation
- Daily scheduled job discovery
- Resume generation for top matches
- Application logging
- LinkedIn post suggestion

---

## 15. KPIs / Success Metrics
- Applications generated per day
- Resume generation time
- User time saved
- Interview conversion rate

---

## 16. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Website scraping blocks | Use Playwright stealth and retries |
| LLM cost | Use free OpenRouter models |
| Data growth | Use Neon scalable storage |

---

## 17. Definition of Done (MVP)
A user can sign in, set preferences, view scraped jobs, generate a tailored resume, track an application, and receive a LinkedIn post suggestion.

---

## 18. Future Roadmap
- Chrome extension
- ATS score checker
- Portfolio recommender
- Email notifications
- Multi‑user SaaS onboarding

