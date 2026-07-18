import AppError from '../errors/AppError.js';

export function ensureOwnerOrAdmin(authenticatedUser, ownerId) {
    if(authenticatedUser.id !== Number(ownerId) && authenticatedUser.role !== "ADMIN"){
        throw new AppError("Forbidden", 403);
    }
}