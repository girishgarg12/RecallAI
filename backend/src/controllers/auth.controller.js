import * as authService from '../services/auth.service.js';
import config from '../config/index.js';

export async function registerUser(req, res) {
    return res.status(201).json(userWithoutPassword);
}

export async function loginUser(req, res) {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginUser(email, password);
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: config.env === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return res.status(200).json({
        user : {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        accessToken
    });
}

export async function refreshAccessToken(req, res) {
    const { refreshToken } = req.cookies;
    const result = await authService.refreshAccessToken(refreshToken);

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.env === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
        accessToken: result.accessToken
    });
}