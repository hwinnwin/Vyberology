/**
 * Vybe Ecosystem App Configuration
 * Single source of truth for all apps in the ecosystem
 */

export interface VybeApp {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  color: string;
  category: AppCategory;
  featured?: boolean;
  status: "live" | "beta" | "development" | "deprecated";
}

export type AppCategory =
  | "core"
  | "ai"
  | "coaching"
  | "productivity"
  | "language"
  | "client"
  | "internal";

/**
 * Core Vybe Ecosystem Apps
 */
export const VYBE_APPS: VybeApp[] = [
  {
    id: "vyberology",
    name: "Vyberology",
    description: "Numerology Readings",
    url: "https://vyberology.app",
    icon: "🔮",
    color: "from-purple-500 to-pink-500",
    category: "core",
    featured: true,
    status: "live",
  },
  {
    id: "lumen-orca",
    name: "Lumen Orca",
    description: "AI Analysis Engine",
    url: "https://lumenorca.app",
    icon: "🐋",
    color: "from-blue-600 to-cyan-500",
    category: "ai",
    featured: true,
    status: "live",
  },
  {
    id: "hwinnwin",
    name: "HwinNwin",
    description: "Success Coaching",
    url: "https://hwinnwin.com",
    icon: "🏆",
    color: "from-amber-500 to-yellow-500",
    category: "coaching",
    status: "live",
  },
  {
    id: "lumynalysis",
    name: "Lumynalysis",
    description: "Deep Insights",
    url: "https://lumynalysis.app",
    icon: "🔬",
    color: "from-emerald-500 to-teal-500",
    category: "ai",
    status: "beta",
  },
  {
    id: "lumen-flow",
    name: "Lumen Flow",
    description: "Workflow Automation",
    url: "https://lumenflow.app",
    icon: "🌊",
    color: "from-sky-500 to-blue-600",
    category: "productivity",
    status: "development",
  },
  {
    id: "numerology",
    name: "Numerology",
    description: "Life Path Calculator",
    url: "https://vyberology.app/numerology",
    icon: "🔢",
    color: "from-indigo-500 to-purple-500",
    category: "core",
    status: "live",
  },
  {
    id: "compatibility",
    name: "Compatibility",
    description: "Match Analysis",
    url: "https://vyberology.app/compatibility",
    icon: "💕",
    color: "from-pink-500 to-rose-500",
    category: "core",
    status: "live",
  },
  {
    id: "hey-lumen",
    name: "Hey Lumen",
    description: "Voice Assistant",
    url: "https://vyberology.app/get-vybe",
    icon: "🎙️",
    color: "from-cyan-500 to-blue-500",
    category: "ai",
    status: "live",
  },
  {
    id: "brand",
    name: "Brand",
    description: "Vybe Identity",
    url: "https://vyberology.app/brand",
    icon: "✨",
    color: "from-amber-500 to-orange-500",
    category: "core",
    status: "live",
  },
];

/**
 * Language Learning Apps (to be consolidated into Vybe Lingua)
 */
export const LANGUAGE_APPS: VybeApp[] = [
  {
    id: "langwage",
    name: "Langwage",
    description: "Multi-Language Learning",
    url: "https://langwage.app",
    icon: "🌍",
    color: "from-green-500 to-emerald-500",
    category: "language",
    status: "live",
  },
  {
    id: "fnf-language",
    name: "FnF Language",
    description: "Fun & Fast Learning",
    url: "https://fnflanguage.app",
    icon: "🎮",
    color: "from-orange-500 to-red-500",
    category: "language",
    status: "live",
  },
  {
    id: "ledeedee",
    name: "Ledeedee",
    description: "Interactive Lessons",
    url: "https://ledeedee.app",
    icon: "🎵",
    color: "from-violet-500 to-purple-500",
    category: "language",
    status: "live",
  },
  {
    id: "jayden-language",
    name: "Jayden Language",
    description: "Youth Learning",
    url: "https://jaydenlanguage.app",
    icon: "📚",
    color: "from-blue-500 to-indigo-500",
    category: "language",
    status: "beta",
  },
  {
    id: "langwage-sasha",
    name: "Langwage Sasha",
    description: "Personalized Learning",
    url: "https://sasha.langwage.app",
    icon: "🦋",
    color: "from-pink-500 to-purple-500",
    category: "language",
    status: "beta",
  },
];

/**
 * Client Projects
 */
export const CLIENT_APPS: VybeApp[] = [
  {
    id: "team-margaret",
    name: "Team Margaret",
    description: "Client Portal",
    url: "https://teammargaret.com",
    icon: "👥",
    color: "from-slate-500 to-gray-600",
    category: "client",
    status: "live",
  },
  {
    id: "max-car-rental",
    name: "Max Car Rental",
    description: "Vehicle Booking",
    url: "https://maxcarrental.com",
    icon: "🚗",
    color: "from-red-500 to-orange-500",
    category: "client",
    status: "live",
  },
];

/**
 * Get all apps across all categories
 */
export function getAllApps(): VybeApp[] {
  return [...VYBE_APPS, ...LANGUAGE_APPS, ...CLIENT_APPS];
}

/**
 * Get apps by category
 */
export function getAppsByCategory(category: AppCategory): VybeApp[] {
  return getAllApps().filter((app) => app.category === category);
}

/**
 * Get featured apps
 */
export function getFeaturedApps(): VybeApp[] {
  return getAllApps().filter((app) => app.featured);
}

/**
 * Get apps by status
 */
export function getAppsByStatus(status: VybeApp["status"]): VybeApp[] {
  return getAllApps().filter((app) => app.status === status);
}
