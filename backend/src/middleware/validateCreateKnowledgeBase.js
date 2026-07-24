import AppError from "../errors/AppError.js";

export default function validateCreateKnowledgeBase(req, res, next) {
    const { name, description, workspaceId } = req.body;

    const allowedFields = [
        "name",
        "description",
        "workspaceId"
    ];

    const receivedFields = Object.keys(req.body);

    const invalidFields = receivedFields.filter(
        field => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
        throw new AppError(
            `Invalid field(s): ${invalidFields.join(", ")}`,
            400
        );
    }

    
    if (name === undefined) {
        throw new AppError("Knowledge Base name is required", 400);
    }

    if (typeof name !== "string") {
        throw new AppError("Knowledge Base name must be a string", 400);
    }

    if (name.trim() === "") {
        throw new AppError("Knowledge Base name cannot be empty", 400);
    }


    if (description !== undefined) {
        if (typeof description !== "string") {
            throw new AppError("Knowledge Base description must be a string", 400);
        }

        if (description.trim() === "") {
            throw new AppError("Knowledge Base description cannot be empty", 400);
        }
    }


    if (workspaceId === undefined) {
        throw new AppError("Workspace ID is required", 400);
    }

    if (typeof workspaceId !== "number") {
        throw new AppError("Workspace ID must be a number", 400);
    }

    if (!Number.isInteger(workspaceId)) {
        throw new AppError("Workspace ID must be an integer", 400);
    }

    if (workspaceId <= 0) {
        throw new AppError("Workspace ID must be a positive integer", 400);
    }

    next();
}