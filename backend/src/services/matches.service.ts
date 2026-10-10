import * as matchesRepository from "../repositories/matches.repository";
import { getMatchStatus } from "../utils/match-status";
import { CreateMatchInput, ListMatchesQueryInput } from "../validation/matches";

const MAX_LIMIT = 100;

export const createMatche = async (input: CreateMatchInput) => {
    const event = await matchesRepository.createMatch({
        ...input,
        status: getMatchStatus(input.startTime, input.endTime) ?? 'scheduled'
    })

    return event
};

export const getMathes = async (input: ListMatchesQueryInput) => {
    const limit = Math.min(input.limit ?? 50, MAX_LIMIT);

    return await matchesRepository.getMatches(limit)
}
