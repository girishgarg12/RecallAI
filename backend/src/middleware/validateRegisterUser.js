import AppError from "../errors/AppError.js";

export function validateRegisterUser(req, res, next) {
    const { name, email, password } =  req.body;
    if(!("name" in req.body)) throw new AppError("Name is required", 400);
    if(!("email" in req.body)) throw new AppError("Email is required", 400);
    if(!("password" in req.body)) throw new AppError("Password is required", 400);

    if(typeof name !== "string") throw new AppError("Name must be a string", 400);
    if(typeof email !== "string") throw new AppError("Email must be a string", 400);
    if(typeof password !== "string") throw new AppError("Password must be a string", 400);

    if(name.trim() === "") throw new AppError("Name cannot be empty", 400);
    if(email.trim() === "") throw new AppError("Email cannot be empty", 400);
    if(password.trim() === "") throw new AppError("Password cannot be empty", 400);

    next();
}