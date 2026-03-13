import type { Motif, TokenInfo } from "./types";
export declare function detectMotifs(tokens: TokenInfo[], context?: string): Motif[];
export declare function motifStrength(motif: Motif): number;
export declare function dominantMotif(tokens: TokenInfo[], motifs: Motif[]): Motif | undefined;
