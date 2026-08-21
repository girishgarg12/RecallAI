import * as refreshTokenRepository from '../repositories/refreshTokens.repository.js';

export async function createRefreshToken({
    userId,
    tokenHash,
    expiresAt
}) {
    return await refreshTokenRepository.createRefreshToken({
        userId,
        tokenHash,
        expiresAt
    });
}

export async function findByTokenHash(tokenHash) {
    return await refreshTokenRepository.findByTokenHash(tokenHash);
}

export async function revokeRefreshToken(tokenHash) {
    return await refreshTokenRepository.revokeRefreshToken(tokenHash);
}