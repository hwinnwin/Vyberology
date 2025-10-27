import { describe, it, expect, vi, afterEach, afterAll } from 'vitest';
import { composeActions } from '../src/lib/numerology/actionPlan';
import { compareProfiles } from '../src/lib/numerology/compat';
import type { PairReading, Profile } from '../src/lib/numerology/compat';
import { tag, blendTitle } from '../src/lib/numerology/compatLabels';
import {
  chakraFor,
  elementFor,
  semanticsFor,
  prettyChakra,
  prettyElement,
  mapChakras,
} from '../src/lib/numerology/chakraMap';
import { summarizeWeave } from '../src/lib/numerology/chakraWeave';
import { composeReading, renderReadingMarkdown } from '../src/lib/numerology/composeReading';
import type { NumValue } from '../src/lib/numerology/reduce';
import * as calculators from '../src/lib/numerology/calculators';

function makeProfile(): Profile {
  return {
    fullName: 'Sample Profile',
    dob: '2000-01-01',
    numbers: {
      lifePath: { value: 1 },
      expression: { value: 1 },
      soulUrge: { value: 1 },
      personality: { value: 1 },
    },
    chakras: [],
  };
}

function basePairReading(): PairReading {
  return {
    left: makeProfile(),
    right: makeProfile(),
    synergy: {
      lifePathBlend: { code: '1 + 1 = 2 → 2', summary: 'Baseline summary.' },
      expressionBlend: { code: '1 × 1', summary: 'Baseline expression.' },
      soulUrgeBlend: { code: '1 × 1', summary: 'Baseline soul urge.' },
      personalityBlend: { code: '1 × 1', summary: 'Baseline personality.' },
      chakraWeave: { dominant: 'lead', bridge: 'support', summary: 'Chakra weave summary.' },
      prosperityVector: 'Vector',
      risks: [],
    },
    narrative: '',
    actions: { focus: '', actions: [], mantra: '' },
  };
}

function makeNumValue(raw: number, value = raw, isMaster = false): NumValue {
  return { raw, value, isMaster };
}

describe('actionPlan.composeActions', () => {
  it('focuses on legacy building when master numbers are present', () => {
    const reading = basePairReading();
    reading.synergy.lifePathBlend.code = '11 + 2 = 13 → 4';
    reading.synergy.soulUrgeBlend.code = '22 × 11';
    reading.synergy.risks = ['Power clash'];

    const result = composeActions(reading);
    expect(result.focus).toBe('Legacy Building');
    expect(result.actions).toHaveLength(4);
    expect(result.mantra).toBe('Our purpose becomes pattern; our work becomes light.');
    expect(result.actions.at(-1)?.text).toContain('⚠️ Aware of risks: Power clash');
  });

  it('detects prosperity leadership for double 8 expression blends', () => {
    const reading = basePairReading();
    reading.synergy.expressionBlend.code = '8 × 8';

    const result = composeActions(reading);
    expect(result.focus).toBe('Prosperity Leadership');
    expect(result.actions[0].chakra).toBe('Solar Plexus');
  });

  it('promotes creative expansion when freedom dynamics are present', () => {
    const reading = basePairReading();
    reading.synergy.expressionBlend.code = '5 × 3';

    const result = composeActions(reading);
    expect(result.focus).toBe('Creative Expansion');
    expect(result.mantra).toBe('Freedom fuels our creation; presence holds it steady.');
  });

  it('leans into emotional balance when harmony is highlighted', () => {
    const reading = basePairReading();
    reading.synergy.lifePathBlend.summary = 'Harmony and balance amplified.';

    const result = composeActions(reading);
    expect(result.focus).toBe('Emotional Balance');
    expect(result.mantra).toBe('Love is the system; structure is how it moves.');
  });

  it('defaults to alignment practice otherwise', () => {
    const reading = basePairReading();

    const result = composeActions(reading);
    expect(result.focus).toBe('Alignment Practice');
    expect(result.mantra).toBe('Aligned energy builds timeless structures.');
  });
});

describe('compatLabels helpers', () => {
  it('tags known numbers with labels and leaves unknowns untouched', () => {
    expect(tag(11)).toBe('11 (Visionary)');
    expect(tag(4)).toBe('4 (Builder)');
    expect(tag(99)).toBe('99');
  });

  it('builds blend titles with decorated tags', () => {
    expect(blendTitle(11, 22, 'Partnership')).toBe('11 (Visionary) × 22 (Master Builder) — Partnership');
  });
});

describe('chakra mapping utilities', () => {
  it('maps master numbers to dual chakra signatures', () => {
    expect(chakraFor(11)).toBe('thirdEye+heart');
    expect(elementFor(22)).toEqual(['earth', 'fire']);
    const semantics = semanticsFor(5);
    expect(semantics.chakra).toBe('throat');
    expect(semantics.themes).toContain('freedom');
    expect(prettyChakra('thirdEye+heart')).toBe('Third Eye × Heart');
    expect(prettyElement(['air', 'ether'])).toBe('Air + Ether');
    expect(prettyElement('fire')).toBe('Fire');
  });

  it('produces legacy chakra semantics with dominant and bridge values', () => {
    const [root, sacral, master] = mapChakras([4, 2, 11]);
    expect(root.dominant).toBe('foundation');
    expect(sacral.bridge).toBe('attunement');
    expect(master.chakra).toBe('thirdEye+heart');
  });

  it('summarizes chakra weave bridges', () => {
    const [a] = mapChakras([1]);
    const [b] = mapChakras([6]);
    const weave = summarizeWeave(a, b);
    expect(weave.summary).toContain('Chakra Weave');
    expect(weave.dominant).toContain('initiative');
    expect(weave.dominant).toContain('care');
    expect(weave.bridge).toBe('clarity ↔ harmony');
  });

  it('falls back gracefully when chakra key unknown', () => {
    expect(prettyChakra('mystic')).toBe('Chakra');
  });
});

describe('composeReading + markdown rendering', () => {
  it('creates a reading block with weighted dominant frequencies', () => {
    const reading = composeReading({
      anchorFrame: 'Creative sprint',
      parts: {
        lifePath: makeNumValue(29, 11, true),
        expression: makeNumValue(26, 8),
        soulUrge: makeNumValue(23, 5),
        personality: makeNumValue(15, 6),
        maturity: makeNumValue(18, 9),
      },
    });

    expect(reading.theme).toBe('Intuition & illumination');
    expect(reading.chakra).toBe('Third Eye × Heart');
    expect(reading.element).toBe('Air + Ether');
    expect(reading.alignmentSummary.lines).toHaveLength(3);
    expect(reading.energyMessage).toBe('“Trust the signal — intuition is louder than usual.”');
    expect(reading.essence).toBe('Trust the signal — it’s confirmation, not coincidence.');

    const markdown = renderReadingMarkdown(reading, 'Compat Focus');
    expect(markdown).toContain('### 🌍 Compat Focus');
    expect(markdown).toContain('| Life Path |');
    expect(markdown).toContain(reading.energyMessage);
  });
});

describe('lifePath blend and prosperity vectors', () => {
  const computeSpy = vi.spyOn(calculators, 'computeAll');

  afterEach(() => {
    computeSpy.mockReset();
  });

  afterAll(() => {
    computeSpy.mockRestore();
  });

  function mockPair(left: { lifePath: number; expression: number; soulUrge?: number; personality?: number }, right: { lifePath: number; expression: number; soulUrge?: number; personality?: number }) {
    const makeResponse = (payload: typeof left) => ({
      lifePath: { value: payload.lifePath },
      expression: { value: payload.expression },
      soulUrge: { value: payload.soulUrge ?? payload.lifePath },
      personality: { value: payload.personality ?? payload.lifePath },
      maturity: { value: payload.lifePath },
    });
    computeSpy
      .mockImplementationOnce(() => makeResponse(left))
      .mockImplementationOnce(() => makeResponse(right));
  }

  it('summarises life path master 11 and 22 blends', () => {
    mockPair({ lifePath: 5, expression: 3 }, { lifePath: 6, expression: 4 });
    const eleven = compareProfiles('A', '2000-01-01', 'B', '2000-01-01');
    expect(eleven.synergy.lifePathBlend.summary).toBe('Heightened intuition and shared vision; protect quiet time.');

    mockPair({ lifePath: 11, expression: 8 }, { lifePath: 11, expression: 8 });
    const twentyTwo = compareProfiles('C', '2000-01-01', 'D', '2000-01-01');
    expect(twentyTwo.synergy.lifePathBlend.summary).toBe('Blueprinting a legacy—translate vision into systems.');
  });

  it('covers prosperity vector variations', () => {
    mockPair({ lifePath: 4, expression: 8 }, { lifePath: 4, expression: 8 });
    const doubleEight = compareProfiles('E', '2000-01-01', 'F', '2000-01-01');
    expect(doubleEight.synergy.prosperityVector).toContain('Dual 8');

    mockPair({ lifePath: 7, expression: 22 }, { lifePath: 7, expression: 3 });
    const master = compareProfiles('G', '2000-01-01', 'H', '2000-01-01');
    expect(master.synergy.prosperityVector).toContain('22 present');

    mockPair({ lifePath: 5, expression: 3 }, { lifePath: 3, expression: 4 });
    const lpEight = compareProfiles('I', '2000-01-01', 'J', '2000-01-01');
    expect(lpEight.synergy.prosperityVector).toContain('LP 8 influence');

    mockPair({ lifePath: 4, expression: 3 }, { lifePath: 1, expression: 4 });
    const defaultVector = compareProfiles('K', '2000-01-01', 'L', '2000-01-01');
    expect(defaultVector.synergy.prosperityVector).toContain('clarify the offer');
  });

  it('falls back to default life path blend guidance when reduced number not special', () => {
    mockPair({ lifePath: 4, expression: 3 }, { lifePath: 6, expression: 4 });
    const result = compareProfiles('M', '2000-01-01', 'N', '2000-01-01');
    expect(result.synergy.lifePathBlend.summary).toBe('Blend your strengths; choose one clear owner per decision.');
  });
});
