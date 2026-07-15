import * as userRepository from '../repositories/user.repository.js';
import AppError from '../errors/AppError.js';
import bcrypt from 'bcrypt';

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