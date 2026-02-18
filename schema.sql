-- AI Career Agent - Database Schema
-- Enable pgvector extension for vector similarity search

CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (NextAuth)
-- This must be created first as other tables reference it
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- NextAuth generates text IDs
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- NextAuth.js required tables
-- Account table for OAuth providers
CREATE TABLE accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

-- Session table for active sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

-- Verification tokens for email verification
CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);


-- Jobs table (scraped jobs with embeddings)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  job_url TEXT NOT NULL UNIQUE,
  description TEXT,
  embedding VECTOR(1536), -- OpenAI ada-002 embedding
  source TEXT, -- 'linkedin', 'company_career_page'
  ats_platform TEXT, -- 'greenhouse', 'lever', 'workday', 'ashby', 'bamboohr', 'smartrecruiters', 'icims'
  scraped_at TIMESTAMP DEFAULT NOW(),
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resume chunks (typed for RAG)
CREATE TABLE resume_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id UUID, -- NULL for base resume
  chunk_type TEXT NOT NULL, -- 'skill', 'experience_bullet', 'project_summary', 'tool_mapping', 'domain', 'metric', 'education'
  content TEXT NOT NULL,
  metadata JSONB, -- {tool: 'Python', metric: '82%', domain: 'sports_analytics', company: 'XYZ Corp', role: 'Data Analyst'}
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resumes (tailored versions)
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  title TEXT, -- 'Base Resume', 'Resume for Data Analyst at XYZ'
  pdf_url TEXT, -- Neon Blob URL
  format TEXT DEFAULT 'ats_friendly', -- 'modern', 'ats_friendly', 'minimal'
 created_at TIMESTAMP DEFAULT NOW()
);

-- Applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  resume_id UUID REFERENCES resumes(id),
  status TEXT DEFAULT 'applied', -- 'applied', 'oa', 'interview', 'rejected', 'offer'
  cover_letter_url TEXT,
  applied_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- LinkedIn posts
CREATE TABLE linkedin_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  trigger TEXT, -- 'scheduled', 'event_applications', 'event_project', 'manual'
  status TEXT DEFAULT 'draft', -- 'draft', 'published'
  scheduled_for TIMESTAMP,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User settings and Knowledge Base
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  target_roles TEXT[], -- ['Data Analyst', 'Data Scientist']
  skills TEXT[], -- Current skills from resume
  experience TEXT, -- Years and description
  salary_expectation TEXT,
  notice_period TEXT,
  portfolio_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  work_authorization TEXT,
  willing_to_relocate BOOLEAN,
  model_mode TEXT DEFAULT 'free', -- 'free', 'paid'
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Artifacts (all generated files)
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT, -- 'resume_pdf', 'cover_letter', 'screenshot'
  file_url TEXT NOT NULL,
  related_job_id UUID REFERENCES jobs(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Skill gap analysis (Skill Gap Analysis Agent output) - Phase 2
CREATE TABLE skill_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  frequency_in_jds INT DEFAULT 0, -- How many JDs require this skill
  user_has_skill BOOLEAN DEFAULT FALSE,
  proficiency_level TEXT, -- 'none', 'beginner', 'intermediate', 'expert'
  recommendation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Interview preparation (Interview Preparation Agent output) - Phase 2
CREATE TABLE interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  question_type TEXT, -- 'technical', 'behavioral', 'company_research'
  question TEXT NOT NULL,
  suggested_answer TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_user_embedding ON jobs USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_resume_chunks_user_embedding ON resume_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_applications_user_status ON applications(user_id, status);
CREATE INDEX idx_skill_gaps_user_id ON skill_gaps(user_id);
CREATE INDEX idx_interview_questions_job_id ON interview_questions(job_id);

-- Add cleanup trigger for old resumes (keep last 15 per user)
CREATE OR REPLACE FUNCTION cleanup_old_resumes()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM resumes
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM resumes
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 15
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_old_resumes
AFTER INSERT ON resumes
FOR EACH ROW
EXECUTE FUNCTION cleanup_old_resumes();
