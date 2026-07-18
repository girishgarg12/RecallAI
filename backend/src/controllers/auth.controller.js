import * as authService from '../services/auth.service.js';

export async function registerUser(req, res) {
    const { name, email, password } = req.body;
    const user = await authService.registerUser(name, email, password);
    const { password_hash, ...userWithoutPassword } = user;
    return res.status(201).json(userWithoutPassword);
}

export async function loginUser(req, res) {
    const { email, password } = req.body;
    const { user, accessToken } = await authService.loginUser(email, password);
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