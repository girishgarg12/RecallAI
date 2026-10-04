-- Migration 012: URL Source Support
-- Extends the documents table to support URL sources alongside FILE sources.
-- All existing documents are assigned source_type = 'FILE'.
-- NOT NULL constraints on file-specific columns are relaxed so URL records
-- can be stored without a physical file.

BEGIN;

-- 1. Add source_type discriminator column. Existing rows default to 'FILE'.
ALTER TABLE documents
    ADD COLUMN source_type TEXT NOT NULL DEFAULT 'FILE';

-- 2. Add source_url column for URL sources (NULL for FILE sources).
ALTER TABLE documents
    ADD COLUMN source_url TEXT;

-- 3. Relax NOT NULL constraints on file-only columns so URL records can be
--    inserted without a physical file path or MIME type.
ALTER TABLE documents ALTER COLUMN original_filename DROP NOT NULL;
ALTER TABLE documents ALTER COLUMN storage_key DROP NOT NULL;
ALTER TABLE documents ALTER COLUMN mime_type DROP NOT NULL;
ALTER TABLE documents ALTER COLUMN file_size DROP NOT NULL;

-- 4. Also drop the UNIQUE constraint on storage_key so NULL values (URL
--    records without a storage key) do not collide.
ALTER TABLE documents DROP CONSTRAINT documents_stored_filename_key;

-- 5. Re-add uniqueness only for non-NULL storage_key values (file sources).
CREATE UNIQUE INDEX uq_documents_storage_key
    ON documents (storage_key)
    WHERE storage_key IS NOT NULL;

-- 6. URL records must have source_url; FILE records must not.
ALTER TABLE documents
    ADD CONSTRAINT chk_url_source_has_url
    CHECK (
        (source_type = 'FILE' AND source_url IS NULL) OR
        (source_type = 'URL'  AND source_url IS NOT NULL)
    );

-- 7. Prevent duplicate URLs within the same knowledge base.
CREATE UNIQUE INDEX uq_kb_source_url
    ON documents (knowledge_base_id, source_url)
    WHERE source_url IS NOT NULL;

COMMIT;
