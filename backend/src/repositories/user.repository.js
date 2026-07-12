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

export function getAllUsers() {
    return users;
}

export function getUserById(id) {
    const user = users.find(u => u.id === Number(id));
    if (user) {
        return user;
    }
    return null;
}
export function updateUser(id, name, age) {
    const user = users.find(u => u.id === Number(id));
    if (user) {
        user.name = name;
        user.age = age;
        return user;
    }
    return null;
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