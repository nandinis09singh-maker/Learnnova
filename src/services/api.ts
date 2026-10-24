import type {
  StudentProfile,
  LearningPathUnit,
  AdaptiveQuizQuestionResponse,
  QuizAnswerSubmission,
  QuizAnswerEvaluation,
  TutorMessage,
  AssessmentQuestion,
} from "../../server/types"

const API_BASE = "/api"

export const api = {
  async getProfile(): Promise<StudentProfile> {
    const res = await fetch(`${API_BASE}/profile`)
    if (!res.ok) throw new Error("Failed to fetch profile")
    return res.json()
  },

  async setPersona(persona: "alex" | "maya" | "liam"): Promise<StudentProfile> {
    const res = await fetch(`${API_BASE}/profile/persona`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona }),
    })
    if (!res.ok) throw new Error("Failed to switch persona")
    const data = await res.json()
    return data.profile
  },

  async login(name: string, grade?: string): Promise<StudentProfile> {
    const res = await fetch(`${API_BASE}/profile/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, grade }),
    })
    if (!res.ok) throw new Error("Failed to log in")
    const data = await res.json()
    return data.profile
  },

  async getDiagnosticQuestions(): Promise<{
    count: number
    questions: AssessmentQuestion[]
  }> {
    const res = await fetch(`${API_BASE}/diagnostic/questions`)
    if (!res.ok) throw new Error("Failed to fetch diagnostic questions")
    return res.json()
  },

  async submitDiagnostic(answers: number[]): Promise<{
    profile: StudentProfile
    analysis: {
      score: number
      total: number
      percentage: number
      gapsIdentified: string[]
      startingLevel: string
      aiSummary: string
    }
  }> {
    const res = await fetch(`${API_BASE}/diagnostic/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
    if (!res.ok) throw new Error("Failed to submit diagnostic")
    return res.json()
  },

  async getKnowledgeGraph(): Promise<{
    concepts: StudentProfile["concepts"]
    gaps: StudentProfile["gaps"]
    overallMastery: number
    masteredCount: number
  }> {
    const res = await fetch(`${API_BASE}/knowledge-graph`)
    if (!res.ok) throw new Error("Failed to fetch knowledge graph")
    return res.json()
  },

  async getLearningPath(): Promise<{
    units: LearningPathUnit[]
    totalUnits: number
    currentLevel: string
    remediationUnitsCount: number
    cycleStage: string
  }> {
    const res = await fetch(`${API_BASE}/learning-path`)
    if (!res.ok) throw new Error("Failed to fetch learning path")
    return res.json()
  },

  async completeLessonUnit(unitId: string): Promise<{
    message: string
    profile: StudentProfile
    units: LearningPathUnit[]
  }> {
    const res = await fetch(`${API_BASE}/learning-path/complete-unit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitId }),
    })
    if (!res.ok) throw new Error("Failed to complete lesson unit")
    return res.json()
  },

  async startAdaptiveQuiz(): Promise<AdaptiveQuizQuestionResponse> {
    const res = await fetch(`${API_BASE}/adaptive-quiz/start`)
    if (!res.ok) throw new Error("Failed to start adaptive quiz")
    return res.json()
  },

  async submitAdaptiveAnswer(submission: QuizAnswerSubmission): Promise<{
    evaluation: QuizAnswerEvaluation
    nextQuestion?: AdaptiveQuizQuestionResponse
    updatedProfile: StudentProfile
  }> {
    const res = await fetch(`${API_BASE}/adaptive-quiz/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    })
    if (!res.ok) throw new Error("Failed to submit quiz answer")
    return res.json()
  },

  async sendTutorMessage(
    message: string,
    mode: "explanation" | "analogy" | "step_by_step" | "practice_question" | "socratic" = "explanation",
    activeConceptId?: string,
  ): Promise<TutorMessage> {
    const res = await fetch(`${API_BASE}/tutor/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, mode, activeConceptId }),
    })
    if (!res.ok) throw new Error("Failed to contact AI tutor")
    const data = await res.json()
    return data.reply
  },

  async register(payload: {
    name: string
    password: string
    grade?: string
    email?: string
    username?: string
    role?: "student" | "teacher"
  }): Promise<{
    message: string
    user: {
      id: string
      name: string
      username: string
      grade: string
      role: string
      avatar: string
      email?: string
      isTeacher: boolean
    }
    profile?: StudentProfile
  }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to register")
    return data
  },

  async loginUser(payload: {
    username?: string
    name?: string
    password: string
  }): Promise<{
    message: string
    user: {
      id: string
      name: string
      username: string
      grade: string
      role: string
      avatar: string
      email?: string
      isTeacher: boolean
    }
    profile?: StudentProfile
  }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to log in")
    return data
  },

  async getDatabaseStats(): Promise<{
    status: string
    engine: string
    databasePath: string
    tables: {
      users: number
      studentProfiles: number
      conceptMasteryRecords: number
      diagnosticSubmissions: number
      quizAttempts: number
      tutorMessages: number
    }
    timestamp: string
  }> {
    const res = await fetch(`${API_BASE}/database/stats`)
    if (!res.ok) throw new Error("Failed to fetch database stats")
    return res.json()
  },

  async getTeacherStudents(): Promise<{
    count: number
    students: Array<{
      id: string
      name: string
      grade: string
      avatar: string
      email?: string
      mastery: number
      velocity: number
      streakDays: number
      xp: number
      category: "intervention" | "developing" | "honors"
      cycleStage: number
      recommendedLevel: string
      gaps: string[]
      quizzesTaken: number
      lastActive: string
    }>
  }> {
    const res = await fetch(`${API_BASE}/teacher/students`)
    if (!res.ok) throw new Error("Failed to fetch student roster")
    return res.json()
  },

  async getDemoUsers(): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/demo-users`)
    if (!res.ok) throw new Error("Failed to fetch demo users")
    return res.json()
  },

  async getAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics`)
    if (!res.ok) throw new Error("Failed to fetch analytics")
    return res.json()
  },
}
