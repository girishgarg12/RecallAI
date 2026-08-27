ALTER TABLE documents
ADD COLUMN name TEXT;

UPDATE documents
SET name = original_filename
WHERE name IS NULL;

ALTER TABLE documents
ALTER COLUMN name SET NOT NULL;

ALTER TABLE documents
ADD CONSTRAINT documents_name_not_empty
CHECK (LENGTH(TRIM(name)) > 0);