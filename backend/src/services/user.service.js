import * as userRepository from '../repositories/user.repository.js';

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
    return user;
}

export async function updateUser(id , name , age){
    const user = await userRepository.updateUser(id, name, age);
    return user;
}


export function patchUser(id , name , age){
    return userRepository.patchUser(id, name, age);
    
}

export function deleteUser(id){ 
    return userRepository.deleteUser(id);
}