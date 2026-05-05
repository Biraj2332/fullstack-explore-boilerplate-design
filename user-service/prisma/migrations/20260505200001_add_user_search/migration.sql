-- Add trigram index for fuzzy name/email search in user-service
-- pg_trgm allows ILIKE to use an index efficiently

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "users_name_trgm_idx"  ON "users" USING GIN ("name"  gin_trgm_ops);
CREATE INDEX "users_email_trgm_idx" ON "users" USING GIN ("email" gin_trgm_ops);
