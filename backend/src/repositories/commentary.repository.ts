import { desc, eq } from "drizzle-orm";
import { db } from "../db/db";
import { commentary, Commentary, NewCommentary } from "../db/schema";

// insert a commentary entry in the database
export const createCommentary = async (values: NewCommentary): Promise<Commentary> => {
    const [entry] = await db.insert(commentary).values(values).returning();

    return entry;
}

// get commentary of a matche, newest first, according to the limit
export const getCommentariesByMatchId = async (matchId: number, limit: number): Promise<Commentary[]> => {
    return await db.select()
                .from(commentary)
                .where(eq(commentary.matchId, matchId))
                .orderBy(desc(commentary.createdAt), desc(commentary.id))
                .limit(limit);
}
