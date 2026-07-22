import AppError from "../errors/AppError.js";
import { WORKSPACE_VISIBILITY_VALUES } from "../constants/workspace.constants.js";

export default function validateCreateWorkspace(req, res, next) {
    const { name, description, visibility } = req.body;

    if(typeof name !== "string") {
        throw new AppError("Workspace name is required", 400);
    }
    if(name.trim().length === 0){
        throw new AppError("Workspace name cannot be empty", 400);
    }
    if(name.length > 255){
        throw new AppError("Workspace name cannot exceed 255 chahcters", 400);
    }

    if(description !== undefined && typeof description !== "string"){
        throw new AppError("Workspace description must be a string", 400);
    }

    if(visibility !== undefined && !WORKSPACE_VISIBILITY_VALUES.includes(visibility)){
        throw new AppError(`Workspace visibility must be one of ${WORKSPACE_VISIBILITY_VALUES.join(', ')}`, 400);
    }

    next();
}