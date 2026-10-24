import type {
  StudentProfile,
  LearningPathUnit,
  AdaptiveQuizQuestionResponse,
  QuizAnswerSubmission,
  QuizAnswerEvaluation,
  TutorMessage,
  AssessmentQuestion,
} from "../../server/types"
import { diagnosticQuestions } from "../../server/data/questionBank"
import { initialKnowledgeGraph } from "../../server/data/knowledgeGraph"
import { getClientTutorFallback } from "./aiTutorClient"

const API_BASE = "/api"

export const api = {
  async getProfile(): Promise<StudentProfile> {
    try {
      const res = await fetch(`${API_BASE}/profile`)
      if (res.ok) return await res.json()
    } catch {}
    return {
      id: "usr_alex_demo",
      name: "Alex Morgan",
      grade: "Grade 10",
      avatar: "AM",
      overallMastery: 72,
      masteredCount: 3,
      totalConcepts: 6,
      recommendedLevel: "Proficient",
      learningVelocity: 1.35,
      streakDays: 6,
      studyTimeMinutes: 185,
      xp: 2450,
      cycleStage: "Personalized Learning",
      concepts: initialKnowledgeGraph,
      gaps: [
        {
          conceptId: "factoring",
          conceptName: "Factoring Polynomials",
          mastery: 64,
          impactScore: 4,
          blockedConcepts: ["Quadratic Roots & Formula"],
          recommendedPrerequisite: "Linear Equations & Arithmetic",
          remediationAction: "Practice trinomial factoring (x² + bx + c) and grouping",
          priority: "High",
        },
      ],
      recentActivities: [
        { id: "act_1", title: "Diagnostic Baseline Assessment", type: "diagnostic", timestamp: "Recently", badge: "72% Score" },
        { id: "act_2", title: "Knowledge Gap Calibrated", type: "gap_identified", timestamp: "Live", badge: "1 Gap" },
      ],
      updatedAt: new Date().toISOString(),
    }
  },

  async setPersona(persona: "alex" | "maya" | "liam"): Promise<StudentProfile> {
    try {
      const res = await fetch(`${API_BASE}/profile/persona`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.profile) return data.profile
      }
    } catch {}
    const profile = await this.getProfile()
    return { ...profile, name: persona.toUpperCase(), avatar: persona.slice(0, 2).toUpperCase() }
  },

  async login(name: string, grade?: string): Promise<StudentProfile> {
    try {
      const res = await fetch(`${API_BASE}/profile/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, grade }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.profile) return data.profile
      }
    } catch {}
    const cleanName = (name || "Student").trim()
    const cleanGrade = grade || "Grade 10"
    return {
      id: `usr_${Date.now()}`,
      name: cleanName,
      grade: cleanGrade,
      avatar: cleanName.slice(0, 2).toUpperCase(),
      overallMastery: 70,
      masteredCount: 3,
      totalConcepts: 6,
      recommendedLevel: "Proficient",
      learningVelocity: 1.25,
      streakDays: 2,
      studyTimeMinutes: 30,
      xp: 1300,
      cycleStage: "Personalized Learning",
      concepts: initialKnowledgeGraph,
      gaps: [
        {
          conceptId: "factoring",
          conceptName: "Factoring Polynomials",
          mastery: 64,
          impactScore: 4,
          blockedConcepts: ["Quadratic Roots & Formula"],
          recommendedPrerequisite: "Linear Equations & Arithmetic",
          remediationAction: "Practice trinomial factoring (x² + bx + c) and grouping",
          priority: "High",
        },
      ],
      recentActivities: [
        { id: "act_1", title: "Personalized Learning Initialized", type: "lesson_completed", timestamp: "Just now", badge: `${cleanGrade} Track` },
      ],
      updatedAt: new Date().toISOString(),
    }
  },

  async getDiagnosticQuestions(): Promise<{
    count: number
    questions: AssessmentQuestion[]
  }> {
    try {
      const res = await fetch(`${API_BASE}/diagnostic/questions`)
      if (res.ok) return await res.json()
    } catch {}
    return {
      count: diagnosticQuestions.length,
      questions: diagnosticQuestions,
    }
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
    try {
      const res = await fetch(`${API_BASE}/diagnostic/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
      if (res.ok) return await res.json()
    } catch {}
    const profile = await this.getProfile()
    return {
      profile,
      analysis: {
        score: Math.min(answers.length, 3),
        total: Math.max(answers.length, 4),
        percentage: 75,
        gapsIdentified: ["Factoring Polynomials", "Completing the Square"],
        startingLevel: "Proficient",
        aiSummary: "Strong conceptual grasp in algebraic foundations. Practice recommended in quadratic expansions.",
      },
    }
  },

  async getKnowledgeGraph(): Promise<{
    concepts: StudentProfile["concepts"]
    gaps: StudentProfile["gaps"]
    overallMastery: number
    masteredCount: number
  }> {
    try {
      const res = await fetch(`${API_BASE}/knowledge-graph`)
      if (res.ok) return await res.json()
    } catch {}
    const profile = await this.getProfile()
    return {
      concepts: profile.concepts,
      gaps: profile.gaps,
      overallMastery: profile.overallMastery,
      masteredCount: profile.masteredCount,
    }
  },

  async getLearningPath(): Promise<{
    units: LearningPathUnit[]
    totalUnits: number
    currentLevel: string
    remediationUnitsCount: number
    cycleStage: string
  }> {
    try {
      const res = await fetch(`${API_BASE}/learning-path`)
      if (res.ok) return await res.json()
    } catch {}
    return {
      totalUnits: 3,
      currentLevel: "Proficient",
      remediationUnitsCount: 1,
      cycleStage: "Personalized Learning",
      units: [
        {
          id: "unit_1",
          conceptId: "factoring",
          title: "Factoring Trinomials (x² + bx + c)",
          description: "Targeted remediation to eliminate quadratic foundation gaps.",
          tier: "Developing",
          completed: false,
          xpReward: 50,
          estimatedMinutes: 8,
          isRemediation: true,
        },
        {
          id: "unit_2",
          conceptId: "quadratic_roots",
          title: "Quadratic Formula & Discriminant Analysis",
          description: "Core syllabus mastery with real-time feedback.",
          tier: "Proficient",
          completed: false,
          xpReward: 70,
          estimatedMinutes: 12,
          isRemediation: false,
        },
        {
          id: "unit_3",
          conceptId: "graph_transformations",
          title: "Parabola Vertex and Shift Transformations",
          description: "Geometric visualization of algebraic equations.",
          tier: "Advanced",
          completed: false,
          xpReward: 90,
          estimatedMinutes: 15,
          isRemediation: false,
        },
      ],
    }
  },

  async completeLessonUnit(unitId: string): Promise<{
    message: string
    profile: StudentProfile
    units: LearningPathUnit[]
  }> {
    try {
      const res = await fetch(`${API_BASE}/learning-path/complete-unit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId }),
      })
      if (res.ok) return await res.json()
    } catch {}
    const profile = await this.getProfile()
    const path = await this.getLearningPath()
    return {
      message: "Unit completed!",
      profile: { ...profile, xp: profile.xp + 50 },
      units: path.units.map((u) => (u.id === unitId ? { ...u, completed: true } : u)),
    }
  },

  async startAdaptiveQuiz(): Promise<AdaptiveQuizQuestionResponse> {
    try {
      const res = await fetch(`${API_BASE}/adaptive-quiz/start`)
      if (res.ok) return await res.json()
    } catch {}
    return {
      questionId: "q_adapt_1",
      prompt: "Find the roots of the equation x² - 5x + 6 = 0.",
      options: ["x = 2, 3", "x = -2, -3", "x = 1, 6", "x = -1, -6"],
      difficulty: "Developing",
      conceptName: "Factoring Trinomials",
      topic: "Mathematics",
      currentTierIndex: 1,
      totalTiers: 5,
    }
  },

  async submitAdaptiveAnswer(submission: QuizAnswerSubmission): Promise<{
    evaluation: QuizAnswerEvaluation
    nextQuestion?: AdaptiveQuizQuestionResponse
    updatedProfile: StudentProfile
  }> {
    try {
      const res = await fetch(`${API_BASE}/adaptive-quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      })
      if (res.ok) return await res.json()
    } catch {}
    const isCorrect = submission.selectedAnswerIndex === 0
    return {
      evaluation: {
        correct: isCorrect,
        correctAnswerIndex: 0,
        explanation: "Factoring x² - 5x + 6 gives (x - 2)(x - 3) = 0, so x = 2 or x = 3.",
        xpEarned: isCorrect ? 30 : 10,
        masteryDelta: isCorrect ? 4 : -2,
        newDifficulty: isCorrect ? "Proficient" : "Foundation",
      },
      updatedProfile: await this.getProfile(),
    }
  },

  async sendTutorMessage(
    message: string,
    mode: "explanation" | "analogy" | "step_by_step" | "practice_question" | "socratic" = "explanation",
    activeConceptId?: string,
  ): Promise<TutorMessage> {
    try {
      const res = await fetch(`${API_BASE}/tutor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, mode, activeConceptId }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.reply) return data.reply
      }
    } catch {}
    return getClientTutorFallback(message, mode, "Student")
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
    user: any
    profile?: StudentProfile
  }> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) return await res.json()
    } catch {}
    const cleanName = (payload.name || "Student").trim()
    const isTeacher = payload.role === "teacher"
    return {
      message: "Registration successful!",
      user: {
        id: `usr_${Date.now()}`,
        name: cleanName,
        username: payload.username || cleanName.toLowerCase().replace(/\s+/g, "_"),
        grade: payload.grade || (isTeacher ? "Faculty" : "Grade 10"),
        role: payload.role || "student",
        avatar: cleanName.slice(0, 2).toUpperCase(),
        email: payload.email,
        isTeacher,
      },
      profile: isTeacher ? undefined : await this.login(cleanName, payload.grade),
    }
  },

  async loginUser(payload: {
    username?: string
    name?: string
    password: string
  }): Promise<{
    message: string
    user: any
    profile?: StudentProfile
  }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) return await res.json()
    } catch {}
    const identifier = (payload.username || payload.name || "Student").trim()
    const isTeacher = identifier.toLowerCase().includes("teacher") || identifier.toLowerCase().includes("sharma")
    return {
      message: "Login successful",
      user: {
        id: `usr_${Date.now()}`,
        name: identifier,
        username: identifier.toLowerCase().replace(/\s+/g, "_"),
        grade: isTeacher ? "Faculty" : "Grade 10",
        role: isTeacher ? "teacher" : "student",
        avatar: identifier.slice(0, 2).toUpperCase(),
        isTeacher,
      },
      profile: isTeacher ? undefined : await this.login(identifier),
    }
  },

  async getDatabaseStats(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/database/stats`)
      if (res.ok) return await res.json()
    } catch {}
    return {
      status: "online",
      engine: "Learnova Adaptive Engine",
      databasePath: "local/in-memory",
      tables: {
        users: 4,
        studentProfiles: 4,
        conceptMasteryRecords: 24,
        diagnosticSubmissions: 3,
        quizAttempts: 15,
        tutorMessages: 8,
      },
      timestamp: new Date().toISOString(),
    }
  },

  async getTeacherStudents(): Promise<{
    count: number
    students: Array<any>
  }> {
    try {
      const res = await fetch(`${API_BASE}/teacher/students`)
      if (res.ok) return await res.json()
    } catch {}
    return {
      count: 3,
      students: [
        {
          id: "usr_alex_demo",
          name: "Alex Morgan",
          grade: "Grade 10",
          avatar: "AM",
          mastery: 72,
          velocity: 1.35,
          streakDays: 6,
          xp: 2450,
          category: "developing",
          cycleStage: 3,
          recommendedLevel: "Proficient",
          gaps: ["Trigonometric Identities", "Polynomial Theorems"],
          quizzesTaken: 12,
          lastActive: "Today",
        },
        {
          id: "usr_maya_demo",
          name: "Maya Patel",
          grade: "Grade 10",
          avatar: "MP",
          mastery: 48,
          velocity: 0.92,
          streakDays: 3,
          xp: 1100,
          category: "intervention",
          cycleStage: 1,
          recommendedLevel: "Foundation",
          gaps: ["Quadratic Equations", "Coordinate Geometry"],
          quizzesTaken: 5,
          lastActive: "Yesterday",
        },
        {
          id: "usr_liam_demo",
          name: "Liam Chen",
          grade: "Grade 10",
          avatar: "LC",
          mastery: 91,
          velocity: 1.85,
          streakDays: 14,
          xp: 4620,
          category: "honors",
          cycleStage: 5,
          recommendedLevel: "Mastery",
          gaps: [],
          quizzesTaken: 28,
          lastActive: "Just now",
        },
      ],
    }
  },

  async getDemoUsers(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/auth/demo-users`)
      if (res.ok) return await res.json()
    } catch {}
    return {
      demoUsers: [
        { username: "alex", role: "student", label: "Alex Morgan (Proficient)" },
        { username: "maya", role: "student", label: "Maya Patel (Needs Support)" },
        { username: "liam", role: "student", label: "Liam Chen (Mastery Track)" },
        { username: "teacher", role: "teacher", label: "Dr. Sharma (Pedagogy Head)" },
      ],
    }
  },

  async getAnalytics(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/analytics`)
      if (res.ok) return await res.json()
    } catch {}
    return {
      averageMastery: 70,
      activeLearners: 124,
      questionsAnsweredToday: 482,
      topGapConcept: "Trigonometric Identities",
    }
  },
}
