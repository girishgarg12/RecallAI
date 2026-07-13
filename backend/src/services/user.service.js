import * as userRepository from '../repositories/user.repository.js';
import AppError from '../errors/AppError.js';

export async function createUser(name, age) {
    const user = {
        name,
        age
    }
    const savedUser = await userRepository.saveUser(user);
    return savedUser;
}

export async function getUsers(){
    return await userRepository.getAllUsers();
}

export async function getUserById(id){
    const user = await userRepository.getUserById(id);
    if(!user){
        throw new AppError("User Not found", 404);
    }
    return user;
}

export async function updateUser(id , name , age){
    const user = await userRepository.updateUser(id, name, age);
    if(!user) {
        throw new AppError("User Not found", 404);
    }
    return user;
}


export async function patchUser(id , updates){
    const user = await userRepository.patchUser(id, updates);
    if(!user) {
        throw new AppError("User Not found", 404);
    }
    return user;
}

export async function deleteUser(id){ 
    const user = await userRepository.deleteUser(id);
    if(!user) {
        throw new AppError("User Not found", 404);
    }
    return user;
}