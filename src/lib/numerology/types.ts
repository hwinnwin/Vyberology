export interface NumberResult {
  raw: number;
  value: number;
  isMaster: boolean;
}

export interface NumerologyNumbers {
  lifePath: NumberResult;
  expression: NumberResult;
  soulUrge: NumberResult;
  personality: NumberResult;
  maturity: NumberResult;
}

export interface ChakraMapping {
  dominant: string;
  bridge: string;
  mapping: {
    lifePath: string;
    expression: string;
    soulUrge: string;
    personality: string;
    maturity: string;
  };
}

export interface Reading {
  frequencyProfile: string;
  energyField: string;
  insight: string;
}

export interface NumerologyResult {
  input: {
    fullName: string;
    dob: string;
  };
  numbers: NumerologyNumbers;
  chakras: ChakraMapping;
  reading: Reading;
}
