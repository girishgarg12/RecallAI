import AppError from '../errors/AppError.js';
import { verifyAccessToken } from '../services/jwt.service.js';
import * as userService from '../services/user.service.js';
export default async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if(!authHeader) throw new AppError("Authorization token missing", 401);

    const parts = authHeader.split(" ");

    if(parts.length !== 2 || parts[0] !== "Bearer") 
        throw new AppError("Invalid authorization header format", 401);

    const token = parts[1];
    
    const decoded = verifyAccessToken(token);
    
    const user = await userService.getAuthenticatedUser(decoded.id);
    req.user = {
        id : user.id,
        name : user.name,
        email : user.email,
        role : user.role
    }
    next();
}