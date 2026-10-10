// positive integer from a query/param value, or undefined
export const toId = (value: unknown): number | undefined => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : undefined;
};