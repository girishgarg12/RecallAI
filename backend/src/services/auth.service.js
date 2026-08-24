import * as userRepository from '../repositories/user.repository.js';
import AppError from '../errors/AppError.js';
import bcrypt from 'bcrypt';
import { generateAccessToken } from './jwt.service.js';
import * as refreshTokenService from './refreshToken.service.js';

export async function registerUser(name, email, password) {
    const existingUser = await userRepository.findUserByEmail(email);
    if(existingUser) {
        throw new AppError("User already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const savedUser = await userRepository.saveUser({
        name,
        email,
        password: hashedPassword
    });
    return savedUser;
}

export async function loginUser(email, password) {
    const user = await userRepository.findUserByEmail(email);
    if(!user) throw new AppError("Invalid email or password", 401);

    const isValid = await bcrypt.compare(password, user.password_hash);
    if(!isValid) throw new AppError("Invalid email or password", 401);

    const accessToken = generateAccessToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshToken = await refreshTokenService.createRefreshToken({
        userId : user.id,
        expiresAt
    });
    
    return { user, accessToken, refreshToken };
}

export async function logout(refreshToken) {
    if(!refreshToken) {
        return;
    }
    const tokenHash = refreshTokenService.hashRefreshToken(refreshToken);
    await refreshTokenService.revokeRefreshToken(tokenHash);
}

export async function refreshAccessToken(refreshToken) {
    if(!refreshToken) {
        throw new AppError("Refresh token is required", 401);
    }

    const tokenHash = await refreshTokenService.hashRefreshToken(refreshToken);
    const storedToken = await refreshTokenService.findByTokenHash(tokenHash);

    if(!storedToken){
        throw new AppError("Invalid Refresh token", 401);
    }
    if(storedToken.revoked_at){
        throw new AppError("Refresh token has been revoked", 401);
    }
    if(new Date(storedToken.expires_at) <= new Date()){
        throw new AppError("Refresh token expired", 401);
    }

    await refreshTokenService.revokeRefreshToken(tokenHash);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newRefreshToken = await refreshTokenService.createRefreshToken({
        userId : storedToken.user_id,
        expiresAt
    });

    const accessToken = generateAccessToken({
        id : storedToken.user_id
    });

    return {
        accessToken,
        refreshToken : newRefreshToken
    };
}