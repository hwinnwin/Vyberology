export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type MasterNumber = 11 | 22 | 33;
export type NumerologyValue = {
    raw: number;
    value: number;
    isMaster: boolean;
};
export type CoreNumbers = {
    lifePath: NumerologyValue;
    expression: NumerologyValue;
    soulUrge: NumerologyValue;
    personality: NumerologyValue;
    maturity: NumerologyValue;
};
