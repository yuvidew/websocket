import { desc } from "drizzle-orm";
import { db } from "../db/db"
import { matches } from "../db/schema"
import { CreatedMatche } from "../types/matches.types";
import { MatchStatus } from "../utils/match-status";

// insert matche details in the database
export const createMatch = async (
    parsed: {
        sport: string,
        homeTeam: string,
        awayTeam: string,
        startTime: string,
        endTime: string,
        homeScore?: number | undefined,
        awayScore?: number | undefined,
        status: MatchStatus
    }
): Promise<CreatedMatche> => {
    const [event] = await db.insert(matches).values({
        ...parsed,
        startTime: new Date(parsed.startTime),
        endTime: new Date(parsed.endTime),
        homeScore: parsed.homeScore ?? 0,
        awayScore: parsed.awayScore ?? 0,
        status: parsed.status
    }).returning();

    return event;
}

// get list the all matches according to the limit
export const getMatches = async (limit: number) =>{
    return await db.select()
                .from(matches)
                .orderBy((desc(matches.createdAt)))
                .limit(limit)
}