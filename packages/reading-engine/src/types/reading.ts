export type ISODate = string & { readonly __brand: 'ISODate' }; // added by Lumen (Stage 4A)

export type ReadingInput = { // added by Lumen (Stage 4A)
  fullName: string;
  birthDate: ISODate;
  locale?: string;
};

export type ReadingBlock = { key: string; text: string }; // added by Lumen (Stage 4A)

export type ReadingText = { // added by Lumen (Stage 4A)
  id: string;
  seed: string;
  blocks: readonly ReadingBlock[];
};

export type Result<T, E extends { code: string; message: string }> = // added by Lumen (Stage 4A)
  | { ok: true; value: T }
  | { ok: false; error: E };
