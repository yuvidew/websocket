import { NextFunction, Request, Response } from "express";
import * as commentaryService from "../services/commentary.service";
import { listCommentaryQuerySchema } from "../validation/commentary";
import { matchIdParamSchema } from "../validation/matches";

// Get list of commentries of a matche, newest first
export const getListCommentaries = async (req: Request, res: Response, next: NextFunction)=> {
    try {
        const params = matchIdParamSchema.safeParse(req.params);

        if (!params.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: params.error.flatten().fieldErrors,
            });
        }

        const query = listCommentaryQuerySchema.safeParse(req.query);

        if (!query.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: query.error.flatten().fieldErrors,
            });
        }

        const result = await commentaryService.getCommentaries(params.data.id, query.data);

        return res.status(200).json({
            result
        });
    } catch (error) {
        next(error)
    }
}

// create commentary for a matche (body is already validated by the validate middleware)
export const createCommentaryController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = matchIdParamSchema.safeParse(req.params);

        if (!params.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: params.error.flatten().fieldErrors,
            });
        }

        const result = await commentaryService.createCommentary(params.data.id, req.body);

        if (res.app.locals.broadcastCommemtary) {
            res.app.locals.broadcastCommemtary(result.matchId, result);
        }

        return res.status(201).json({
            result
        });
    } catch (error) {
        next(error);
    }
}
