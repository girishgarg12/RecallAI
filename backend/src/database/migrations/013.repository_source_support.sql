-- Migration 013: Repository Source Support
-- Extends the documents table to support REPOSITORY and REPOSITORY_FILE sources.
-- Adds repository metadata columns (provider, repo_owner, repo_name, default_branch, commit_sha, parent_source_id, file_path).
-- Updates constraints and unique indexes to safely support repository ingestion and deduplication.

BEGIN;

-- 1. Add repository and file metadata columns
ALTER TABLE documents
    ADD COLUMN parent_source_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    ADD COLUMN provider TEXT,
    ADD COLUMN repo_owner TEXT,
    ADD COLUMN repo_name TEXT,
    ADD COLUMN default_branch TEXT,
    ADD COLUMN commit_sha TEXT,
    ADD COLUMN file_path TEXT;

-- Index for quickly querying files belonging to a repository parent
CREATE INDEX idx_documents_parent_source_id ON documents(parent_source_id);

-- 2. Drop the old check constraint from 012 which only knew about 'FILE' and 'URL'
ALTER TABLE documents DROP CONSTRAINT chk_url_source_has_url;

-- 3. Add updated constraint to validate source_type and requirements:
--    - FILE: source_type = 'FILE'
--    - URL: source_type = 'URL' and source_url is NOT NULL
--    - REPOSITORY: source_type = 'REPOSITORY' and repo_owner, repo_name are NOT NULL
--    - REPOSITORY_FILE: source_type = 'REPOSITORY_FILE' and parent_source_id, file_path are NOT NULL
ALTER TABLE documents
    ADD CONSTRAINT chk_documents_source_type
    CHECK (
        (source_type = 'FILE' AND source_url IS NULL) OR
        (source_type = 'URL' AND source_url IS NOT NULL) OR
        (source_type = 'REPOSITORY' AND repo_owner IS NOT NULL AND repo_name IS NOT NULL) OR
        (source_type = 'REPOSITORY_FILE' AND parent_source_id IS NOT NULL AND file_path IS NOT NULL)
    );

-- 4. Deduplication: Prevent duplicate repositories (same provider, owner, repo) within the same knowledge base
CREATE UNIQUE INDEX uq_kb_repo_identity
    ON documents (knowledge_base_id, provider, repo_owner, repo_name)
    WHERE source_type = 'REPOSITORY';

COMMIT;
