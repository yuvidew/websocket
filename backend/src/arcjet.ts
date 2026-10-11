import { NextFunction, Request, Response } from "express";
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey) throw new Error(`ARCJET_KEY env valiables is missing.`);

// Arcjet protection for HTTP routes: blocks attacks and non-allowed bots, limits to 50 requests per 10s.
export const httpArcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            shield({ mode: arcjetMode }),
            detectBot({ mode: arcjetMode, allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"] }),
            slidingWindow({ mode: arcjetMode, interval: "10s", max: 50 })
        ]
    }) : null;

// Arcjet protection for WebSocket connections: same checks, but a stricter limit of 5 requests per 2s.
export const wsArcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            shield({ mode: arcjetMode }),
            detectBot({ mode: arcjetMode, allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"] }),
            slidingWindow({ mode: arcjetMode, interval: "2s", max: 5 })
        ]
    }) : null;

// Express middleware that asks Arcjet to check each request: rate-limited gets 429, other denials get 403, otherwise it continues.
export const securityMiddleware = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!httpArcjet) return next();

        try {
            const decision = await httpArcjet.protect(req);

            if (decision.isDenied()) {
                if (decision.reason.isRateLimit()) {
                    return res.status(429).json({
                        error: "Too many requests."
                    });
                }

                return res.status(403).json({ error: "Forbidden."})
            }

        } catch (error) {
            return next(error)
        }

        next()
    }
}