-- Fix users table to allow NextAuth adapter to generate IDs
ALTER TABLE users 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
