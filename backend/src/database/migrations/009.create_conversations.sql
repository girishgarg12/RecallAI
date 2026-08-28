CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,

    knowledge_base_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    title TEXT NOT NULL DEFAULT 'New Conversation',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_conversations_knowledge_base
        FOREIGN KEY (knowledge_base_id)
        REFERENCES knowledge_bases(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_conversations_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_conversations_knowledge_base_id
    ON conversations(knowledge_base_id);

CREATE INDEX idx_conversations_user_id
    ON conversations(user_id);

CREATE INDEX idx_conversations_updated_at
    ON conversations(updated_at DESC);