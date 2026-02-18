-- Fix the users table column names to match NextAuth adapter expectations
ALTER TABLE users 
  RENAME COLUMN email_verified TO "emailVerified";

ALTER TABLE users
  RENAME COLUMN created_at TO "createdAt";

ALTER TABLE users
  RENAME COLUMN updated_at TO "updatedAt";
