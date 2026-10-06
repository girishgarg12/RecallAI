import AppError from "../errors/AppError.js";

export default function validateAddRepositorySource(req, res, next) {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
        throw new AppError("GitHub repository URL is required", 400);
    }

    next();
}
