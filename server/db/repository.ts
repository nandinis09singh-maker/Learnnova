import { db } from "./database"
import type { StudentProfile, ConceptNode } from "../types"

export interface UserRecord {
  id: string
  username: string
  password?: string
  role: "student" | "teacher" | "admin"
  name: string
  grade: string
  email?: string
  avatar?: string
  created_at: string
  last_login_at?: string
}

export const dbRepository = {
  /**
   * Find user by username
   */
  getUserByUsername(username: string): UserRecord | null {
    const row = db.query("SELECT * FROM users WHERE username = ? COLLATE NOCASE").get(username) as UserRecord | null
    return row
  },

  /**
   * Find user by id
   */
  getUserById(id: string): UserRecord | null {
    const row = db.query("SELECT * FROM users WHERE id = ?").get(id) as UserRecord | null
    return row
  },

  /**
   * Create a new user and associated student profile
   */
  createUser(params: {
    username: string
    password: string
    name: string
    grade: string
    role?: "student" | "teacher"
    email?: string
  }): UserRecord {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const avatar = params.name.slice(0, 2).toUpperCase()
    const role = params.role || "student"

    db.run(
      `INSERT INTO users (id, username, password, role, name, grade, email, avatar, created_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, params.username, params.password, role, params.name, params.grade, params.email || null, avatar]
    )

    if (role === "student") {
      db.run(
        `INSERT INTO student_profiles (user_id, persona, overall_mastery, recommended_level, learning_velocity, streak_days, study_time_minutes, xp, cycle_stage)
         VALUES (?, 'custom', 55, 'Developing', 1.0, 1, 15, 500, 1)`,
        [id]
      )

      // Initialize default core concepts for this student
      const initialConcepts = [
        { id: "c1", name: "Quadratic Equations", subject: "Mathematics", mastery: 50, status: "developing", bloom: "Understand", conf: 60 },
        { id: "c2", name: "Trigonometric Identities", subject: "Mathematics", mastery: 35, status: "gap", bloom: "Remember", conf: 40 },
        { id: "c3", name: "Linear Inequalities", subject: "Mathematics", mastery: 65, status: "developing", bloom: "Apply", conf: 70 },
        { id: "c4", name: "Coordinate Geometry", subject: "Mathematics", mastery: 55, status: "developing", bloom: "Understand", conf: 55 },
        { id: "c5", name: "Polynomial Theorems", subject: "Mathematics", mastery: 40, status: "gap", bloom: "Understand", conf: 45 },
        { id: "c6", name: "Arithmetic Progressions", subject: "Mathematics", mastery: 75, status: "mastered", bloom: "Apply", conf: 80 },
      ]

      for (const c of initialConcepts) {
        db.run(
          `INSERT INTO concept_mastery (user_id, concept_id, name, subject, mastery, status, bloom_level, confidence)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, c.id, c.name, c.subject, c.mastery, c.status, c.bloom, c.conf]
        )
      }
    }

    return this.getUserById(id)!
  },

  /**
   * Update user last login timestamp
   */
  updateLastLogin(userId: string) {
    db.run("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", [userId])
  },

  /**
   * Get full student profile including concepts and gaps
   */
  getStudentProfile(userId: string): StudentProfile | null {
    const user = this.getUserById(userId)
    if (!user) return null

    const profileRow = db.query("SELECT * FROM student_profiles WHERE user_id = ?").get(userId) as any
    if (!profileRow) return null

    const conceptRows = db.query("SELECT * FROM concept_mastery WHERE user_id = ? ORDER BY id ASC").all(userId) as any[]

    const concepts: ConceptNode[] = conceptRows.map((c) => ({
      id: c.concept_id,
      name: c.name,
      subject: c.subject,
      mastery: c.mastery,
      status: c.status as "mastered" | "developing" | "gap",
      bloomLevel: c.bloom_level,
      prerequisites: [],
      relatedIds: [],
      confidence: c.confidence,
      difficultyScore: 3,
    }))

    const gaps = concepts
      .filter((c) => c.status === "gap" || c.mastery < 50)
      .map((c) => ({
        conceptId: c.id,
        conceptName: c.name,
        mastery: c.mastery,
        impactScore: 4,
        blockedConcepts: ["Advanced Problem Solving", "Board Exam Prep"],
        recommendedPrerequisite: "Foundations & Practice",
        remediationAction: `Practice targeted modules on ${c.name}`,
        priority: (c.mastery < 40 ? "High" : "Medium") as "High" | "Medium" | "Low",
      }))

    const masteredCount = concepts.filter((c) => c.status === "mastered" || c.mastery >= 75).length

    const cycleStages = [
      "Assessment",
      "Knowledge Analysis",
      "Personalized Learning",
      "Adaptive Quiz",
      "Updated Recommendations",
    ] as const
    const stageIdx = Math.min(Math.max((profileRow.cycle_stage || 1) - 1, 0), 4)

    return {
      id: user.id,
      name: user.name,
      grade: user.grade,
      avatar: user.avatar || user.name.slice(0, 2).toUpperCase(),
      overallMastery: profileRow.overall_mastery,
      masteredCount,
      totalConcepts: concepts.length,
      learningVelocity: profileRow.learning_velocity,
      streakDays: profileRow.streak_days,
      studyTimeMinutes: profileRow.study_time_minutes,
      xp: profileRow.xp,
      cycleStage: cycleStages[stageIdx],
      recommendedLevel: profileRow.recommended_level,
      concepts,
      gaps,
      recentActivities: [
        {
          id: "act_1",
          title: "Diagnostic Baseline Assessment",
          type: "diagnostic",
          timestamp: "Recently",
          badge: `${profileRow.overall_mastery}% Score`,
        },
        {
          id: "act_2",
          title: "Knowledge Gap Calibrated",
          type: "gap_identified",
          timestamp: "Live",
          badge: `${gaps.length} Gaps`,
        },
        {
          id: "act_3",
          title: "Adaptive Problem Set Attempted",
          type: "adaptive_quiz",
          timestamp: "Today",
          badge: "+30 XP",
        },
      ],
      updatedAt: profileRow.updated_at || new Date().toISOString(),
    }
  },

  /**
   * Update student profile fields (e.g. after quiz, lesson, or diagnostic)
   */
  updateStudentProfile(
    userId: string,
    updates: {
      overallMastery?: number
      learningVelocity?: number
      streakDays?: number
      studyTimeMinutes?: number
      xp?: number
      cycleStage?: number
      recommendedLevel?: string
    }
  ) {
    const fields: string[] = []
    const values: any[] = []

    if (updates.overallMastery !== undefined) {
      fields.push("overall_mastery = ?")
      values.push(updates.overallMastery)
    }
    if (updates.learningVelocity !== undefined) {
      fields.push("learning_velocity = ?")
      values.push(updates.learningVelocity)
    }
    if (updates.streakDays !== undefined) {
      fields.push("streak_days = ?")
      values.push(updates.streakDays)
    }
    if (updates.studyTimeMinutes !== undefined) {
      fields.push("study_time_minutes = ?")
      values.push(updates.studyTimeMinutes)
    }
    if (updates.xp !== undefined) {
      fields.push("xp = ?")
      values.push(updates.xp)
    }
    if (updates.cycleStage !== undefined) {
      fields.push("cycle_stage = ?")
      values.push(updates.cycleStage)
    }
    if (updates.recommendedLevel !== undefined) {
      fields.push("recommended_level = ?")
      values.push(updates.recommendedLevel)
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')")
      values.push(userId)
      db.run(`UPDATE student_profiles SET ${fields.join(", ")} WHERE user_id = ?`, values)
    }
  },

  /**
   * Update individual concept mastery in the database
   */
  updateConceptMastery(
    userId: string,
    conceptId: string,
    mastery: number,
    status?: "mastered" | "developing" | "gap"
  ) {
    const calculatedStatus = status || (mastery >= 75 ? "mastered" : mastery >= 50 ? "developing" : "gap")
    db.run(
      `UPDATE concept_mastery
       SET mastery = ?, status = ?, updated_at = datetime('now')
       WHERE user_id = ? AND concept_id = ?`,
      [mastery, calculatedStatus, userId, conceptId]
    )

    // Recalculate and update overall mastery for profile
    const avgRow = db
      .query("SELECT AVG(mastery) as avg_mastery FROM concept_mastery WHERE user_id = ?")
      .get(userId) as { avg_mastery: number } | null
    if (avgRow && avgRow.avg_mastery !== null) {
      const overall = Math.round(avgRow.avg_mastery)
      db.run("UPDATE student_profiles SET overall_mastery = ?, updated_at = datetime('now') WHERE user_id = ?", [
        overall,
        userId,
      ])
    }
  },

  /**
   * Record a diagnostic assessment submission
   */
  recordDiagnostic(submission: {
    userId: string
    score: number
    total: number
    percentage: number
    gaps: string[]
    answers: number[]
    startingLevel: string
    aiSummary: string
  }) {
    const id = `diag_${Date.now()}`
    db.run(
      `INSERT INTO diagnostic_submissions (id, user_id, score, total, percentage, gaps_json, answers_json, starting_level, ai_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        submission.userId,
        submission.score,
        submission.total,
        submission.percentage,
        JSON.stringify(submission.gaps),
        JSON.stringify(submission.answers),
        submission.startingLevel,
        submission.aiSummary,
      ]
    )
    return id
  },

  /**
   * Record adaptive quiz answer attempt
   */
  recordQuizAttempt(attempt: {
    userId: string
    grade: string
    subject: string
    questionId: string
    selectedAnswer: number
    isCorrect: boolean
    timeSpentSeconds: number
    difficulty: string
    xpEarned: number
  }) {
    const id = `qa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    db.run(
      `INSERT INTO quiz_attempts (id, user_id, grade, subject, question_id, selected_answer, is_correct, time_spent_seconds, difficulty, xp_earned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        attempt.userId,
        attempt.grade,
        attempt.subject,
        attempt.questionId,
        attempt.selectedAnswer,
        attempt.isCorrect ? 1 : 0,
        attempt.timeSpentSeconds,
        attempt.difficulty,
        attempt.xpEarned,
      ]
    )

    // Increment student XP
    db.run("UPDATE student_profiles SET xp = xp + ?, updated_at = datetime('now') WHERE user_id = ?", [
      attempt.xpEarned,
      attempt.userId,
    ])

    return id
  },

  /**
   * Record completion of a learning unit
   */
  recordUnitCompletion(userId: string, unitId: string, score: number = 100) {
    db.run(
      `INSERT OR REPLACE INTO learning_path_progress (user_id, unit_id, completed, score, completed_at)
       VALUES (?, ?, 1, ?, datetime('now'))`,
      [userId, unitId, score]
    )

    // Award 50 XP
    db.run("UPDATE student_profiles SET xp = xp + 50, updated_at = datetime('now') WHERE user_id = ?", [userId])
  },

  /**
   * Record AI Tutor Chat Message
   */
  recordTutorMessage(userId: string, sender: "user" | "tutor", message: string, mode: string = "explanation") {
    db.run(
      `INSERT INTO tutor_messages (user_id, sender, message, mode)
       VALUES (?, ?, ?, ?)`,
      [userId, sender, message, mode]
    )
  },

  /**
   * Get student's tutor chat history
   */
  getTutorMessages(userId: string, limit: number = 20) {
    return db
      .query("SELECT * FROM tutor_messages WHERE user_id = ? ORDER BY id DESC LIMIT ?")
      .all(userId, limit)
  },

  /**
   * Teacher / Educator query: Get live list of all students with their masteries & gaps
   */
  getTeacherRoster() {
    const students = db
      .query(`
        SELECT u.id, u.username, u.name, u.grade, u.avatar, u.email, u.last_login_at,
               sp.overall_mastery, sp.recommended_level, sp.learning_velocity, sp.streak_days, sp.study_time_minutes, sp.xp, sp.cycle_stage
        FROM users u
        JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.role = 'student'
        ORDER BY sp.overall_mastery ASC
      `)
      .all() as any[]

    return students.map((s) => {
      // Fetch gaps for this student
      const gaps = db
        .query(
          "SELECT name FROM concept_mastery WHERE user_id = ? AND (status = 'gap' OR mastery < 50)"
        )
        .all(s.id) as { name: string }[]

      const quizCount = db
        .query("SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ?")
        .get(s.id) as { count: number }

      let category: "intervention" | "developing" | "honors" = "developing"
      if (s.overall_mastery < 60) category = "intervention"
      else if (s.overall_mastery >= 85) category = "honors"

      return {
        id: s.id,
        name: s.name,
        grade: s.grade,
        avatar: s.avatar || s.name.slice(0, 2).toUpperCase(),
        email: s.email,
        mastery: s.overall_mastery,
        velocity: s.learning_velocity,
        streakDays: s.streak_days,
        xp: s.xp,
        category,
        cycleStage: s.cycle_stage || 1,
        recommendedLevel: s.recommended_level,
        gaps: gaps.map((g) => g.name),
        quizzesTaken: quizCount?.count || 0,
        lastActive: s.last_login_at || "Today",
      }
    })
  },

  /**
   * Database Diagnostics & Health Statistics
   */
  getDatabaseStats() {
    const userCount = (db.query("SELECT COUNT(*) as c FROM users").get() as any).c
    const profileCount = (db.query("SELECT COUNT(*) as c FROM student_profiles").get() as any).c
    const conceptCount = (db.query("SELECT COUNT(*) as c FROM concept_mastery").get() as any).c
    const diagCount = (db.query("SELECT COUNT(*) as c FROM diagnostic_submissions").get() as any).c
    const quizCount = (db.query("SELECT COUNT(*) as c FROM quiz_attempts").get() as any).c
    const msgCount = (db.query("SELECT COUNT(*) as c FROM tutor_messages").get() as any).c

    return {
      status: "online",
      engine: "SQLite 3 (WAL mode via Bun)",
      databasePath: "server/data/learnova.db",
      tables: {
        users: userCount,
        studentProfiles: profileCount,
        conceptMasteryRecords: conceptCount,
        diagnosticSubmissions: diagCount,
        quizAttempts: quizCount,
        tutorMessages: msgCount,
      },
      timestamp: new Date().toISOString(),
    }
  },
}
