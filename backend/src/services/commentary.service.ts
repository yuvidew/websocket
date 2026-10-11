import * as commentaryRepository from "../repositories/commentary.repository";
import * as matchesRepository from "../repositories/matches.repository";
import { CreateCommentaryInput, ListCommentaryQueryInput } from "../validation/commentary";

const MAX_LIMIT = 100;

// throw 404 when the matche does not exist
const assertMatchExists = async (matchId: number) => {
    const match = await matchesRepository.getMatchById(matchId);

    if (!match) {
        throw Object.assign(new Error("Match not found"), { status: 404 });
    }
}

export const createCommentary = async (matchId: number, input: CreateCommentaryInput) => {
    await assertMatchExists(matchId);

    return await commentaryRepository.createCommentary({ ...input, matchId });
}

export const getCommentaries = async (matchId: number, input: ListCommentaryQueryInput) => {
    await assertMatchExists(matchId);

    const limit = Math.min(input.limit ?? MAX_LIMIT, MAX_LIMIT);

    return await commentaryRepository.getCommentariesByMatchId(matchId, limit);
}
