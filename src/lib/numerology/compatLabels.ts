export const NUM_LABEL: Record<number, string> = {
  1: "Initiator",
  2: "Peacemaker",
  3: "Creator",
  4: "Builder",
  5: "Messenger",
  6: "Harmonizer",
  7: "Seer",
  8: "Executive",
  9: "Humanitarian",
  11: "Visionary",
  22: "Master Builder",
  33: "Master Teacher"
};

export function tag(n: number): string {
  return NUM_LABEL[n] ? `${n} (${NUM_LABEL[n]})` : String(n);
}

export function blendTitle(a: number, b: number, label = "Blend"): string {
  return `${tag(a)} × ${tag(b)} — ${label}`;
}
