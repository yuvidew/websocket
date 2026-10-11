import { NextFunction, Request, Response } from "express";

// Global error handler: logs the error and sends a JSON response with its status and message.
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.log(err);

    const status = err.status || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
}