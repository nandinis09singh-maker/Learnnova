import { aiTutorEngine } from "../../server/engine/aiTutorEngine"
import type { TutorMessage, StudentProfile } from "../../server/types"

export function getClientTutorFallback(
  text: string,
  mode: string,
  studentName: string,
): TutorMessage {
  const dummyProfile: StudentProfile = {
    id: "active_user",
    name: studentName,
    grade: "Grade 10",
    avatar: studentName.slice(0, 2).toUpperCase(),
    overallMastery: 70,
    masteredCount: 3,
    totalConcepts: 8,
    recommendedLevel: "Developing",
    gaps: [],
    concepts: [],
    learningVelocity: 3.0,
    streakDays: 7,
    xp: 1200,
    studyTimeMinutes: 200,
    cycleStage: "Personalized Learning",
    recentActivities: [],
    updatedAt: new Date().toISOString(),
  }

  return aiTutorEngine.generateResponse(
    text,
    (mode as any) || "explanation",
    dummyProfile,
  )
}

