import AppError from '../errors/AppError.js';
import { verifyAccessToken } from '../services/jwt.service.js';
export default function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if(!authHeader) throw new AppError("Authorization token missing", 401);

    const parts = authHeader.split(" ");

    if(parts.length !== 2 || parts[0] !== "Bearer") 
        throw new AppError("Invalid authorization header format", 401);

    const token = parts[1];
    
    const decoded = verifyAccessToken(token);
    req.user = {
        id : decoded.id
    }
    next();
}