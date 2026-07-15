import * as authService from '../services/auth.service.js';

export async function registerUser(req, res) {
    const { name, email, password } = req.body;
    const savedUser = await authService.registerUser(name, email, password);
    const { password_hash, ...user } = savedUser;
    return res.status(201).json(user);
}