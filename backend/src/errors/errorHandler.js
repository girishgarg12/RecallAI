import AppError from "./AppError.js";

function errorHandler(err, req, res, next) {
    if(err instanceof AppError) {
        res.status(err.statusCode).json({
            message : err.message
        })
    }
    res.status(500).json({
        message : "Internal Server Error"
    })
}

export default errorHandler;