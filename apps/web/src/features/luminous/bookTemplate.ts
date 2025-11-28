import { orders } from "./data";
import {
  LuminousBookTemplate,
  OrderKey,
  QuizResult,
  ResolvedBook,
  ResolvedBlock,
  ResolvedSection,
} from "./types";

interface TemplateContext {
  userName: string;
  primaryOrderId: OrderKey;
  primaryOrderName: string;
  primaryOrderEssence: string;
  primaryOrderLight1: string;
  primaryOrderLight2: string;
  primaryOrderShadow1: string;
  secondaryOrderName: string;
  primaryScore: number;
  secondaryScore: number;
}

const resolveTemplateString = (template: string, context: TemplateContext) =>
  template.replace(/{{\s*(\w+)\s*}}/g, (_, key: keyof TemplateContext) => {
    const value = context[key];
    return typeof value === "number" ? String(value) : value ?? "";
  });

const baseTemplate: LuminousBookTemplate = {
  id: "default_v1",
  titleTemplate: "Luminous Legends: The Path of the {{primaryOrderName}}",
  sections: [
    {
      id: "origin",
      title: "Origin of Your Lumenheart",
      description: "A short story of how your light moves through the world.",
      blocks: [
        {
          id: "origin_text",
          type: "text",
          editable: true,
          template:
            "{{userName}}, you carry the light of the {{primaryOrderName}}. From an early age, your energy has moved through the world with {{primaryOrderEssence}}. Even before you had words for it, you felt different – more aware, more sensitive, more tuned to the invisible currents around you.",
        },
      ],
    },
    {
      id: "order_profile",
      title: "Your Order Profile",
      blocks: [
        {
          id: "order_summary",
          type: "text",
          editable: false,
          template:
            "You belong to the Order of the {{primaryOrderName}}. This Order is defined by {{primaryOrderEssence}}. Your light traits include {{primaryOrderLight1}} and {{primaryOrderLight2}}, while your main growth edge lies in {{primaryOrderShadow1}}.",
        },
      ],
    },
    {
      id: "abilities",
      title: "Your Mangix Abilities",
      description: "Symbolic abilities mapped to real strengths and practices.",
      blocks: [
        {
          id: "ability_1",
          type: "list",
          editable: true,
          template:
            "- **Clarity Surge** – Moments where your insight arrives suddenly, helping you see what others miss.\n- **Heart Anchor** – Your capacity to steady others emotionally just by being present.",
        },
      ],
    },
    {
      id: "challenges",
      title: "Quests and Growth Edges",
      blocks: [
        {
          id: "quests_text",
          type: "text",
          editable: true,
          template:
            "Every legend walks through trials. For you, the main quests lie in learning to soften the shadow of {{primaryOrderShadow1}} and to trust your own light even when others don’t understand it.",
        },
      ],
    },
    {
      id: "allies",
      title: "Allies & Support",
      blocks: [
        {
          id: "allies_text",
          type: "text",
          editable: true,
          template:
            "You walk this path alongside many allies – people who see your light, challenge you with care, and remind you who you are when you forget. Use this space to name them, or to call in the kind of allies you want to attract.",
        },
      ],
    },
    {
      id: "forward",
      title: "Your Path Forward",
      blocks: [
        {
          id: "forward_text",
          type: "text",
          editable: true,
          template:
            "From here, your legend unfolds through small, consistent choices. Each time you act in alignment with your {{primaryOrderName}} light, you strengthen your path. This book is not the end of your story – it is the moment you choose to walk it consciously.",
        },
      ],
    },
  ],
};

const deriveContext = (quizResult: QuizResult, userName: string): TemplateContext => {
  const primaryOrder = orders[quizResult.finalOrder];
  const secondaryOrder = orders[quizResult.secondaryOrder];

  return {
    userName: userName || "Seeker",
    primaryOrderId: quizResult.finalOrder,
    primaryOrderName: primaryOrder.name,
    primaryOrderEssence: primaryOrder.essence,
    primaryOrderLight1: primaryOrder.lightTraits[0] ?? "radiant focus",
    primaryOrderLight2: primaryOrder.lightTraits[1] ?? "steady courage",
    primaryOrderShadow1: primaryOrder.veilTraits[0] ?? "an unspoken edge",
    secondaryOrderName: secondaryOrder.name,
    primaryScore: quizResult.scores[quizResult.finalOrder],
    secondaryScore: quizResult.scores[quizResult.secondaryOrder],
  };
};

const buildResolvedBlocks = (templateBlocks: LuminousBookTemplate["sections"][number]["blocks"], context: TemplateContext): ResolvedBlock[] =>
  templateBlocks.map((block) => {
    const resolved = resolveTemplateString(block.template, context);
    return {
      id: block.id,
      type: block.type,
      editable: block.editable,
      value: resolved,
      defaultValue: resolved,
      edited: false,
    } satisfies ResolvedBlock;
  });

export const resolveLuminousBook = (quizResult: QuizResult, userName: string): ResolvedBook => {
  const context = deriveContext(quizResult, userName);
  const sections: ResolvedSection[] = baseTemplate.sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    blocks: buildResolvedBlocks(section.blocks, context),
  }));

  return {
    title: resolveTemplateString(baseTemplate.titleTemplate, context),
    sections,
  };
};

export { baseTemplate as luminousBookTemplate };
