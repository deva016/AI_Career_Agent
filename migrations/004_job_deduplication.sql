
-- Fix missing URL column if it doesn't exist (safety check)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS url TEXT;

-- Now add the constraint
ALTER TABLE jobs 
DROP CONSTRAINT IF EXISTS unique_user_job_url;

ALTER TABLE jobs 
ADD CONSTRAINT unique_user_job_url UNIQUE (user_id, url);
