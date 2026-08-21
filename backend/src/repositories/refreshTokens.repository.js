import pool from "../database/connection.js";

export async function createRefreshToken({
    userId,
    tokenHash,
    expiresAt
}) {
    const query = `
    INSERT into refresh_tokens
        (user_id, token_hash, expires_at)
    VALUES
        ($1, $2, $3)
    RETURNING id, user_id, created_at, expires_at
    `;
    const values = [userId, tokenHash, expiresAt];
    const result = await pool.query(query, values);
    return result.rows[0];
}

export async function findByTokenHash(tokenHash) {
    const query = `
    SELECT * FROM refresh_tokens
    WHERE token_hash = $1
    `;
    const values = [tokenHash];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
}

export async function revokeRefreshToken(tokenHash) {
    const query = `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE token_hash = $1
        AND revoked_at id NULL
    RETURNING *
    `;
    const values = [tokenHash];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
}