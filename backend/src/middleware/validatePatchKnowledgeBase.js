import AppError from "../errors/AppError.js";

const ALLOWED_FIELDS = ["name", "description"];

export default function validatePatchKnowledgeBase(req, res, next) {
    const updates = Object.keys(req.body);

    if (updates.length === 0)
        throw new AppError("Request body cannot be empty", 400);

    const isValidOperation = updates.every(field =>
        ALLOWED_FIELDS.includes(field)
    );

    if (!isValidOperation)
        throw new AppError("Invalid update fields", 400);

    const { name, description } = req.body;

    if (name !== undefined) {
        if (typeof name !== "string")
            throw new AppError("name must be a string", 400);

        if (name.trim() === "")
            throw new AppError("name cannot be empty", 400);
    }

    if (description !== undefined) {
        if (typeof description !== "string")
            throw new AppError("description must be a string", 400);
    }

    next();
}
