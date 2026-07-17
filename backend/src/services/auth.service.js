import * as userRepository from '../repositories/user.repository.js';
import AppError from '../errors/AppError.js';
import bcrypt from 'bcrypt';
import { generateAccessToken } from './jwt.service.js';

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
    
    return { user, accessToken };
}