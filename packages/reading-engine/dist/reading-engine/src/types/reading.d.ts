export type ISODate = string & {
    readonly __brand: 'ISODate';
};
export type ReadingInput = {
    fullName: string;
    birthDate: ISODate;
    locale?: string;
};
export type ReadingBlock = {
    key: string;
    text: string;
};
export type ReadingText = {
    id: string;
    seed: string;
    blocks: readonly ReadingBlock[];
};
export type Result<T, E extends {
    code: string;
    message: string;
}> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: E;
};
