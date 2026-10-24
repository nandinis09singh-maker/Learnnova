import { Router, Request, Response } from "express"
import { adaptiveEngine } from "../engine/adaptiveEngine"
import { aiTutorEngine } from "../engine/aiTutorEngine"
import { diagnosticQuestions } from "../data/questionBank"
import { dbRepository } from "../db/repository"

const apiRouter = Router()

// 1. Health & Database Check
apiRouter.get("/health", (_req: Request, res: Response) => {
  const dbStats = dbRepository.getDatabaseStats()
  res.json({
    status: "ok",
    engine: "Learnova Adaptive AI Engine",
    database: "SQLite 3 (WAL mode via Bun)",
    databaseStats: dbStats,
    version: "2.5.0",
    timestamp: new Date().toISOString(),
  })
})

// 2. Database Status Endpoint
apiRouter.get("/database/stats", (_req: Request, res: Response) => {
  try {
    const stats = dbRepository.getDatabaseStats()
    res.json(stats)
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch database stats" })
  }
})

// 3. User Registration / Sign-Up with strict validation
apiRouter.post("/auth/register", (req: Request, res: Response) => {
  try {
    const { name, username, password, grade, email, role } = req.body

    const cleanName = (name || "").trim()
    if (!cleanName) {
      return res.status(400).json({ error: "Name is required." })
    }
    if (cleanName.length < 3) {
      return res.status(400).json({ error: "Name must be at least 3 letters long." })
    }
    if (!/^[a-zA-Z\s]+$/.test(cleanName)) {
      return res.status(400).json({ error: "Name must contain only alphabets (no numbers or special characters)." })
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required." })
    }

    const cleanUsername = (username || cleanName.toLowerCase().replace(/\s+/g, "_")).trim()
    const cleanGrade = grade || "Grade 10"

    // Check if username already exists
    const existing = dbRepository.getUserByUsername(cleanUsername)
    if (existing) {
      return res.status(400).json({ error: "A user with this username or name already exists. Please choose another." })
    }

    // Create user in SQLite
    const user = dbRepository.createUser({
      name: cleanName,
      username: cleanUsername,
      password,
      grade: cleanGrade,
      email: email?.trim(),
      role: role === "teacher" ? "teacher" : "student",
    })

    const profile = user.role === "student" ? dbRepository.getStudentProfile(user.id) : null

    res.json({
      message: "Registration successful!",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        grade: user.grade,
        role: user.role,
        avatar: user.avatar,
        email: user.email,
        isTeacher: user.role === "teacher",
      },
      profile,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to register user" })
  }
})

// 4. User Sign-In / Login
apiRouter.post("/auth/login", (req: Request, res: Response) => {
  try {
    const { username, name, password } = req.body
    const identifier = (username || name || "").trim()

    if (!identifier) {
      return res.status(400).json({ error: "Username or name is required." })
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required." })
    }

    // Try finding by username or name in SQLite
    let user = dbRepository.getUserByUsername(identifier)
    if (!user) {
      // Try searching by name case-insensitively
      const allUsers = dbRepository.getTeacherRoster()
      const match = allUsers.find(
        (u) => u.name.toLowerCase() === identifier.toLowerCase()
      )
      if (match) {
        user = dbRepository.getUserById(match.id)
      }
    }

    if (!user) {
      return res.status(401).json({ error: "User not found. Please sign up first." })
    }

    if (user.password && user.password !== password) {
      return res.status(401).json({ error: "Incorrect password. Please try again." })
    }

    dbRepository.updateLastLogin(user.id)

    const profile = user.role === "student" ? dbRepository.getStudentProfile(user.id) : null

    // Sync in-memory engine for live adaptive calculations
    if (profile) {
      adaptiveEngine.setCustomUser(user.name, user.grade)
    }

    res.json({
      message: `Welcome back, ${user.name}!`,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        grade: user.grade,
        role: user.role,
        avatar: user.avatar,
        email: user.email,
        isTeacher: user.role === "teacher",
      },
      profile,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to log in" })
  }
})

// 5. Demo Users List (Quick testing)
apiRouter.get("/auth/demo-users", (_req: Request, res: Response) => {
  res.json({
    students: [
      { name: "Alex Morgan", username: "alex", grade: "Grade 10", password: "alex123", role: "student" },
      { name: "Maya Patel", username: "maya", grade: "Grade 10", password: "maya123", role: "student" },
      { name: "Liam Chen", username: "liam", grade: "Grade 10", password: "liam123", role: "student" },
    ],
    teacher: {
      name: "Dr. Sharma (Head of Pedagogy)",
      username: "teacher",
      grade: "Faculty / All Grades",
      password: "teacher123",
      role: "teacher",
    },
  })
})

// 6. Teacher Portal: Live Students List from SQLite
apiRouter.get("/teacher/students", (_req: Request, res: Response) => {
  try {
    const students = dbRepository.getTeacherRoster()
    res.json({
      count: students.length,
      students,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch student roster" })
  }
})

// 7. Student Profile (SQLite backed)
apiRouter.get("/profile", (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || "usr_alex_demo"
  const profile = dbRepository.getStudentProfile(userId) || adaptiveEngine.getProfile()
  res.json(profile)
})

// 8. Legacy Profile Login / Setup
apiRouter.post("/profile/login", (req: Request, res: Response) => {
  const { name, grade } = req.body
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Name is required" })
  }
  const cleanName = name.trim()
  const cleanGrade = grade || "Grade 10"

  // Check if exists in SQLite or create
  let user = dbRepository.getUserByUsername(cleanName.toLowerCase().replace(/\s+/g, "_"))
  if (!user) {
    user = dbRepository.createUser({
      name: cleanName,
      username: cleanName.toLowerCase().replace(/\s+/g, "_"),
      password: "password123",
      grade: cleanGrade,
    })
  }

  const updatedProfile = dbRepository.getStudentProfile(user.id) || adaptiveEngine.setCustomUser(cleanName, cleanGrade)
  res.json({
    message: `Logged in as ${cleanName}`,
    profile: updatedProfile,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      grade: user.grade,
      role: user.role,
      avatar: user.avatar,
      isTeacher: false,
    },
  })
})

// 9. Change Persona (Alex / Maya / Liam)
apiRouter.post("/profile/persona", (req: Request, res: Response) => {
  const { persona } = req.body
  if (persona !== "alex" && persona !== "maya" && persona !== "liam") {
    return res
      .status(400)
      .json({ error: 'Invalid persona. Expected "alex", "maya", or "liam"' })
  }
  const updatedProfile = adaptiveEngine.setPersona(persona)
  const user = dbRepository.getUserByUsername(persona)
  if (user) {
    dbRepository.updateLastLogin(user.id)
  }
  res.json({
    message: `Persona switched to ${updatedProfile.name}`,
    profile: updatedProfile,
  })
})

// 10. Diagnostic Assessment Questions
apiRouter.get("/diagnostic/questions", (_req: Request, res: Response) => {
  res.json({
    count: diagnosticQuestions.length,
    questions: diagnosticQuestions,
  })
})

// 11. Submit Diagnostic Assessment Answers (Saves to SQLite)
apiRouter.post("/diagnostic/submit", (req: Request, res: Response) => {
  const { answers, userId } = req.body
  if (!Array.isArray(answers) || answers.length === 0) {
    return res
      .status(400)
      .json({ error: "Answers must be a non-empty array of answer indices" })
  }

  const result = adaptiveEngine.submitDiagnostic(answers)

  // Persist into SQLite
  try {
    const targetUserId = userId || "usr_alex_demo"
    dbRepository.recordDiagnostic({
      userId: targetUserId,
      score: result.analysis.score,
      total: result.analysis.total,
      percentage: result.analysis.percentage,
      gaps: result.analysis.gapsIdentified,
      answers,
      startingLevel: result.analysis.startingLevel,
      aiSummary: result.analysis.aiSummary,
    })

    // Update concept masteries in SQLite
    for (const c of result.profile.concepts) {
      dbRepository.updateConceptMastery(targetUserId, c.id, c.mastery, c.status)
    }

    dbRepository.updateStudentProfile(targetUserId, {
      overallMastery: result.profile.overallMastery,
      cycleStage: 2, // Proceed to Analysis
      recommendedLevel: result.profile.recommendedLevel,
    })
  } catch (err) {
    console.error("Failed to persist diagnostic to SQLite:", err)
  }

  res.json(result)
})

// 12. Knowledge Graph & Gap Analysis
apiRouter.get("/knowledge-graph", (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || "usr_alex_demo"
  const profile = dbRepository.getStudentProfile(userId) || adaptiveEngine.getProfile()
  res.json({
    concepts: profile.concepts,
    gaps: profile.gaps,
    overallMastery: profile.overallMastery,
    masteredCount: profile.masteredCount,
  })
})

// 13. Dynamic Personalized Learning Path
apiRouter.get("/learning-path", (req: Request, res: Response) => {
  const units = adaptiveEngine.generateLearningPath()
  const profile = adaptiveEngine.getProfile()
  res.json({
    units,
    totalUnits: units.length,
    currentLevel: profile.recommendedLevel,
    remediationUnitsCount: units.filter((u) => u.isRemediation).length,
    cycleStage: profile.cycleStage,
  })
})

// 14. Complete a Lesson Unit (Saves to SQLite)
apiRouter.post("/learning-path/complete-unit", (req: Request, res: Response) => {
  const { unitId, userId } = req.body
  if (!unitId) {
    return res.status(400).json({ error: "unitId is required" })
  }

  const updatedProfile = adaptiveEngine.completeLesson(unitId)
  const updatedUnits = adaptiveEngine.generateLearningPath()

  try {
    const targetUserId = userId || "usr_alex_demo"
    dbRepository.recordUnitCompletion(targetUserId, unitId, 100)
    dbRepository.updateStudentProfile(targetUserId, {
      xp: updatedProfile.xp,
      cycleStage: 4,
    })
  } catch (err) {
    console.error("Failed to persist unit completion to SQLite:", err)
  }

  res.json({
    message: "Lesson completed successfully",
    profile: updatedProfile,
    units: updatedUnits,
  })
})

// 15. Start Adaptive Quiz
apiRouter.get("/adaptive-quiz/start", (_req: Request, res: Response) => {
  const firstQuestion = adaptiveEngine.startAdaptiveQuiz()
  res.json(firstQuestion)
})

// 16. Submit Adaptive Quiz Answer (Saves to SQLite)
apiRouter.post("/adaptive-quiz/submit", (req: Request, res: Response) => {
  const { questionId, selectedAnswer, timeSpentSeconds, confidence, userId, grade, subject } = req.body
  if (questionId === undefined || selectedAnswer === undefined) {
    return res
      .status(400)
      .json({ error: "questionId and selectedAnswer are required" })
  }

  const result = adaptiveEngine.submitAdaptiveAnswer({
    questionId,
    selectedAnswer,
    timeSpentSeconds: timeSpentSeconds || 15,
    confidence,
  })

  try {
    const targetUserId = userId || "usr_alex_demo"
    dbRepository.recordQuizAttempt({
      userId: targetUserId,
      grade: grade || "Grade 10",
      subject: subject || "Mathematics",
      questionId,
      selectedAnswer,
      isCorrect: result.evaluation.isCorrect,
      timeSpentSeconds: timeSpentSeconds || 15,
      difficulty: result.evaluation.nextDifficulty || "Medium",
      xpEarned: result.evaluation.xpEarned || 25,
    })

    dbRepository.updateStudentProfile(targetUserId, {
      xp: result.updatedProfile.xp,
      learningVelocity: result.updatedProfile.learningVelocity,
    })
  } catch (err) {
    console.error("Failed to persist quiz attempt to SQLite:", err)
  }

  res.json(result)
})

// 17. AI Tutor Chat (Persists to SQLite)
apiRouter.post("/tutor/chat", (req: Request, res: Response) => {
  const { message, mode, activeConceptId, userId } = req.body
  if (!message) {
    return res.status(400).json({ error: "message is required" })
  }

  const profile = adaptiveEngine.getProfile()
  const tutorReply = aiTutorEngine.generateResponse(
    message,
    mode || "explanation",
    profile,
    activeConceptId,
  )

  // Persist messages to SQLite
  try {
    const targetUserId = userId || "usr_alex_demo"
    dbRepository.recordTutorMessage(targetUserId, "user", message, mode)
    dbRepository.recordTutorMessage(targetUserId, "tutor", tutorReply.text, mode)
  } catch (err) {
    console.error("Failed to save tutor message to SQLite:", err)
  }

  res.json({ reply: tutorReply })
})

// 18. Tutor Chat History
apiRouter.get("/tutor/history", (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || "usr_alex_demo"
  const history = dbRepository.getTutorMessages(userId, 30)
  res.json({ history })
})

// 19. Analytics & Insights
apiRouter.get("/analytics", (_req: Request, res: Response) => {
  const profile = adaptiveEngine.getProfile()
  const concepts = profile.concepts

  const strengthCount = concepts.filter((c) => c.mastery >= 75).length
  const developingCount = concepts.filter(
    (c) => c.mastery >= 50 && c.mastery < 75,
  ).length
  const gapCount = concepts.filter((c) => c.mastery < 50).length

  res.json({
    overallMastery: profile.overallMastery,
    learningVelocity: profile.learningVelocity,
    streakDays: profile.streakDays,
    studyTimeMinutes: profile.studyTimeMinutes,
    xp: profile.xp,
    strengthCount,
    developingCount,
    gapCount,
    gaps: profile.gaps,
    cycleStage: profile.cycleStage,
    conceptsBreakdown: concepts.map((c) => ({
      name: c.name,
      mastery: c.mastery,
      status: c.status,
      bloomLevel: c.bloomLevel,
    })),
  })
})

export default apiRouter
