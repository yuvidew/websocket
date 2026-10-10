import { NextFunction, Request, Response } from "express";
import * as matchesService from "../services/matches.service";
import { toId } from "../utils/lib";


// create matche controller
export const createMatcheController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await matchesService.createMatche(req.body);

        if(res.app.locals.broadcastMatchCreated){
            res.app.locals.broadcastMatchCreated(result);
        }

        return res.status(201).json({
            result
        });
    } catch (error) {
        next(error);
    }
}

export const getMatchesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await matchesService.getMathes({
            limit : toId(req.query.limit)
        });

        return res.status(200).json({
            result
        });
    } catch (error) {
        next(error);
    }
}