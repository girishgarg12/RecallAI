import AppError from "../errors/AppError.js";

export default function validateUploadDocument(req, res, next) {
    if(!req.file){
        throw new AppError("Document file is required", 400);
    }
    next();
}