-- Fix missing columns in jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_range TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type TEXT;

-- Expand artifacts table
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS mission_id TEXT;
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Ensure mission_id indexes for performance
CREATE INDEX IF NOT EXISTS idx_artifacts_mission_id ON artifacts(mission_id);
