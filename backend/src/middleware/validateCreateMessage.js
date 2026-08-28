import AppError from "../errors/AppError.js";

export default function validateCreateMessage(req, res, next) {
    const { content } = req.body;

    if (
        typeof content !== "string" ||
        content.trim().length === 0
    ) {
        throw new AppError(
            "Message content is required",
            400
        );
    }

    next();
}