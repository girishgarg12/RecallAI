import AppError from "../errors/AppError.js";

export default function validateAskQuestion(req, res, next) {
    const { question } = req.body;

    if (question == null) {
        throw new AppError("Question is required", 400);
    }

    if (typeof question !== "string") {
        throw new AppError("Question must be a string", 400);
    }

    if (question.trim().length === 0) {
        throw new AppError("Question cannot be empty", 400);
    }

    next();
}