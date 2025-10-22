import { describe, it, expect } from 'vitest';
import { composeReading } from '../src/lib/numerology/composeReading';
import type { NumValue } from '../src/lib/numerology/reduce';

type TestCase = {
  top: number;
  energy: string;
  essence: string;
  isMaster?: boolean;
};

const makeNum = (value: number, isMaster = false): NumValue => ({ raw: value, value, isMaster });

const scenarios: TestCase[] = [
  { top: 1, energy: '“Choose one clear step; simple beats perfect.”', essence: 'Move slow, decide clear.' },
  { top: 2, energy: '“Listen first; alignment comes from attunement.”', essence: 'Stay connected, not crowded.' },
  { top: 3, energy: '“Say it simply; light words carry far.”', essence: 'Create lightly, share warmly.' },
  { top: 4, energy: '“Lay one brick; foundations love consistency.”', essence: 'Strong roots, steady growth.' },
  { top: 5, energy: '“Let change breathe; move with it, not against it.”', essence: 'Flow with change; keep your centre.' },
  { top: 6, energy: '“Care is strength; hold the field steady.”', essence: 'Harmony first — the rest follows.' },
  { top: 7, energy: '“Quiet reveals the path; reflect before you act.”', essence: 'Clarity comes from quiet.' },
  { top: 8, energy: '“Power flows when grounded; steward your impact.”', essence: 'Balanced power builds trust.' },
  { top: 9, energy: '“Close with gratitude; space invites the new.”', essence: 'Finish well, begin clean.' },
  { top: 11, energy: '“Trust the signal — intuition is louder than usual.”', essence: 'Trust the signal — it’s confirmation, not coincidence.', isMaster: true },
  { top: 22, energy: '“Blueprints want action — build one real step today.”', essence: 'Make it tangible — vision becomes real through structure.', isMaster: true },
  { top: 33, energy: '“Teach by example — your warmth is the message.”', essence: 'Lead with compassion — your voice heals as it teaches.', isMaster: true },
  { top: 12, energy: '“Stay present; the next step will show itself.”', essence: 'Calm step, clear signal.' },
];

describe('composeReading energy + essence map', () => {
  for (const scenario of scenarios) {
    it(`selects the correct tone for ${scenario.top}`, () => {
      const offset = (seed: number) => (seed === scenario.top ? seed + 7 : seed); // keep distinct

      const reading = composeReading({
        anchorFrame: 'Daily Sync',
        parts: {
          lifePath: makeNum(scenario.top, scenario.isMaster ?? false),
          expression: makeNum(scenario.top, scenario.isMaster ?? false),
          soulUrge: makeNum(offset(4)),
          personality: makeNum(offset(5)),
          maturity: makeNum(offset(6)),
        },
      });

      expect(reading.energyMessage).toBe(scenario.energy);
      expect(reading.essence).toBe(scenario.essence);
      expect(reading.alignmentSummary.lines).toHaveLength(3);
      expect(reading.mainPattern).toContain('·');
    });
  }
});
