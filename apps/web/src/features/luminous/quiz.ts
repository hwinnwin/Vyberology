import { answerOrderMap, orders, orderKeys } from "./data";
import { OrderKey, QuizResult } from "./types";

const lifePathWeights: Record<number, OrderKey> = {
  11: "Dawnbearer",
  22: "Stonecaller",
  33: "Heartforged",
};

const mapAnswerToOrder = (answer: string): OrderKey | null => {
  const normalized = answer.trim().toUpperCase();
  return answerOrderMap[normalized] ?? null;
};

const reduceToDigit = (value: number): number => {
  let total = value;
  while (total > 9 && total !== 11 && total !== 22 && total !== 33) {
    total = total
      .toString()
      .split("")
      .reduce((sum, digit) => sum + Number.parseInt(digit, 10), 0);
  }
  return total;
};

export const calculateLifePath = (dob: string): number => {
  const digits = dob.replace(/\D/g, "");
  const rawTotal = digits
    .split("")
    .filter(Boolean)
    .reduce((sum, digit) => sum + Number.parseInt(digit, 10), 0);
  return reduceToDigit(rawTotal);
};

export const scoreQuiz = (answers: string[], dob: string): QuizResult => {
  const scores: Record<OrderKey, number> = {
    Dawnbearer: 0,
    Heartforged: 0,
    Starweaver: 0,
    Stonecaller: 0,
    Stormbound: 0,
    Shadowmancer: 0,
  };

  answers.forEach((answer) => {
    const order = mapAnswerToOrder(answer);
    if (order) {
      scores[order] += 1;
    }
  });

  const lifePath = calculateLifePath(dob);
  const weightOrder = lifePathWeights[lifePath];
  if (weightOrder) {
    scores[weightOrder] += 3;
  }

  const finalOrder = orderKeys.reduce((currentTop, candidate) =>
    scores[candidate] > scores[currentTop] ? candidate : currentTop
  , orderKeys[0]);

  return {
    finalOrder,
    scores,
    lifePath,
    lumenheart: orders[finalOrder].defaultLumenheart,
  };
};
