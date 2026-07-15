import pool from "../database/connection.js";


export async function saveUser(user) {
    const query = `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const values = [user.name, user.email, user.password];
    const result = await pool.query(query, values);
    return result.rows[0];
}

export async function getAllUsers() {
    const query = `
        SELECT * FROM users;
        `;
    const result = await pool.query(query);
    return result.rows;
}

export async function getUserById(id) {
    const query = `
    SELECT * FROM users
    WHERE id = $1
    `;
    const values = [id];
    const result = await pool.query(query, values);
    if(result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}

export async function updateUser(id, name, age) {
    const query = `
    UPDATE users
    SET name = $1,
        age = $2
    WHERE id = $3
    RETURNING *
    `;
    const values = [name, age, id];
    const result = await pool.query(query, values);
    if(result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}

export async function patchUser(id , updates){
    const setClauses = [];
    const values = [];
    for(const [field, value] of Object.entries(updates)){
        values.push(value);
        setClauses.push(`${field} = $${values.length}`);
    }
    values.push(id);

    const query = `
    UPDATE users
    SET ${setClauses.join(", ")}
    WHERE id = $${values.length}
    Returning *
    `;

    const result = await pool.query(query, values);

    if(result.rows.length === 0) return null;
    return result.rows[0];
}

export async function deleteUser(id) {
    const query = `
    DELETE FROM USERS
    WHERE id = $1
    `;
    const values = [id];
    const result = await pool.query(query, values);

    if(result.rowCount === 0) return null;
    return true;
}

export async function findUserByEmail(email) {
    const query = `
    SELECT * FROM users
    WHERE email = $1
    `;
    const values = [email];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
}