import { ChakraResult } from "./chakraMap";

export function summarizeWeave(a: ChakraResult, b: ChakraResult) {
  const dom = `${a.dominant} ↔ ${b.dominant}`;
  const bridge = `${a.bridge} ↔ ${b.bridge}`;
  const text = `Chakra Weave: Dominants ${dom}; Bridges ${bridge}. This pairing favors mutual regulation: lead from the shared dominant, and use the bridges to translate vision into structure.`;
  return { dominant: dom, bridge, summary: text };
}
