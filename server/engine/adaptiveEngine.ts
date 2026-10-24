import {
  ConceptNode,
  DifficultyLevel,
  GapAnalysisItem,
  LearningPathUnit,
  StudentProfile,
  AssessmentQuestion,
  QuizAnswerSubmission,
  QuizAnswerEvaluation,
  AdaptiveQuizQuestionResponse,
} from "../types"
import { initialKnowledgeGraph } from "../data/knowledgeGraph"
import { diagnosticQuestions, adaptiveQuestionPool } from "../data/questionBank"

const DIFFICULTY_ORDER: DifficultyLevel[] = [
  "Foundation",
  "Developing",
  "Proficient",
  "Advanced",
  "Mastery",
]

export class AdaptiveLearningEngine {
  private profile: StudentProfile
  private currentQuizIndex = 0
  private currentTierIndex = 2 // Proficient
  private quizQuestions: AssessmentQuestion[] = []
  private answeredQuestions: {
    questionId: string
    correct: boolean
    tier: DifficultyLevel
  }[] = []

  constructor() {
    this.profile = this.createDefaultProfile()
  }

  public getProfile(): StudentProfile {
    return this.profile
  }

  public setPersona(personaKey: "alex" | "maya" | "liam"): StudentProfile {
    if (personaKey === "maya") {
      // Beginner persona: Gaps in algebra foundations and factoring
      const concepts: ConceptNode[] = initialKnowledgeGraph.map((c) => {
        if (c.id === "algebra_foundations")
          return { ...c, mastery: 54, status: "developing" as const }
        if (c.id === "linear_graphing")
          return { ...c, mastery: 42, status: "gap" as const }
        if (c.id === "factoring")
          return { ...c, mastery: 28, status: "gap" as const }
        if (c.id === "graph_transformations")
          return { ...c, mastery: 20, status: "gap" as const }
        return { ...c, mastery: 10, status: "locked" as const }
      })
      const gaps = this.detectKnowledgeGaps(concepts)
      this.profile = {
        id: "user_maya",
        name: "Maya Lin",
        grade: "Grade 9 · Foundational",
        avatar: "ML",
        overallMastery: 35,
        masteredCount: 0,
        totalConcepts: concepts.length,
        recommendedLevel: "Foundation",
        gaps,
        concepts,
        learningVelocity: 1.8,
        streakDays: 4,
        xp: 450,
        studyTimeMinutes: 110,
        cycleStage: "Assessment",
        recentActivities: [
          {
            id: "act_m1",
            title: "Diagnostic Completed: Algebra Foundations",
            type: "diagnostic",
            timestamp: "2 hours ago",
            badge: "54% Mastery",
          },
        ],
        updatedAt: new Date().toISOString(),
      }
    } else if (personaKey === "liam") {
      // Advanced persona
      const concepts: ConceptNode[] = initialKnowledgeGraph.map((c) => {
        if (c.id === "algebra_foundations")
          return { ...c, mastery: 98, status: "mastered" as const }
        if (c.id === "linear_graphing")
          return { ...c, mastery: 95, status: "mastered" as const }
        if (c.id === "factoring")
          return { ...c, mastery: 91, status: "mastered" as const }
        if (c.id === "graph_transformations")
          return { ...c, mastery: 87, status: "mastered" as const }
        if (c.id === "quadratic_functions")
          return { ...c, mastery: 84, status: "mastered" as const }
        if (c.id === "vertex_form")
          return { ...c, mastery: 80, status: "mastered" as const }
        if (c.id === "systems_equations")
          return { ...c, mastery: 68, status: "in_progress" as const }
        return { ...c, mastery: 45, status: "developing" as const }
      })
      const gaps = this.detectKnowledgeGaps(concepts)
      this.profile = {
        id: "user_liam",
        name: "Liam Chen",
        grade: "Grade 11 · Honors",
        avatar: "LC",
        overallMastery: 84,
        masteredCount: 6,
        totalConcepts: concepts.length,
        recommendedLevel: "Advanced",
        gaps,
        concepts,
        learningVelocity: 4.2,
        streakDays: 21,
        xp: 2450,
        studyTimeMinutes: 380,
        cycleStage: "Adaptive Quiz",
        recentActivities: [
          {
            id: "act_l1",
            title: "Mastered Vertex Form & Extrema",
            type: "lesson_completed",
            timestamp: "Yesterday",
            badge: "92% Score",
          },
          {
            id: "act_l2",
            title: "Unlocked Systems of Equations",
            type: "gap_identified",
            timestamp: "Today",
            badge: "Accelerated",
          },
        ],
        updatedAt: new Date().toISOString(),
      }
    } else {
      // Default: Alex Morgan
      this.profile = this.createDefaultProfile()
    }
    return this.profile
  }

  public setCustomUser(name: string, grade?: string): StudentProfile {
    const trimmed = name.trim() || "Student"
    const parts = trimmed.split(" ")
    const initials =
      parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : trimmed.slice(0, 2).toUpperCase()

    this.profile = {
      ...this.profile,
      name: trimmed,
      grade: grade ? `${grade} · Active Learner` : this.profile.grade,
      avatar: initials,
      updatedAt: new Date().toISOString(),
    }
    return this.profile
  }

  private createDefaultProfile(): StudentProfile {
    const gaps = this.detectKnowledgeGaps(initialKnowledgeGraph)
    return {
      id: "user_alex",
      name: "Alex Morgan",
      grade: "Grade 10 · High School",
      avatar: "AM",
      overallMastery: 68,
      masteredCount: 2,
      totalConcepts: initialKnowledgeGraph.length,
      recommendedLevel: "Developing",
      gaps,
      concepts: initialKnowledgeGraph,
      learningVelocity: 2.9,
      streakDays: 12,
      xp: 1350,
      studyTimeMinutes: 275,
      cycleStage: "Knowledge Analysis",
      recentActivities: [
        {
          id: "act_1",
          title: "Prerequisite Gap Detected in Graph Transformations",
          type: "gap_identified",
          timestamp: "15 minutes ago",
          badge: "AI Alert",
        },
        {
          id: "act_2",
          title: "Diagnostic: Algebra & Functions Evaluated",
          type: "diagnostic",
          timestamp: "Today, 10:15 AM",
          badge: "68% Mastery",
        },
        {
          id: "act_3",
          title: "Completed Factoring Polynomials Core Lesson",
          type: "lesson_completed",
          timestamp: "Yesterday",
          badge: "+50 XP",
        },
      ],
      updatedAt: new Date().toISOString(),
    }
  }

  // 1. KNOWLEDGE GAP DETECTION & PREREQUISITE ANALYSIS
  public detectKnowledgeGaps(concepts: ConceptNode[]): GapAnalysisItem[] {
    const gaps: GapAnalysisItem[] = []
    const conceptMap = new Map<string, ConceptNode>(
      concepts.map((c) => [c.id, c]),
    )

    for (const concept of concepts) {
      if (concept.mastery < 60) {
        // Find downstream concepts that depend on this
        const blocked = concepts
          .filter((c) => c.prerequisites.includes(concept.id))
          .map((c) => c.name)

        const prerequisiteNames = concept.prerequisites
          .map((pid) => conceptMap.get(pid)?.name || pid)
          .join(", ")

        gaps.push({
          conceptId: concept.id,
          conceptName: concept.name,
          mastery: concept.mastery,
          impactScore: blocked.length * 25 + (60 - concept.mastery),
          blockedConcepts: blocked,
          recommendedPrerequisite:
            prerequisiteNames || "Foundational arithmetic & linear coordinates",
          remediationAction:
            blocked.length > 0
              ? `Critical bottleneck! Directly impeding ${blocked.join(" and ")}. Complete targeted bridge practice.`
              : `Developing skill. Reinforce with step-by-step visual examples.`,
          priority:
            blocked.length > 0 || concept.mastery < 40 ? "High" : "Medium",
        })
      }
    }

    // Sort by priority and impact
    return gaps.sort((a, b) => b.impactScore - a.impactScore)
  }

  // 2. PERSONALIZED LEARNING PATH GENERATION
  public generateLearningPath(): LearningPathUnit[] {
    const concepts = this.profile.concepts
    const gaps = this.profile.gaps
    const pathUnits: LearningPathUnit[] = []
    const conceptMap = new Map<string, ConceptNode>(
      concepts.map((c) => [c.id, c]),
    )

    // Check if there is a critical gap requiring remediation insertion
    const highPriorityGap = gaps.find((g) => g.priority === "High")

    let order = 1

    // Unit 1: Algebra Foundations
    const c1 = conceptMap.get("algebra_foundations")
    pathUnits.push({
      id: "unit_1",
      order: order++,
      unitCode: "01",
      title: "Algebra Foundations & Linear Equivalence",
      conceptId: "algebra_foundations",
      description:
        "Master distributing coefficients, isolating unknowns, and verifying equivalence.",
      durationMinutes: 12,
      status: (c1?.mastery ?? 0) >= 75 ? "completed" : "in_progress",
      score: c1?.mastery,
      isRemediation: false,
      aiRationale:
        "Foundation verified. Provides the bedrock algebraic manipulation required for all subsequent units.",
      prerequisiteNames: [],
      lessonContent: {
        overview:
          "Algebraic balance requires preserving equality while applying inverse operations.",
        keyPoints: [
          "Distributive Property: a(b + c) = ab + ac",
          "Combine like terms with identical variable powers",
          "Isolate variables by systematically reversing operation order",
        ],
        formulaOrRule: "3(x + 4) - 2x = 3x + 12 - 2x = x + 12",
        interactiveExample: {
          problem: "Simplify 5(2x - 3) + 7x",
          solution: "10x - 15 + 7x = 17x - 15",
          tip: "Watch negative signs when multiplying through parentheses!",
        },
      },
    })

    // Unit 2: Factoring Polynomials
    const c2 = conceptMap.get("factoring")
    pathUnits.push({
      id: "unit_2",
      order: order++,
      unitCode: "02",
      title: "Factoring Polynomials & Trinomials",
      conceptId: "factoring",
      description:
        "Find binomial products, greatest common factors, and quadratic roots through zero product property.",
      durationMinutes: 16,
      status: (c2?.mastery ?? 0) >= 75 ? "completed" : "in_progress",
      score: c2?.mastery,
      isRemediation: false,
      aiRationale:
        "Essential prerequisite for quadratic functions. Developing well with 64% demonstrated accuracy.",
      prerequisiteNames: ["Algebra Foundations"],
      lessonContent: {
        overview:
          "Factoring converts a sum into a product of simpler binomial components.",
        keyPoints: [
          "Look for GCF first across all terms",
          "For x² + bx + c, find two numbers multiplying to c and adding to b",
          "Difference of squares: a² - b² = (a - b)(a + b)",
        ],
        formulaOrRule: "x² + 5x + 6 = (x + 2)(x + 3)",
        interactiveExample: {
          problem: "Factor x² - 9x + 20",
          solution:
            "Numbers multiplying to +20 and summing to -9 are -4 and -5: (x - 4)(x - 5)",
          tip: "When c is positive and b is negative, both factors must be negative.",
        },
      },
    })

    // DYNAMIC REMEDIATION BRIDGE INJECTION:
    // If the student has a gap in graph transformations, dynamically insert a dedicated bridge module!
    if (
      highPriorityGap &&
      highPriorityGap.conceptId === "graph_transformations"
    ) {
      pathUnits.push({
        id: "unit_remed_trans",
        order: order++,
        unitCode: "02B",
        title: "Bridge Module: Function Transformations & Shifts",
        conceptId: "graph_transformations",
        description:
          "Targeted visual remediation to close the gap detected in your diagnostic before advancing to vertex form.",
        durationMinutes: 10,
        status: "remediation",
        score: highPriorityGap.mastery,
        isRemediation: true,
        aiRationale:
          "AI REMEDIATION INSERT: Diagnostic revealed a 36% mastery gap here. Mastering horizontal (x - h) shifts is required before Quadratic Vertex Form unlocks.",
        prerequisiteNames: ["Linear Graphing"],
        lessonContent: {
          overview:
            "Transformations modify parent shapes through shifts, stretches, and reflections.",
          keyPoints: [
            "Horizontal Shift f(x - h): (x - 4) shifts 4 units to the RIGHT (opposite to sign!)",
            "Vertical Shift f(x) + k: +3 shifts 3 units UP",
            "Reflection -f(x): flips the parabola upside down",
          ],
          formulaOrRule:
            "y = a(x - h)² + k (h = horizontal shift, k = vertical shift)",
          interactiveExample: {
            problem:
              "Predict graph transformation for y = -(x + 2)² - 5 from y = x²",
            solution:
              "Reflected downward, shifted left 2 units, shifted down 5 units.",
            tip: "Inside shifts horizontal (inverted sign), outside shifts vertical (exact sign).",
          },
        },
      })
    }

    // Unit 3: Quadratic Functions
    const c3 = conceptMap.get("quadratic_functions")
    pathUnits.push({
      id: "unit_3",
      order: order++,
      unitCode: "03",
      title: "Understanding Quadratic Functions & Parabolas",
      conceptId: "quadratic_functions",
      description:
        "Analyze parabolas, axis of symmetry, vertex coordinates, and real-world projectile modeling.",
      durationMinutes: 18,
      status: (c3?.mastery ?? 0) >= 75 ? "completed" : "in_progress",
      score: c3?.mastery,
      isRemediation: false,
      aiRationale:
        "Active core curriculum unit. Connects algebraic factoring with visual parabolic trajectories.",
      prerequisiteNames: [
        "Factoring Polynomials",
        "Function Graph Transformations",
      ],
      lessonContent: {
        overview:
          "A quadratic function produces a symmetric U-shaped curve called a parabola.",
        keyPoints: [
          "Axis of symmetry occurs at x = -b / (2a)",
          "When a > 0, parabola opens upward (minimum); when a < 0, opens downward (maximum)",
          "Y-intercept is always at (0, c)",
        ],
        formulaOrRule: "f(x) = ax² + bx + c",
        interactiveExample: {
          problem: "Find the axis of symmetry for y = 2x² - 8x + 5",
          solution: "x = -(-8) / (2 * 2) = 8 / 4 = 2",
          tip: "The vertex always lies on the axis of symmetry.",
        },
      },
    })

    // Unit 4: Vertex Form & Completing the Square
    const c4 = conceptMap.get("vertex_form")
    const isC4Locked =
      (c3?.mastery ?? 0) < 60 ||
      (conceptMap.get("graph_transformations")?.mastery ?? 0) < 50
    pathUnits.push({
      id: "unit_4",
      order: order++,
      unitCode: "04",
      title: "Vertex Form & Completing the Square",
      conceptId: "vertex_form",
      description:
        "Convert standard equations into vertex form to instantly identify maxima, minima, and translations.",
      durationMinutes: 20,
      status: isC4Locked
        ? "locked"
        : (c4?.mastery ?? 0) >= 75
          ? "completed"
          : "in_progress",
      score: c4?.mastery,
      isRemediation: false,
      aiRationale: isC4Locked
        ? "Prerequisites pending: Requires >= 50% mastery in Function Transformations and >= 60% in Quadratic Functions."
        : "Unlocked! Ready to tackle completing the square.",
      prerequisiteNames: [
        "Quadratic Functions",
        "Function Graph Transformations",
      ],
      lessonContent: {
        overview:
          "Vertex form makes reading maximum and minimum coordinates effortless.",
        keyPoints: [
          "Vertex coordinates are given directly by (h, k)",
          "Complete square by adding and subtracting (b/2)²",
          "Vertex represents peak height or lowest cost in applied scenarios",
        ],
        formulaOrRule: "y = a(x - h)² + k",
        interactiveExample: {
          problem: "Find vertex of y = 3(x - 5)² + 12",
          solution: "Vertex is (5, 12). Since a = 3 > 0, it is a minimum.",
          tip: "Notice h = 5 (not -5).",
        },
      },
    })

    // Unit 5: Systems of Non-Linear Equations
    pathUnits.push({
      id: "unit_5",
      order: order++,
      unitCode: "05",
      title: "Systems of Non-Linear Equations",
      conceptId: "systems_equations",
      description:
        "Solve intersection points of lines and parabolas using substitution and discriminant analysis.",
      durationMinutes: 22,
      status: "locked",
      score: 15,
      isRemediation: false,
      aiRationale:
        "Locked until Quadratic Functions & Vertex Form reach mastery >= 75%.",
      prerequisiteNames: ["Quadratic Functions", "Linear Graphing"],
    })

    return pathUnits
  }

  // 3. DIAGNOSTIC ASSESSMENT SUBMISSION
  public submitDiagnostic(answers: number[]): {
    profile: StudentProfile
    analysis: {
      score: number
      total: number
      percentage: number
      gapsIdentified: string[]
      startingLevel: DifficultyLevel
      aiSummary: string
    }
  } {
    let score = 0
    const answeredDetails: { conceptId: string; isCorrect: boolean }[] = []

    answers.forEach((ans, idx) => {
      const q = diagnosticQuestions[idx]
      if (q) {
        const correct = ans === q.correct
        if (correct) score++
        answeredDetails.push({ conceptId: q.conceptId, isCorrect: correct })
      }
    })

    const percentage = Math.round((score / diagnosticQuestions.length) * 100)

    // Update concept masteries based on diagnostic responses
    const updatedConcepts = this.profile.concepts.map((concept) => {
      const detail = answeredDetails.find((d) => d.conceptId === concept.id)
      let newMastery = concept.mastery

      if (detail) {
        newMastery = detail.isCorrect
          ? Math.min(96, Math.max(30, concept.mastery + 16))
          : Math.min(96, Math.max(22, concept.mastery - 18))
      }

      const status =
        newMastery >= 75 ? "mastered" : newMastery >= 55 ? "developing" : "gap"
      return {
        ...concept,
        mastery: newMastery,
        status: status as any,
      }
    })

    // Detect new gaps
    const gaps = this.detectKnowledgeGaps(updatedConcepts)

    // Starting level calibration
    let startingLevel: DifficultyLevel = "Developing"
    if (percentage >= 80) startingLevel = "Advanced"
    else if (percentage >= 60) startingLevel = "Proficient"
    else if (percentage <= 35) startingLevel = "Foundation"

    const overallMastery = Math.round(
      updatedConcepts.reduce((acc, c) => acc + c.mastery * (c.weight / 100), 0),
    )

    const masteredCount = updatedConcepts.filter((c) => c.mastery >= 75).length

    const gapNames = gaps.map((g) => g.conceptName)

    this.profile = {
      ...this.profile,
      overallMastery,
      masteredCount,
      recommendedLevel: startingLevel,
      gaps,
      concepts: updatedConcepts,
      cycleStage: "Knowledge Analysis",
      recentActivities: [
        {
          id: `diag_${Date.now()}`,
          title: `Diagnostic Assessed: ${score}/${diagnosticQuestions.length} Correct (${percentage}%)`,
          type: "diagnostic",
          timestamp: "Just now",
          badge: `${startingLevel} Level`,
        },
        ...this.profile.recentActivities,
      ],
      updatedAt: new Date().toISOString(),
    }

    const aiSummary =
      gaps.length > 0
        ? `Analysis complete: ${gaps.length} critical gap(s) identified in [${gapNames.join(", ")}]. We have dynamically recalibrated your learning path with a bridge module to guarantee mastery before advanced quadratics.`
        : `Outstanding diagnostic performance! All foundational prerequisites confirmed strong. Accelerating curriculum directly into advanced modeling.`

    return {
      profile: this.profile,
      analysis: {
        score,
        total: diagnosticQuestions.length,
        percentage,
        gapsIdentified: gapNames,
        startingLevel,
        aiSummary,
      },
    }
  }

  // 4. REAL-TIME ADAPTIVE QUIZ ENGINE (Item Response & Dynamic Difficulty)
  public startAdaptiveQuiz(): AdaptiveQuizQuestionResponse {
    this.currentQuizIndex = 0
    this.answeredQuestions = []

    // Initialize difficulty tier based on student profile recommended level
    const levelIndex = DIFFICULTY_ORDER.indexOf(this.profile.recommendedLevel)
    this.currentTierIndex = levelIndex !== -1 ? Math.max(1, levelIndex) : 1

    return this.getNextAdaptiveQuestion(
      "Diagnostic baseline set initial tier to " +
        DIFFICULTY_ORDER[this.currentTierIndex],
    )
  }

  public getNextAdaptiveQuestion(
    reason?: string,
  ): AdaptiveQuizQuestionResponse {
    const currentTier = DIFFICULTY_ORDER[this.currentTierIndex]
    const targetDifficultyScore = this.currentTierIndex + 1

    // Filter candidate questions by tier
    const candidates = adaptiveQuestionPool.filter(
      (q) =>
        q.difficultyScore === targetDifficultyScore &&
        !this.answeredQuestions.some((a) => a.questionId === q.id),
    )

    const question =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : adaptiveQuestionPool[
            this.currentQuizIndex % adaptiveQuestionPool.length
          ]

    const estimatedAbility = Math.round((this.currentTierIndex + 1) * 20)

    return {
      question,
      currentTier,
      tierScore: targetDifficultyScore,
      streak: this.answeredQuestions.filter((a) => a.correct).length,
      estimatedAbility,
      adaptationReason:
        reason ||
        `Selected difficulty tier ${currentTier} matching your current proficiency index.`,
      questionNumber: this.currentQuizIndex + 1,
      totalQuestions: 5,
    }
  }

  public submitAdaptiveAnswer(submission: QuizAnswerSubmission): {
    evaluation: QuizAnswerEvaluation
    nextQuestion?: AdaptiveQuizQuestionResponse
    updatedProfile: StudentProfile
  } {
    const question =
      adaptiveQuestionPool.find((q) => q.id === submission.questionId) ||
      adaptiveQuestionPool[0]
    const isCorrect = submission.selectedAnswer === question.correct

    const prevTierIndex = this.currentTierIndex
    let difficultyChange: "increased" | "decreased" | "maintained" =
      "maintained"
    let adaptationReason = ""

    if (isCorrect) {
      // Dynamic difficulty adjustment UP
      if (this.currentTierIndex < DIFFICULTY_ORDER.length - 1) {
        this.currentTierIndex++
        difficultyChange = "increased"
        adaptationReason = `Correct answer! Increasing difficulty to ${DIFFICULTY_ORDER[this.currentTierIndex]} to test higher-order reasoning.`
      } else {
        adaptationReason =
          "Maximum mastery tier achieved. Reinforcing advanced synthesis."
      }
    } else {
      // Dynamic difficulty adjustment DOWN
      if (this.currentTierIndex > 0) {
        this.currentTierIndex--
        difficultyChange = "decreased"
        adaptationReason = `Prerequisite gap signal detected. Stepping difficulty down to ${DIFFICULTY_ORDER[this.currentTierIndex]} to reinforce foundation.`
      } else {
        adaptationReason =
          "Reinforcing foundational concepts with scaffolded guidance."
      }
    }

    this.answeredQuestions.push({
      questionId: question.id,
      correct: isCorrect,
      tier: DIFFICULTY_ORDER[prevTierIndex],
    })

    this.currentQuizIndex++

    // Calculate mastery delta
    const masteryDelta = isCorrect ? 12 : -6

    // Update concept in profile
    const updatedConcepts = this.profile.concepts.map((c) => {
      if (c.id === question.conceptId) {
        const updatedMastery = Math.min(
          99,
          Math.max(20, c.mastery + masteryDelta),
        )
        return {
          ...c,
          mastery: updatedMastery,
          status: (updatedMastery >= 75
            ? "mastered"
            : updatedMastery >= 55
              ? "developing"
              : "gap") as any,
        }
      }
      return c
    })

    const newGaps = this.detectKnowledgeGaps(updatedConcepts)
    const overallMastery = Math.round(
      updatedConcepts.reduce((acc, c) => acc + c.mastery * (c.weight / 100), 0),
    )
    const xpEarned = isCorrect ? (prevTierIndex + 1) * 30 : 10

    const targetConcept = updatedConcepts.find(
      (c) => c.id === question.conceptId,
    )

    this.profile = {
      ...this.profile,
      overallMastery,
      masteredCount: updatedConcepts.filter((c) => c.mastery >= 75).length,
      xp: this.profile.xp + xpEarned,
      concepts: updatedConcepts,
      gaps: newGaps,
      cycleStage:
        this.currentQuizIndex >= 5
          ? "Updated Recommendations"
          : "Adaptive Quiz",
      recentActivities: [
        {
          id: `quiz_ans_${Date.now()}`,
          title: `Adaptive Quiz: ${
            isCorrect ? "Correct (+XP)" : "Review Needed"
          } on ${question.conceptName}`,
          type: "adaptive_quiz",
          timestamp: "Just now",
          badge: DIFFICULTY_ORDER[this.currentTierIndex],
        },
        ...this.profile.recentActivities.slice(0, 5),
      ],
      updatedAt: new Date().toISOString(),
    }

    const evaluation: QuizAnswerEvaluation = {
      isCorrect,
      correctAnswerIndex: question.correct,
      explanation: question.explanation,
      prerequisiteGapDetected: !isCorrect ? question.conceptName : undefined,
      difficultyChange,
      newTier: DIFFICULTY_ORDER[this.currentTierIndex],
      masteryDelta,
      conceptId: question.conceptId,
      conceptMastery: targetConcept?.mastery || 50,
      xpEarned,
      aiFeedback: isCorrect
        ? `Superb! You demonstrated command of ${question.conceptName}. Moving you to ${DIFFICULTY_ORDER[this.currentTierIndex]} tier.`
        : `Let's break this down: ${question.explanation} ${question.prerequisiteHint || ""}`,
      nextRecommendedAction: isCorrect
        ? "Advance to higher-tier problem solving."
        : `Review ${question.conceptName} bridge module in your personalized path.`,
    }

    let nextQuestion: AdaptiveQuizQuestionResponse | undefined = undefined
    if (this.currentQuizIndex < 5) {
      nextQuestion = this.getNextAdaptiveQuestion(adaptationReason)
    }

    return {
      evaluation,
      nextQuestion,
      updatedProfile: this.profile,
    }
  }

  // 5. LESSON COMPLETION
  public completeLesson(unitId: string): StudentProfile {
    const pathUnits = this.generateLearningPath()
    const unit = pathUnits.find((u) => u.id === unitId)

    if (unit) {
      const updatedConcepts = this.profile.concepts.map((c) => {
        if (c.id === unit.conceptId) {
          const newMastery = Math.min(98, c.mastery + 15)
          return {
            ...c,
            mastery: newMastery,
            status: (newMastery >= 75 ? "mastered" : "developing") as any,
          }
        }
        return c
      })

      const newGaps = this.detectKnowledgeGaps(updatedConcepts)
      const overallMastery = Math.round(
        updatedConcepts.reduce(
          (acc, c) => acc + c.mastery * (c.weight / 100),
          0,
        ),
      )

      this.profile = {
        ...this.profile,
        overallMastery,
        masteredCount: updatedConcepts.filter((c) => c.mastery >= 75).length,
        xp: this.profile.xp + 100,
        studyTimeMinutes: this.profile.studyTimeMinutes + unit.durationMinutes,
        concepts: updatedConcepts,
        gaps: newGaps,
        cycleStage: "Adaptive Quiz",
        recentActivities: [
          {
            id: `lesson_${Date.now()}`,
            title: `Completed ${unit.title}`,
            type: "lesson_completed",
            timestamp: "Just now",
            badge: "+100 XP",
          },
          ...this.profile.recentActivities.slice(0, 5),
        ],
        updatedAt: new Date().toISOString(),
      }
    }

    return this.profile
  }
}

export const adaptiveEngine = new AdaptiveLearningEngine()
