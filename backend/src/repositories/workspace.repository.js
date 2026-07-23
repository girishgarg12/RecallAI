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

export async function findOwnedWorkspaceById(workspaceId, ownerId) {
    const query = `
    SELECT
        id,
        name,
        description,
        visibility,
        owner_id
    FROM workspaces
    WHERE id = $1
    AND owner_id = $2
    `;

    const values = [workspaceId, ownerId];
    const result = await pool.query(query, values);
    return result.rows[0];
}

export async function updateOwnedWorkspace(
    workspaceId,
    ownerId,
    updates
) {
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(updates)) {
        const column = key === "ownerId" ? "owner_id" : key;

        fields.push(`${column} = $${index}`);
        values.push(value);
        index++;
    }

    values.push(workspaceId);
    values.push(ownerId);

    const query = `
        UPDATE workspaces
        SET ${fields.join(", ")}
        WHERE id = $${index}
        AND owner_id = $${index + 1}
        RETURNING
            id,
            name,
            description,
            visibility,
            owner_id;
    `;

    const result = await pool.query(query, values);

    return result.rows[0];
}

export async function deleteOwnedWorkspace(workspaceId, ownerId) {
    const query = `
    DELETE FROM workspaces
    WHERE id = $1
    AND owner_id = $2
    RETURNING id
    `;

    const values = [workspaceId, ownerId];
    const result = await pool.query(query, values);
    return result.rows[0];
}