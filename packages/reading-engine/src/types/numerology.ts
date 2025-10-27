export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // added by Lumen (Stage 4A)
export type MasterNumber = 11 | 22 | 33; // added by Lumen (Stage 4A)

export type NumerologyValue = { // added by Lumen (Stage 4A)
  raw: number;
  value: number;
  isMaster: boolean;
};

export type CoreNumbers = { // added by Lumen (Stage 4A)
  lifePath: NumerologyValue;
  expression: NumerologyValue;
  soulUrge: NumerologyValue;
  personality: NumerologyValue;
  maturity: NumerologyValue;
};
