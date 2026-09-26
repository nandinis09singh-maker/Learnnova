export type LearningProfile = {
  overallMastery: number;
  mastered: number;
  gaps: string[];
  recommendedLevel: string;
  concepts: { name: string; mastery: number; note: string }[];
  updatedAt: string;
};

export const diagnosticQuestions = [
  {
    topic: "Algebra foundations",
    difficulty: "Foundation",
    prompt: "Which expression is equivalent to 3(x + 4) − 2x?",
    answers: ["x + 12", "x + 4", "5x + 12", "x + 10"],
    correct: 0,
  },
  {
    topic: "Factoring",
    difficulty: "Intermediate",
    prompt: "Which is the factored form of x² + 5x + 6?",
    answers: ["(x + 1)(x + 6)", "(x + 2)(x + 3)", "(x − 2)(x − 3)", "(x + 5)(x + 1)"],
    correct: 1,
  },
  {
    topic: "Functions",
    difficulty: "Intermediate",
    prompt: "If f(x) = 2x² − 1, what is f(3)?",
    answers: ["5", "11", "17", "35"],
    correct: 2,
  },
  {
    topic: "Graph transformations",
    difficulty: "Challenge",
    prompt: "How does y = (x − 4)² compare with y = x²?",
    answers: ["4 units left", "4 units right", "4 units up", "4 units down"],
    correct: 1,
  },
];

const baseProfile: LearningProfile = {
  overallMastery: 68,
  mastered: 18,
  gaps: ["Graph transformations", "Completing the square"],
  recommendedLevel: "Intermediate",
  concepts: [
    { name: "Linear equations", mastery: 88, note: "Strong" },
    { name: "Algebraic expressions", mastery: 81, note: "Strong" },
    { name: "Factoring", mastery: 64, note: "Developing" },
    { name: "Quadratic functions", mastery: 57, note: "In progress" },
    { name: "Graph transformations", mastery: 38, note: "Knowledge gap" },
  ],
  updatedAt: new Date().toISOString(),
};

export function getInitialProfile(): LearningProfile {
  try {
    const stored = localStorage.getItem("learnova-profile");
    return stored ? JSON.parse(stored) : baseProfile;
  } catch {
    return baseProfile;
  }
}

export function answerDiagnostic(answers: number[]): LearningProfile {
  const score = answers.reduce((sum, answer, index) => sum + (answer === diagnosticQuestions[index].correct ? 1 : 0), 0);
  const mastery = 42 + score * 13;
  const transformationsCorrect = answers[3] === diagnosticQuestions[3].correct;
  const factoringCorrect = answers[1] === diagnosticQuestions[1].correct;
  const gaps = [
    ...(!transformationsCorrect ? ["Graph transformations"] : []),
    ...(!factoringCorrect ? ["Factoring expressions"] : []),
    ...(score < 3 ? ["Completing the square"] : []),
  ];
  return {
    ...baseProfile,
    overallMastery: mastery,
    mastered: 15 + score,
    gaps: gaps.length ? gaps : ["Advanced function composition"],
    recommendedLevel: score >= 3 ? "Intermediate" : "Foundation",
    concepts: baseProfile.concepts.map((concept, index) => ({
      ...concept,
      mastery: Math.min(96, Math.max(28, concept.mastery + (answers[index % answers.length] === diagnosticQuestions[index % answers.length].correct ? 7 : -6))),
    })),
    updatedAt: new Date().toISOString(),
  };
}

export function saveProfile(profile: LearningProfile) {
  try {
    localStorage.setItem("learnova-profile", JSON.stringify(profile));
  } catch {
    // The app remains usable when storage is unavailable.
  }
}
