CREATE TABLE document_chunks (
    id BIGSERIAL PRIMARY KEY,

    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

    chunk_index INTEGER NOT NULL,

    content TEXT NOT NULL,

    embedding VECTOR(384) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(document_id, chunk_index)
);