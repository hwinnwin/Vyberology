import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PathId = "fire" | "water" | "air" | "earth";
export type QuestType = "main" | "side" | "boss";

export interface Quest {
  id: string;
  title: string;
  description: string;
  path: PathId;
  type: QuestType;
  xp: number;
}

export interface PathDefinition {
  id: PathId;
  name: string;
  realm: string;
  theme: string;
  description: string;
  status: "available" | "coming_soon";
  signatureSpell: string;
}

export type QuestStatus = "available" | "locked" | "completed";

export interface LegendsState {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  primaryPath: PathId | null;
  questStatus: Record<string, QuestStatus>;
}

export const pathDefinitions: Record<PathId, PathDefinition> = {
  fire: {
    id: "fire",
    name: "Path of Fire",
    realm: "Emberwild",
    theme: "from-orange-500 to-red-600",
    description: "Bold action, courage, and ignition of creative power.",
    status: "available",
    signatureSpell: "Ignition Pulse",
  },
  water: {
    id: "water",
    name: "Path of Water",
    realm: "Tidegrove",
    theme: "from-sky-500 to-blue-700",
    description: "Flow, intuition, and emotional mastery.",
    status: "coming_soon",
    signatureSpell: "Aqua Veil",
  },
  air: {
    id: "air",
    name: "Path of Air",
    realm: "Zephyrreach",
    theme: "from-cyan-400 to-indigo-500",
    description: "Clarity, intellect, and swift movement.",
    status: "coming_soon",
    signatureSpell: "Gale Script",
  },
  earth: {
    id: "earth",
    name: "Path of Earth",
    realm: "Stoneheart",
    theme: "from-emerald-500 to-lime-600",
    description: "Stability, resilience, and patient growth.",
    status: "coming_soon",
    signatureSpell: "Terra Ward",
  },
};

const quests: Quest[] = [
  {
    id: "fire-main-1",
    title: "Ember Initiation",
    description: "Choose one bold action you will do today and commit to it in writing.",
    path: "fire",
    type: "main",
    xp: 120,
  },
  {
    id: "fire-side-1",
    title: "Breath of Ember",
    description: "Practice a 2-minute power breath before your next decision.",
    path: "fire",
    type: "side",
    xp: 80,
  },
  {
    id: "fire-boss-1",
    title: "Flamebound Vow",
    description: "Make a public commitment to a creative challenge this week.",
    path: "fire",
    type: "boss",
    xp: 160,
  },
];

const levelSteps = [100, 200, 350, 500];

const getXpForLevel = (level: number) => {
  if (level <= levelSteps.length) return levelSteps[level - 1];
  const lastStep = levelSteps[levelSteps.length - 1];
  return lastStep + (level - levelSteps.length) * 200;
};

const applyXpGain = (previous: LegendsState, xpGain: number): LegendsState => {
  let level = previous.level;
  let xpIntoLevel = previous.xpIntoLevel + xpGain;
  const totalXp = previous.totalXp + xpGain;

  while (xpIntoLevel >= getXpForLevel(level)) {
    xpIntoLevel -= getXpForLevel(level);
    level += 1;
  }

  return { ...previous, level, xpIntoLevel, totalXp };
};

const buildDefaultQuestStatus = (): Record<string, QuestStatus> => {
  const status: Record<string, QuestStatus> = {};
  quests.forEach((quest) => {
    status[quest.id] = quest.path === "fire" ? "available" : "locked";
  });
  return status;
};

const defaultState: LegendsState = {
  level: 1,
  totalXp: 0,
  xpIntoLevel: 0,
  primaryPath: null,
  questStatus: buildDefaultQuestStatus(),
};

const loadStoredState = (): LegendsState => {
  if (typeof window === "undefined") return defaultState;
  const stored = localStorage.getItem("legends-progress");
  if (!stored) return defaultState;

  try {
    const parsed = JSON.parse(stored) as LegendsState;
    return { ...defaultState, ...parsed };
  } catch (err) {
    console.error("Failed to parse legends-progress", err);
    return defaultState;
  }
};

const LegendsContext = createContext<LegendsContextValue | undefined>(undefined);

export interface LegendsContextValue {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNext: number;
  primaryPath: PathId | null;
  questStatus: Record<string, QuestStatus>;
  quests: Quest[];
  questsByPath: Record<PathId, Quest[]>;
  currentQuest: Quest | null;
  paths: Record<PathId, PathDefinition>;
  selectPrimaryPath: (path: PathId) => void;
  completeQuest: (questId: string) => number;
  grantDailySpellXp: (amount?: number) => number;
  getQuestById: (questId: string) => Quest | undefined;
}

export function LegendsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LegendsState>(loadStoredState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("legends-progress", JSON.stringify(state));
  }, [state]);

  const questsByPath = useMemo(() => {
    return quests.reduce<Record<PathId, Quest[]>>((acc, quest) => {
      acc[quest.path] = acc[quest.path] || [];
      acc[quest.path].push(quest);
      return acc;
    }, { fire: [], water: [], air: [], earth: [] });
  }, []);

  const xpForNext = useMemo(() => getXpForLevel(state.level), [state.level]);

  const currentQuest = useMemo(() => {
    if (!state.primaryPath) return null;
    const pathQuests = questsByPath[state.primaryPath] || [];
    return pathQuests.find((quest) => state.questStatus[quest.id] !== "completed") || null;
  }, [state.primaryPath, questsByPath, state.questStatus]);

  const getQuestById = (questId: string) => quests.find((quest) => quest.id === questId);

  const selectPrimaryPath = (path: PathId) => {
    setState((prev) => ({ ...prev, primaryPath: path }));
  };

  const completeQuest = (questId: string) => {
    const quest = getQuestById(questId);
    if (!quest) return 0;

    setState((prev) => {
      if (prev.questStatus[questId] === "completed") return prev;
      const updated = applyXpGain(prev, quest.xp);
      return {
        ...updated,
        questStatus: { ...updated.questStatus, [questId]: "completed" },
      };
    });

    return quest.xp;
  };

  const grantDailySpellXp = (amount = 20) => {
    setState((prev) => applyXpGain(prev, amount));
    return amount;
  };

  const value: LegendsContextValue = {
    level: state.level,
    totalXp: state.totalXp,
    xpIntoLevel: state.xpIntoLevel,
    xpForNext,
    primaryPath: state.primaryPath,
    questStatus: state.questStatus,
    quests,
    questsByPath,
    currentQuest,
    paths: pathDefinitions,
    selectPrimaryPath,
    completeQuest,
    grantDailySpellXp,
    getQuestById,
  };

  return <LegendsContext.Provider value={value}>{children}</LegendsContext.Provider>;
}

export const useLegends = () => {
  const ctx = useContext(LegendsContext);
  if (!ctx) throw new Error("useLegends must be used within LegendsProvider");
  return ctx;
};
