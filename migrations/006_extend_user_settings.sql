-- Migration 006: Extend User Settings Table
-- Adds target_locations and knowledge_base columns to user_settings

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS target_locations TEXT[],
ADD COLUMN IF NOT EXISTS knowledge_base JSONB;
