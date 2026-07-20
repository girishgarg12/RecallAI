import AppError from '../errors/AppError.js';

export function ensureOwnerOrAdmin(authenticatedUser, ownerUserId) {
    if(authenticatedUser.id !== Number(ownerUserId) && authenticatedUser.role !== "ADMIN"){
        throw new AppError("Forbidden", 403);
    }
}

export function ensureRole(authenticatedUser, allowedRoles) {
    if(!allowedRoles.includes(authenticatedUser.role)){
        throw new AppError("Forbidden", 403);
    }
}