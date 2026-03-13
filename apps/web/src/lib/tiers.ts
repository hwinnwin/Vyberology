export type ReadingTier = "free" | "lyf-path" | "full-vybe" | "deep";

/** Maps our tier IDs to the depth parameter the vybe-reading edge function expects */
export const TIER_TO_DEPTH: Record<ReadingTier, string> = {
  free: "free",
  "lyf-path": "lite",
  "full-vybe": "standard",
  deep: "deep",
};

/** Maps paid tiers to Stripe price IDs (live mode) */
export const TIER_PRICE_ID: Record<Exclude<ReadingTier, "free">, string> = {
  "lyf-path": "price_1SzVjTKQHOT2DNgNAICdqNm3", // $9.97
  "full-vybe": "price_1SzVlfKQHOT2DNgNnOwQkFoJ", // $19.97
  deep: "price_1SzVmEKQHOT2DNgNaDAPVjN0", // $39.97
};

export interface TierConfig {
  id: ReadingTier;
  label: string;
  tagline: string;
  price: string;
  priceAmount: number; // cents
  features: string[];
  lockedPreview: string[];
  hasPdf: boolean;
  hasShareCard: boolean;
  hasPremiumShareCard: boolean;
  hasFrequencyPrescription: boolean;
  hasChakraFlowAnalysis: boolean;
  hasIntegratedReading: boolean;
}

export const TIERS: Record<ReadingTier, TierConfig> = {
  free: {
    id: "free",
    label: "Free Teaser",
    tagline: "Your base frequency revealed",
    price: "Free",
    priceAmount: 0,
    features: [
      "Life Path number calculation",
      "1-2 sentence interpretation",
      "Core numbers grid",
      "Chakra + Element identification",
    ],
    lockedPreview: [
      "Deep Life Path interpretation",
      "Expression + Soul Urge analysis",
      "Personality insights",
      "AI-powered soul reading",
      "Shareable result card",
    ],
    hasPdf: false,
    hasShareCard: false,
    hasPremiumShareCard: false,
    hasFrequencyPrescription: false,
    hasChakraFlowAnalysis: false,
    hasIntegratedReading: false,
  },
  "lyf-path": {
    id: "lyf-path",
    label: "Lyf Path Reading",
    tagline: "Your soul blueprint decoded",
    price: "$9.97",
    priceAmount: 997,
    features: [
      "Life Path deep interpretation",
      "Expression number + meaning",
      "Soul Urge number + meaning",
      "Personality number + meaning",
      "Basic frequency mapping",
      "AI-powered soul reading (~200 words)",
      "Shareable result card",
    ],
    lockedPreview: [],
    hasPdf: false,
    hasShareCard: true,
    hasPremiumShareCard: false,
    hasFrequencyPrescription: false,
    hasChakraFlowAnalysis: false,
    hasIntegratedReading: false,
  },
  "full-vybe": {
    id: "full-vybe",
    label: "Full VYBE Reading",
    tagline: "Complete energetic blueprint",
    price: "$19.97",
    priceAmount: 1997,
    features: [
      "Everything in Lyf Path Reading",
      "Maturity number deep analysis",
      "Dominant Chakra identification",
      "Bridge Chakra + Chakra Flow analysis",
      "Integrated reading narrative",
      "Personal frequency prescription",
      "AI-powered deep reading (~500 words)",
      "Premium shareable card",
      "Downloadable PDF report",
    ],
    lockedPreview: [],
    hasPdf: true,
    hasShareCard: true,
    hasPremiumShareCard: true,
    hasFrequencyPrescription: true,
    hasChakraFlowAnalysis: true,
    hasIntegratedReading: true,
  },
  deep: {
    id: "deep",
    label: "Deep Attunement",
    tagline: "In-depth soul-level exploration",
    price: "$39.97",
    priceAmount: 3997,
    features: [
      "Everything in Full VYBE Reading",
      "Full soul-level analysis (~1000 words)",
      "Shadow work & keystone actions",
      "Past life echoes & karmic patterns",
    ],
    lockedPreview: [],
    hasPdf: true,
    hasShareCard: true,
    hasPremiumShareCard: true,
    hasFrequencyPrescription: true,
    hasChakraFlowAnalysis: true,
    hasIntegratedReading: true,
  },
};

/** Labels for tier badges */
export const TIER_BADGE: Record<ReadingTier, { text: string; className: string }> = {
  free: { text: "Free", className: "bg-vy-charcoal/10 text-vy-charcoal/60" },
  "lyf-path": { text: "Lyf Path", className: "bg-vy-gold/20 text-vy-gold" },
  "full-vybe": { text: "Full VYBE", className: "bg-vy-gold text-white" },
  deep: { text: "Deep Attunement", className: "bg-vy-charcoal text-vy-parchment" },
};
