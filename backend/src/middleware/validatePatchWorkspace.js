import AppError from '../errors/AppError.js';
import {
    WORKSPACE_VISIBILITY_VALUES
} from '../constants/workspace.constants.js';

export default function validatePatchWorkspace(req, res, next) {
    const updates = Object.keys(req.body);

    if(updates.length === 0)
        return next(new AppError("At least one field must be provided", 400));

    const allowedFields = [
        "name",
        "description",
        "visibility"
    ]

    const isValid = updates.every((field) => 
        allowedFields.includes(field)
    )

    if(!isValid)
        return next(new AppError("Invalid fields provided", 400));

    const {name, description, visibility} = req.body;

    if(name !== undefined) {
        if(typeof name !== "string" || name.trim() === "")
            return next(new AppError("name must be a not empty string", 400));
        req.body.name = name.trim();
    }

    if(description !== undefined) {
        if(typeof description !== "string")
            return next(new AppError("description must be a string",400));
        req.body.description = description.trim();
    }

    if(visibility !== undefined && !WORKSPACE_VISIBILITY_VALUES.includes(visibility))
        return next(new AppError("Invalid visibility value",400));


    next();
}