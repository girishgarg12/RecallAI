import * as userRepository from '../repositories/user.repository.js';
import AppError from '../errors/AppError.js';
import * as authorizationService from './authorization.service.js';

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

export async function updateUser(authenticatedUser, id , name , age){
    authorizationService.ensureOwnerOrAdmin(authenticatedUser, id);

    const user = await userRepository.updateUser(id, name, age);
    if(!user) {
        throw new AppError("User Not found", 404);
    }
    return user;
}


export async function patchUser(authenticatedUser, id , updates){
    authorizationService.ensureOwnerOrAdmin(authenticatedUser, id);

    const user = await userRepository.patchUser(id, updates);
    if(!user) {
        throw new AppError("User Not found", 404);
    }
    return user;
}

export async function deleteUser(authenticatedUser, id){ 
    authorizationService.ensureOwnerOrAdmin(authenticatedUser, id);

    const user = await userRepository.deleteUser(id);
    if(!user) {
        throw new AppError("User Not found", 404);
    }
    return user;
}

export async function getAuthenticatedUser(id) {
    const authenticatedUser = await userRepository.getUserById(id);
    if(!authenticatedUser)
        throw new AppError("Authentication failed", 401);
    return authenticatedUser;
}