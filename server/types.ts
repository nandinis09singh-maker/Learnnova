export type MasteryStatus = "mastered" | "developing" | "gap" | "in_progress" | "locked"

export type DifficultyLevel = "Foundation" | "Developing" | "Proficient" | "Advanced" | "Mastery"

export interface ConceptNode {
  id: string
  name: string
  topic: string
  description: string
  prerequisites: string[] // IDs of prerequisite concepts
  mastery: number // 0 - 100
  status: MasteryStatus
  bloomLevel: "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate"
  recommendedAction?: string
  weight: number
}

export interface QuestionOption {
  text: string
  isCorrect: boolean
  misconceptionFeedback?: string
}

export interface AssessmentQuestion {
  id: string
  conceptId: string
  conceptName: string
  topic: string
  difficulty: DifficultyLevel
  difficultyScore: number // 1 to 5
  prompt: string
  answers: string[]
  correct: number
  explanation: string
  prerequisiteHint?: string
  visualAid?: string
}

export interface GapAnalysisItem {
  conceptId: string
  conceptName: string
  mastery: number
  impactScore: number // how many downstream concepts are blocked
  blockedConcepts: string[]
  recommendedPrerequisite: string
  remediationAction: string
  priority: "High" | "Medium" | "Low"
}

export interface LearningPathUnit {
  id: string
  order: number
  unitCode: string
  title: string
  conceptId: string
  description: string
  durationMinutes: number
  status: "completed" | "in_progress" | "remediation" | "locked"
  score?: number
  isRemediation: boolean
  aiRationale: string
  prerequisiteNames: string[]
  lessonContent?: {
    overview: string
    keyPoints: string[]
    formulaOrRule?: string
    interactiveExample?: {
      problem: string
      solution: string
      tip: string
    }
  }
}

export interface AdaptiveQuizQuestionResponse {
  question: AssessmentQuestion
  currentTier: DifficultyLevel
  tierScore: number
  streak: number
  estimatedAbility: number // 0 - 100
  adaptationReason: string
  questionNumber: number
  totalQuestions: number
}

export interface QuizAnswerSubmission {
  questionId: string
  selectedAnswer: number
  timeSpentSeconds: number
  confidence?: "low" | "medium" | "high"
}

export interface QuizAnswerEvaluation {
  isCorrect: boolean
  correctAnswerIndex: number
  explanation: string
  prerequisiteGapDetected?: string
  difficultyChange: "increased" | "decreased" | "maintained"
  newTier: DifficultyLevel
  masteryDelta: number
  conceptId: string
  conceptMastery: number
  xpEarned: number
  aiFeedback: string
  nextRecommendedAction: string
}

export interface StudentProfile {
  id: string
  name: string
  grade: string
  avatar: string
  overallMastery: number
  masteredCount: number
  totalConcepts: number
  recommendedLevel: DifficultyLevel
  gaps: GapAnalysisItem[]
  concepts: ConceptNode[]
  learningVelocity: number // % gain per session
  streakDays: number
  xp: number
  studyTimeMinutes: number
  cycleStage: "Assessment" | "Knowledge Analysis" | "Personalized Learning" | "Adaptive Quiz" | "Updated Recommendations"
  recentActivities: {
    id: string
    title: string
    type: "diagnostic" | "adaptive_quiz" | "lesson_completed" | "gap_identified"
    timestamp: string
    badge: string
  }[]
  updatedAt: string
}

export interface TutorMessage {
  id: string
  from: "ai" | "user"
  text: string
  timestamp: string
  mode?: "explanation" | "analogy" | "step_by_step" | "practice_question" | "socratic"
  relatedConcept?: string
  practiceProblem?: {
    prompt: string
    hint: string
    solution: string
  }
}
