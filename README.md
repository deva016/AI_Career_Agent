# AI Career Agent

Full-stack SaaS application that automates job searching, resume tailoring, and application tracking using AI agents with human-in-the-loop oversight.

## 🎯 MVP Features (Phase 1)

- ✅ **Job Scraping**: LinkedIn for discovery, company ATS pages for application
- ✅ **Resume Tailoring**: RAG-based resume generation with typed chunk retrieval
- ✅ **HITL Review**: Side-by-side diff view with approve/regenerate/edit
- ✅ **Auto-Application**: Automated form filling for Greenhouse, Lever, Workday
- ✅ **Application Tracking**: Status management, notes, resume versions

## 🏗️ Architecture

```
Next.js (Vercel)
     ↓ API
Python Agent Service (Render.com)
     ↓
Neon PostgreSQL (pgvector + blob)
     ↓
Playwright Worker
     ↓
OpenRouter (LLM)
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Python, FastAPI, LangChain, LangGraph
- **Database**: Neon Postgres with pgvector
- **AI**: OpenRouter (free models)
- **Automation**: Playwright
- **Auth**: NextAuth
- **Hosting**: Vercel (frontend) + Render.com (agent service) - 100% Free Tier!
- **Scheduling**: GitHub Actions

## 📦 Project Structure

```
AI_Career_Agent/
├── frontend/                 # Next.js application
│   ├── app/                  # App router pages
│   │   ├── (dashboard)/      # Dashboard layout
│   │   ├── api/              # API routes
│   │   └── auth/             # Auth pages
│   ├── components/           # React components
│   └── lib/                  # Utilities
│
├── agent-service/            # Python microservice
│   ├── app/                  # FastAPI app
│   ├── agents/               # LangGraph workflows
│   ├── scrapers/             # Job scraping
│   ├── rag/                  # Embedding & retrieval
│   ├── ats/                  # ATS automation
│   └── utils/                # Shared utilities
│
├── schema.sql                # Database schema
└── .github/workflows/        # Scheduled jobs

```

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20.9.0
- Python ≥ 3.10
- Neon Postgres account
- OpenRouter API key
- Google/LinkedIn OAuth credentials

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Agent Service Setup

```bash
cd agent-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Database Setup

1. Create Neon Postgres database
2. Enable pgvector extension
3. Run schema:
   ```bash
   psql -h [neon-host] -d [database] -f schema.sql
   ```

## 📚 Documentation

- [Implementation Plan](C:\Users\Deveshwar.B\.gemini\antigravity\brain\6041f7b4-80c7-4d4d-ad3b-93e7e17fa6da\implementation_plan.md)
- [Product Requirements Document](ai_career_agent_product_requirements_document_prd.md)
- [Tech Stack Document](ai_career_agent_tech_stack_document.md)
- [UI/UX Design - HITL Command Center](ai_career_agent_ui_ux_design_document_hitl_command_center.md)
- [Free Tier Analysis](C:\Users\Deveshwar.B\.gemini\antigravity\brain\6041f7b4-80c7-4d4d-ad3b-93e7e17fa6da\free_tier_analysis.md)

## 🎨 Dashboard Views

1. **Mission Log** - Live agent timeline
2. **Jobs Found** - Scraped jobs with match scores
3. **Resume Workbench** - Tailored resume versions with diff view
4. **Applications Tracker** - Status tracking (Applied, OA, Interview, Rejected, Offer)
5. **Settings** - KB configuration, target roles, model mode

## 🔄 Agent Workflow (MVP)

```
Daily Scrape → Job Match Score → Resume Tailor → HITL Review → Apply → Log
```

## 🆓 Free Tier Limits

- **Vercel**: 100 GB bandwidth
- **Render.com**: 750 hrs/month (cold starts after 15 min)
- **Neon**: 512 MB storage (~40-50 resumes)
- **OpenRouter**: 10-15 applications/day on free models
- **GitHub Actions**: 2000 minutes/month

## 📝 License

MIT

## 👤 Author

Built with ❤️ by [Your Name]
