-- Add GIN index for full-text search on tweet content
-- to_tsvector('english', content) enables efficient keyword search

CREATE INDEX "tweets_content_fts_idx"
  ON "tweets" USING GIN (to_tsvector('english', "content"));
