import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import AppError from '../errors/AppError.js'

export function generateAccessToken(user) {
    return jwt.sign(
        {
            id : user.id
        },
        config.jwt.secret,
        {
            expiresIn: config.jwt.expiresIn
        }
    );
}

export function verifyAccessToken(token) {
    try{
        return jwt.verify(token, config.jwt.secret);
    }
    catch{
        throw new AppError("Invalid or expired token", 401);
    }
}