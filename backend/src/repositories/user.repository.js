import pool from "../database/connection.js";


export async function saveUser(user) {
    const query = `
        INSERT INTO users (name, age)
        VALUES ($1, $2)
        RETURNING *;
    `;
    const values = [user.name, user.age];
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

export function patchUser(id , name , age){
    const user = users.find(u => u.id === Number(id));
    if(user){
        if(name !== undefined){
            user.name = name;
        }
        if(age !== undefined){
            user.age = age;
        }
        return user;
    }
    else{
        return null;
    }
}

export function deleteUser(id) {
    const userIndex = users.findIndex(u => u.id === Number(id));
    if (userIndex !== -1) {
        users.splice(userIndex, 1);
        return true;
    }
    return null;
}