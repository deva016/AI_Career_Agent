-- Optimize mission listing performance
CREATE INDEX IF NOT EXISTS idx_missions_user_id_created_at ON missions(user_id, created_at DESC);
