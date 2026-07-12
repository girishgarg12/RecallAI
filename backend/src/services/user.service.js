import * as userRepository from '../repositories/user.repository.js';

export async function createUser(name, age) {
    const user = {
        name,
        age
    }
    const savedUser = await userRepository.saveUser(user);
    return savedUser;
}

export function getUsers(){
    return userRepository.getAllUsers();
}

export function getUserById(id){
    return userRepository.getUserById(id);
}

export function updateUser(id , name , age){
    return userRepository.updateUser(id, name, age);
    
}


export function patchUser(id , name , age){
    return userRepository.patchUser(id, name, age);
    
}

export function deleteUser(id){ 
    return userRepository.deleteUser(id);
}