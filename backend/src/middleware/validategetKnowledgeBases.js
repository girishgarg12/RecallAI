import AppError from "../errors/AppError.js";

export default function validategetKnowledgeBases(req, res, next) {
    const { workspaceId } = req.query;

    if(workspaceId === undefined)
        throw new AppError("WorkspaceId is required", 400);

    const id = Number(workspaceId);

    if(Number.isNaN(id))
        throw new AppError("WorkspaceId must be a number", 400);
    if(!Number.isInteger(id))
        throw new AppError("WorkspaceId must be an integer", 400);
    if(id <= 0 )
        throw new AppError("WorkspaceId must be a positive integer", 400);

    next();
}