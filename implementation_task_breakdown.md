# AI Career Agent - Implementation Task Breakdown

## Phase 1: Project Setup & Infrastructure ✅ COMPLETE
- [x] Initialize Next.js 15 project with TypeScript and App Router
- [x] Set up Neon Postgres database with pgvector extension (10 tables created and verified)
- [x] Configure environment variables and secrets management (templates created)
- [x] Set up Python microservice with FastAPI (Render.com) - structure and main.py created
- [x] Configure CORS and API communication layer (implemented in main.py)
- [x] Install core dependencies (shadcn/ui, Framer Motion, Recharts, Next-Auth, LangChain, LangGraph)
- [x] Set up NextAuth with Google and LinkedIn OAuth (NextAuth configured, OAuth deferred to Phase 2)
- [x] Create base database schema with multi-tenancy (user_id isolation)
- [x] ✅ **Both services tested and running successfully**

## Phase 2: Database Schema & Models ✅ COMPLETE (Done in Phase 1)
- [x] Create users table with NextAuth integration
- [x] Create jobs table (with pgvector embedding column)
- [x] Create resume_chunks table (typed chunks with embeddings)
- [x] Create resumes table (PDF storage in Neon Blob)
- [x] Create applications table (tracking and status)
- [x] Create linkedin_posts table (drafts and published)
- [x] Create user_settings table (KB answers, target roles, preferences)
- [x] Create artifacts table (PDFs, screenshots, cover letters)
- [x] Create skill_gaps & interview_questions tables
- [x] Add indexes and constraints for performance (6 indexes + cleanup trigger)

## Phase 3: Authentication & User Management ✅ COMPLETE
- [x] Configure NextAuth providers (Google OAuth with PostgreSQL adapter)
- [x] Create authentication API routes (NextAuth API, middleware)
- [x] Build login/signup UI components (glassmorphism design)
- [x] Implement session management (database sessions)
- [x] Add user profile management (dashboard with user info)
- [x] Create settings page for user preferences
- [x] Run database migration (accounts, sessions, verification_tokens tables)

## Phase 4: Python AI Agent Service (6 Agents with LangGraph)
- [x] Set up FastAPI application structure
- [x] Configure OpenRouter LLM client
- [x] Design LangGraph orchestration system
- [x] Implement **Job Finder Agent** (job scraping and storage)
- [x] Implement **Resume & Cover Letter Agent** (RAG-based generation)
  - [x] Match node (vector search)
  - [x] Tailor node (content generation)
  - [x] HITL review gate
- [x] Implement **Application Automation Agent** (Playwright automation)
- [x] Implement **LinkedIn Content Agent** (headline, posts, scheduling)
- [x] Implement **Skill Gap Analysis Agent** (JD analysis, gap detection)
- [x] Implement **Interview Preparation Agent** (Q&A generation, company research)
- [x] Create API endpoints for Next.js communication

## Phase 5: Job Scraping System
- [ ] Build LinkedIn job scraper (Playwright)
- [ ] Build company career page scraper (generic ATS detection)
- [x] Implement job deduplication logic (DB Unique Constraint added)
- [ ] Create job search criteria parser (keywords, location, experience)
- [ ] Set up embedding pipeline for job descriptions
- [ ] Store jobs with embeddings in Neon Postgres
- [ ] Create **GitHub Actions cron workflow** for 24hr scheduled scraping (per tech stack)
- [ ] Add scraping status tracking

## Phase 6: Resume Management & RAG System
- [ ] Build PDF upload component
- [ ] Create manual resume entry form
- [ ] Implement PDF text extraction (PyPDF2/pdfplumber)
- [ ] Design chunk extraction logic (typed chunks)
  - [ ] Skills extraction
  - [ ] Experience bullets (one per chunk)
  - [ ] Project summaries
  - [ ] Tools mapping
  - [ ] Domain tags
  - [ ] Education & certifications
  - [ ] Metrics extraction
- [ ] Create embedding pipeline for resume chunks
- [ ] Implement Typed, Ranked RAG retrieval
  - [ ] Priority ordering (experience > projects > skills)
  - [ ] Top-K per type (4 bullets, 3 projects, 3 skills)
  - [ ] JD keyword boosting
  - [ ] Metric injection
- [ ] Build resume template system (multiple formats)
- [ ] Implement resume PDF generation

## Phase 7: Auto-Application System
- [ ] Implement ATS detection (Greenhouse, Lever, Workday, Ashby, BambooHR, SmartRecruiters, iCIMS)
- [ ] Build Playwright automation for each ATS platform
- [ ] Create Knowledge Base (KB) for custom questions
  - [ ] Skills, years of experience
  - [ ] Salary expectation, notice period
  - [ ] Portfolio/GitHub/LinkedIn links
  - [ ] Work authorization, relocation
- [ ] Implement 3-step question handling
  - [ ] Question classification (type, intent)
  - [ ] KB matching
  - [ ] LLM fallback with RAG
- [ ] Add HITL pause for low-confidence answers
- [ ] Build application logging and tracking

## Phase 8: LinkedIn Post Generation
- [ ] Create scheduled post generation (3x/week cron)
- [ ] Implement event-based triggers
  - [ ] X applications in a day
  - [ ] Project completion/resume update
  - [ ] New skill learned
- [ ] Build manual "Generate Post" feature
- [ ] Design post templates (industry insights, project showcases)
- [ ] Add post preview and editing
- [ ] Store drafts and published posts

## Phase 9: Next.js API Routes
- [ ] Create `/api/jobs` endpoints (list, search, get)
- [ ] Create `/api/resumes` endpoints (upload, list, retrieve chunks)
- [ ] Create `/api/applications` endpoints (list, create, update status)
- [ ] Create `/api/linkedin` endpoints (generate, list, update)
- [ ] Create `/api/agent` proxy endpoints (trigger workflows, get status)
- [ ] Create `/api/artifacts` endpoints (list, download)
- [ ] Create `/api/settings` endpoints (get, update KB)
- [ ] Add API authentication middleware

## Phase 10: Command Center UI - Core Layout
- [ ] Build responsive layout with left sidebar navigation
- [ ] Create KPI strip component (applications, time saved, token usage)
- [ ] Implement dark theme with glassmorphism
- [ ] Add Framer Motion animations for transitions
- [ ] Create mission card component (agent status)
- [ ] Build action chips component (Approve, Regenerate, Edit)

## Phase 11: Dashboard Views (Aligned with PRD)
- [ ] Mission Log (Home) - live agent timeline
- [ ] Jobs Found - new jobs with match scores
- [ ] Resumes Generated (Workbench) - side-by-side diff view
- [ ] Applications Tracker - table/Kanban with status filtering
- [ ] LinkedIn Posts (Studio) - scheduled posts and drafts
- [ ] Skill Insights - **Skill Gap Analysis Agent** output with charts
- [ ] Interview Prep - **Interview Preparation Agent** output
- [ ] Settings - target roles, KB answers, model mode toggle

## Phase 12: HITL Review System
- [ ] Build side-by-side resume diff component
- [ ] Create inline highlights for changed sections
- [ ] Implement reasoning trace viewer ("Show Logic")
- [ ] Add vector similarity visualization
- [ ] Build approval workflow UI
- [ ] Create regeneration with feedback loop

## Phase 13: Artifact Management
- [ ] Implement artifact card component
- [ ] Add preview modals (PDF, images)
- [ ] Build download functionality
- [ ] Create artifact reuse system
- [ ] Add drag-and-drop for organization

## Phase 14: Agent Status & Live Updates
- [ ] Implement WebSocket/Server-Sent Events for live updates
- [ ] Create agent state machine visualization
- [ ] Build progress indicators for long-running tasks
- [ ] Add toast notifications for agent events
- [ ] Create mission timeline component

## Phase 15: Testing & Validation
- [ ] Test job scraping for all sources
- [ ] Validate RAG retrieval quality
- [ ] Test auto-application on ATS platforms
- [ ] Verify resume generation quality
- [ ] Test LinkedIn post generation
- [ ] Validate multi-user data isolation
- [ ] Performance testing (embedding speed, query latency)

## Phase 16: Deployment
- [ ] Deploy Next.js to Vercel
- [ ] Deploy Python agent service to Railway
- [ ] Configure environment variables in production
- [ ] Set up database connection pooling
- [ ] Configure cron jobs in production
- [ ] Set up monitoring and logging
- [ ] Create deployment documentation

## Phase 17: Polish & Documentation
- [ ] Add loading states and error boundaries
- [ ] Implement proper error handling
- [ ] Create user onboarding flow
- [ ] Write API documentation
- [ ] Create README with setup instructions
- [ ] Add code comments and docstrings
- [ ] Create user guide for key features
