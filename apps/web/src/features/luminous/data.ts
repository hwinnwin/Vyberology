import { OrderDefinition, OrderKey, StoryBlocks } from "./types";

export const orderKeys: OrderKey[] = [
  "Dawnbearer",
  "Heartforged",
  "Starweaver",
  "Stonecaller",
  "Stormbound",
  "Shadowmancer",
];

export const orders: Record<OrderKey, OrderDefinition> = {
  Dawnbearer: {
    name: "Dawnbearer",
    sigil: "dawnbearer",
    originBlockId: "dawnbearer_origin",
    trialBlockId: "dawnbearer_trial",
    destinyBlockId: "dawnbearer_destiny",
    signatureAbilityId: "dawnbearer_ability",
    lightTraits: ["Radiant optimism", "Guiding presence", "Fearless hope"],
    veilTraits: ["Overcommitment", "Naive trust", "Restless energy"],
    defaultLumenheart: "Prime Ray",
  },
  Heartforged: {
    name: "Heartforged",
    sigil: "heartforged",
    originBlockId: "heartforged_origin",
    trialBlockId: "heartforged_trial",
    destinyBlockId: "heartforged_destiny",
    signatureAbilityId: "heartforged_ability",
    lightTraits: ["Unbreakable loyalty", "Steady courage", "Empathic strength"],
    veilTraits: ["Stubborn pride", "Overprotection", "Silent struggle"],
    defaultLumenheart: "Eternal Ember",
  },
  Starweaver: {
    name: "Starweaver",
    sigil: "starweaver",
    originBlockId: "starweaver_origin",
    trialBlockId: "starweaver_trial",
    destinyBlockId: "starweaver_destiny",
    signatureAbilityId: "starweaver_ability",
    lightTraits: ["Pattern-seeing", "Calm insight", "Graceful improvisation"],
    veilTraits: ["Detached analysis", "Overthinking", "Evasive timing"],
    defaultLumenheart: "Astral Thread",
  },
  Stonecaller: {
    name: "Stonecaller",
    sigil: "stonecaller",
    originBlockId: "stonecaller_origin",
    trialBlockId: "stonecaller_trial",
    destinyBlockId: "stonecaller_destiny",
    signatureAbilityId: "stonecaller_ability",
    lightTraits: ["Steadfast focus", "Quiet resilience", "Grounded clarity"],
    veilTraits: ["Unyielding pace", "Guarded heart", "Slow to pivot"],
    defaultLumenheart: "Terra Core",
  },
  Stormbound: {
    name: "Stormbound",
    sigil: "stormbound",
    originBlockId: "stormbound_origin",
    trialBlockId: "stormbound_trial",
    destinyBlockId: "stormbound_destiny",
    signatureAbilityId: "stormbound_ability",
    lightTraits: ["Lightning instinct", "Adaptive force", "Brave disruption"],
    veilTraits: ["Impulsive strikes", "Short fuse", "Restless change"],
    defaultLumenheart: "Gale Spark",
  },
  Shadowmancer: {
    name: "Shadowmancer",
    sigil: "shadowmancer",
    originBlockId: "shadowmancer_origin",
    trialBlockId: "shadowmancer_trial",
    destinyBlockId: "shadowmancer_destiny",
    signatureAbilityId: "shadowmancer_ability",
    lightTraits: ["Quiet intuition", "Veiled empathy", "Tactical patience"],
    veilTraits: ["Hidden motives", "Overcaution", "Self-isolation"],
    defaultLumenheart: "Veil Shard",
  },
};

export const storyBlocks: StoryBlocks = {
  origin: {
    dawnbearer_origin:
      "You awoke to first light, feeling a chord between your pulse and the horizon. The world answered with warmth, naming you a Dawnbearer.",
    heartforged_origin:
      "Your earliest trials were in the forge of feeling, where bonds were tempered and vows were hammered into being.",
    starweaver_origin:
      "Constellations whispered patterns in your dreams, guiding your hands to weave meaning between moments.",
    stonecaller_origin:
      "Deep caverns echoed your steady call, each step carving patience into your bones until the stone itself listened.",
    stormbound_origin:
      "Thunder taught you rhythm. Lightning taught you decisiveness. The storm named you kin.",
    shadowmancer_origin:
      "Silence became your ally. In the spaces between heartbeats, you learned to listen to what others left unsaid.",
  },
  trial: {
    dawnbearer_trial:
      "You carried light into places where no paths remained, trusting that even a single spark could redraw a map.",
    heartforged_trial:
      "When others wavered, you held the line. Your resolve turned fear into focus and doubt into direction.",
    starweaver_trial:
      "You navigated chaos by tracing threads of possibility, connecting what seemed separate into one design.",
    stonecaller_trial:
      "Stillness was your crucible. You waited, you watched, and when the moment arrived you moved mountains.",
    stormbound_trial:
      "You rode uncertainty like wind, adapting mid-flight and landing on the one branch sturdy enough to hold you.",
    shadowmancer_trial:
      "You mastered the unseen currents of choice, shaping outcomes with subtle pivots and unseen nudges.",
  },
  destiny: {
    dawnbearer_destiny:
      "You are called to ignite dormant hopes, to steward dawn in those who have forgotten morning.",
    heartforged_destiny:
      "You will anchor communities, binding courage to compassion so others remember they belong.",
    starweaver_destiny:
      "You are destined to chart new constellations between people and ideas, aligning them toward shared futures.",
    stonecaller_destiny:
      "You will build foundations that last beyond your lifetime, stone set upon stone in quiet devotion.",
    stormbound_destiny:
      "You are meant to awaken momentum, to show that change can be navigated with grace and daring.",
    shadowmancer_destiny:
      "You will reveal the value of mystery, helping others embrace both light and shade in their stories.",
  },
  signatureAbility: {
    dawnbearer_ability: "Solar Aegis — you kindle courage and illuminate a safe path through uncertainty.",
    heartforged_ability: "Emberbound Vow — you reinforce hearts with steadfast warmth and unbreakable promise.",
    starweaver_ability: "Celestial Loom — you thread insights into a pattern others can follow.",
    stonecaller_ability: "Earthsong Pulse — you summon stability, anchoring those around you.",
    stormbound_ability: "Tempest Step — you dance with upheaval and turn it into forward motion.",
    shadowmancer_ability: "Veilcraft — you navigate the hidden and help others see what was overlooked.",
  },
  openings: {
    "Book of Light":
      "In the hush before dawn, a legend stirs. This is the Book of Light, where your path is etched into luminous page.",
  },
  closings: {
    "Book of Light":
      "May this legend remind you: light endures, hope returns, and your story is a beacon for those who follow.",
  },
};

export interface QuizQuestion {
  id: number;
  prompt: string;
  answers: { label: string; order: OrderKey; text: string }[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    prompt: "What draws you forward when everything feels uncertain?",
    answers: [
      { label: "A", order: "Dawnbearer", text: "A glimpse of hope on the horizon" },
      { label: "B", order: "Heartforged", text: "The people relying on me" },
      { label: "C", order: "Starweaver", text: "A pattern others haven't noticed" },
      { label: "D", order: "Stonecaller", text: "A plan I've prepared" },
      { label: "E", order: "Stormbound", text: "The thrill of adapting" },
      { label: "F", order: "Shadowmancer", text: "An intuition I trust" },
    ],
  },
  {
    id: 2,
    prompt: "How do you steady yourself before a challenge?",
    answers: [
      { label: "A", order: "Dawnbearer", text: "Reframing with optimism" },
      { label: "B", order: "Heartforged", text: "Checking in with those I care about" },
      { label: "C", order: "Starweaver", text: "Mapping possible outcomes" },
      { label: "D", order: "Stonecaller", text: "Taking a slow grounding breath" },
      { label: "E", order: "Stormbound", text: "Moving to get my energy flowing" },
      { label: "F", order: "Shadowmancer", text: "Observing quietly before acting" },
    ],
  },
  {
    id: 3,
    prompt: "Which gift do friends seek from you?",
    answers: [
      { label: "A", order: "Dawnbearer", text: "Encouragement" },
      { label: "B", order: "Heartforged", text: "Loyal backup" },
      { label: "C", order: "Starweaver", text: "Strategic insight" },
      { label: "D", order: "Stonecaller", text: "Steady presence" },
      { label: "E", order: "Stormbound", text: "Bold action" },
      { label: "F", order: "Shadowmancer", text: "Quiet understanding" },
    ],
  },
  {
    id: 4,
    prompt: "What kind of story ignites you?",
    answers: [
      { label: "A", order: "Dawnbearer", text: "A comeback against all odds" },
      { label: "B", order: "Heartforged", text: "A found family defending their own" },
      { label: "C", order: "Starweaver", text: "A puzzle that shifts perspective" },
      { label: "D", order: "Stonecaller", text: "A slow build to lasting change" },
      { label: "E", order: "Stormbound", text: "A daring leap into the unknown" },
      { label: "F", order: "Shadowmancer", text: "A secret shaping the world" },
    ],
  },
  {
    id: 5,
    prompt: "Choose a companion for the road.",
    answers: [
      { label: "A", order: "Dawnbearer", text: "A loyal lantern" },
      { label: "B", order: "Heartforged", text: "A trusted ally" },
      { label: "C", order: "Starweaver", text: "A map of shifting constellations" },
      { label: "D", order: "Stonecaller", text: "A walking staff" },
      { label: "E", order: "Stormbound", text: "A swift wind at your back" },
      { label: "F", order: "Shadowmancer", text: "A cloak that blends with night" },
    ],
  },
  {
    id: 6,
    prompt: "When plans crumble, what's your first move?",
    answers: [
      { label: "A", order: "Dawnbearer", text: "Boost morale" },
      { label: "B", order: "Heartforged", text: "Protect the group" },
      { label: "C", order: "Starweaver", text: "Recalculate the path" },
      { label: "D", order: "Stonecaller", text: "Stabilize what's left" },
      { label: "E", order: "Stormbound", text: "Find a quick pivot" },
      { label: "F", order: "Shadowmancer", text: "Gather intel quietly" },
    ],
  },
  {
    id: 7,
    prompt: "What scent feels like home?",
    answers: [
      { label: "A", order: "Dawnbearer", text: "Fresh dawn air" },
      { label: "B", order: "Heartforged", text: "Warm ember smoke" },
      { label: "C", order: "Starweaver", text: "Night jasmine" },
      { label: "D", order: "Stonecaller", text: "Rain on stone" },
      { label: "E", order: "Stormbound", text: "Charged ozone" },
      { label: "F", order: "Shadowmancer", text: "Cedar and ink" },
    ],
  },
  {
    id: 8,
    prompt: "Which virtue feels most natural?",
    answers: [
      { label: "A", order: "Dawnbearer", text: "Hope" },
      { label: "B", order: "Heartforged", text: "Courage" },
      { label: "C", order: "Starweaver", text: "Wisdom" },
      { label: "D", order: "Stonecaller", text: "Patience" },
      { label: "E", order: "Stormbound", text: "Adaptability" },
      { label: "F", order: "Shadowmancer", text: "Discernment" },
    ],
  },
  {
    id: 9,
    prompt: "How do you celebrate a win?",
    answers: [
      { label: "A", order: "Dawnbearer", text: "Share the hype" },
      { label: "B", order: "Heartforged", text: "Toast with loved ones" },
      { label: "C", order: "Starweaver", text: "Reflect quietly" },
      { label: "D", order: "Stonecaller", text: "Take a calm walk" },
      { label: "E", order: "Stormbound", text: "Plan the next adventure" },
      { label: "F", order: "Shadowmancer", text: "Send a discreet thank you" },
    ],
  },
  {
    id: 10,
    prompt: "Pick a guiding phrase.",
    answers: [
      { label: "A", order: "Dawnbearer", text: "Light the way" },
      { label: "B", order: "Heartforged", text: "With heart, forward" },
      { label: "C", order: "Starweaver", text: "See the pattern" },
      { label: "D", order: "Stonecaller", text: "Build to last" },
      { label: "E", order: "Stormbound", text: "Move with the wind" },
      { label: "F", order: "Shadowmancer", text: "Read the shadows" },
    ],
  },
  {
    id: 11,
    prompt: "Your ideal artifact is…",
    answers: [
      { label: "A", order: "Dawnbearer", text: "A dawnstone" },
      { label: "B", order: "Heartforged", text: "A heartforge hammer" },
      { label: "C", order: "Starweaver", text: "A starwoven thread" },
      { label: "D", order: "Stonecaller", text: "A carved keystone" },
      { label: "E", order: "Stormbound", text: "A tempest compass" },
      { label: "F", order: "Shadowmancer", text: "A mirror of veils" },
    ],
  },
  {
    id: 12,
    prompt: "What do you leave behind wherever you go?",
    answers: [
      { label: "A", order: "Dawnbearer", text: "A spark of hope" },
      { label: "B", order: "Heartforged", text: "A feeling of safety" },
      { label: "C", order: "Starweaver", text: "A clearer picture" },
      { label: "D", order: "Stonecaller", text: "A stronger foundation" },
      { label: "E", order: "Stormbound", text: "A fresh breeze" },
      { label: "F", order: "Shadowmancer", text: "A sense of mystery" },
    ],
  },
];

export const answerOrderMap: Record<string, OrderKey> = {
  A: "Dawnbearer",
  B: "Heartforged",
  C: "Starweaver",
  D: "Stonecaller",
  E: "Stormbound",
  F: "Shadowmancer",
};
