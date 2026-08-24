import * as refreshTokenRepository from '../repositories/refreshTokens.repository.js';
import crypto from 'crypto';

export async function createRefreshToken({
    userId,
    expiresAt
}) {
    const token = generateRefreshToken();
    const tokenHash = hashRefreshToken(token);
    await refreshTokenRepository.createRefreshToken({
        userId,
        tokenHash,
        expiresAt
    });
    return token;
}

export async function findByTokenHash(tokenHash) {
    return await refreshTokenRepository.findByTokenHash(tokenHash);
}

export async function revokeRefreshToken(tokenHash) {
    return await refreshTokenRepository.revokeRefreshToken(tokenHash);
}

export function generateRefreshToken() {
    const token = crypto.randomBytes(64).toString("hex");
    return token;
}

export function hashRefreshToken(token) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}