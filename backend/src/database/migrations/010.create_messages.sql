CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,

    conversation_id BIGINT NOT NULL,

    role VARCHAR(20) NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_messages_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    CONSTRAINT messages_role_check
        CHECK (role IN ('USER', 'ASSISTANT')),

    CONSTRAINT messages_content_not_empty
        CHECK (LENGTH(TRIM(content)) > 0)
);

CREATE INDEX idx_messages_conversation_id
    ON messages(conversation_id);

CREATE INDEX idx_messages_conversation_created_at
    ON messages(conversation_id, created_at);