CREATE TYPE workspace_visibility AS ENUM (
    'PRIVATE',
    'TEAM',
    'PUBLIC'
);

CREATE TABLE workspaces (
    id SERIAL PRIMARY KEY,

    name VARCHAR(255)
        NOT NULL
        CHECK (LENGTH(TRIM(name)) > 0),

    description TEXT
        NOT NULL
        DEFAULT '',

    visibility workspace_visibility
        NOT NULL
        DEFAULT 'PRIVATE',

    owner_id INTEGER NOT NULL,

    FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);