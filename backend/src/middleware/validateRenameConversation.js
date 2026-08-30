import AppError from "../errors/AppError.js";

export default function validateRenameConversation(req, res, next) {
    const { title } = req.body;

    if (typeof title !== "string" || title.trim().length === 0) {
        throw new AppError("Conversation title is required", 400);
    }

    if (title.trim().length > 200) {
        throw new AppError(
            "Conversation title cannot exceed 200 characters",
            400
        );
    }

    next();
}