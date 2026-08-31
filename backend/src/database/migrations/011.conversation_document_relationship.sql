-- Remove existing development/test documents.
-- document_chunks will be removed automatically because
-- document_chunks.document_id has ON DELETE CASCADE.
DELETE FROM documents;


-- Associate every document with the conversation
-- in which it was uploaded.
ALTER TABLE documents
ADD COLUMN conversation_id BIGINT NOT NULL;


ALTER TABLE documents
ADD CONSTRAINT fk_documents_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES conversations(id)
    ON DELETE CASCADE;


CREATE INDEX idx_documents_conversation_id
    ON documents(conversation_id);


-- Track the source currently being discussed
-- in each conversation.
ALTER TABLE conversations
ADD COLUMN active_source_id INTEGER;


ALTER TABLE conversations
ADD CONSTRAINT fk_conversations_active_source
    FOREIGN KEY (active_source_id)
    REFERENCES documents(id)
    ON DELETE SET NULL;