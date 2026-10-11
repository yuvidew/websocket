import { Router } from "express";
import { createCommentaryController, getListCommentaries } from "../controllers/commentary.controller";
import { validate } from "../middleware/validate.middleware";
import { createCommentarySchema } from "../validation/commentary";

// mergeParams so :id from "/matches/:id/commentary" is visible in req.params
export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get("/", getListCommentaries);

commentaryRouter.post("/",
    validate(createCommentarySchema),
    createCommentaryController
);
