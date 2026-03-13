export interface CareerInsight {
  archetype: string;
  strengths: string[];
  idealEnvironments: string;
}

export const careerInsights: Record<number, CareerInsight> = {
  1: {
    archetype: "The Visionary Founder",
    strengths: ["Strategic leadership", "Innovation", "Independent decision-making"],
    idealEnvironments: "Startups, consulting, or any role where you set the direction.",
  },
  2: {
    archetype: "The Strategic Partner",
    strengths: ["Mediation", "Collaborative intelligence", "Behind-the-scenes influence"],
    idealEnvironments: "Partnerships, diplomacy, HR, counseling, or support-driven leadership roles.",
  },
  3: {
    archetype: "The Creative Catalyst",
    strengths: ["Storytelling", "Creative vision", "Inspiring teams"],
    idealEnvironments: "Marketing, entertainment, writing, design, or any role blending ideas with expression.",
  },
  4: {
    archetype: "The Infrastructure Architect",
    strengths: ["Systems thinking", "Operational excellence", "Methodical execution"],
    idealEnvironments: "Engineering, project management, finance, or roles that reward consistency and precision.",
  },
  5: {
    archetype: "The Change Agent",
    strengths: ["Adaptability", "Sales magnetism", "Multi-domain expertise"],
    idealEnvironments: "Travel-based work, consulting, sales, media, or portfolio careers with variety.",
  },
  6: {
    archetype: "The Service Leader",
    strengths: ["Team nurturing", "Community building", "Aesthetic intelligence"],
    idealEnvironments: "Education, healthcare, interior design, hospitality, or mission-driven organizations.",
  },
  7: {
    archetype: "The Depth Specialist",
    strengths: ["Research mastery", "Analytical precision", "Strategic foresight"],
    idealEnvironments: "Research, data science, spiritual teaching, technology, or any role rewarding deep expertise.",
  },
  8: {
    archetype: "The Executive Builder",
    strengths: ["Financial acumen", "Scalable thinking", "Authority and presence"],
    idealEnvironments: "Business ownership, executive leadership, finance, real estate, or high-leverage roles.",
  },
  9: {
    archetype: "The Impact Visionary",
    strengths: ["Global perspective", "Compassionate leadership", "Completion mastery"],
    idealEnvironments: "Nonprofits, international work, healing professions, or roles with humanitarian reach.",
  },
  11: {
    archetype: "The Intuitive Innovator",
    strengths: ["Visionary insight", "Inspirational communication", "Pattern recognition"],
    idealEnvironments: "Innovation labs, spiritual leadership, coaching, or roles channeling future-forward ideas.",
  },
  22: {
    archetype: "The Civilization Builder",
    strengths: ["Institutional vision", "Large-scale execution", "Legacy creation"],
    idealEnvironments: "Government, large-scale infrastructure, movements, or organizations that outlast their founder.",
  },
  33: {
    archetype: "The Transformative Mentor",
    strengths: ["Teaching magnetism", "Healing presence", "Selfless leadership"],
    idealEnvironments: "Education, spiritual teaching, healing arts, or any platform that elevates others.",
  },
};
