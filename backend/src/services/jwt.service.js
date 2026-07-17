import jwt from 'jsonwebtoken';
import config from '../config/index.js';

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