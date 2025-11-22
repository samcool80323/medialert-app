"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(error, req, res, next) {
    console.error('API Error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
    });
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
        error: error.name || 'Error',
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error.details,
        }),
    });
}
