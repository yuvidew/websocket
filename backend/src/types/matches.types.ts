export type CreatedMatche = {
    id: number;
    sport: string;
    homeTeam: string;
    awayTeam: string;
    startTime: Date;
    endTime: Date | null;
    homeScore: number;
    awayScore: number;
    status: "scheduled" | "live" | "finished";
    createdAt: Date;
}