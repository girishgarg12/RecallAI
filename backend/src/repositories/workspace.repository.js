import pool from '../database/connection.js';

export async function createWorkspace({ name, description, visibility, ownerId }) {
    const query = `
    INSERT INTO workspaces (name, description, visibility, owner_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `;
    const values = [name, description, visibility, ownerId];
    const result = await pool.query(query, values);
    return result.rows[0];
}

export async function getOwnedWorkspaces(ownerId) {
    const query = `
    SELECT 
        id,
        name,
        description,
        visibility,
        owner_id
    FROM workspaces
    WHERE owner_id = $1
    `;

    const values = [ownerId];
    const result = await pool.query(query, values);
    return result.rows;
}

