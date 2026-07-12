import * as userRepository from '../repositories/user.repository.js';
export function createUser(name, age) {
    const user = userRepository.createUser(name, age);
    userRepository.saveUser(user);
    return user;
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