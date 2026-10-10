import { Router } from "express";
import { createMatchSchema } from "../validation/matches";
import { validate } from "../middleware/validate.middleware";
import { createMatcheController, getMatchesController } from "../controllers/matches.controller";

export const matchRouter = Router();

matchRouter.get("/", 
    getMatchesController
);


matchRouter.post("/", 
    validate(createMatchSchema),
    createMatcheController
)