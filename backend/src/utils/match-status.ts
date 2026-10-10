import { MATCH_STATUS } from '../validation/matches';

export type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];
type DateInput = string | number | Date;

interface MatchLike {
    startTime: DateInput;
    endTime: DateInput;
    status: MatchStatus | string;
}

export const getMatchStatus = (startTime: DateInput, endTime: DateInput, now: Date = new Date()): MatchStatus | null => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
    }

    if (now < start) {
        return MATCH_STATUS.SCHEDULED;
    }

    if (now >= end) {
        return MATCH_STATUS.FINISHED;
    }

    return MATCH_STATUS.LIVE;
}

export const syncMatchStatus = async (
    match: MatchLike,
    updateStatus: (status: MatchStatus) => Promise<unknown> | unknown
) => {
    const nextStatus = getMatchStatus(match.startTime, match.endTime);
    if (!nextStatus) {
        return match.status;
    }
    if (match.status !== nextStatus) {
        await updateStatus(nextStatus);
        match.status = nextStatus;
    }
    return match.status;
}