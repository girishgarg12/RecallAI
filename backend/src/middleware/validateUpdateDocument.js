import AppError from "../errors/AppError.js";

export default function validateUpdateDocument(req, res, next) {

    const { name } = req.body;

    if (typeof name !== "string" || name.trim().length === 0) {
        throw new AppError("Document name is required", 400);
    }

    if (name.trim().length > 255) {
        throw new AppError(
            "Document name cannot exceed 255 characters",
            400
        );
    }

    next();
}