# Neon Database Setup Guide

## Step 1: Create Neon Account

1. **Go to**: https://neon.tech
2. **Click**: "Sign up" or "Get Started"
3. **Sign up with**: GitHub (recommended) or Email
4. **Verify** your email if required

## Step 2: Create Database Project

1. **After login**, you'll see the dashboard
2. **Click**: "Create a project" or "New Project"
3. **Configure**:
   - **Project name**: `ai-career-agent` (or any name)
   - **Region**: Choose closest to you
   - **Postgres version**: 16 (latest)
4. **Click**: "Create Project"

## Step 3: Get Connection String

1. **In your project dashboard**, find "Connection Details"
2. **Copy the connection string** - it looks like:
   ```
   postgresql://username:password@ep-xxxx.region.neon.tech/neondb?sslmode=require
   ```
3. **Save this** - you'll need it for environment variables

## Step 4: Enable pgvector Extension

**Option A: Via Neon Console (SQL Editor)**
1. Go to "SQL Editor" tab in Neon dashboard
2. Run this command:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

**Option B: Via Command Line (after schema upload)**
The schema.sql file already includes this command, so it will be created when you run the schema.

## Step 5: Run Database Schema

**Method 1: Using Neon SQL Editor (Easiest)**
1. In Neon dashboard, go to "SQL Editor"
2. Copy the entire contents of `d:/project/AI_Career_Agent/schema.sql`
3. Paste into the SQL Editor
4. Click "Run" or press Ctrl+Enter
5. Verify: You should see success messages for all CREATE TABLE commands

**Method 2: Using psql Command Line**
```bash
# Install psql first if you don't have it
# Windows: Download from https://www.postgresql.org/download/windows/

# Run the schema
psql "postgresql://username:password@ep-xxxx.region.neon.tech/neondb?sslmode=require" -f schema.sql
```

**Method 3: Using TablePlus/DBeaver/pgAdmin (GUI)**
1. Install TablePlus (https://tableplus.com/) or DBeaver
2. Create new PostgreSQL connection with your Neon connection string
3. Open `schema.sql` file
4. Execute the SQL

## Step 6: Verify Tables Created

Run this query to check:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see:
- jobs
- resume_chunks
- resumes
- applications
- linkedin_posts
- user_settings
- artifacts
- skill_gaps
- interview_questions

## Step 7: Update Environment Variables

**Frontend** (`frontend/.env.local`):
```env
DATABASE_URL=postgresql://your-connection-string-here
NEXTAUTH_SECRET=run-this-command-to-generate
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_AGENT_SERVICE_URL=http://localhost:8000
```

**Agent Service** (`agent-service/.env`):
```env
DATABASE_URL=postgresql://your-connection-string-here
OPENROUTER_API_KEY=get-from-openrouter
ALLOWED_ORIGINS=http://localhost:3000
```

**Generate NEXTAUTH_SECRET**:
```bash
# On Windows PowerShell:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or online: https://generate-secret.vercel.app/32
```

## Troubleshooting

**Error: "extension vector does not exist"**
- Run: `CREATE EXTENSION vector;` in SQL Editor first

**Error: "permission denied"**
- You need owner/admin rights on the database

**Error: "connection refused"**
- Check your connection string is correct
- Verify region matches your project region

## Next Steps

After database setup, you'll need:
1. ✅ DATABASE_URL configured
2. ⏳ OpenRouter API key (next section)
3. ⏳ OAuth credentials (optional)
