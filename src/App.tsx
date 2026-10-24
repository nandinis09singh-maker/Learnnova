import { useEffect, useMemo, useRef, useState } from "react"
import { api } from "./services/api"
import { getClientTutorFallback } from "./services/aiTutorClient"
import type {
  StudentProfile,
  LearningPathUnit,
  ConceptNode,
  AdaptiveQuizQuestionResponse,
  QuizAnswerEvaluation,
  TutorMessage,
  DifficultyLevel,
} from "../server/types"
import { diagnosticQuestions } from "../server/data/questionBank"
import { initialKnowledgeGraph } from "../server/data/knowledgeGraph"
import {
  gradeSubjects,
  getRandomUniqueQuestions,
  allQuestions,
  type SubjectQuestion,
} from "../server/data/gradeSubjectQuestions"

function buildFallbackProfile(name: string, grade: string = "Grade 10"): StudentProfile {
  const cleanName = (name || "Student").trim()
  const cleanGrade = grade || "Grade 10"
  return {
    id: `usr_${Date.now()}`,
    name: cleanName,
    grade: cleanGrade,
    avatar: (cleanName || "ST").slice(0, 2).toUpperCase(),
    overallMastery: 70,
    masteredCount: 3,
    totalConcepts: 6,
    recommendedLevel: "Proficient",
    learningVelocity: 1.25,
    streakDays: 2,
    studyTimeMinutes: 35,
    xp: 1350,
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
      {
        conceptId: "completing_square",
        conceptName: "Completing the Square",
        mastery: 45,
        impactScore: 5,
        blockedConcepts: ["Vertex Form Transformations"],
        recommendedPrerequisite: "Factoring Polynomials",
        remediationAction: "Master adding (b/2)² to both sides of quadratic",
        priority: "High",
      },
    ],
    recentActivities: [
      {
        id: "act_1",
        title: "Personalized Study Track Ready",
        type: "lesson_completed",
        timestamp: "Just now",
        badge: `${cleanGrade} Track`,
      },
      {
        id: "act_2",
        title: "Adaptive Calibration Active",
        type: "diagnostic",
        timestamp: "Today",
        badge: "70% Mastery",
      },
    ],
    updatedAt: new Date().toISOString(),
  }
}

type IconName = "spark" | "grid" | "path" | "chart" | "brain" | "book" | "clock" | "flame" | "target" | "arrow" | "check" | "lock" | "play" | "message" | "bell" | "search" | "chevron" | "x" | "bolt" | "trophy" | "heart" | "alert" | "refresh" | "zap" | "logout"

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    spark: (
      <path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2zm7 13l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    path: (
      <>
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="6" r="3" />
        <path d="M8.5 16.5c2-2 1-5 3-7s3.5-1 4-1" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    brain: (
      <path d="M9.5 4.5A3.5 3.5 0 006 8v.5a3.5 3.5 0 00-1 6.8A3.5 3.5 0 009.5 21c1 0 1.8-.4 2.5-1 .7.6 1.5 1 2.5 1a3.5 3.5 0 004.5-5.7 3.5 3.5 0 00-1-6.8V8a3.5 3.5 0 00-6-2.5 3.5 3.5 0 00-2.5-1zM12 5.5V20M8 9.5c0 1.3 1 2.5 2.5 2.5M16 9.5c0 1.3-1 2.5-2.5 2.5" />
    ),
    book: (
      <>
        <path d="M4 5.5A3.5 3.5 0 017.5 2H12v18H7.5A3.5 3.5 0 004 23V5.5z" />
        <path d="M20 5.5A3.5 3.5 0 0016.5 2H12v18h4.5a3.5 3.5 0 013.5 3V5.5z" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    flame: (
      <path d="M13 2s1 4-2 6c-2-3-5-1-5 3 0 1.8.8 3 2 4-1-.3-2-.8-3-2 0 5 3 9 7 9s7-3 7-7c0-5-3-8-6-13z" />
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </>
    ),
    check: <path d="M5 12l4 4L19 6" />,
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 018 0v3" />
      </>
    ),
    play: <path d="M8 5l11 7-11 7V5z" />,
    message: (
      <path d="M21 15a4 4 0 01-4 4H8l-5 3 1.5-5A7 7 0 013 13V8a4 4 0 014-4h10a4 4 0 014 4v7z" />
    ),
    bell: (
      <>
        <path d="M18 9a6 6 0 00-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8" />
        <path d="M10 21h4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </>
    ),
    chevron: <path d="M9 6l6 6-6 6" />,
    x: (
      <>
        <path d="M6 6l12 12M18 6L6 18" />
      </>
    ),
    bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
    trophy: (
      <>
        <path d="M8 4h8v5a4 4 0 01-8 0V4z" />
        <path d="M8 6H4v2a4 4 0 004 4M16 6h4v2a4 4 0 01-4 4M12 13v5M8 21h8M9 18h6" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 00-.1-7.8z" />
    ),
    alert: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
    refresh: (
      <>
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </>
    ),
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    logout: (
      <>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === "spark" || name === "flame" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  style,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "ghost"
  className?: string
  disabled?: boolean
  style?: React.CSSProperties
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  )
}

function Ring({
  value,
  color = "violet",
  size = 46,
}: {
  value: number
  color?: "violet" | "mint" | "amber" | "sky"
  size?: number
}) {
  const colorMap: Record<string, string> = {
    violet: "#635bdb",
    mint: "#10b981",
    amber: "#f59e0b",
    sky: "#0284c7",
  }
  const strokeColor = colorMap[color] || "#635bdb"
  const strokeWidth = 3.5
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const validValue = Math.max(0, Math.min(100, Math.round(value || 0)))
  const strokeDashoffset = circumference - (validValue / 100) * circumference

  return (
    <div
      className="donut-progress-ring"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        maxWidth: `${size}px`,
        minHeight: `${size}px`,
        maxHeight: `${size}px`,
        flex: `0 0 ${size}px`,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        boxSizing: "border-box",
        border: "none",
        outline: "none",
        boxShadow: "none",
        background: "transparent",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          transform: "rotate(-90deg)",
          position: "absolute",
          top: 0,
          left: 0,
          width: `${size}px`,
          height: `${size}px`,
        }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1f0f8"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <span
        style={{
          position: "relative",
          zIndex: 2,
          fontSize: size >= 44 ? "11px" : "9.5px",
          fontWeight: 800,
          color: "#1a1730",
          fontFamily: "Manrope, sans-serif",
          lineHeight: 1,
          textAlign: "center",
          userSelect: "none",
        }}
      >
        {validValue}%
      </span>
    </div>
  )
}

const navItems: { id: string; label: string; icon: IconName }[] = [
  { id: "home", label: "Dashboard", icon: "grid" },
  { id: "diagnostic", label: "1. Diagnostic Assessment", icon: "target" },
  { id: "analysis", label: "2. Gap Radar", icon: "chart" },
  { id: "path", label: "3. Learning Path", icon: "path" },
  { id: "challenge", label: "4. Adaptive Quiz", icon: "bolt" },
  { id: "recommendations", label: "5. Next Actions", icon: "spark" },
  { id: "subjects", label: "Subject Modules", icon: "book" },
  { id: "tutor", label: "AI Study Coach", icon: "brain" },
  { id: "library", label: "Resource Hub", icon: "book" },
]

interface SidebarNavItem {
  id: string
  label: string
  icon: IconName
  badge?: string
  gradient: string
  badgeBg: string
  badgeBorder: string
  badgeColor: string
}

interface SidebarNavGroup {
  title: string
  items: SidebarNavItem[]
}

const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        id: "home",
        label: "Dashboard",
        icon: "grid",
        badge: "Hub",
        gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        badgeBg: "rgba(99, 102, 241, 0.22)",
        badgeBorder: "rgba(167, 139, 250, 0.45)",
        badgeColor: "#c4b5fd",
      },
    ],
  },
  {
    title: "ADAPTIVE CYCLE",
    items: [
      {
        id: "diagnostic",
        label: "1. Diagnostic",
        icon: "target",
        badge: "Assess",
        gradient: "linear-gradient(135deg, #06b6d4, #3b82f6)",
        badgeBg: "rgba(6, 182, 212, 0.22)",
        badgeBorder: "rgba(56, 189, 248, 0.45)",
        badgeColor: "#7dd3fc",
      },
      {
        id: "analysis",
        label: "2. Gap Radar",
        icon: "chart",
        badge: "Analyze",
        gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
        badgeBg: "rgba(245, 158, 11, 0.22)",
        badgeBorder: "rgba(251, 146, 60, 0.45)",
        badgeColor: "#fed7aa",
      },
      {
        id: "path",
        label: "3. Learning Path",
        icon: "path",
        badge: "Learn",
        gradient: "linear-gradient(135deg, #10b981, #059669)",
        badgeBg: "rgba(16, 185, 129, 0.22)",
        badgeBorder: "rgba(52, 211, 153, 0.45)",
        badgeColor: "#a7f3d0",
      },
      {
        id: "challenge",
        label: "4. Adaptive Quiz",
        icon: "bolt",
        badge: "Test",
        gradient: "linear-gradient(135deg, #facc15, #f97316)",
        badgeBg: "rgba(250, 204, 21, 0.22)",
        badgeBorder: "rgba(251, 191, 36, 0.45)",
        badgeColor: "#fde68a",
      },
      {
        id: "recommendations",
        label: "5. Next Actions",
        icon: "spark",
        badge: "Evolve",
        gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)",
        badgeBg: "rgba(236, 72, 153, 0.22)",
        badgeBorder: "rgba(244, 114, 182, 0.45)",
        badgeColor: "#fbcfe8",
      },
    ],
  },
  {
    title: "EXPLORE & COACH",
    items: [
      {
        id: "subjects",
        label: "Subject Modules",
        icon: "book",
        badge: "Grades 8–12",
        gradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
        badgeBg: "rgba(59, 130, 246, 0.22)",
        badgeBorder: "rgba(96, 165, 250, 0.45)",
        badgeColor: "#bfdbfe",
      },
      {
        id: "tutor",
        label: "AI Study Coach",
        icon: "brain",
        badge: "Nova AI",
        gradient: "linear-gradient(135deg, #d946ef, #8b5cf6)",
        badgeBg: "rgba(217, 70, 239, 0.22)",
        badgeBorder: "rgba(232, 121, 249, 0.45)",
        badgeColor: "#f5d0fe",
      },
      {
        id: "library",
        label: "Resource Hub",
        icon: "book",
        badge: "Guides",
        gradient: "linear-gradient(135deg, #14b8a6, #06b6d4)",
        badgeBg: "rgba(20, 184, 166, 0.22)",
        badgeBorder: "rgba(45, 212, 191, 0.45)",
        badgeColor: "#99f6e4",
      },
    ],
  },
]

const CYCLE_STEPS = [
  {
    id: "diagnostic",
    label: "Diagnostic",
    sub: "Stage 1: Assess",
    badge: "Assess Baseline",
    icon: "target" as IconName,
    emoji: "🎯",
    color: "#635BDB",
    bg: "#f5f3ff",
    border: "#dcd7f8",
  },
  {
    id: "analysis",
    label: "Gap Analysis",
    sub: "Stage 2: Analyze",
    badge: "Pinpoint Gaps",
    icon: "chart" as IconName,
    emoji: "📊",
    color: "#0284C7",
    bg: "#f0f9ff",
    border: "#bae6fd",
  },
  {
    id: "path",
    label: "Personalized Path",
    sub: "Stage 3: Learn",
    badge: "Remediation",
    icon: "path" as IconName,
    emoji: "🛤️",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    id: "challenge",
    label: "Adaptive Quiz",
    sub: "Stage 4: Calibrate",
    badge: "Level-Up Quiz",
    icon: "bolt" as IconName,
    emoji: "⚡",
    color: "#D97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  {
    id: "recommendations",
    label: "Recommendations",
    sub: "Stage 5: Adapt",
    badge: "Continuous Loop",
    icon: "spark" as IconName,
    emoji: "✨",
    color: "#DB2777",
    bg: "#fdf2f8",
    border: "#fbcfe8",
  },
]

/* ------------------------------------------------------------- */
/* 1. ADAPTIVE CYCLE NAVIGATION BAR                              */
/* ------------------------------------------------------------- */
function CycleStepper({
  currentStage,
  onSelectStage,
}: {
  currentStage: string
  onSelectStage: (stage: string) => void
}) {
  return (
    <div
      className="cycle-stepper-wrap"
      style={{
        background: "#ffffff",
        border: "1.5px solid #e7e4f8",
        borderRadius: "18px",
        padding: "16px 20px",
        marginBottom: "24px",
        boxShadow: "0 4px 20px rgba(99,91,219,0.04)",
      }}
    >
      <div
        className="cycle-stepper-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            className="eyebrow"
            style={{
              color: "var(--violet)",
              fontWeight: 800,
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Icon name="spark" size={14} /> ADAPTIVE LEARNING CYCLE
          </span>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 8px",
              background: "#ede9fe",
              color: "#5b21b6",
              borderRadius: "12px",
              fontWeight: 700,
            }}
          >
            5-Stage Pipeline Active
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#74708a",
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          <span>Continuous Loop:</span>
          <span style={{ color: "#635bdb", fontWeight: 700 }}>Assess</span>
          <span style={{ color: "#cbd5e1" }}>→</span>
          <span style={{ color: "#0284c7", fontWeight: 700 }}>Analyze</span>
          <span style={{ color: "#cbd5e1" }}>→</span>
          <span style={{ color: "#059669", fontWeight: 700 }}>Learn</span>
          <span style={{ color: "#cbd5e1" }}>→</span>
          <span style={{ color: "#d97706", fontWeight: 700 }}>Calibrate</span>
          <span style={{ color: "#cbd5e1" }}>→</span>
          <span style={{ color: "#db2777", fontWeight: 700 }}>Adapt</span>
        </div>
      </div>

      <div
        className="cycle-stepper"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "10px",
          position: "relative",
        }}
      >
        {CYCLE_STEPS.map((step, idx) => {
          const isActive = currentStage === step.id
          return (
            <button
              key={step.id}
              className={`cycle-step ${isActive ? "active" : ""}`}
              onClick={() => onSelectStage(step.id)}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "14px",
                background: isActive ? step.bg : "#fbfbfe",
                border: `1.5px solid ${isActive ? step.color : "#ebe8f7"}`,
                boxShadow: isActive
                  ? `0 6px 18px ${step.color}25`
                  : "0 2px 6px rgba(0,0,0,0.02)",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                textAlign: "left",
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#f5f3ff"
                  e.currentTarget.style.borderColor = "#c4b5fd"
                  e.currentTarget.style.transform = "translateY(-2px)"
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#fbfbfe"
                  e.currentTarget.style.borderColor = "#ebe8f7"
                  e.currentTarget.style.transform = "none"
                }
              }}
            >
              <div
                className="cycle-step-num"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "14px",
                  background: isActive ? step.color : "#ecebf7",
                  color: isActive ? "#ffffff" : "#4b4960",
                  flexShrink: 0,
                  boxShadow: isActive ? `0 3px 8px ${step.color}40` : "none",
                }}
              >
                {step.emoji}
              </div>

              <div className="cycle-step-text" style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <strong
                    style={{
                      color: isActive ? step.color : "#1a1730",
                      fontSize: "12px",
                      fontWeight: 800,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.label}
                  </strong>
                  <span
                    style={{
                      fontSize: "9px",
                      color: isActive ? step.color : "#9490ad",
                      fontWeight: 700,
                    }}
                  >
                    #{idx + 1}
                  </span>
                </div>
                <div style={{ marginTop: "2px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      color: isActive ? step.color : "#74708a",
                      fontWeight: isActive ? 700 : 500,
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.sub}
                  </span>
                </div>
              </div>

              {idx < CYCLE_STEPS.length - 1 && (
                <span
                  style={{
                    position: "absolute",
                    right: "-8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 4,
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1px solid #dcd7f8",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "8px",
                    color: "#7c3aed",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  →
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- */
/* 2. DIAGNOSTIC ASSESSMENT MODAL & VIEW                        */
/* ------------------------------------------------------------- */
function DiagnosticModal({
  onClose,
  onComplete,
  grade,
}: {
  onClose: () => void
  onComplete: (profile: StudentProfile) => void
  grade: string
}) {
  // Pick grade-based questions with no-repeat per session
  const sessionKey = `learnova_used_diag_${grade}`
  const usedIds: string[] = (() => {
    try { return JSON.parse(sessionStorage.getItem(sessionKey) || "[]") } catch { return [] }
  })()

  // Gather 6 questions across subjects of this grade (1 per subject, shuffled)
  const subjects = gradeSubjects[grade] || gradeSubjects["Grade 10"]
  const pickedQuestions = useMemo(() => {
    const pool: SubjectQuestion[] = []
    subjects.forEach((subj) => {
      const qs = getRandomUniqueQuestions(grade, subj, 2, usedIds)
      pool.push(...qs)
    })
    // Shuffle and take 6
    const shuffled = [...pool].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 6)
  }, [])

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    score: number; total: number; percentage: number;
    gapsIdentified: string[]; startingLevel: string; aiSummary: string
  } | null>(null)

  const question = pickedQuestions[step]
  const total = pickedQuestions.length

  const choose = async (index: number) => {
    const nextAnswers = [...answers, index]
    setAnswers(nextAnswers)

    if (step === total - 1) {
      setSubmitting(true)
      // Save used IDs to prevent repetition
      const newUsed = [...usedIds, ...pickedQuestions.map((q) => q.id)]
      try { sessionStorage.setItem(sessionKey, JSON.stringify(newUsed)) } catch {}

      const score = nextAnswers.filter((a, i) => a === pickedQuestions[i]?.correct).length
      const percentage = Math.round((score / total) * 100)
      const gaps = pickedQuestions
        .filter((_, i) => nextAnswers[i] !== pickedQuestions[i]?.correct)
        .map((q) => q.subject)
        .filter((v, i, arr) => arr.indexOf(v) === i)

      const level = percentage >= 80 ? "Advanced" : percentage >= 60 ? "Proficient" : percentage >= 40 ? "Developing" : "Foundation"

      // Also try to sync to server
      try { await api.submitDiagnostic(nextAnswers) } catch {}

      setTimeout(() => {
        setResult({
          score, total, percentage, gapsIdentified: gaps, startingLevel: level,
          aiSummary: gaps.length > 0
            ? `Assessment done! Found gaps in: ${gaps.join(", ")}. Learning path has been personalised to close these gaps first.`
            : `Excellent! Strong performance across all ${grade} subjects. Moving to advanced modules!`,
        })
        setSubmitting(false)
      }, 400)
    } else {
      setTimeout(() => setStep(step + 1), 220)
    }
  }

  const subjectEmoji: Record<string, string> = {
    Mathematics: "🧮", Hindi: "🇮🇳", English: "📖", Marathi: "✍️",
    "Social Science": "🌍", "EVS/Science": "🔬", Science: "⚗️",
    Physics: "⚡", Chemistry: "🧪", Biology: "🧬", IT: "💻",
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="assessment-modal">
        <div className="modal-top">
          <div>
            <span className="eyebrow">📋 DIAGNOSTIC ASSESSMENT · {grade.toUpperCase()}</span>
            <p>
              {result
                ? "Analysis Complete"
                : `Question ${step + 1} of ${total}`}
            </p>
          </div>
          <Button variant="ghost" className="icon-button" onClick={onClose}>
            <Icon name="x" />
          </Button>
        </div>

        {!result && question && (
          <>
            <div className="question-progress">
              <span style={{ width: `${((step + 1) / total) * 100}%` }} />
            </div>
            <div className="question-area">
              <div className="difficulty-row">
                <span>
                  {subjectEmoji[question.subject] || "📚"} {question.subject} · {question.topic}
                </span>
                <span className={`difficulty-tier-badge tier-${question.difficulty}`}>
                  {question.difficulty}
                </span>
              </div>
              <h2>{question.prompt}</h2>
              <div className="answers">
                {question.answers.map((answer, index) => (
                  <button
                    key={answer}
                    type="button"
                    className="modal-answer-btn"
                    onClick={() => choose(index)}
                    disabled={submitting}
                  >
                    <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                    <span className="answer-text">{answer}</span>
                  </button>
                ))}
              </div>
              <p className="adaptive-note">
                <Icon name="spark" size={15} /> {grade} curriculum · Questions rotate every session so no repeats
              </p>
            </div>
          </>
        )}

        {result && (
          <div className="result-area">
            <div className="result-icon"><Icon name="brain" size={32} /></div>
            <h2>Diagnostic Evaluated ✅</h2>
            <p>{result.aiSummary}</p>
            <div className="result-stats">
              <div>
                <strong>{result.score} / {result.total}</strong>
                <span>Score ({result.percentage}%)</span>
              </div>
              <div>
                <strong style={{ color: result.gapsIdentified.length ? "#d9534f" : "#28835e" }}>
                  {result.gapsIdentified.length}
                </strong>
                <span>Subject Gaps</span>
              </div>
              <div>
                <strong>{result.startingLevel}</strong>
                <span>Your Level</span>
              </div>
            </div>
            {result.gapsIdentified.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "10px 0" }}>
                {result.gapsIdentified.map((g) => (
                  <span key={g} style={{ background: "#fff0f0", color: "#d9534f", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                    ⚠️ {g}
                  </span>
                ))}
              </div>
            )}
            <Button onClick={() => { onComplete({} as StudentProfile) }}>
              View Subject Modules <Icon name="arrow" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- */
/* 3. DASHBOARD VIEW                                             */
/* ------------------------------------------------------------- */
function DashboardView({
  profile,
  onStartDiagnostic,
  onNavigate,
  grade,
}: {
  profile: StudentProfile
  onStartDiagnostic: () => void
  onNavigate: (page: string) => void
  grade: string
}) {
  const currentGrade = grade || profile.grade || "Grade 10"
  const gradeSubjectList = gradeSubjects[currentGrade] || gradeSubjects["Grade 10"]

  return (
    <>
      {/* ELEVATED HERO BANNER */}
      <section
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #fbf9ff 45%, #f1f7ff 100%)",
          border: "1.5px solid #e5dffa",
          borderRadius: "20px",
          padding: "26px 30px",
          marginBottom: "26px",
          boxShadow: "0 8px 30px rgba(99,91,219,0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient background orbs */}
        <div
          style={{
            position: "absolute",
            right: "-20px",
            top: "-20px",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,91,219,0.09) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "240px",
            bottom: "-30px",
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(2,132,199,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ flex: 1, minWidth: "280px" }}>
            {/* Badges header row */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "3px 10px",
                  background: "linear-gradient(135deg, #635bdb, #8b5cf6)",
                  color: "#ffffff",
                  borderRadius: "14px",
                  letterSpacing: "0.5px",
                  boxShadow: "0 2px 6px rgba(99,91,219,0.25)",
                }}
              >
                🎓 {currentGrade.toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  background: "#ecfdf5",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                  borderRadius: "14px",
                }}
              >
                ⚡ ADAPTIVE CYCLE CALIBRATED
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  background: "#fff7ed",
                  color: "#c2410c",
                  border: "1px solid #fed7aa",
                  borderRadius: "14px",
                }}
              >
                🎯 6 CURRICULUM SUBJECTS
              </span>
            </div>

            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#1a1730",
                margin: "4px 0 8px",
                letterSpacing: "-0.5px",
              }}
            >
              Welcome back, {profile.name}! ✨
            </h1>
            <p
              style={{
                color: "#6b6782",
                fontSize: "13px",
                lineHeight: 1.5,
                margin: "0 0 16px",
                maxWidth: "640px",
              }}
            >
              Your adaptive learning path is actively customized for {currentGrade}. Dive into
              interactive visual modules, test yourself with non-repeating leveled quizzes, or consult your AI Coach!
            </p>

            {/* Quick Subject Launcher Chips */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginRight: "4px",
                }}
              >
                Quick Launch:
              </span>
              {gradeSubjectList.map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => onNavigate("subjects")}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e1dcf7",
                    borderRadius: "16px",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#5548c8",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#f5f3ff"
                    e.currentTarget.style.borderColor = "#635bdb"
                    e.currentTarget.style.transform = "translateY(-1px)"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#ffffff"
                    e.currentTarget.style.borderColor = "#e1dcf7"
                    e.currentTarget.style.transform = "none"
                  }}
                >
                  <span>{subjectEmoji[subj] || "📚"}</span>
                  <span>{subj}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              minWidth: "210px",
            }}
          >
            <button
              type="button"
              className="hero-action-primary"
              onClick={onStartDiagnostic}
            >
              <Icon name="refresh" size={16} />
              <span>Retake Diagnostic</span>
            </button>
            <button
              type="button"
              className="hero-action-secondary"
              onClick={() => onNavigate("subjects")}
            >
              <Icon name="book" size={16} />
              <span>Browse Subject Modules</span>
            </button>
          </div>
        </div>
      </section>

      {/* SYMMETRICAL STATS GRID WITH UNIFORM DONUT RINGS */}
      <section className="stats-grid" style={{ marginBottom: "28px" }}>
        {/* Card 1: Overall Mastery */}
        <div
          className="stat-card"
          style={{
            background: "#ffffff",
            border: "1.5px solid #ede8fa",
            borderRadius: "16px",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 16px rgba(99,91,219,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <div
              className="stat-icon purple"
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "#f0edff",
                color: "#635bdb",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="target" size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: "11px", color: "#74708a", fontWeight: 600, display: "block", whiteSpace: "nowrap" }}>
                Overall Mastery
              </span>
              <strong style={{ fontSize: "20px", fontWeight: 800, color: "#1a1730", display: "block" }}>
                {profile.overallMastery}%
              </strong>
              <div style={{ marginTop: "3px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#059669", background: "#ecfdf5", padding: "1px 6px", borderRadius: "6px", display: "inline-block", whiteSpace: "nowrap" }}>
                  ↑ +8% this week
                </span>
              </div>
            </div>
          </div>
          <Ring value={profile.overallMastery} size={44} color="violet" />
        </div>

        {/* Card 2: Learning Time */}
        <div
          className="stat-card"
          style={{
            background: "#ffffff",
            border: "1.5px solid #e0f2fe",
            borderRadius: "16px",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 16px rgba(2,132,199,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <div
              className="stat-icon blue"
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "#e0f2fe",
                color: "#0284c7",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="clock" size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: "11px", color: "#74708a", fontWeight: 600, display: "block", whiteSpace: "nowrap" }}>
                Learning Time
              </span>
              <strong style={{ fontSize: "20px", fontWeight: 800, color: "#1a1730", display: "block" }}>
                {Math.floor(profile.studyTimeMinutes / 60)}h {profile.studyTimeMinutes % 60}m
              </strong>
              <div style={{ marginTop: "3px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#0284c7", background: "#f0f9ff", padding: "1px 6px", borderRadius: "6px", display: "inline-block", whiteSpace: "nowrap" }}>
                  🎯 42 / 50m Today
                </span>
              </div>
            </div>
          </div>
          <Ring value={Math.min(100, Math.round(((profile.studyTimeMinutes % 60) / 50) * 100))} size={44} color="sky" />
        </div>

        {/* Card 3: Day Streak */}
        <div
          className="stat-card"
          style={{
            background: "#ffffff",
            border: "1.5px solid #ffedd5",
            borderRadius: "16px",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 16px rgba(245,158,11,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <div
              className="stat-icon orange"
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "#fff7ed",
                color: "#ea580c",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="flame" size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: "11px", color: "#74708a", fontWeight: 600, display: "block", whiteSpace: "nowrap" }}>
                Day Streak
              </span>
              <strong style={{ fontSize: "20px", fontWeight: 800, color: "#1a1730", display: "block" }}>
                {profile.streakDays} Days
              </strong>
              <div style={{ marginTop: "3px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#ea580c", background: "#fff7ed", padding: "1px 6px", borderRadius: "6px", display: "inline-block", whiteSpace: "nowrap" }}>
                  🔥 Top 5% Rank
                </span>
              </div>
            </div>
          </div>
          <Ring value={Math.min(100, Math.round((profile.streakDays / 14) * 100))} size={44} color="amber" />
        </div>

        {/* Card 4: Concepts Mastered */}
        <div
          className="stat-card"
          style={{
            background: "#ffffff",
            border: "1.5px solid #dcfce7",
            borderRadius: "16px",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 16px rgba(16,185,129,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <div
              className="stat-icon green"
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "#ecfdf5",
                color: "#059669",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="book" size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: "11px", color: "#74708a", fontWeight: 600, display: "block", whiteSpace: "nowrap" }}>
                Concepts Mastered
              </span>
              <strong style={{ fontSize: "20px", fontWeight: 800, color: "#1a1730", display: "block" }}>
                {profile.masteredCount} / {profile.totalConcepts}
              </strong>
              <div style={{ marginTop: "3px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: profile.gaps.length > 0 ? "#dc2626" : "#059669",
                    background: profile.gaps.length > 0 ? "#fef2f2" : "#ecfdf5",
                    padding: "1px 6px",
                    borderRadius: "6px",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                  }}
                >
                  {profile.gaps.length > 0 ? `⚠️ ${profile.gaps.length} gaps flagged` : "All clear"}
                </span>
              </div>
            </div>
          </div>
          <Ring
            value={Math.round((profile.masteredCount / profile.totalConcepts) * 100)}
            size={44}
            color="mint"
          />
        </div>
      </section>

      {/* GRADE-SPECIFIC SUBJECTS & VISUAL MODULES */}
      <section style={{ margin: "24px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <span
              className="eyebrow"
              style={{ color: "var(--violet)", fontWeight: 800 }}
            >
              📚 CURRICULUM SUBJECTS · {currentGrade.toUpperCase()}
            </span>
            <h2
              style={{
                margin: "4px 0 0",
                fontSize: "20px",
                fontWeight: 800,
                color: "#1a1730",
              }}
            >
              Subjects, Lessons & Interactive Visuals
            </h2>
          </div>
          <Button variant="secondary" onClick={() => onNavigate("subjects")}>
            <Icon name="book" /> View All Lessons & Graphs <Icon name="arrow" />
          </Button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
            gap: "14px",
          }}
        >
          {gradeSubjectList.map((subj) => {
            const col = subjectColor[subj] || {
              bg: "#f0edff",
              border: "#c5b9ff",
              text: "#5548c8",
            }
            const lessonCount = (subjectLessons[subj] || []).length || 5
            return (
              <div
                key={subj}
                style={{
                  background: col.bg,
                  border: `1.5px solid ${col.border}`,
                  borderRadius: "16px",
                  padding: "16px 14px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  cursor: "pointer",
                  transition: "transform 0.15s ease",
                }}
                onClick={() => onNavigate("subjects")}
              >
                <div>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>
                    {subjectEmoji[subj] || "📚"}
                  </div>
                  <strong
                    style={{
                      color: col.text,
                      fontSize: "15px",
                      display: "block",
                    }}
                  >
                    {subj}
                  </strong>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#6b6782",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    {lessonCount} Interactive Lessons + Visual Graph
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "14px" }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      background: "#fff",
                      border: `1px solid ${col.border}`,
                      borderRadius: "8px",
                      padding: "6px 8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: col.text,
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onNavigate("subjects")
                    }}
                  >
                    Lessons →
                  </button>
                  <button
                    type="button"
                    style={{
                      background: col.text,
                      border: "none",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onNavigate("challenge")
                    }}
                    title="Take Adaptive Quiz"
                  >
                    Quiz ⚡
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ELEVATED REAL-TIME ADAPTIVE QUIZ SPRINT BANNER */}
      <section className="challenge-banner">
        <div className="challenge-art">
          <div className="challenge-art-core">
            <Icon name="bolt" size={26} />
          </div>
          <span className="challenge-glow-orb" />
        </div>
        <div className="challenge-copy">
          <div className="challenge-badge-row">
            <span className="challenge-stage-pill">STAGE 4 · REAL-TIME ADAPTIVE QUIZ</span>
            <span className="challenge-engine-tag">⚡ Live Difficulty Calibration</span>
          </div>
          <h2>Dynamic Assessment: Turn your weakest concepts into mastery</h2>
          <p>
            The quiz engine continuously adjusts question difficulty (Foundation
            ➔ Mastery) based on your real-time responses.
          </p>
        </div>
        <div className="challenge-reward">
          <div className="reward-icon-box">
            <Icon name="trophy" size={20} />
          </div>
          <div className="reward-info">
            <strong>+{profile.xp.toLocaleString()} XP</strong>
            <span>Active score</span>
          </div>
        </div>
        <button
          type="button"
          className="challenge-launch-btn"
          onClick={() => onNavigate("challenge")}
        >
          <span>Launch Adaptive Quiz</span>
          <Icon name="arrow" size={14} />
        </button>
      </section>

      {/* MAIN DASHBOARD SPLIT */}
      <section className="dashboard-grid">
        <div className="main-column">
          <div className="section-heading">
            <div>
              <span className="eyebrow" style={{ color: "var(--violet)", fontWeight: 800 }}>
                STAGE 3: CURATED ROADMAP
              </span>
              <h2>Your Personalized Learning Sequence</h2>
            </div>
            <button
              type="button"
              className="view-curriculum-btn"
              onClick={() => onNavigate("path")}
            >
              <span>View full curriculum</span>
              <Icon name="arrow" size={13} />
            </button>
          </div>

          {/* UPGRADED HERO LESSON CARD */}
          <div className="lesson-card">
            <div className="lesson-art">
              <div className="lesson-art-grid-lines" />
              <svg className="lesson-art-curve" viewBox="0 0 200 120" fill="none">
                <path
                  d="M 10 95 C 50 15, 80 105, 130 35 S 175 45, 195 15"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="130" cy="35" r="5" fill="#f43f5e" />
                <circle cx="75" cy="65" r="4" fill="#a78bfa" />
              </svg>
              <div className="math-badge">
                <span className="math-symbol">ƒ(x)</span>
              </div>
              <span className="lesson-art-chip">Interactive Graph</span>
            </div>

            <div className="lesson-copy">
              <div className="lesson-meta-row">
                <span className="lesson-level-badge">{profile.recommendedLevel.toUpperCase()} LEVEL</span>
                <span className="lesson-active-badge">
                  <span className="active-dot" /> ACTIVE UNIT
                </span>
                <span className="lesson-cat-pill">Algebra & Functions</span>
              </div>

              <h3>Function Graph Transformations</h3>
              <p>
                Diagnostic detected a critical prerequisite gap here. Closing this gap unlocks
                <strong> Quadratic Vertex Form</strong> and <strong>Non-Linear Systems</strong>.
              </p>

              <div className="lesson-progress-wrap">
                <div className="lesson-progress-labels">
                  <span>Prerequisite Gap Recovery</span>
                  <strong>42% Calibrated</strong>
                </div>
                <div className="mini-progress">
                  <span style={{ width: "42%" }} />
                </div>
              </div>

              <div className="lesson-footer">
                <div className="lesson-meta-chips">
                  <span className="meta-chip">
                    <Icon name="clock" size={14} /> 10 min bridge module
                  </span>
                  <span className="meta-chip gap-indicator">
                    ⚠️ Prerequisite Bridge
                  </span>
                </div>
                <button
                  type="button"
                  className="lesson-open-btn"
                  onClick={() => onNavigate("path")}
                >
                  <Icon name="play" size={14} />
                  <span>Open Lesson Module</span>
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVITY LOG & AI INTERVENTIONS */}
          <div className="section-heading compact">
            <div>
              <span className="eyebrow" style={{ color: "#64748b", fontWeight: 800 }}>
                RECENT PERFORMANCE SIGNALS
              </span>
              <h2>Activity Log & AI Interventions</h2>
            </div>
            <span className="time-pill">
              <span className="live-sync-dot" />
              <Icon name="clock" size={13} /> Real-time sync
            </span>
          </div>

          <div className="plan-list">
            {(profile.recentActivities || []).map((act) => {
              const isGap = act.type === "gap_identified"
              const isDiag = act.type === "diagnostic"
              return (
                <div className="plan-item" key={act.id}>
                  <div
                    className={`plan-icon ${isGap ? "plan-icon-gap" : isDiag ? "plan-icon-diag" : "plan-icon-done"}`}
                  >
                    <Icon
                      name={isDiag ? "target" : isGap ? "alert" : "check"}
                      size={16}
                    />
                  </div>
                  <div className="plan-title">
                    <small>{act.type.replace("_", " ")}</small>
                    <strong>{act.title}</strong>
                  </div>
                  <span className="plan-time">{act.timestamp}</span>
                  <span
                    className={`unit-score-badge ${isGap ? "badge-alert" : isDiag ? "badge-diag" : "badge-done"}`}
                  >
                    {act.badge}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="right-column">
          {/* CONCEPT MASTERY CARD */}
          <div className="insight-card">
            <div className="card-head">
              <div>
                <span className="eyebrow" style={{ color: "var(--violet)", fontWeight: 800 }}>
                  STAGE 2: KNOWLEDGE SNAPSHOT
                </span>
                <h3>Concept Mastery</h3>
              </div>
              <button
                type="button"
                className="icon-circle-btn"
                onClick={() => onNavigate("analysis")}
                title="View full knowledge graph analysis"
              >
                <Icon name="chevron" size={14} />
              </button>
            </div>

            <div className="mastery-list">
              {profile.concepts.slice(0, 4).map((c) => {
                const isMastered = c.mastery >= 75
                const isDeveloping = c.mastery >= 50
                const statusLabel = isMastered
                  ? "Mastered · Ready"
                  : isDeveloping
                    ? "Developing"
                    : "Knowledge Gap"
                const statusClass = isMastered
                  ? "status-mastered"
                  : isDeveloping
                    ? "status-developing"
                    : "status-gap"

                return (
                  <div className="mastery-item" key={c.id}>
                    <Ring
                      value={c.mastery}
                      size={42}
                      color={isMastered ? "mint" : isDeveloping ? "amber" : "violet"}
                    />
                    <div className="mastery-info">
                      <strong>{c.name}</strong>
                      <span className={`mastery-chip ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              className="explore-graph-btn"
              onClick={() => onNavigate("analysis")}
            >
              <span>Explore Full Knowledge Graph</span>
              <Icon name="arrow" size={14} />
            </button>
          </div>

          {/* AI STUDY COACH CARD */}
          <div className="coach-card">
            <div className="coach-orb-glow" />
            <div className="coach-top">
              <div className="coach-orb">
                <Icon name="spark" size={14} />
              </div>
              <span className="coach-eyebrow">NOVA AI STUDY COACH</span>
            </div>
            <h3>Stuck on a Concept?</h3>
            <p>
              Nova knows your diagnosed gaps and provides instant step-by-step proofs,
              curated analogies, and targeted practice problems.
            </p>
            <button
              type="button"
              className="coach-consult-btn"
              onClick={() => onNavigate("tutor")}
            >
              <Icon name="message" size={15} />
              <span>Consult Nova Coach</span>
              <span className="coach-sparkle-emoji">✨</span>
            </button>
          </div>
        </aside>
      </section>
    </>
  )
}

/* ------------------------------------------------------------- */
/* 4. KNOWLEDGE ANALYSIS & CONCEPT GRAPH VIEW                   */
/* ------------------------------------------------------------- */
function KnowledgeAnalysisView({
  profile,
  onNavigate,
}: {
  profile: StudentProfile
  onNavigate: (page: string) => void
}) {
  const [selectedConcept, setSelectedConcept] = useState<ConceptNode | null>(
    profile.concepts.find((c) => c.status === "gap") ||
      profile.concepts[0] ||
      null,
  )

  return (
    <div className="page-view">
      <div className="page-hero">
        <div>
          <span className="eyebrow">
            STAGE 2: KNOWLEDGE GAP DETECTION & PREREQUISITE GRAPH
          </span>
          <h1>Knowledge Graph & Prerequisite Analysis</h1>
          <p>
            The AI maps concept dependencies, analyzes your demonstrated
            mastery, and isolates root prerequisite bottlenecks before they
            compound.
          </p>
        </div>
        <Button variant="secondary" onClick={() => onNavigate("path")}>
          View Personalized Path <Icon name="arrow" />
        </Button>
      </div>

      {/* GRAPH VIEWPORT */}
      <div className="graph-viewport">
        <div className="graph-legend">
          <div className="legend-item">
            <span className="legend-dot mastered" />
            <span>Mastered (≥ 75%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot developing" />
            <span>Developing (50% - 74%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot gap" />
            <span>Knowledge Gap (&lt; 50%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot locked" />
            <span>Locked (Prerequisites Unmet)</span>
          </div>
        </div>

        <div className="graph-nodes-grid">
          {profile.concepts.map((concept) => {
            const isSelected = selectedConcept?.id === concept.id
            return (
              <div
                key={concept.id}
                className={`graph-node-card status-${concept.status} ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => setSelectedConcept(concept)}
              >
                <div className="node-header">
                  <span className="node-topic">{concept.topic}</span>
                  <Ring
                    value={concept.mastery}
                    color={
                      concept.mastery >= 75
                        ? "mint"
                        : concept.mastery >= 50
                          ? "amber"
                          : "violet"
                    }
                    size={34}
                  />
                </div>
                <h4 className="node-title">{concept.name}</h4>
                <p className="node-desc">{concept.description}</p>
                <div className="node-meta">
                  <span>Bloom: {concept.bloomLevel}</span>
                  <span
                    style={{ textTransform: "capitalize", fontWeight: 700 }}
                  >
                    {concept.status.replace("_", " ")}
                  </span>
                </div>
                {concept.prerequisites.length > 0 && (
                  <div className="node-prereqs">
                    {concept.prerequisites.map((p) => (
                      <span key={p} className="prereq-badge">
                        Requires: {p.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* SELECTED CONCEPT INSPECTOR DRAWER */}
        {selectedConcept && (
          <div className="graph-detail-drawer">
            <div className="graph-detail-header">
              <div>
                <span className="eyebrow" style={{ color: "#bebbf6" }}>
                  CONCEPT DEEP DIVE
                </span>
                <h3>{selectedConcept.name}</h3>
              </div>
              <span
                className={`difficulty-tier-badge tier-${
                  selectedConcept.status === "gap" ? "Mastery" : "Foundation"
                }`}
              >
                Status: {selectedConcept.status.toUpperCase()}
              </span>
            </div>
            <p
              style={{
                color: "#d6d4e8",
                fontSize: "12px",
                margin: "6px 0 14px",
              }}
            >
              {selectedConcept.description}
            </p>
            <div className="detail-grid">
              <div className="detail-item">
                <span>Mastery Level</span>
                <strong>{selectedConcept.mastery}%</strong>
              </div>
              <div className="detail-item">
                <span>Cognitive Level</span>
                <strong>{selectedConcept.bloomLevel}</strong>
              </div>
              <div className="detail-item">
                <span>Direct Prerequisites</span>
                <strong>
                  {selectedConcept.prerequisites.length
                    ? selectedConcept.prerequisites.join(", ")
                    : "None (Foundational)"}
                </strong>
              </div>
              <div className="detail-item">
                <span>AI Recommendation</span>
                <strong>
                  {selectedConcept.recommendedAction ||
                    "Continue consistent review"}
                </strong>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <Button onClick={() => onNavigate("path")}>
                Jump to Curriculum Unit <Icon name="arrow" />
              </Button>
              <Button variant="secondary" onClick={() => onNavigate("tutor")}>
                Ask Nova About This Concept
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* PREREQUISITE GAP CARDS */}
      <div className="large-panel gap-summary">
        <span className="eyebrow">CRITICAL PREREQUISITE BOTTLENECKS</span>
        <h2>Knowledge Gaps Requiring Remediation</h2>
        {profile.gaps.length === 0 ? (
          <p style={{ color: "#47a282", fontWeight: 600 }}>
            No critical prerequisite gaps detected! Your conceptual foundation
            is solid.
          </p>
        ) : (
          profile.gaps.map((gap) => (
            <div className="gap-row" key={gap.conceptId}>
              <span className="risk-dot" />
              <div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <strong>{gap.conceptName}</strong>
                  <span
                    className="unit-score"
                    style={{ background: "#ffebee", color: "#c62828" }}
                  >
                    {gap.priority} Priority Gap ({gap.mastery}% Mastery)
                  </span>
                </div>
                <p>
                  <strong>Impact:</strong> Impedes understanding of{" "}
                  {gap.blockedConcepts.join(", ") || "advanced applications"}.
                </p>
                <p style={{ color: "#666280" }}>{gap.remediationAction}</p>
              </div>
              <Button variant="secondary" onClick={() => onNavigate("path")}>
                Remediate in Path <Icon name="arrow" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- */
/* 5. PERSONALIZED LEARNING PATH VIEW & LESSON MODAL             */
/* ------------------------------------------------------------- */
function LearningPathView({
  onNavigate,
  onRefreshProfile,
}: {
  onNavigate: (page: string) => void
  onRefreshProfile: () => void
}) {
  const [units, setUnits] = useState<LearningPathUnit[]>([])
  const [activeLesson, setActiveLesson] = useState<LearningPathUnit | null>(
    null,
  )
  const [completing, setCompleting] = useState(false)
  const [lessonFinishedToast, setLessonFinishedToast] = useState(false)

  const loadUnits = async () => {
    try {
      const data = await api.getLearningPath()
      setUnits(data.units)
    } catch {
      // Fallback
    }
  }

  useEffect(() => {
    loadUnits()
  }, [])

  const handleCompleteLesson = async (unitId: string) => {
    setCompleting(true)
    try {
      const res = await api.completeLessonUnit(unitId)
      setUnits(res.units)
      setActiveLesson(null)
      setLessonFinishedToast(true)
      onRefreshProfile()
      setTimeout(() => setLessonFinishedToast(false), 5000)
    } catch {
      // Offline fallback
      setActiveLesson(null)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="page-view">
      <div className="page-hero">
        <div>
          <span className="eyebrow">STAGE 3: DYNAMIC CURRICULUM</span>
          <h1>Personalized Learning Path</h1>
          <p>
            Curriculum order is computed dynamically. When knowledge gaps are
            detected, bridge modules are inserted to secure prerequisites before
            advanced topics unlock.
          </p>
        </div>
        <Button onClick={() => onNavigate("challenge")}>
          Test Mastery in Adaptive Quiz <Icon name="bolt" />
        </Button>
      </div>

      {lessonFinishedToast && (
        <div className="adaptation-callout increased">
          <Icon name="check" size={16} />
          <span>
            <strong>Lesson Complete!</strong> Concept mastery boosted (+15%).
            Knowledge gap closed and curriculum updated.
          </span>
        </div>
      )}

      <div className="path-layout">
        <div className="path-list">
          {units.map((unit) => {
            const isDone = unit.status === "completed"
            const isRemed = unit.isRemediation
            const isLocked = unit.status === "locked"

            return (
              <div
                className={`path-unit ${
                  isDone
                    ? "done"
                    : isRemed
                      ? "active"
                      : isLocked
                        ? "locked"
                        : "active"
                }`}
                key={unit.id}
                style={
                  isRemed
                    ? { borderColor: "#8e78e6", background: "#fbfaff" }
                    : {}
                }
              >
                <span className="unit-num">
                  {isDone ? (
                    <Icon name="check" />
                  ) : isLocked ? (
                    <Icon name="lock" size={14} />
                  ) : (
                    unit.unitCode
                  )}
                </span>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <small>UNIT {unit.unitCode}</small>
                    {isRemed && (
                      <span
                        className="unit-score"
                        style={{
                          background: "#eeeafd",
                          color: "#5644cc",
                          fontWeight: 700,
                        }}
                      >
                        AI REMEDIATION BRIDGE
                      </span>
                    )}
                  </div>
                  <h3>{unit.title}</h3>
                  <p>{unit.description}</p>
                  <p
                    style={{
                      fontSize: "10px",
                      color: "#747098",
                      marginTop: "4px",
                    }}
                  >
                    <strong>AI Rationale:</strong> {unit.aiRationale}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "8px",
                  }}
                >
                  <span className="unit-score">{unit.durationMinutes} min</span>
                  {!isLocked && (
                    <Button
                      variant={isDone ? "secondary" : "primary"}
                      onClick={() => setActiveLesson(unit)}
                    >
                      {isDone ? "Review Lesson" : "Start Lesson"}{" "}
                      <Icon name="arrow" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* AI RATIONALE PANEL */}
        <aside className="gap-panel">
          <div className="gap-icon">
            <Icon name="brain" />
          </div>
          <span className="eyebrow">ADAPTIVE ENGINE DISPATCH</span>
          <h3>Prerequisite Injection Logic</h3>
          <p>
            When a concept falls below 60% mastery, the system identifies all
            dependent downstream units and automatically scaffolds the path.
          </p>
          <div className="gap-flow">
            <span>Factoring</span>
            <Icon name="arrow" />
            <span style={{ background: "#6b5ce7", color: "#fff" }}>
              Transformations
            </span>
            <Icon name="arrow" />
            <span>Quadratics</span>
            <Icon name="arrow" />
            <span>Vertex Form</span>
          </div>
          <small>
            Bridge units provide conceptual analogies, visual demonstrations,
            and interactive checks to repair gaps quickly.
          </small>
        </aside>
      </div>

      {/* INTERACTIVE LESSON MODAL */}
      {activeLesson && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div
            className="assessment-modal"
            style={{ width: "min(720px, 100%)" }}
          >
            <div className="modal-top">
              <div>
                <span className="eyebrow">
                  {activeLesson.isRemediation
                    ? "AI BRIDGE REMEDIATION"
                    : "CURRICULUM LESSON"}
                </span>
                <p>
                  Unit {activeLesson.unitCode}: {activeLesson.title}
                </p>
              </div>
              <Button
                variant="ghost"
                className="icon-button"
                onClick={() => setActiveLesson(null)}
              >
                <Icon name="x" />
              </Button>
            </div>

            <div className="lesson-modal-content">
              <div className="lesson-section">
                <h4>Conceptual Overview</h4>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#48485b",
                    lineHeight: 1.6,
                  }}
                >
                  {activeLesson.lessonContent?.overview ||
                    activeLesson.description}
                </p>
              </div>

              {activeLesson.lessonContent?.formulaOrRule && (
                <div className="lesson-section">
                  <h4>Core Equation & Rule</h4>
                  <div className="lesson-formula-box">
                    {activeLesson.lessonContent.formulaOrRule}
                  </div>
                </div>
              )}

              {activeLesson.lessonContent?.keyPoints && (
                <div className="lesson-section">
                  <h4>Key Takeaways</h4>
                  <ul
                    style={{
                      paddingLeft: "18px",
                      margin: "6px 0",
                      fontSize: "11px",
                      color: "#4c4c5e",
                      lineHeight: 1.7,
                    }}
                  >
                    {activeLesson.lessonContent.keyPoints.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeLesson.lessonContent?.interactiveExample && (
                <div className="lesson-section">
                  <h4>Interactive Worked Example</h4>
                  <div className="lesson-example-box">
                    <strong>
                      Problem:{" "}
                      {activeLesson.lessonContent.interactiveExample.problem}
                    </strong>
                    <p>
                      <strong>Solution:</strong>{" "}
                      {activeLesson.lessonContent.interactiveExample.solution}
                    </p>
                    <div className="lesson-tip">
                      <Icon name="spark" size={14} />
                      <span>
                        {activeLesson.lessonContent.interactiveExample.tip}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "24px",
                }}
              >
                <Button variant="secondary" onClick={() => onNavigate("tutor")}>
                  Ask Nova for Clarification
                </Button>
                <Button
                  onClick={() => handleCompleteLesson(activeLesson.id)}
                  disabled={completing}
                >
                  <Icon name="check" /> Complete Lesson & Verify Mastery (+15%)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- */
/* 6. ADAPTIVE QUIZ ARENA (Dynamic Difficulty & Non-Repeating)    */
/* ------------------------------------------------------------- */
const DIFFICULTY_TIERS: DifficultyLevel[] = [
  "Foundation",
  "Developing",
  "Proficient",
  "Advanced",
  "Mastery",
]

function AdaptiveQuizView({
  onFinish,
  onNavigate,
  grade,
}: {
  onFinish: () => void
  onNavigate: (page: string) => void
  grade?: string
}) {
  const currentGrade = grade || "Grade 10"
  const subjects = gradeSubjects[currentGrade] || gradeSubjects["Grade 10"]
  const [activeSubject, setActiveSubject] = useState<string>(subjects[0] || "Mathematics")
  const [tierIndex, setTierIndex] = useState(1) // Start at Developing
  const [questionNumber, setQuestionNumber] = useState(1)
  const totalQuestions = 5

  const [currentQuestion, setCurrentQuestion] = useState<SubjectQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [evaluation, setEvaluation] = useState<{
    isCorrect: boolean
    explanation: string
    difficultyChange: "increased" | "decreased" | "maintained"
    newTier: DifficultyLevel
    aiFeedback: string
    xpEarned: number
  } | null>(null)

  const [score, setScore] = useState(0)
  const [totalXp, setTotalXp] = useState(0)
  const [streak, setStreak] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [adaptationReason, setAdaptationReason] = useState(
    `Initial baseline difficulty calibrated to ${DIFFICULTY_TIERS[1]} for ${currentGrade} ${activeSubject}.`,
  )

  // Non-repeating question session store
  const getSeenIds = (subj: string): string[] => {
    const key = `learnova_adaptive_seen_${currentGrade}_${subj}`
    try {
      return JSON.parse(sessionStorage.getItem(key) || "[]")
    } catch {
      return []
    }
  }

  const markSeenId = (subj: string, id: string) => {
    const key = `learnova_adaptive_seen_${currentGrade}_${subj}`
    const seen = getSeenIds(subj)
    if (!seen.includes(id)) {
      try {
        sessionStorage.setItem(key, JSON.stringify([...seen, id]))
      } catch {}
    }
  }

  // Load question for a given tier and subject, strictly avoiding previously seen questions
  const loadQuestionForTier = (subj: string, targetTierIdx: number): SubjectQuestion | null => {
    const seenIds = getSeenIds(subj)
    const targetDifficulty = DIFFICULTY_TIERS[targetTierIdx]

    // 1. Try to find a question in the exact target difficulty that hasn't been seen
    let candidates = allQuestions.filter(
      (q) =>
        q.grade === currentGrade &&
        q.subject === subj &&
        q.difficulty === targetDifficulty &&
        !seenIds.includes(q.id),
    )

    // 2. If exhausted at this tier, try any unused question in this subject
    if (candidates.length === 0) {
      candidates = allQuestions.filter(
        (q) =>
          q.grade === currentGrade &&
          q.subject === subj &&
          !seenIds.includes(q.id),
      )
    }

    // 3. If ALL questions for this subject have been seen, reset history so student never gets stuck
    if (candidates.length === 0) {
      const key = `learnova_adaptive_seen_${currentGrade}_${subj}`
      try {
        sessionStorage.removeItem(key)
      } catch {}
      candidates = allQuestions.filter(
        (q) => q.grade === currentGrade && q.subject === subj,
      )
    }

    if (candidates.length === 0) {
      // Fallback: pick any available question in the entire grade
      candidates = allQuestions.filter((q) => q.grade === currentGrade)
    }

    const shuffled = [...candidates].sort(() => 0.5 - Math.random())
    const picked = shuffled[0] || null
    if (picked) {
      markSeenId(subj, picked.id)
    }
    return picked
  }

  const initSubjectQuiz = (subj: string) => {
    setActiveSubject(subj)
    setTierIndex(1)
    setQuestionNumber(1)
    setSelectedAnswer(null)
    setEvaluation(null)
    setScore(0)
    setTotalXp(0)
    setStreak(0)
    setIsFinished(false)

    const q = loadQuestionForTier(subj, 1)
    setCurrentQuestion(q)
    setAdaptationReason(
      `Starting adaptive assessment for ${subj} at ${DIFFICULTY_TIERS[1]} difficulty.`,
    )
  }

  useEffect(() => {
    initSubjectQuiz(activeSubject)
  }, [currentGrade])

  const handleSelect = (idx: number) => {
    if (selectedAnswer !== null || !currentQuestion) return
    setSelectedAnswer(idx)

    const correct = idx === currentQuestion.correct
    let nextTierIdx = tierIndex
    let change: "increased" | "decreased" | "maintained" = "maintained"
    let feedback = ""

    if (correct) {
      setScore((s) => s + 1)
      setStreak((st) => st + 1)
      const earned = (tierIndex + 1) * 35
      setTotalXp((xp) => xp + earned)

      if (tierIndex < DIFFICULTY_TIERS.length - 1) {
        nextTierIdx = tierIndex + 1
        change = "increased"
        feedback = `Outstanding! You answered correctly. Leveled up to ${DIFFICULTY_TIERS[nextTierIdx]} difficulty! 🚀`
      } else {
        feedback = `Flawless execution! Maintaining peak Mastery tier challenge.`
      }
    } else {
      setStreak(0)
      setTotalXp((xp) => xp + 10)
      if (tierIndex > 0) {
        nextTierIdx = tierIndex - 1
        change = "decreased"
        feedback = `Prerequisite gap signal detected. Stepping difficulty down to ${DIFFICULTY_TIERS[nextTierIdx]} to reinforce foundations.`
      } else {
        feedback = `Reinforcing foundational principles with scaffolded guidance.`
      }
    }

    setTierIndex(nextTierIdx)
    setEvaluation({
      isCorrect: correct,
      explanation: currentQuestion.explanation,
      difficultyChange: change,
      newTier: DIFFICULTY_TIERS[nextTierIdx],
      aiFeedback: feedback,
      xpEarned: correct ? (tierIndex + 1) * 35 : 10,
    })
  }

  const handleNext = () => {
    if (questionNumber >= totalQuestions) {
      setIsFinished(true)
      onFinish()
      return
    }

    const nextQNum = questionNumber + 1
    const nextQ = loadQuestionForTier(activeSubject, tierIndex)

    setQuestionNumber(nextQNum)
    setCurrentQuestion(nextQ)
    setSelectedAnswer(null)
    setEvaluation(null)
    setAdaptationReason(
      `Question ${nextQNum} calibrated to ${DIFFICULTY_TIERS[tierIndex]} tier matching your real-time accuracy.`,
    )
  }

  if (isFinished) {
    return (
      <div className="challenge-page result">
        <div className="confetti confetti-a" />
        <div className="confetti confetti-b" />
        <div className="confetti confetti-c" />
        <div className="trophy-orb">
          <Icon name="trophy" size={42} />
        </div>
        <span className="eyebrow">ADAPTIVE SPRINT COMPLETE · {currentGrade}</span>
        <h1>{activeSubject} Adaptive Sprint Finished!</h1>
        <p>
          The engine tested your mastery across real-time dynamic tiers. Questions
          are uniquely tracked — next time you take this quiz, you will get fresh
          questions!
        </p>
        <div className="result-score">
          <strong>+{totalXp}</strong>
          <span>XP Gained Across Leveled Tiers</span>
        </div>
        <div className="result-pills">
          <span>
            <Icon name="target" /> {score} / {totalQuestions} Correct
          </span>
          <span>
            <Icon name="zap" /> Highest Tier: {DIFFICULTY_TIERS[tierIndex]}
          </span>
          <span>
            <Icon name="spark" /> Different Q/A Next Run
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          <Button onClick={() => onNavigate("recommendations")}>
            View Updated Recommendations <Icon name="arrow" />
          </Button>
          <Button variant="secondary" onClick={() => initSubjectQuiz(activeSubject)}>
            <Icon name="refresh" /> Retake With Fresh Questions
          </Button>
          <Button variant="ghost" onClick={() => onNavigate("subjects")}>
            <Icon name="book" /> Browse Subject Modules
          </Button>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="challenge-page" style={{ textAlign: "center", padding: "60px 0" }}>
        <Icon name="brain" size={36} />
        <h2 style={{ marginTop: "16px" }}>Preparing Adaptive Question Pool...</h2>
      </div>
    )
  }

  const currentTier = DIFFICULTY_TIERS[tierIndex]

  return (
    <div className="challenge-page">
      {/* SUBJECT SELECTOR TABS */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "10px",
          marginBottom: "16px",
          borderBottom: "1px solid #ede9fe",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 800,
            color: "var(--muted)",
            alignSelf: "center",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            whiteSpace: "nowrap",
          }}
        >
          Active Subject:
        </span>
        {subjects.map((s) => (
          <button
            key={s}
            type="button"
            className={`persona-btn ${activeSubject === s ? "active" : ""}`}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 700,
              borderRadius: "20px",
              whiteSpace: "nowrap",
            }}
            onClick={() => initSubjectQuiz(s)}
          >
            {subjectEmoji[s] || "📚"} {s}
          </button>
        ))}
      </div>

      <div className="challenge-status">
        <div>
          <span className={`challenge-level difficulty-tier-badge tier-${currentTier}`}>
            <Icon name="bolt" size={14} /> TIER {tierIndex + 1}/5: {currentTier.toUpperCase()}
          </span>
          <span>
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>
        <div className="challenge-track">
          {[...Array(totalQuestions)].map((_, i) => (
            <span
              key={i}
              className={
                i < questionNumber - 1
                  ? "passed"
                  : i === questionNumber - 1
                    ? "current"
                    : ""
              }
            />
          ))}
        </div>
        <div className="game-stats">
          <span>
            <Icon name="flame" size={15} /> Streak: {streak}
          </span>
          <span>
            <Icon name="trophy" size={15} /> {totalXp} XP
          </span>
        </div>
      </div>

      {/* ADAPTIVE DIFFICULTY TOAST */}
      {evaluation && (
        <div className={`adaptation-callout ${evaluation.difficultyChange}`}>
          <Icon name={evaluation.isCorrect ? "zap" : "alert"} size={16} />
          <span>
            <strong>
              {evaluation.isCorrect
                ? "Difficulty Tier Leveled Up! 🚀"
                : "Reinforcing Foundational Concept 💡"}
            </strong>{" "}
            {evaluation.aiFeedback}
          </span>
        </div>
      )}

      <div className="quiz-card">
        <div className="quiz-topic">
          <span>
            {subjectEmoji[currentQuestion.subject] || "📚"}{" "}
            {currentQuestion.subject} · {currentQuestion.topic}
          </span>
          <span className={`difficulty-tier-badge tier-${currentTier}`}>
            Level {tierIndex + 1} / 5 · {currentTier}
          </span>
        </div>

        <h1 style={{ fontSize: "20px", lineHeight: 1.5, margin: "16px 0 20px" }}>
          {currentQuestion.prompt}
        </h1>

        <div className="quiz-answers">
          {currentQuestion.answers.map((answer, idx) => {
            const isChosen = selectedAnswer === idx
            const isRight = idx === currentQuestion.correct
            const state =
              selectedAnswer === null
                ? ""
                : isRight
                  ? "correct"
                  : isChosen
                    ? "incorrect"
                    : "muted"

            return (
              <Button
                key={answer}
                variant="secondary"
                className={state}
                onClick={() => handleSelect(idx)}
              >
                <span>{String.fromCharCode(65 + idx)}</span>
                {answer}
                {state === "correct" && <Icon name="check" />}
                {state === "incorrect" && <Icon name="x" />}
              </Button>
            )
          })}
        </div>

        {evaluation && (
          <div
            className={`answer-feedback ${
              evaluation.isCorrect ? "good" : "retry"
            }`}
          >
            <div>
              <Icon name={evaluation.isCorrect ? "spark" : "brain"} />
              <div>
                <strong>
                  {evaluation.isCorrect
                    ? "Correct! Leveling Up Next Question."
                    : "Concept Review & Hint:"}
                </strong>
                <p>{evaluation.explanation}</p>
                {currentQuestion.prerequisiteHint && !evaluation.isCorrect && (
                  <p
                    style={{
                      color: "#d9534f",
                      fontWeight: 600,
                      marginTop: "6px",
                      fontSize: "12px",
                    }}
                  >
                    💡 Prerequisite Hint: {currentQuestion.prerequisiteHint}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button onClick={handleNext}>
                {questionNumber >= totalQuestions
                  ? "View Sprint Results"
                  : "Next Question"}{" "}
                <Icon name="arrow" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="quiz-ai-note">
        <Icon name="spark" size={15} /> {adaptationReason} · Questions never repeat in this session
      </p>
    </div>
  )
}

/* ------------------------------------------------------------- */
/* 7. UPDATED RECOMMENDATIONS VIEW (Closing the Loop)            */
/* ------------------------------------------------------------- */
function UpdatedRecommendationsView({
  profile,
  onNavigate,
  onStartDiagnostic,
}: {
  profile: StudentProfile
  onNavigate: (page: string) => void
  onStartDiagnostic: () => void
}) {
  return (
    <div className="page-view">
      <div className="page-hero">
        <div>
          <span className="eyebrow">STAGE 5: CONTINUOUS LEARNING PROFILE</span>
          <h1>Updated AI Recommendations</h1>
          <p>
            The adaptive learning cycle has completed! Based on your latest quiz
            signals, your knowledge model and recommended actions have been
            updated.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button variant="secondary" onClick={onStartDiagnostic}>
            <Icon name="refresh" /> Retake Diagnostic
          </Button>
          <Button onClick={() => onNavigate("home")}>
            <Icon name="grid" /> Back to Dashboard
          </Button>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">
            <Icon name="target" />
          </div>
          <div>
            <span>Updated mastery</span>
            <strong>{profile.overallMastery}%</strong>
            <small>Current Profile</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <Icon name="check" />
          </div>
          <div>
            <span>Mastered Concepts</span>
            <strong>
              {profile.masteredCount} / {profile.totalConcepts}
            </strong>
            <small>Demonstrated</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <Icon name="bolt" />
          </div>
          <div>
            <span>Calibrated Level</span>
            <strong>{profile.recommendedLevel}</strong>
            <small>Active Tier</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Icon name="spark" />
          </div>
          <div>
            <span>Total XP</span>
            <strong>{profile.xp} XP</strong>
            <small>Accumulated</small>
          </div>
        </div>
      </section>

      {/* RECOMMENDATIONS CARDS */}
      <h2 style={{ fontSize: "18px", margin: "24px 0 12px" }}>
        Next Action Prescriptions
      </h2>
      <div className="recommendations-grid">
        <div className="rec-card">
          <div>
            <div className="rec-card-top">
              <div className="rec-icon">
                <Icon name="path" />
              </div>
              <span className="eyebrow">PRIMARY ACTION</span>
            </div>
            <h3>Resume Core Learning Path</h3>
            <p>
              Your updated prerequisite standing clears you to progress through
              Unit 03: Understanding Quadratic Functions.
            </p>
          </div>
          <Button onClick={() => onNavigate("path")}>
            Go to Learning Path <Icon name="arrow" />
          </Button>
        </div>

        <div className="rec-card">
          <div>
            <div className="rec-card-top">
              <div className="rec-icon">
                <Icon name="brain" />
              </div>
              <span className="eyebrow">TARGETED SPRINT</span>
            </div>
            <h3>Practice Graph Transformations</h3>
            <p>
              Reinforce horizontal shifts f(x - h) with Nova coach to ensure
              full mastery before Quadratic Vertex Form.
            </p>
          </div>
          <Button variant="secondary" onClick={() => onNavigate("tutor")}>
            Consult AI Study Coach <Icon name="arrow" />
          </Button>
        </div>

        <div className="rec-card">
          <div>
            <div className="rec-card-top">
              <div className="rec-icon">
                <Icon name="bolt" />
              </div>
              <span className="eyebrow">CHALLENGE ARENA</span>
            </div>
            <h3>Adaptive Speed Run</h3>
            <p>
              Challenge yourself with a 5-question adaptive quiz at higher
              difficulty tiers to test edge cases.
            </p>
          </div>
          <Button variant="secondary" onClick={() => onNavigate("challenge")}>
            Launch Adaptive Quiz <Icon name="arrow" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- */
/* 8. AI STUDY COACH (Nova)                                      */
/* ------------------------------------------------------------- */
function CoachView({ profile }: { profile: StudentProfile }) {
  const activeGap =
    profile.gaps[0]?.conceptName || "Function Graph Transformations"
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: "init",
      from: "ai",
      text: `Hello ${profile.name}! I am Nova, your AI study coach. I've analyzed your profile and noticed that **${activeGap}** is currently your highest-impact knowledge gap. Would you like a visual explanation, a real-world analogy, or a targeted practice problem?`,
      timestamp: "Just now",
      relatedConcept: activeGap,
    },
  ])
  const [value, setValue] = useState("")
  const [mode, setMode] =
    useState<"explanation" | "analogy" | "step_by_step" | "practice_question" | "socratic">(
      "explanation",
    )
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, sending])

  const send = async (text = value, selectedMode = mode) => {
    if (!text.trim() || sending) return
    const userMsg: TutorMessage = {
      id: `u_${Date.now()}`,
      from: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }
    setMessages((prev) => [...prev, userMsg])
    setValue("")
    setSending(true)

    try {
      const reply = await api.sendTutorMessage(
        text,
        selectedMode,
        profile.gaps[0]?.conceptId,
      )
      setMessages((prev) => [...prev, reply])
    } catch {
      // Offline / Local solver fallback
      const fallbackMsg = getClientTutorFallback(
        text,
        selectedMode,
        profile.name,
      )
      setMessages((prev) => [...prev, fallbackMsg])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="coach-page">
      <div className="coach-header">
        <div className="coach-avatar">
          <Icon name="spark" />
        </div>
        <div>
          <span className="eyebrow">AI-POWERED ADAPTIVE STUDY COACH</span>
          <h2>Nova, Your AI Problem Solver & Tutor</h2>
          <p>
            <span className="online-dot" /> Online · Active student:{" "}
            <strong>{profile.name}</strong> ({profile.grade})
          </p>
        </div>
      </div>

      <div className="chat-area">
        <div className="chat-context">
          <Icon name="brain" />
          <span>
            Context: Targeting knowledge gap in <strong>{activeGap}</strong>
          </span>
        </div>

        {/* QUICK PROBLEM SOLVING CHIPS */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            margin: "10px 0 16px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              color: "var(--muted)",
              fontWeight: 700,
              alignSelf: "center",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Quick Prompts:
          </span>
          {[
            { text: "Hi Nova 👋", label: "Say Hi" },
            { text: "Solve: 2x + 5 = 15", label: "Solve: 2x + 5 = 15" },
            { text: "Factor: x² + 7x + 12", label: "Factor: x² + 7x + 12" },
            {
              text: "Solve: x² - 7x + 10 = 0",
              label: "Quadratic: x² - 7x + 10 = 0",
            },
            { text: "Vertex of y = 2(x - 3)² + 4", label: "Vertex Form" },
            { text: "Area of circle radius 7", label: "Circle Area" },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              className="filter-pill"
              style={{ fontSize: "10px", padding: "4px 10px" }}
              onClick={() => send(chip.text, "step_by_step")}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {messages.map((m) => (
          <div key={m.id} className={`message ${m.from}`}>
            <span className="message-avatar">
              {m.from === "ai" ? (
                <Icon name="spark" size={15} />
              ) : (
                profile.avatar
              )}
            </span>
            <div>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {m.text}
              </p>
              {m.practiceProblem && (
                <div
                  className="lesson-example-box"
                  style={{ marginTop: "10px", background: "#fff" }}
                >
                  <strong>Practice Problem: {m.practiceProblem.prompt}</strong>
                  <p style={{ color: "#666278" }}>
                    <em>Hint: {m.practiceProblem.hint}</em>
                  </p>
                  <details
                    style={{
                      fontSize: "11px",
                      color: "#28835e",
                      cursor: "pointer",
                      marginTop: "6px",
                    }}
                  >
                    <summary>View Solution</summary>
                    <div style={{ marginTop: "6px", fontWeight: 700 }}>
                      {m.practiceProblem.solution}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="message ai">
            <span className="message-avatar">
              <Icon name="spark" size={15} />
            </span>
            <div
              style={{
                color: "var(--muted)",
                fontStyle: "italic",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Icon name="refresh" size={13} /> Nova is solving step-by-step...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />

        <div
          className="suggestions"
          style={{ flexWrap: "wrap", marginTop: "12px" }}
        >
          {[
            { label: "Visual Breakdown", mode: "explanation" },
            { label: "Real-World Analogy", mode: "analogy" },
            { label: "Step-by-Step Algorithm", mode: "step_by_step" },
            { label: "Give Me Practice", mode: "practice_question" },
            { label: "Socratic Hint", mode: "socratic" },
          ].map((item) => (
            <Button
              key={item.label}
              variant="secondary"
              onClick={() => {
                setMode(item.mode as any)
                send(
                  `Explain ${activeGap} using ${item.label.toLowerCase()}`,
                  item.mode as any,
                )
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="composer">
        <input
          aria-label="Ask your coach"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask a question, say 'hi', or type an equation (e.g. 2x + 5 = 15)..."
        />
        <Button onClick={() => send()} disabled={sending}>
          <Icon name="arrow" />
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- */
/* 9. RESOURCE LIBRARY & INTERACTIVE RESOURCE MODALS              */
/* ------------------------------------------------------------- */
type ResourceItem = {
  type: string
  title: string
  text: string
  time: string
  tone: string
}

function ResourceModal({
  resource,
  onClose,
  onNavigate,
}: {
  resource: ResourceItem
  onClose: () => void
  onNavigate: (page: string) => void
}) {
  // States for Visual Guide (Parabola shifts)
  const [hShift, setHShift] = useState(2)
  const [kShift, setKShift] = useState(3)

  // States for Practice Set
  const [quizStep, setQuizStep] = useState(0)
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [practiceScore, setPracticeScore] = useState(0)

  // States for AI Explanation (Completing the square)
  const [bCoeff, setBCoeff] = useState(6)

  // States for Interactive Builder
  const [aCoeff, setACoeff] = useState(1)
  const [bBuilder, setBBuilder] = useState(-4)
  const [cBuilder, setCBuilder] = useState(3)

  const practiceQuestions = [
    {
      prompt: "What is the factored form of x² + 7x + 12?",
      answers: [
        "(x + 3)(x + 4)",
        "(x + 2)(x + 6)",
        "(x − 3)(x − 4)",
        "(x + 1)(x + 12)",
      ],
      correct: 0,
      explanation:
        "Find two numbers that multiply to 12 and add to 7: 3 × 4 = 12 and 3 + 4 = 7.",
    },
    {
      prompt: "What is the factored form of x² − 8x + 15?",
      answers: [
        "(x + 3)(x + 5)",
        "(x − 3)(x − 5)",
        "(x − 2)(x − 6)",
        "(x + 1)(x − 15)",
      ],
      correct: 1,
      explanation:
        "Since the middle term is negative and the constant is positive, both factors are negative: (-3) × (-5) = 15 and (-3) + (-5) = -8.",
    },
    {
      prompt: "Factor the difference of squares: x² − 49",
      answers: ["(x − 7)²", "(x + 7)²", "(x − 7)(x + 7)", "(x − 49)(x + 1)"],
      correct: 2,
      explanation: "The formula a² − b² = (a − b)(a + b) gives (x − 7)(x + 7).",
    },
  ]

  // Calculations for Interactive Builder
  const vertexX = -bBuilder / (2 * (aCoeff === 0 ? 0.001 : aCoeff))
  const vertexY = aCoeff * vertexX * vertexX + bBuilder * vertexX + cBuilder
  const discriminant = bBuilder * bBuilder - 4 * aCoeff * cBuilder

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div
        className="assessment-modal"
        style={{
          width: "min(760px, 100%)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="modal-top">
          <div>
            <span className="eyebrow" style={{ color: "var(--violet)" }}>
              {resource.type}
            </span>
            <h2 style={{ fontSize: "17px", margin: "2px 0 0" }}>
              {resource.title}
            </h2>
          </div>
          <Button variant="ghost" className="icon-button" onClick={onClose}>
            <Icon name="x" />
          </Button>
        </div>

        <div style={{ padding: "24px 30px", overflowY: "auto", flex: 1 }}>
          {/* 1. VISUAL GUIDE: PARABOLA SHIFTS */}
          {resource.title.includes("Parabolas Move") && (
            <div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  margin: "0 0 16px",
                }}
              >
                Adjust the horizontal and vertical sliders to see how modifying{" "}
                <strong>h</strong> and <strong>k</strong> in the vertex form{" "}
                <code>y = (x − h)² + k</code> dynamically transforms the
                parabola on the Cartesian plane.
              </p>

              <div className="graph-canvas-wrap">
                <svg
                  width="340"
                  height="220"
                  viewBox="0 0 340 220"
                  style={{
                    background: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e2ec",
                  }}
                >
                  {/* Grid Lines */}
                  {[-4, -2, 0, 2, 4, 6].map((x) => (
                    <line
                      key={`x-${x}`}
                      x1={170 + x * 18}
                      y1="0"
                      x2={170 + x * 18}
                      y2="220"
                      stroke="#f0f0f5"
                      strokeWidth="1"
                    />
                  ))}
                  {[-2, 0, 2, 4, 6, 8, 10].map((y) => (
                    <line
                      key={`y-${y}`}
                      x1="0"
                      y1={170 - y * 14}
                      x2="340"
                      y2={170 - y * 14}
                      stroke="#f0f0f5"
                      strokeWidth="1"
                    />
                  ))}
                  {/* Axes */}
                  <line
                    x1="0"
                    y1="170"
                    x2="340"
                    y2="170"
                    stroke="#b0b0c2"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="170"
                    y1="0"
                    x2="170"
                    y2="220"
                    stroke="#b0b0c2"
                    strokeWidth="1.5"
                  />
                  <text x="325" y="165" fontSize="10" fill="#888899">
                    x
                  </text>
                  <text x="175" y="14" fontSize="10" fill="#888899">
                    y
                  </text>

                  {/* Parabola curve */}
                  {(() => {
                    const points: string[] = []
                    for (let x = -8; x <= 8; x += 0.4) {
                      const y = Math.pow(x - hShift, 2) + kShift
                      const px = 170 + x * 18
                      const py = 170 - y * 14
                      if (py >= -20 && py <= 240) points.push(`${px},${py}`)
                    }
                    return (
                      <polyline
                        fill="none"
                        stroke="#635bdb"
                        strokeWidth="3"
                        strokeLinecap="round"
                        points={points.join(" ")}
                      />
                    )
                  })()}

                  {/* Vertex marker */}
                  <circle
                    cx={170 + hShift * 18}
                    cy={170 - kShift * 14}
                    r="5"
                    fill="#e85959"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={170 + hShift * 18 + 8}
                    y={170 - kShift * 14 - 6}
                    fontSize="11"
                    fontWeight="700"
                    fill="#222238"
                  >
                    Vertex ({hShift}, {kShift})
                  </text>
                </svg>

                <div className="slider-group">
                  <div className="slider-row">
                    <span>
                      Horizontal Shift (h):{" "}
                      <strong>
                        {hShift > 0
                          ? `+${hShift} (Right)`
                          : hShift < 0
                            ? `${hShift} (Left)`
                            : "0"}
                      </strong>
                    </span>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="1"
                      value={hShift}
                      onChange={(e) => setHShift(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="slider-row">
                    <span>
                      Vertical Shift (k):{" "}
                      <strong>
                        {kShift > 0
                          ? `+${kShift} (Up)`
                          : kShift < 0
                            ? `${kShift} (Down)`
                            : "0"}
                      </strong>
                    </span>
                    <input
                      type="range"
                      min="-3"
                      max="7"
                      step="1"
                      value={kShift}
                      onChange={(e) => setKShift(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="lesson-formula-box">
                Active Equation: y = (x{" "}
                {hShift >= 0 ? `− ${hShift}` : `+ ${Math.abs(hShift)}`})²{" "}
                {kShift >= 0 ? `+ ${kShift}` : `− ${Math.abs(kShift)}`}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginTop: "14px",
                }}
              >
                <div
                  style={{
                    background: "#fbfaff",
                    border: "1px solid #e7e4fa",
                    padding: "12px",
                    borderRadius: "10px",
                  }}
                >
                  <strong style={{ fontSize: "11px", color: "var(--violet)" }}>
                    Inside (x − h): Horizontal Shift
                  </strong>
                  <p
                    style={{
                      fontSize: "10px",
                      color: "#66667a",
                      margin: "4px 0 0",
                      lineHeight: 1.5,
                    }}
                  >
                    Subtracting a positive number shifts the parabola to the{" "}
                    <strong>RIGHT</strong>. Adding shifts to the{" "}
                    <strong>LEFT</strong> (counter-intuitive!).
                  </p>
                </div>
                <div
                  style={{
                    background: "#f8fdfa",
                    border: "1px solid #d4f2e3",
                    padding: "12px",
                    borderRadius: "10px",
                  }}
                >
                  <strong style={{ fontSize: "11px", color: "var(--green)" }}>
                    Outside (+ k): Vertical Shift
                  </strong>
                  <p
                    style={{
                      fontSize: "10px",
                      color: "#66667a",
                      margin: "4px 0 0",
                      lineHeight: 1.5,
                    }}
                  >
                    Adding k shifts the entire parabola directly{" "}
                    <strong>UP</strong>. Subtracting k shifts it straight{" "}
                    <strong>DOWN</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. PRACTICE SET: FACTORING */}
          {resource.title.includes("Factoring Refresher") && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}
              >
                <span className="eyebrow">
                  QUESTION {quizStep + 1} OF {practiceQuestions.length}
                </span>
                <span
                  className="unit-score"
                  style={{
                    background: "#e8f7f1",
                    color: "var(--green)",
                    fontWeight: 700,
                  }}
                >
                  Score: {practiceScore} / {practiceQuestions.length}
                </span>
              </div>

              <div className="question-area" style={{ padding: 0 }}>
                <h2 style={{ fontSize: "18px", margin: "0 0 16px" }}>
                  {practiceQuestions[quizStep].prompt}
                </h2>
                <div className="answers" style={{ gridTemplateColumns: "1fr" }}>
                  {practiceQuestions[quizStep].answers.map((ans, idx) => {
                    let btnClass = ""
                    if (showAnswer) {
                      if (idx === practiceQuestions[quizStep].correct)
                        btnClass = "correct"
                      else if (idx === selectedOpt) btnClass = "incorrect"
                      else btnClass = "muted"
                    }
                    return (
                      <Button
                        key={ans}
                        variant="secondary"
                        className={btnClass}
                        onClick={() => {
                          if (showAnswer) return
                          setSelectedOpt(idx)
                          setShowAnswer(true)
                          if (idx === practiceQuestions[quizStep].correct) {
                            setPracticeScore((s) => s + 1)
                          }
                        }}
                      >
                        <span className="answer-letter">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{ans}</span>
                        {showAnswer &&
                          idx === practiceQuestions[quizStep].correct && (
                            <Icon name="check" />
                          )}
                        {showAnswer &&
                          idx === selectedOpt &&
                          idx !== practiceQuestions[quizStep].correct && (
                            <Icon name="x" />
                          )}
                      </Button>
                    )
                  })}
                </div>

                {showAnswer && (
                  <div
                    className={`answer-feedback ${
                      selectedOpt === practiceQuestions[quizStep].correct
                        ? "good"
                        : "retry"
                    }`}
                    style={{ margin: "16px 0 0", borderRadius: "10px" }}
                  >
                    <div>
                      <Icon
                        name={
                          selectedOpt === practiceQuestions[quizStep].correct
                            ? "spark"
                            : "brain"
                        }
                      />
                      <div>
                        <strong>
                          {selectedOpt === practiceQuestions[quizStep].correct
                            ? "Well done!"
                            : "Concept Breakdown:"}
                        </strong>
                        <p>{practiceQuestions[quizStep].explanation}</p>
                      </div>
                    </div>
                    {quizStep < practiceQuestions.length - 1 ? (
                      <Button
                        onClick={() => {
                          setQuizStep((s) => s + 1)
                          setSelectedOpt(null)
                          setShowAnswer(false)
                        }}
                      >
                        Next Question <Icon name="arrow" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setQuizStep(0)
                          setSelectedOpt(null)
                          setShowAnswer(false)
                          setPracticeScore(0)
                        }}
                      >
                        Restart Practice Set <Icon name="refresh" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. AI EXPLANATION: VERTEX FORM & COMPLETING SQUARE */}
          {resource.title.includes("Vertex Form") && (
            <div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  margin: "0 0 16px",
                }}
              >
                Completing the square is an algebraic technique that transforms
                a standard quadratic into vertex form, making the highest or
                lowest points immediately readable.
              </p>

              <div className="lesson-section">
                <h4>Interactive Completion Calculator</h4>
                <div
                  style={{
                    background: "#f8f8fc",
                    border: "1px solid #e7e7f0",
                    padding: "16px",
                    borderRadius: "12px",
                  }}
                >
                  <div className="slider-row" style={{ marginBottom: "12px" }}>
                    <span>
                      Choose Linear Coefficient (b):{" "}
                      <strong>b = {bCoeff}</strong>
                    </span>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="2"
                      value={bCoeff}
                      onChange={(e) => setBCoeff(parseInt(e.target.value))}
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        background: "#ffffff",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ececf4",
                      }}
                    >
                      <small style={{ color: "#8d8d9f", fontSize: "9px" }}>
                        STEP 1: HALF OF b
                      </small>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "15px",
                          color: "var(--ink)",
                          marginTop: "4px",
                        }}
                      >
                        b/2 = {bCoeff / 2}
                      </strong>
                    </div>
                    <div
                      style={{
                        background: "#f4f2ff",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #dcd8fc",
                      }}
                    >
                      <small
                        style={{ color: "var(--violet)", fontSize: "9px" }}
                      >
                        STEP 2: SQUARE IT (MAGIC NUMBER)
                      </small>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "15px",
                          color: "var(--violet)",
                          marginTop: "4px",
                        }}
                      >
                        (b/2)² = {Math.pow(bCoeff / 2, 2)}
                      </strong>
                    </div>
                    <div
                      style={{
                        background: "#ffffff",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ececf4",
                      }}
                    >
                      <small style={{ color: "#8d8d9f", fontSize: "9px" }}>
                        STEP 3: PERFECT SQUARE
                      </small>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "15px",
                          color: "var(--green)",
                          marginTop: "4px",
                        }}
                      >
                        (x{" "}
                        {bCoeff / 2 >= 0
                          ? `+ ${bCoeff / 2}`
                          : `− ${Math.abs(bCoeff / 2)}`}
                        )²
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lesson-section" style={{ marginTop: "18px" }}>
                <h4>Why It Works</h4>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#55556a",
                    lineHeight: 1.6,
                  }}
                >
                  Expanding <code>(x + d)²</code> yields{" "}
                  <code>x² + 2dx + d²</code>. Here, the middle coefficient is{" "}
                  <code>2d = b</code>, meaning <code>d = b/2</code>. Therefore,
                  the constant needed to complete the square is always{" "}
                  <code>d² = (b/2)²</code>.
                </p>
              </div>
            </div>
          )}

          {/* 4. INTERACTIVE BUILDER: BUILD A QUADRATIC GRAPH */}
          {resource.title.includes("Build a Quadratic") && (
            <div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  margin: "0 0 16px",
                }}
              >
                Interact with coefficients <strong>a</strong>,{" "}
                <strong>b</strong>, and <strong>c</strong> to see real-time
                changes in the parabola orientation, axis of symmetry, vertex,
                and roots.
              </p>

              <div className="graph-canvas-wrap">
                <svg
                  width="340"
                  height="200"
                  viewBox="0 0 340 200"
                  style={{
                    background: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e2ec",
                  }}
                >
                  {/* Grid & Axes */}
                  <line
                    x1="0"
                    y1="130"
                    x2="340"
                    y2="130"
                    stroke="#b0b0c2"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="170"
                    y1="0"
                    x2="170"
                    y2="200"
                    stroke="#b0b0c2"
                    strokeWidth="1.5"
                  />

                  {/* Curve */}
                  {(() => {
                    const points: string[] = []
                    for (let x = -8; x <= 8; x += 0.3) {
                      const y = aCoeff * x * x + bBuilder * x + cBuilder
                      const px = 170 + x * 18
                      const py = 130 - y * 7
                      if (py >= -20 && py <= 220) points.push(`${px},${py}`)
                    }
                    return (
                      <polyline
                        fill="none"
                        stroke="#e99947"
                        strokeWidth="3"
                        strokeLinecap="round"
                        points={points.join(" ")}
                      />
                    )
                  })()}

                  {/* Vertex */}
                  <circle
                    cx={170 + vertexX * 18}
                    cy={130 - vertexY * 7}
                    r="4.5"
                    fill="#635bdb"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </svg>

                <div className="slider-group">
                  <div className="slider-row">
                    <span>
                      Stretch & Direction (a): <strong>{aCoeff}</strong> (
                      {aCoeff > 0 ? "Opens Upward" : "Opens Downward"})
                    </span>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.5"
                      value={aCoeff}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        setACoeff(v === 0 ? 0.5 : v)
                      }}
                    />
                  </div>
                  <div className="slider-row">
                    <span>
                      Linear Shift (b): <strong>{bBuilder}</strong>
                    </span>
                    <input
                      type="range"
                      min="-6"
                      max="6"
                      step="1"
                      value={bBuilder}
                      onChange={(e) => setBBuilder(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="slider-row">
                    <span>
                      Y-Intercept (c): <strong>{cBuilder}</strong>
                    </span>
                    <input
                      type="range"
                      min="-6"
                      max="6"
                      step="1"
                      value={cBuilder}
                      onChange={(e) => setCBuilder(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "10px",
                  marginTop: "14px",
                }}
              >
                <div
                  style={{
                    background: "#fafafc",
                    border: "1px solid #e7e7f0",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <small style={{ color: "#8a8a9c", fontSize: "9px" }}>
                    VERTEX (h, k)
                  </small>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "13px",
                      marginTop: "3px",
                    }}
                  >
                    ({vertexX.toFixed(1)}, {vertexY.toFixed(1)})
                  </strong>
                </div>
                <div
                  style={{
                    background: "#fafafc",
                    border: "1px solid #e7e7f0",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <small style={{ color: "#8a8a9c", fontSize: "9px" }}>
                    DISCRIMINANT (Δ)
                  </small>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "13px",
                      marginTop: "3px",
                      color: discriminant >= 0 ? "var(--green)" : "#d9534f",
                    }}
                  >
                    Δ = {discriminant}
                  </strong>
                </div>
                <div
                  style={{
                    background: "#fafafc",
                    border: "1px solid #e7e7f0",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <small style={{ color: "#8a8a9c", fontSize: "9px" }}>
                    ROOTS STATUS
                  </small>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "11px",
                      marginTop: "3px",
                    }}
                  >
                    {discriminant > 0
                      ? "2 Real Roots"
                      : discriminant === 0
                        ? "1 Double Root"
                        : "No Real Roots"}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className="modal-top"
          style={{
            borderTop: "1px solid var(--line)",
            borderBottom: 0,
            height: "64px",
          }}
        >
          <Button
            variant="secondary"
            onClick={() => {
              onClose()
              onNavigate("tutor")
            }}
          >
            <Icon name="message" /> Ask Nova About This
          </Button>
          <Button onClick={onClose}>Done Exploring</Button>
        </div>
      </div>
    </div>
  )
}

function LibraryView({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(
    null,
  )

  const resources: ResourceItem[] = [
    {
      type: "VISUAL GUIDE",
      title: "How Parabolas Move & Shift",
      text: "Interactive walkthrough of horizontal and vertical shifts on the Cartesian plane with real-time vertex tracking.",
      time: "8 min",
      tone: "purple",
    },
    {
      type: "PRACTICE SET",
      title: "Factoring Refresher: Trinomials",
      text: "Targeted questions designed to prevent sign errors in binomial roots and trinomial decomposition.",
      time: "10 min",
      tone: "blue",
    },
    {
      type: "AI EXPLANATION",
      title: "Vertex Form & Completing Square",
      text: "Understand why (b/2)² produces an exact square every single time with visual algebraic tiles.",
      time: "6 min",
      tone: "green",
    },
    {
      type: "INTERACTIVE",
      title: "Build a Quadratic Graph",
      text: "Manipulate coefficients a, b, and c to see instant parabola changes, vertex shift, and discriminant calculation.",
      time: "12 min",
      tone: "orange",
    },
  ]

  const filteredResources = resources.filter((item) => {
    const matchesFilter =
      filter === "all" || item.type.toLowerCase().includes(filter.toLowerCase())
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="page-view">
      <div className="page-hero">
        <div>
          <span className="eyebrow">CURATED KNOWLEDGE BANK</span>
          <h1>Resource Library</h1>
          <p>
            Interactive guides, practice sets, and algebraic simulators tailored
            to your active learning goals. Click any card to launch!
          </p>
        </div>
        <div className="search-box">
          <Icon name="search" />
          <input
            placeholder="Search concepts and resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* FILTER PILLS */}
      <div className="resource-filter-bar">
        {[
          { id: "all", label: "All Resources" },
          { id: "visual", label: "Visual Guides" },
          { id: "practice", label: "Practice Sets" },
          { id: "ai", label: "AI Explanations" },
          { id: "interactive", label: "Simulators" },
        ].map((pill) => (
          <button
            key={pill.id}
            className={`filter-pill ${filter === pill.id ? "active" : ""}`}
            onClick={() => setFilter(pill.id)}
          >
            {pill.label}
          </button>
        ))}
      </div>

      <div className="resource-grid">
        {filteredResources.map((item) => (
          <div
            className="resource-card"
            key={item.title}
            onClick={() => setSelectedResource(item)}
            title="Click to open interactive resource"
          >
            <div className={`resource-visual ${item.tone}`}>
              <Icon
                name={
                  item.type === "PRACTICE SET"
                    ? "target"
                    : item.type === "AI EXPLANATION"
                      ? "spark"
                      : item.type === "INTERACTIVE"
                        ? "bolt"
                        : "book"
                }
                size={28}
              />
            </div>
            <span className="eyebrow">{item.type}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <div>
              <span>
                <Icon name="clock" size={14} /> {item.time}
              </span>
              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedResource(item)
                }}
              >
                Open Resource <Icon name="arrow" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {selectedResource && (
        <ResourceModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------- */
/* 9.4 TEACHER & EDUCATOR PORTAL (DEMO PROGRESS DASHBOARD)      */
/* ------------------------------------------------------------- */
interface RosterStudent {
  id: string
  name: string
  grade: string
  avatar: string
  mastery: number
  streak: number
  xp: number
  status: "Needs Intervention" | "Developing" | "Proficient" | "Honors"
  gaps: string[]
  learningVelocity: number
  lastActive: string
  conceptScores: { concept: string; score: number; status: "gap" | "progress" | "mastered" }[]
  teacherNotes: string
}

const DEMO_STUDENT_ROSTER: RosterStudent[] = [
  {
    id: "s1",
    name: "Neha",
    grade: "Grade 10 · SSC",
    avatar: "NE",
    mastery: 72,
    streak: 12,
    xp: 1350,
    status: "Developing",
    gaps: ["Graph Transformations", "Vertex Form"],
    learningVelocity: 3.2,
    lastActive: "10 mins ago",
    conceptScores: [
      { concept: "Linear Equations", score: 85, status: "mastered" },
      { concept: "Factoring Polynomials", score: 74, status: "progress" },
      { concept: "Graph Transformations", score: 48, status: "gap" },
      { concept: "Vertex Form", score: 52, status: "gap" },
      { concept: "Quadratic Systems", score: 68, status: "progress" },
    ],
    teacherNotes: "Strong analytical grasp on linear algebra. Needs 1:1 revision on vertex form translations.",
  },
  {
    id: "s2",
    name: "Alex Morgan",
    grade: "Grade 10 · SSC",
    avatar: "AM",
    mastery: 68,
    streak: 8,
    xp: 1120,
    status: "Developing",
    gaps: ["Graph Shifts", "Polynomial Roots"],
    learningVelocity: 2.8,
    lastActive: "1 hour ago",
    conceptScores: [
      { concept: "Linear Equations", score: 80, status: "mastered" },
      { concept: "Factoring Polynomials", score: 62, status: "progress" },
      { concept: "Graph Transformations", score: 42, status: "gap" },
      { concept: "Vertex Form", score: 58, status: "gap" },
    ],
    teacherNotes: "Benefiting from visual graph representations. Suggesting quadratic transformation worksheet.",
  },
  {
    id: "s3",
    name: "Maya Lin",
    grade: "Grade 9 · Secondary",
    avatar: "ML",
    mastery: 54,
    streak: 4,
    xp: 780,
    status: "Needs Intervention",
    gaps: ["Factoring Quadratics", "Linear Systems"],
    learningVelocity: 1.9,
    lastActive: "Yesterday",
    conceptScores: [
      { concept: "Linear Equations", score: 60, status: "progress" },
      { concept: "Factoring Polynomials", score: 38, status: "gap" },
      { concept: "Coordinate Geometry", score: 50, status: "gap" },
    ],
    teacherNotes: "Prerequisite foundation gap in factoring trinomials. Recommended scaffolded video lessons.",
  },
  {
    id: "s4",
    name: "Liam Chen",
    grade: "Grade 11 · HSC",
    avatar: "LC",
    mastery: 89,
    streak: 15,
    xp: 2100,
    status: "Honors",
    gaps: [],
    learningVelocity: 4.1,
    lastActive: "Just now",
    conceptScores: [
      { concept: "Calculus & Limits", score: 92, status: "mastered" },
      { concept: "Matrices & Determinants", score: 88, status: "mastered" },
      { concept: "Thermodynamics", score: 86, status: "mastered" },
    ],
    teacherNotes: "Performing at peak Mastery tier across PCMB. Ready for advanced competitive problem sets.",
  },
  {
    id: "s5",
    name: "Rohan Patel",
    grade: "Grade 10 · SSC",
    avatar: "RP",
    mastery: 79,
    streak: 11,
    xp: 1450,
    status: "Proficient",
    gaps: ["Quadratic Vertex Form"],
    learningVelocity: 3.4,
    lastActive: "3 hours ago",
    conceptScores: [
      { concept: "Linear Equations", score: 90, status: "mastered" },
      { concept: "Geometry & Proofs", score: 82, status: "mastered" },
      { concept: "Vertex Form", score: 58, status: "gap" },
    ],
    teacherNotes: "High consistency and fast problem completion rate. Minor review needed on completing the square.",
  },
  {
    id: "s6",
    name: "Pooja Deshmukh",
    grade: "Grade 10 · SSC",
    avatar: "PD",
    mastery: 81,
    streak: 13,
    xp: 1620,
    status: "Honors",
    gaps: ["Trigonometric Identities"],
    learningVelocity: 3.6,
    lastActive: "2 hours ago",
    conceptScores: [
      { concept: "Trigonometric Identities", score: 62, status: "gap" },
      { concept: "Quadratic Equations", score: 88, status: "mastered" },
      { concept: "Statistics & Probability", score: 94, status: "mastered" },
    ],
    teacherNotes: "Outstanding exam preparedness. Recommended trigonometry practice quiz for total mastery.",
  },
]

function TeacherDashboardView({
  onLogout,
  onSwitchToStudent,
}: {
  onLogout: () => void
  onSwitchToStudent: () => void
}) {
  const [filter, setFilter] = useState<"all" | "intervention" | "developing" | "honors">("all")
  const [selectedStudent, setSelectedStudent] = useState<RosterStudent | null>(null)
  const [toastMessage, setToastMessage] = useState("")
  const [dbStudents, setDbStudents] = useState<any[]>([])
  const [dbStats, setDbStats] = useState<any>(null)

  useEffect(() => {
    api.getTeacherStudents().then((res) => {
      if (res?.students?.length) {
        setDbStudents(res.students)
      }
    }).catch(() => {})
    api.getDatabaseStats().then(setDbStats).catch(() => {})
  }, [])

  // Combine live SQLite students with demo roster
  const allRosterStudents: RosterStudent[] = useMemo(() => {
    if (!dbStudents || dbStudents.length === 0) return DEMO_STUDENT_ROSTER
    const liveMapped: RosterStudent[] = dbStudents.map((s) => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      avatar: s.avatar || s.name.slice(0, 2).toUpperCase(),
      mastery: s.mastery,
      streak: s.streakDays,
      xp: s.xp,
      status: s.category === "intervention" ? "Needs Intervention" : s.category === "honors" ? "Honors" : "Developing",
      gaps: s.gaps || [],
      learningVelocity: s.velocity || 1.2,
      lastActive: s.lastActive || "Today",
      conceptScores: [
        { concept: "Mastery Index", score: s.mastery, status: s.mastery >= 75 ? "mastered" : s.mastery >= 50 ? "progress" : "gap" },
      ],
      teacherNotes: `Live SQLite Student: ${s.quizzesTaken || 0} quiz attempts recorded. Recommended tier: ${s.recommendedLevel}.`,
    }))

    // Add any from DEMO_STUDENT_ROSTER not already in liveMapped by name
    const existingNames = new Set(liveMapped.map((m) => m.name.toLowerCase()))
    const additional = DEMO_STUDENT_ROSTER.filter((d) => !existingNames.has(d.name.toLowerCase()))
    return [...liveMapped, ...additional]
  }, [dbStudents])

  const filteredStudents = allRosterStudents.filter((s) => {
    if (filter === "intervention") return s.status === "Needs Intervention"
    if (filter === "developing") return s.status === "Developing"
    if (filter === "honors") return s.status === "Honors" || s.status === "Proficient"
    return true
  })

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(""), 3500)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fe", fontFamily: "DM Sans, sans-serif", color: "#1a1730" }}>
      {/* TEACHER PORTAL TOPBAR */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1.5px solid #e5e2f6",
          padding: "16px 36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(2,132,199,0.3)",
            }}
          >
            <Icon name="brain" size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong style={{ fontSize: "18px", color: "#1a1730" }}>Prof. Sharma</strong>
              <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 8px", background: "#e0f2fe", color: "#0369a1", borderRadius: "10px" }}>
                EDUCATOR PORTAL · DEMO
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
              High School Mathematics & Science Batch · 32 Enrolled Students
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              padding: "6px 12px",
              borderRadius: "10px",
              fontSize: "11px",
              color: "#166534",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px #22c55e",
              }}
            />
            <strong>SQLite DB:</strong>
            <span>{dbStats?.tables?.users || 5} Users · {dbStats?.tables?.quizAttempts || 3} Quizzes (learnova.db)</span>
          </div>
          <button
            type="button"
            onClick={onSwitchToStudent}
            style={{
              background: "#f0edff",
              border: "1px solid #dcd7f8",
              borderRadius: "10px",
              padding: "9px 16px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#5548c8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🎓 Switch to Student View</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "9px 14px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#dc2626",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Icon name="logout" size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* TOAST ALERT */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#1e1b4b",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 700,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Icon name="check" size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN TEACHER CONTENT */}
      <main style={{ maxWidth: "1240px", margin: "0 auto", padding: "32px 36px 60px" }}>
        {/* BANNER GREETING */}
        <section
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f0f7ff 50%, #faf8ff 100%)",
            border: "1.5px solid #dbeafe",
            borderRadius: "20px",
            padding: "26px 30px",
            marginBottom: "28px",
            boxShadow: "0 6px 20px rgba(2,132,199,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, padding: "3px 10px", background: "#0284c7", color: "#ffffff", borderRadius: "12px" }}>
                CLASS ANALYTICS DASHBOARD
              </span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 10px", background: "#ecfdf5", color: "#059669", borderRadius: "12px" }}>
                LIVE AI DIAGNOSTIC SYNC: ACTIVE
              </span>
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
              Classroom Progress & Diagnostic Insights
            </h1>
            <p style={{ color: "#64748b", fontSize: "13px", margin: 0, maxWidth: "680px" }}>
              Track real-time student mastery, inspect prerequisite gaps identified by the adaptive engine,
              and deploy targeted class-wide remediation practice.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => triggerToast("Class-Wide Diagnostic assigned to all 32 students!")}
              style={{
                background: "linear-gradient(135deg, #0284c7, #0369a1)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "11px 18px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(2,132,199,0.25)",
              }}
            >
              🎯 Assign Class Diagnostic
            </button>
            <button
              type="button"
              onClick={() => triggerToast("Remediation Homework Sheet generated based on identified gaps!")}
              style={{
                background: "#ffffff",
                color: "#0369a1",
                border: "1.5px solid #bfdbfe",
                borderRadius: "12px",
                padding: "11px 18px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📄 Export Progress Report
            </button>
          </div>
        </section>

        {/* 4 CLASS KPIS */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "2px" }}>
                Class Avg. Mastery
              </span>
              <strong style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>74.2%</strong>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#059669", marginTop: "4px" }}>
                ↑ +6.4% this sprint
              </div>
            </div>
            <Ring value={74} size={44} color="sky" />
          </div>

          <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "2px" }}>
                Students Diagnosed
              </span>
              <strong style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>32 / 32</strong>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#0284c7", marginTop: "4px" }}>
                100% Cohort Participation
              </div>
            </div>
            <Ring value={100} size={44} color="violet" />
          </div>

          <div style={{ background: "#ffffff", border: "1.5px solid #fee2e2", borderRadius: "16px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "2px" }}>
                Concept Gaps Flagged
              </span>
              <strong style={{ fontSize: "22px", fontWeight: 800, color: "#dc2626" }}>8 Gaps</strong>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626", marginTop: "4px" }}>
                Requires Class Intervention
              </div>
            </div>
            <Ring value={25} size={44} color="amber" />
          </div>

          <div style={{ background: "#ffffff", border: "1.5px solid #dcfce7", borderRadius: "16px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "2px" }}>
                Learning Velocity
              </span>
              <strong style={{ fontSize: "22px", fontWeight: 800, color: "#059669" }}>3.1x</strong>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#059669", marginTop: "4px" }}>
                Accelerated Remediation
              </div>
            </div>
            <Ring value={85} size={44} color="mint" />
          </div>
        </section>

        {/* CLASS GAP RADAR (WHAT TEACHER NEEDS TO REVISE) */}
        <section
          style={{
            background: "#ffffff",
            border: "1.5px solid #e2e8f0",
            borderRadius: "18px",
            padding: "22px 24px",
            marginBottom: "28px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#dc2626", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                ⚠️ CLASS GAP RADAR · PRIORITY INTERVENTIONS
              </span>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "2px 0 0" }}>
                Topics Where Most Students Are Struggling
              </h2>
            </div>
            <button
              type="button"
              onClick={() => triggerToast("Bridge revision modules assigned for Graph Transformations and Vertex Form!")}
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#dc2626",
                cursor: "pointer",
              }}
            >
              Deploy Remediation For All Struggling Students →
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
            <div style={{ background: "#fff5f5", border: "1.5px solid #fed7d7", borderRadius: "14px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#c53030" }}>🔴 HIGH PRIORITY</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#c53030" }}>14 Students (44%)</span>
              </div>
              <strong style={{ fontSize: "15px", color: "#1a202c", display: "block", margin: "8px 0 4px" }}>
                Function Graph Transformations
              </strong>
              <p style={{ fontSize: "11px", color: "#4a5568", margin: 0, lineHeight: 1.4 }}>
                Students failing vertical and horizontal shift problems on vertex parabolas. Prerequisite algebra gaps detected.
              </p>
            </div>

            <div style={{ background: "#fffaf0", border: "1.5px solid #feebc8", borderRadius: "14px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#dd6b20" }}>🟡 MEDIUM PRIORITY</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#dd6b20" }}>9 Students (28%)</span>
              </div>
              <strong style={{ fontSize: "15px", color: "#1a202c", display: "block", margin: "8px 0 4px" }}>
                Quadratic Vertex Form & Roots
              </strong>
              <p style={{ fontSize: "11px", color: "#4a5568", margin: 0, lineHeight: 1.4 }}>
                Difficulty with completing the square and finding coordinates `(h, k)`. Requires visual parabola breakdown.
              </p>
            </div>

            <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "14px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#16a34a" }}>🟢 LOW PRIORITY</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>5 Students (16%)</span>
              </div>
              <strong style={{ fontSize: "15px", color: "#1a202c", display: "block", margin: "8px 0 4px" }}>
                Trigonometric Ratio Conversions
              </strong>
              <p style={{ fontSize: "11px", color: "#4a5568", margin: 0, lineHeight: 1.4 }}>
                Minor confusion between complementary angle formulas `sin(90-θ) = cos(θ)`. Rapidly remediable.
              </p>
            </div>
          </div>
        </section>

        {/* STUDENT PROGRESS ROSTER TABLE */}
        <section
          style={{
            background: "#ffffff",
            border: "1.5px solid #e2e8f0",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Student Progress & Diagnostic Roster
              </h2>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Click on any student to inspect detailed concept scores and AI remediation notes
              </span>
            </div>

            {/* Filter buttons */}
            <div style={{ display: "flex", gap: "6px" }}>
              {(
                [
                  { id: "all", label: "All Students (32)" },
                  { id: "intervention", label: "Needs Intervention (1)" },
                  { id: "developing", label: "Developing (2)" },
                  { id: "honors", label: "Proficient / Honors (3)" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  style={{
                    background: filter === tab.id ? "#0284c7" : "#f1f5f9",
                    color: filter === tab.id ? "#ffffff" : "#475569",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Roster table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #e2e8f0", color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 12px" }}>Student</th>
                  <th style={{ padding: "10px 12px" }}>Grade / Cohort</th>
                  <th style={{ padding: "10px 12px" }}>Mastery Score</th>
                  <th style={{ padding: "10px 12px" }}>Status Tier</th>
                  <th style={{ padding: "10px 12px" }}>Identified Gaps</th>
                  <th style={{ padding: "10px 12px" }}>Velocity</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s ease",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "#f8fafc" }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "transparent" }}
                  >
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: s.status === "Honors" ? "#ecfdf5" : s.status === "Needs Intervention" ? "#fef2f2" : "#eff6ff",
                            color: s.status === "Honors" ? "#059669" : s.status === "Needs Intervention" ? "#dc2626" : "#0284c7",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "11px",
                            fontWeight: 800,
                          }}
                        >
                          {s.avatar}
                        </div>
                        <div>
                          <strong style={{ color: "#0f172a", display: "block" }}>{s.name}</strong>
                          <small style={{ color: "#94a3b8", fontSize: "10px" }}>Active {s.lastActive}</small>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "14px 12px", color: "#475569" }}>
                      {s.grade}
                    </td>

                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "14px", color: "#0f172a" }}>{s.mastery}%</strong>
                        <div style={{ width: "60px", height: "6px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${s.mastery}%`,
                              height: "100%",
                              background: s.mastery >= 80 ? "#059669" : s.mastery >= 60 ? "#0284c7" : "#dc2626",
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "14px 12px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "10px",
                          background:
                            s.status === "Honors"
                              ? "#ecfdf5"
                              : s.status === "Needs Intervention"
                                ? "#fef2f2"
                                : "#f0f9ff",
                          color:
                            s.status === "Honors"
                              ? "#059669"
                              : s.status === "Needs Intervention"
                                ? "#dc2626"
                                : "#0284c7",
                        }}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td style={{ padding: "14px 12px" }}>
                      {s.gaps.length > 0 ? (
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {s.gaps.map((g) => (
                            <span key={g} style={{ fontSize: "10px", fontWeight: 600, padding: "2px 6px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px" }}>
                              ⚠️ {g}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#059669", fontWeight: 700 }}>✓ Zero Concept Gaps</span>
                      )}
                    </td>

                    <td style={{ padding: "14px 12px", color: "#475569", fontWeight: 700 }}>
                      {s.learningVelocity}x
                    </td>

                    <td style={{ padding: "14px 12px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(s)}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#0369a1",
                          cursor: "pointer",
                        }}
                      >
                        Inspect Analysis →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* STUDENT DETAIL INSPECTION MODAL */}
        {selectedStudent && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="assessment-modal" style={{ maxWidth: "580px" }}>
              <div className="modal-top">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                    }}
                  >
                    {selectedStudent.avatar}
                  </div>
                  <div>
                    <h2 style={{ fontSize: "18px", margin: 0, color: "#0f172a" }}>
                      {selectedStudent.name} · Diagnostic Breakdown
                    </h2>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      {selectedStudent.grade} · {selectedStudent.streak} Day Streak · {selectedStudent.xp} XP
                    </span>
                  </div>
                </div>
                <Button variant="ghost" className="icon-button" onClick={() => setSelectedStudent(null)}>
                  <Icon name="x" />
                </Button>
              </div>

              <div style={{ padding: "20px 24px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "12px" }}>
                  Concept Mastery Breakdown
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  {selectedStudent.conceptScores.map((c) => (
                    <div key={c.concept} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: c.status === "gap" ? "#fef2f2" : "#f8fafc", borderRadius: "10px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{c.concept}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: c.status === "gap" ? "#dc2626" : "#059669" }}>
                          {c.score}% {c.status === "gap" ? "⚠️ Gap" : "✓"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "12px", padding: "14px", marginBottom: "20px" }}>
                  <strong style={{ fontSize: "12px", color: "#0369a1", display: "block", marginBottom: "4px" }}>
                    🤖 AI Pedagogical Recommendation for Educator:
                  </strong>
                  <p style={{ fontSize: "12px", color: "#334155", margin: 0, lineHeight: 1.5 }}>
                    {selectedStudent.teacherNotes}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      triggerToast(`Assigned bridge remediation worksheet to ${selectedStudent.name}!`)
                      setSelectedStudent(null)
                    }}
                    style={{
                      flex: 1,
                      background: "#0284c7",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Assign Bridge Remediation
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "10px",
                      padding: "10px 16px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

/* ------------------------------------------------------------- */
/* 9.5 COVER PAGE / WEBSITE ENTRANCE                            */
/* ------------------------------------------------------------- */
function CoverPageView({
  onGetStarted,
  onQuickLogin,
}: {
  onGetStarted: () => void
  onQuickLogin: (name: string, grade: string, isTeacher?: boolean) => void
}) {
  const [selectedGrade, setSelectedGrade] = useState("Grade 10")
  const activeSubjects = gradeSubjects[selectedGrade] || gradeSubjects["Grade 10"]

  return (
    <div style={{ minHeight: "100vh", background: "#fbfbfe", color: "#1a1730", fontFamily: "DM Sans, sans-serif" }}>
      {/* STICKY TOP NAVBAR */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1.5px solid #ece8f8",
          padding: "14px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #635bdb, #8b5cf6)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(99,91,219,0.3)",
            }}
          >
            <Icon name="spark" size={20} />
          </div>
          <div>
            <strong style={{ fontSize: "20px", fontWeight: 800, color: "#1a1730", letterSpacing: "-0.5px" }}>
              Learnova
            </strong>
            <span
              style={{
                display: "block",
                fontSize: "9px",
                fontWeight: 800,
                color: "#635bdb",
                letterSpacing: "1px",
              }}
            >
              ADAPTIVE AI LEARNING
            </span>
          </div>
        </div>

        <nav style={{ display: "flex", gap: "28px", alignItems: "center" }}>
          <a href="#how-it-works" style={{ textDecoration: "none", color: "#605c78", fontSize: "13px", fontWeight: 600 }}>
            Adaptive Engine
          </a>
          <a href="#curriculum" style={{ textDecoration: "none", color: "#605c78", fontSize: "13px", fontWeight: 600 }}>
            Curriculum & Subjects
          </a>
          <a href="#visuals" style={{ textDecoration: "none", color: "#605c78", fontSize: "13px", fontWeight: 600 }}>
            Visual Graphs
          </a>
          <a href="#demos" style={{ textDecoration: "none", color: "#605c78", fontSize: "13px", fontWeight: 600 }}>
            Live Personas
          </a>
        </nav>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => onQuickLogin("Prof Sharma", "Faculty", true)}
            style={{
              background: "#e0f2fe",
              border: "1.5px solid #bae6fd",
              borderRadius: "10px",
              padding: "9px 14px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#0369a1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>👨‍🏫 Teacher Demo</span>
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            style={{
              background: "none",
              border: "1.5px solid #dcd7f8",
              borderRadius: "10px",
              padding: "9px 18px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#5548c8",
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            style={{
              background: "linear-gradient(135deg, #635bdb 0%, #7c3aed 100%)",
              border: "none",
              borderRadius: "10px",
              padding: "9px 20px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#ffffff",
              boxShadow: "0 4px 14px rgba(99,91,219,0.3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Get Started Free</span>
            <Icon name="arrow" size={14} />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section
        style={{
          padding: "70px 40px 60px",
          maxWidth: "1160px",
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#f0edff",
            border: "1px solid #dcd7f8",
            borderRadius: "24px",
            padding: "6px 16px",
            marginBottom: "24px",
          }}
        >
          <span style={{ color: "#635bdb", fontSize: "14px" }}>✨</span>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#635bdb", letterSpacing: "0.5px" }}>
            AI-POWERED ADAPTIVE LEARNING FOR SSC & HSC (GRADES 8–12)
          </span>
        </div>

        <h1
          style={{
            fontSize: "48px",
            fontWeight: 800,
            lineHeight: 1.18,
            letterSpacing: "-1.5px",
            color: "#161329",
            margin: "0 auto 20px",
            maxWidth: "920px",
          }}
        >
          Master Every Subject with Real-Time{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #635bdb, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Adaptive Intelligence
          </span>
        </h1>

        <p
          style={{
            fontSize: "16px",
            lineHeight: 1.6,
            color: "#6b6782",
            maxWidth: "760px",
            margin: "0 auto 36px",
          }}
        >
          Tailored for Indian Board Curricula. Pinpoint prerequisite knowledge gaps, learn with
          interactive visual graphs, and level up with 150+ board questions that <strong>never repeat</strong>.
        </p>

        {/* CTA BUTTONS */}
        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginBottom: "40px" }}>
          <button
            type="button"
            onClick={onGetStarted}
            style={{
              background: "linear-gradient(135deg, #635bdb 0%, #7c3aed 100%)",
              border: "none",
              borderRadius: "14px",
              padding: "16px 32px",
              fontSize: "15px",
              fontWeight: 800,
              color: "#ffffff",
              boxShadow: "0 8px 24px rgba(99,91,219,0.35)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>🚀 Launch Platform Free</span>
            <Icon name="arrow" size={16} />
          </button>

          <button
            type="button"
            onClick={() => onQuickLogin("Neha", "Grade 10")}
            style={{
              background: "#ffffff",
              border: "1.5px solid #dcd7f8",
              borderRadius: "14px",
              padding: "16px 26px",
              fontSize: "15px",
              fontWeight: 700,
              color: "#5548c8",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚡ 1-Click Demo Login (Neha · Grade 10)</span>
          </button>
        </div>

        {/* METRICS ROW */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            maxWidth: "960px",
            margin: "0 auto",
          }}
        >
          {[
            { stat: "94%", label: "Concept Retention Rate", sub: "Prerequisite Gap Resolution" },
            { stat: "150+", label: "Board Question Bank", sub: "Curriculum-aligned SSC & HSC" },
            { stat: "Zero", label: "Question Repetition", sub: "Session tracking rotation" },
            { stat: "5 Tiers", label: "Dynamic Difficulty", sub: "Foundation to Mastery level-up" },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                background: "#ffffff",
                border: "1.5px solid #ece8f8",
                borderRadius: "16px",
                padding: "20px 16px",
                boxShadow: "0 4px 14px rgba(99,91,219,0.04)",
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#635bdb" }}>{m.stat}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#1a1730", marginTop: "4px" }}>{m.label}</div>
              <div style={{ fontSize: "10px", color: "#8a869e", marginTop: "2px" }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 5-STAGE ADAPTIVE LOOP SHOWCASE */}
      <section
        id="how-it-works"
        style={{
          padding: "70px 40px",
          background: "#ffffff",
          borderTop: "1.5px solid #ece8f8",
          borderBottom: "1.5px solid #ece8f8",
        }}
      >
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#635bdb", letterSpacing: "1px", textTransform: "uppercase" }}>
              HOW THE SYSTEM ADAPTS TO YOU
            </span>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#1a1730", margin: "8px 0 10px" }}>
              The 5-Stage Continuous Learning Loop
            </h2>
            <p style={{ color: "#74708a", fontSize: "14px", margin: 0 }}>
              Learnova doesn't just grade tests — it continuously recalibrates your learning path based on your real-time performance.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px" }}>
            {[
              { num: "01", title: "Diagnostic Assessment", desc: "Multi-subject baseline assessment across grade concepts with unique question pools.", icon: "🎯", color: "#635bdb", bg: "#f5f3ff" },
              { num: "02", title: "Knowledge Gap Analysis", desc: "Machine learning engine identifies exact prerequisite weak links across concepts.", icon: "📊", color: "#0284c7", bg: "#f0f9ff" },
              { num: "03", title: "Personalized Roadmap", desc: "Curated sequence of lessons, worked formulas, and interactive visual aids.", icon: "🛤️", color: "#059669", bg: "#ecfdf5" },
              { num: "04", title: "Adaptive Quiz Arena", desc: "Real-time difficulty adjustment that levels up (Foundation → Mastery) without repeating questions.", icon: "⚡", color: "#d97706", bg: "#fffbeb" },
              { num: "05", title: "Continuous Adaptation", desc: "AI Study Coach Nova provides step-by-step proofs, hints, and updated recommendations.", icon: "✨", color: "#db2777", bg: "#fdf2f8" },
            ].map((s) => (
              <div
                key={s.num}
                style={{
                  background: s.bg,
                  border: `1.5px solid ${s.color}25`,
                  borderRadius: "18px",
                  padding: "24px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <span style={{ fontSize: "28px" }}>{s.icon}</span>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: s.color, opacity: 0.7 }}>STAGE {s.num}</span>
                  </div>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#1a1730", margin: "0 0 8px" }}>{s.title}</h3>
                  <p style={{ fontSize: "12px", color: "#605c78", lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURRICULUM & SUBJECTS PREVIEW */}
      <section id="curriculum" style={{ padding: "70px 40px", maxWidth: "1140px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#635bdb", letterSpacing: "1px", textTransform: "uppercase" }}>
            INDIAN STATE & CENTRAL BOARDS
          </span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#1a1730", margin: "8px 0 10px" }}>
            Comprehensive Curriculum: Grade 8 to 12
          </h2>
          <p style={{ color: "#74708a", fontSize: "14px", margin: 0 }}>
            Select any grade to preview curriculum subjects, lesson modules, and interactive graphs.
          </p>

          {/* Grade Selector Tabs */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "24px" }}>
            {["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGrade(g)}
                style={{
                  background: selectedGrade === g ? "#635bdb" : "#ffffff",
                  color: selectedGrade === g ? "#ffffff" : "#4b4960",
                  border: `1.5px solid ${selectedGrade === g ? "#635bdb" : "#dcd7f8"}`,
                  borderRadius: "20px",
                  padding: "8px 20px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: selectedGrade === g ? "0 4px 12px rgba(99,91,219,0.25)" : "none",
                }}
              >
                {g} {g.includes("10") ? "· SSC" : g.includes("12") ? "· HSC" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Subject cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "14px" }}>
          {activeSubjects.map((subj) => {
            const col = subjectColor[subj] || { bg: "#f0edff", border: "#c5b9ff", text: "#5548c8" }
            return (
              <div
                key={subj}
                style={{
                  background: col.bg,
                  border: `1.5px solid ${col.border}`,
                  borderRadius: "16px",
                  padding: "20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>{subjectEmoji[subj] || "📚"}</div>
                  <strong style={{ color: col.text, fontSize: "15px", display: "block" }}>{subj}</strong>
                  <span style={{ fontSize: "11px", color: "#6b6782", marginTop: "4px", display: "block" }}>
                    5 Core Lessons + Visual Graph
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onGetStarted}
                  style={{
                    marginTop: "16px",
                    background: "#ffffff",
                    border: `1px solid ${col.border}`,
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: col.text,
                    cursor: "pointer",
                  }}
                >
                  Start Modules →
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* VISUAL CONCEPT GRAPHS SECTION */}
      <section
        id="visuals"
        style={{
          padding: "70px 40px",
          background: "#ffffff",
          borderTop: "1.5px solid #ece8f8",
        }}
      >
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#635bdb", letterSpacing: "1px", textTransform: "uppercase" }}>
              INTERACTIVE VISUAL AIDS
            </span>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#1a1730", margin: "8px 0 10px" }}>
              Learn with Interactive Visual Concept Graphs
            </h2>
            <p style={{ color: "#74708a", fontSize: "14px", margin: 0 }}>
              Concepts are retained faster through visual representations in Maths, Physics, Chemistry, Biology, and IT.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            <div style={{ background: "#fbfbfe", border: "1.5px solid #ede8fa", borderRadius: "16px", padding: "18px" }}>
              <strong style={{ fontSize: "14px", color: "#5548c8", display: "block", marginBottom: "10px" }}>
                🧮 Mathematics · Parabola Graph
              </strong>
              <SubjectVisualization subject="Mathematics" />
            </div>

            <div style={{ background: "#fbfbfe", border: "1.5px solid #ede8fa", borderRadius: "16px", padding: "18px" }}>
              <strong style={{ fontSize: "14px", color: "#00695c", display: "block", marginBottom: "10px" }}>
                🧪 Chemistry · Interactive pH Scale
              </strong>
              <SubjectVisualization subject="Chemistry" />
            </div>

            <div style={{ background: "#fbfbfe", border: "1.5px solid #ede8fa", borderRadius: "16px", padding: "18px" }}>
              <strong style={{ fontSize: "14px", color: "#33691e", display: "block", marginBottom: "10px" }}>
                🧬 Biology · Ecosystem Energy Flow
              </strong>
              <SubjectVisualization subject="Biology" />
            </div>
          </div>
        </div>
      </section>

      {/* QUICK DEMO PERSONAS */}
      <section id="demos" style={{ padding: "70px 40px", maxWidth: "1140px", margin: "0 auto", textAlign: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#635bdb", letterSpacing: "1px", textTransform: "uppercase" }}>
          ONE-CLICK DEMO ENTRANCE
        </span>
        <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#1a1730", margin: "8px 0 12px" }}>
          Test Drive Learnova Instantly
        </h2>
        <p style={{ color: "#74708a", fontSize: "14px", marginBottom: "36px" }}>
          Click any learner profile below to enter the live platform with pre-configured grades and diagnosed gaps:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {[
            { name: "Neha", grade: "Grade 10", role: "Active Learner", sub: "SSC Board · 6 Subjects", color: "#635bdb", bg: "#f0edff", isTeacher: false },
            { name: "Alex Morgan", grade: "Grade 10", role: "Developing", sub: "Gap in Graph Transformations", color: "#0284c7", bg: "#f0f9ff", isTeacher: false },
            { name: "Maya Lin", grade: "Grade 9", role: "Foundational", sub: "Algebra & Factoring Focus", color: "#ea580c", bg: "#fff7ed", isTeacher: false },
            { name: "Liam Chen", grade: "Grade 11", role: "Honors", sub: "PCMB Accelerated Track", color: "#059669", bg: "#ecfdf5", isTeacher: false },
            { name: "Prof Sharma", grade: "Faculty", role: "Demo Teacher", sub: "Class Analytics & Student Gaps", color: "#0284c7", bg: "#e0f2fe", isTeacher: true },
          ].map((u) => (
            <div
              key={u.name}
              onClick={() => onQuickLogin(u.name, u.grade, u.isTeacher)}
              style={{
                background: "#ffffff",
                border: "1.5px solid #ece8f8",
                borderRadius: "16px",
                padding: "22px 18px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = u.color
                e.currentTarget.style.transform = "translateY(-3px)"
                e.currentTarget.style.boxShadow = `0 8px 24px ${u.color}20`
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#ece8f8"
                e.currentTarget.style.transform = "none"
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)"
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: u.bg,
                  color: u.color,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: "14px",
                  marginBottom: "12px",
                }}
              >
                {u.isTeacher ? "👨‍🏫" : u.name.slice(0, 2).toUpperCase()}
              </div>
              <strong style={{ fontSize: "16px", color: "#1a1730", display: "block" }}>{u.name}</strong>
              <div style={{ fontSize: "12px", fontWeight: 700, color: u.color, marginTop: "2px" }}>
                {u.grade} · {u.role}
              </div>
              <div style={{ fontSize: "11px", color: "#8a869e", marginTop: "4px" }}>{u.sub}</div>
              <div style={{ marginTop: "16px", fontSize: "12px", fontWeight: 700, color: u.color, display: "flex", alignItems: "center", gap: "4px" }}>
                {u.isTeacher ? "Open Teacher Portal →" : "Launch Persona →"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section
        style={{
          margin: "40px 40px 60px",
          borderRadius: "24px",
          padding: "50px 40px",
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)",
          color: "#ffffff",
          textAlign: "center",
          boxShadow: "0 16px 40px rgba(79,70,229,0.3)",
        }}
      >
        <h2 style={{ fontSize: "36px", fontWeight: 800, color: "#ffffff", margin: "0 0 12px" }}>
          Ready to Transform the Way You Learn?
        </h2>
        <p style={{ fontSize: "16px", color: "#ede9fe", maxWidth: "640px", margin: "0 auto 28px" }}>
          Create your learner profile in 30 seconds, calibrate your baseline diagnostic, and start mastering your grade curriculum today.
        </p>
        <button
          type="button"
          onClick={onGetStarted}
          style={{
            background: "#ffffff",
            border: "none",
            borderRadius: "14px",
            padding: "16px 36px",
            fontSize: "16px",
            fontWeight: 800,
            color: "#4f46e5",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            cursor: "pointer",
          }}
        >
          Get Started Now — It's Free →
        </button>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "1.5px solid #ece8f8",
          padding: "30px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#8a869e",
          fontSize: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon name="spark" size={16} />
          <strong>Learnova Adaptive Learning Platform</strong> · Aligned with Indian State & Central Curricula
        </div>
        <div>
          <span>© 2026 Learnova · Adaptive Engine Active</span>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------- */
/* 10. LOGIN / AUTHENTICATION PAGE                               */
/* ------------------------------------------------------------- */
function LoginPage({
  onLogin,
  onBackToCover,
}: {
  onLogin: (user: { name: string; grade: string; email?: string; isTeacher?: boolean }) => void
  onBackToCover?: () => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [grade, setGrade] = useState("Grade 10")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = name.trim()

    // Validation: Minimum 3 letters
    if (!cleanName) {
      setError("Please enter your name.")
      return
    }
    if (cleanName.length < 3) {
      setError("Name must be at least 3 letters long.")
      return
    }
    // Validation: Only letters and spaces (no numbers, no special characters)
    if (!/^[a-zA-Z\s]+$/.test(cleanName)) {
      setError("Name must contain only alphabets (no numbers or special characters).")
      return
    }
    // Validation: Password required
    if (!password) {
      setError("Please enter your password.")
      return
    }

    setError("")
    setLoading(true)

    try {
      if (isSignUp) {
        // Register in SQLite database
        const res = await api.register({
          name: cleanName,
          password,
          grade,
          email: email.trim() || undefined,
        })
        onLogin({
          name: res.user.name,
          grade: res.user.grade,
          email: res.user.email,
          isTeacher: res.user.isTeacher,
        })
      } else {
        // Login against SQLite database
        const res = await api.loginUser({
          username: cleanName,
          name: cleanName,
          password,
        })
        onLogin({
          name: res.user.name,
          grade: res.user.grade,
          email: res.user.email,
          isTeacher: res.user.isTeacher,
        })
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check credentials or sign up.")
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (demoName: string, demoGrade: string, isTeacher = false) => {
    setLoading(true)
    setError("")
    try {
      if (isTeacher) {
        const res = await api.loginUser({
          username: "teacher",
          password: "teacher123",
        })
        onLogin({
          name: res.user.name,
          grade: res.user.grade,
          email: res.user.email,
          isTeacher: true,
        })
      } else {
        const username = demoName.toLowerCase().split(" ")[0]
        const res = await api.loginUser({
          username,
          password: `${username}123`,
        })
        onLogin({
          name: res.user.name,
          grade: res.user.grade,
          email: res.user.email,
          isTeacher: false,
        })
      }
    } catch {
      onLogin({ name: demoName, grade: demoGrade, isTeacher })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page-wrap">
      <div className="login-card">
        {onBackToCover && (
          <button
            type="button"
            onClick={onBackToCover}
            style={{
              background: "none",
              border: "none",
              color: "var(--violet)",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "16px",
              padding: 0,
            }}
          >
            ← Back to Cover Page
          </button>
        )}

        <div className="login-brand">
          <div className="login-brand-icon">
            <Icon name="spark" size={22} />
          </div>
          <div>
            <strong>Learnova</strong>
            <span
              style={{
                display: "block",
                fontSize: "9px",
                color: "var(--violet)",
                fontWeight: 700,
                letterSpacing: "1px",
              }}
            >
              ADAPTIVE AI PLATFORM
            </span>
          </div>
        </div>

        <h2>
          {isSignUp
            ? "Create Your Learner Profile"
            : "Sign In to Your Learning Space"}
        </h2>
        <p>
          {isSignUp
            ? "Enter your details to generate your personalized learning path and dynamic diagnostic assessment."
            : "Sign in with your username and password to continue your personalized curriculum."}
        </p>

        {error && (
          <div
            style={{
              background: "#fff2f2",
              color: "#d94242",
              border: "1px solid #fed2d2",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "11px",
              marginBottom: "14px",
              fontWeight: 600,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>{isSignUp ? "Student Full Name" : "Username / Student Name"}</label>
            <input
              className="form-input"
              type="text"
              placeholder={isSignUp ? "e.g. Aishwarya Sharma" : "Enter your username..."}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError("")
              }}
              autoFocus
            />
            <small style={{ fontSize: "10px", color: "#8a869e", marginTop: "3px", display: "block" }}>
              Min. 3 letters, alphabets only (no numbers or special characters)
            </small>
          </div>

          {/* SIGN UP ONLY FIELDS: Email, Grade, Subjects Preview */}
          {isSignUp && (
            <>
              <div className="form-group">
                <label>Email or Student ID</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="student@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Current Grade / Level</label>
                <select
                  className="form-input"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  style={{ cursor: "pointer" }}
                >
                  <option value="Grade 8">Grade 8 · Middle School</option>
                  <option value="Grade 9">Grade 9 · Secondary</option>
                  <option value="Grade 10">Grade 10 · SSC Board</option>
                  <option value="Grade 11">Grade 11 · HSC (PCMB/IT)</option>
                  <option value="Grade 12">Grade 12 · HSC (PCMB/IT)</option>
                </select>
              </div>

              {gradeSubjects[grade] && (
                <div
                  style={{
                    background: "#f5f3ff",
                    border: "1px solid #e4e0fa",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    fontSize: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <strong
                    style={{
                      color: "var(--violet)",
                      fontSize: "9px",
                      letterSpacing: "1px",
                    }}
                  >
                    SUBJECTS FOR {grade.toUpperCase()}:
                  </strong>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "5px",
                      marginTop: "6px",
                    }}
                  >
                    {gradeSubjects[grade].map((s: string) => (
                      <span
                        key={s}
                        style={{
                          background: "#fff",
                          border: "1px solid #ddd8f5",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "10px",
                          color: "#5548c8",
                          fontWeight: 600,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError("")
              }}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "12px", marginTop: "6px", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span>Authenticating with Database...</span>
            ) : isSignUp ? (
              "Create Profile & Start Learning"
            ) : (
              "Sign In & Launch Platform"
            )}{" "}
            {!loading && <Icon name="arrow" />}
          </Button>

          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <button
              type="button"
              style={{
                background: "none",
                border: 0,
                color: "var(--violet)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError("")
              }}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "New student? Create your learner account"}
            </button>
          </div>
        </form>

        {/* DEMO TEACHER LOGIN BUTTON */}
        <div style={{ margin: "20px 0 10px" }}>
          <button
            type="button"
            onClick={() =>
              handleQuickLogin(
                "Prof Sharma",
                "Faculty",
                true,
              )
            }
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              border: "none",
              borderRadius: "12px",
              padding: "12px 16px",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(2,132,199,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span>👨‍🏫 Demo Teacher Login (Inspect Student Progress)</span>
            <Icon name="arrow" size={14} />
          </button>
        </div>

        <div className="demo-users-divider">Or 1-Click Quick Demo Sign In</div>

        <div className="demo-users-list">
          <button
            type="button"
            className="demo-user-btn"
            onClick={() => handleQuickLogin("Neha", "Grade 10")}
          >
            <div className="demo-user-info">
              <span className="demo-avatar" style={{ background: "#f0edff", color: "var(--violet)" }}>NE</span>
              <div className="demo-user-text">
                <strong>Neha</strong>
                <small>Grade 10 · Active Learner (SSC Board)</small>
              </div>
            </div>
            <Icon name="chevron" size={14} />
          </button>

          <button
            type="button"
            className="demo-user-btn"
            onClick={() => handleQuickLogin("Alex Morgan", "Grade 10")}
          >
            <div className="demo-user-info">
              <span className="demo-avatar">AM</span>
              <div className="demo-user-text">
                <strong>Alex Morgan</strong>
                <small>Grade 10 · Developing (Gap in Graph Shifts)</small>
              </div>
            </div>
            <Icon name="chevron" size={14} />
          </button>

          <button
            type="button"
            className="demo-user-btn"
            onClick={() => handleQuickLogin("Maya Lin", "Grade 9")}
          >
            <div className="demo-user-info">
              <span
                className="demo-avatar"
                style={{ background: "#fff2e5", color: "var(--orange)" }}
              >
                ML
              </span>
              <div className="demo-user-text">
                <strong>Maya Lin</strong>
                <small>Grade 9 · Foundational (Algebra & Factoring)</small>
              </div>
            </div>
            <Icon name="chevron" size={14} />
          </button>

          <button
            type="button"
            className="demo-user-btn"
            onClick={() => handleQuickLogin("Liam Chen", "Grade 11")}
          >
            <div className="demo-user-info">
              <span
                className="demo-avatar"
                style={{ background: "#e8f7f1", color: "var(--green)" }}
              >
                LC
              </span>
              <div className="demo-user-text">
                <strong>Liam Chen</strong>
                <small>Grade 11 · Honors (Accelerated)</small>
              </div>
            </div>
            <Icon name="chevron" size={14} />
          </button>
        </div>

        {/* SQLITE DATABASE PERSISTENCE BADGE */}
        <div
          style={{
            marginTop: "20px",
            padding: "10px 14px",
            background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
            border: "1.5px solid #a7f3d0",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "#065f46",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                display: "inline-block",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 8px #10b981",
              }}
            />
            <div>
              <strong style={{ display: "block", color: "#047857" }}>
                SQLite Database Online (WAL Mode)
              </strong>
              <small style={{ color: "#059669", fontSize: "10px" }}>
                Fast, persistent, ACID compliant
              </small>
            </div>
          </div>
          <span
            style={{
              fontSize: "9.5px",
              fontFamily: "monospace",
              background: "#d1fae5",
              color: "#047857",
              padding: "3px 8px",
              borderRadius: "6px",
              fontWeight: 700,
            }}
          >
            learnova.db
          </span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- */
/* SUBJECT MODULE VIEW                                           */
/* ------------------------------------------------------------- */
const subjectEmoji: Record<string, string> = {
  Mathematics: "🧮", Hindi: "🇮🇳", English: "📖", Marathi: "✍️",
  "Social Science": "🌍", "EVS/Science": "🔬", Science: "⚗️",
  Physics: "⚡", Chemistry: "🧪", Biology: "🧬", IT: "💻",
}

const subjectColor: Record<string, { bg: string; border: string; text: string }> = {
  Mathematics:    { bg: "#f0edff", border: "#c5b9ff", text: "#5548c8" },
  Hindi:          { bg: "#fff3ec", border: "#ffbb94", text: "#c25f00" },
  English:        { bg: "#e8f4fd", border: "#93cdf5", text: "#1a6fa8" },
  Marathi:        { bg: "#fff8e1", border: "#ffd54f", text: "#a07000" },
  "Social Science":{ bg: "#e8f5e9", border: "#a5d6a7", text: "#2e7d32" },
  "EVS/Science":  { bg: "#e3f2fd", border: "#90caf9", text: "#1565c0" },
  Science:        { bg: "#fce4ec", border: "#f48fb1", text: "#ad1457" },
  Physics:        { bg: "#ede7f6", border: "#b39ddb", text: "#4527a0" },
  Chemistry:      { bg: "#e0f2f1", border: "#80cbc4", text: "#00695c" },
  Biology:        { bg: "#f1f8e9", border: "#aed581", text: "#33691e" },
  IT:             { bg: "#e8eaf6", border: "#9fa8da", text: "#283593" },
  English:        { bg: "#e3f2fd", border: "#90caf9", text: "#0d47a1" },
}

// Lesson content per subject
const subjectLessons: Record<string, { title: string; icon: string; overview: string; keyPoints: string[]; formula?: string; example?: { problem: string; solution: string; tip: string } }[]> = {
  Mathematics: [
    { title: "Linear Equations", icon: "📏", overview: "Equations of the form ax + b = c with one unknown variable.", keyPoints: ["Isolate variable by applying inverse operations", "Maintain equality — do same to both sides", "Check solution by substituting back"], formula: "ax + b = c  →  x = (c − b) / a", example: { problem: "Solve 3x + 7 = 22", solution: "3x = 15, x = 5", tip: "Always verify: 3(5)+7 = 22 ✓" } },
    { title: "Quadratic Equations", icon: "📐", overview: "Equations of degree 2. Solutions via factoring or quadratic formula.", keyPoints: ["Standard form: ax² + bx + c = 0", "Discriminant Δ = b²−4ac determines roots", "Quadratic formula: x = (−b ± √Δ) / 2a"], formula: "x = (−b ± √(b²−4ac)) / 2a", example: { problem: "Solve x² − 5x + 6 = 0", solution: "(x−2)(x−3)=0 → x=2 or x=3", tip: "If Δ > 0: two roots; Δ = 0: one root; Δ < 0: no real roots" } },
    { title: "Geometry: Triangles", icon: "🔺", overview: "Properties, theorems, and area calculations for triangles.", keyPoints: ["Sum of angles = 180°", "Pythagoras: a² + b² = c² (right triangles)", "Area = ½ × base × height"], formula: "A = ½bh", example: { problem: "Find hypotenuse if legs are 3 and 4", solution: "c = √(9+16) = √25 = 5", tip: "Memorize Pythagorean triples: 3-4-5, 5-12-13" } },
    { title: "Trigonometry", icon: "📡", overview: "Ratios relating angles to sides in right-angled triangles.", keyPoints: ["sin θ = opposite/hypotenuse", "cos θ = adjacent/hypotenuse", "tan θ = opposite/adjacent"], formula: "sin²θ + cos²θ = 1", example: { problem: "sin 30° = ?", solution: "sin 30° = 0.5", tip: "SOH-CAH-TOA helps remember the ratios!" } },
    { title: "Statistics", icon: "📊", overview: "Collecting, organising, and interpreting data meaningfully.", keyPoints: ["Mean = sum of values / count", "Median = middle value when sorted", "Mode = most frequently occurring value"], formula: "Mean = Σx / n", example: { problem: "Find mean of 4, 7, 13, 2", solution: "(4+7+13+2)/4 = 26/4 = 6.5", tip: "Arrange data in ascending order first" } },
  ],
  Physics: [
    { title: "Newton's Laws of Motion", icon: "🚀", overview: "Three fundamental laws governing motion of objects.", keyPoints: ["1st Law: Objects at rest stay at rest unless acted on", "2nd Law: F = ma (Force = mass × acceleration)", "3rd Law: Every action has an equal & opposite reaction"], formula: "F = ma", example: { problem: "Find force on 5kg object with 3 m/s² acceleration", solution: "F = 5 × 3 = 15 N", tip: "Always convert mass to kg and acceleration to m/s²" } },
    { title: "Gravitation", icon: "🌍", overview: "Gravitational force between masses and planetary motion.", keyPoints: ["F = Gm₁m₂/r² (universal gravitation)", "g = 9.8 m/s² at Earth's surface", "Orbital velocity: v = √(GM/r)"], formula: "F = Gm₁m₂ / r²", example: { problem: "Weight of 60kg person on Earth", solution: "W = mg = 60 × 9.8 = 588 N", tip: "Weight and mass are different — W = mg" } },
    { title: "Ohm's Law & Circuits", icon: "⚡", overview: "Relationship between voltage, current and resistance in circuits.", keyPoints: ["V = IR (Voltage = Current × Resistance)", "Series circuit: R_total = R₁ + R₂", "Parallel circuit: 1/R = 1/R₁ + 1/R₂"], formula: "V = IR,  P = VI = I²R", example: { problem: "Current through 12V battery with 4Ω resistance", solution: "I = V/R = 12/4 = 3 A", tip: "Power dissipated as heat: P = I²R" } },
    { title: "Optics & Light", icon: "🔦", overview: "Reflection, refraction, lenses and mirrors.", keyPoints: ["Reflection: angle of incidence = angle of reflection", "Snell's Law: n₁sin θ₁ = n₂sin θ₂", "Convex lens converges light; concave diverges"], formula: "1/f = 1/v − 1/u", example: { problem: "Object 20cm from concave mirror (f=10cm). Find image.", solution: "1/v = 1/f − 1/u = 1/10 − 1/20 = 1/20, v=20cm", tip: "Use sign convention consistently throughout" } },
    { title: "Thermodynamics", icon: "🌡️", overview: "Heat transfer, energy conservation and entropy.", keyPoints: ["0th Law: Thermal equilibrium", "1st Law: ΔU = Q − W (energy conservation)", "2nd Law: Entropy of universe always increases"], formula: "Q = mcΔT", example: { problem: "Heat needed to raise 2kg water by 10°C", solution: "Q = 2 × 4200 × 10 = 84,000 J = 84 kJ", tip: "Specific heat of water = 4200 J/kg°C" } },
  ],
  Chemistry: [
    { title: "Atomic Structure", icon: "⚛️", overview: "Structure of atoms including protons, neutrons, electrons.", keyPoints: ["Atomic number = protons = electrons (neutral)", "Mass number = protons + neutrons", "Electron configuration follows Aufbau principle"], formula: "Atomic mass ≈ Protons + Neutrons", example: { problem: "Electron configuration of Carbon (Z=6)", solution: "C: 1s² 2s² 2p²", tip: "Fill lower energy orbitals first (Aufbau)" } },
    { title: "Chemical Bonding", icon: "🔗", overview: "Ionic, covalent and metallic bonds between atoms.", keyPoints: ["Ionic bond: electron transfer (metals to nonmetals)", "Covalent bond: electron sharing", "Electronegativity difference > 1.7 → ionic"], formula: "Octet Rule: atoms share/transfer e⁻ to reach 8 electrons", example: { problem: "Type of bond in NaCl?", solution: "Ionic — Na loses e⁻ to Cl (ΔEN = 3.0 − 0.9 = 2.1)", tip: "High electronegativity difference = ionic bond" } },
    { title: "Acids, Bases & pH", icon: "🧪", overview: "Properties of acids and bases and the pH scale.", keyPoints: ["Acid: pH < 7, donates H⁺ ions", "Base: pH > 7, accepts H⁺ / donates OH⁻", "Neutralization: Acid + Base → Salt + Water"], formula: "pH = −log[H⁺]", example: { problem: "HCl + NaOH → ?", solution: "HCl + NaOH → NaCl + H₂O (salt + water)", tip: "Strong acids/bases fully dissociate in water" } },
    { title: "Organic Chemistry", icon: "🌿", overview: "Carbon compounds, functional groups and reactions.", keyPoints: ["Hydrocarbons: alkanes (−ane), alkenes (−ene), alkynes (−yne)", "Functional groups: −OH (alcohol), −COOH (acid), −CHO (aldehyde)", "Isomers have same formula but different structures"], formula: "General alkane: CₙH₂ₙ₊₂", example: { problem: "Molecular formula of ethane?", solution: "n=2: C₂H₂(2)+2 = C₂H₆", tip: "Memorise first four: methane, ethane, propane, butane" } },
    { title: "Chemical Equilibrium", icon: "⚖️", overview: "Dynamic equilibrium in reversible reactions.", keyPoints: ["Forward and reverse rates become equal at equilibrium", "Kc = [products] / [reactants]", "Le Chatelier's principle: system opposes changes"], formula: "Kc = [C]ᶜ[D]ᵈ / [A]ᵃ[B]ᵇ", example: { problem: "N₂ + 3H₂ ⇌ 2NH₃. Adding more N₂?", solution: "Equilibrium shifts right to produce more NH₃", tip: "Increasing reactants pushes equilibrium forward" } },
  ],
  Biology: [
    { title: "Cell Biology", icon: "🔬", overview: "Structure and function of cells — basic unit of life.", keyPoints: ["Prokaryotes lack nucleus (bacteria)", "Eukaryotes have membrane-bound organelles", "Mitochondria = powerhouse; Ribosomes = protein factories"], formula: "Cell Theory: All living things are made of cells", example: { problem: "Difference between plant and animal cells?", solution: "Plant cells have cell wall + chloroplasts; animal cells have centrioles", tip: "Both have nucleus, mitochondria, and cell membrane" } },
    { title: "Genetics & Heredity", icon: "🧬", overview: "DNA, genes, chromosomes and inheritance patterns.", keyPoints: ["DNA carries genetic information as base sequences", "Mendel's Laws: Dominance, Segregation, Independent Assortment", "Punnett square predicts offspring ratios"], formula: "Genotype determines Phenotype", example: { problem: "Tt × Tt cross — probability of tall (T_)?", solution: "TT + Tt + Tt = 75% tall, 25% short (tt)", tip: "Use Punnett squares for all inheritance problems" } },
    { title: "Photosynthesis", icon: "🌿", overview: "Process by which plants make food using sunlight.", keyPoints: ["Takes place in chloroplasts", "Requires: CO₂ + H₂O + light energy", "Produces: glucose + oxygen"], formula: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂", example: { problem: "Which gas is released during photosynthesis?", solution: "Oxygen (O₂) is released as a byproduct", tip: "Cellular respiration is the reverse of photosynthesis" } },
    { title: "Human Physiology", icon: "🫀", overview: "Functioning of major human body systems.", keyPoints: ["Digestive: breaks food into nutrients", "Circulatory: heart pumps blood through vessels", "Nervous: brain and nerves control body responses"], formula: "Homeostasis: maintaining stable internal environment", example: { problem: "Function of insulin in the body?", solution: "Insulin (from pancreas) lowers blood glucose by promoting uptake by cells", tip: "Diabetes occurs when insulin production/response fails" } },
    { title: "Ecology", icon: "🌍", overview: "Interactions between organisms and their environment.", keyPoints: ["Food chain: Producer → Primary consumer → Secondary consumer", "Energy decreases at each trophic level (10% rule)", "Biodiversity crucial for ecosystem stability"], formula: "Energy transfer efficiency ≈ 10% per trophic level", example: { problem: "Why are there fewer lions than grass in a savanna?", solution: "Energy is lost at each level, so only 10% passes up the chain", tip: "Producers have the most energy; apex predators the least" } },
  ],
  IT: [
    { title: "Python Basics", icon: "🐍", overview: "Introduction to Python programming language.", keyPoints: ["Python is interpreted and dynamically typed", "Key data types: int, float, str, list, dict, tuple, bool", "Indentation defines code blocks (no curly braces)"], formula: "print('Hello, World!')", example: { problem: "Write Python to check if a number is even", solution: "if n % 2 == 0:\n    print('Even')\nelse:\n    print('Odd')", tip: "% is the modulo operator — gives remainder after division" } },
    { title: "Data Structures", icon: "📦", overview: "Organising data efficiently in programs.", keyPoints: ["List: ordered, mutable [ ]", "Dictionary: key-value pairs { }", "Stack: LIFO (Last In First Out)"], formula: "Time complexity: Search O(n), Binary Search O(log n)", example: { problem: "Access value 'Biology' from dict = {'sub': 'Biology'}", solution: "dict['sub']  →  'Biology'", tip: "Use .get() to avoid KeyError when key might not exist" } },
    { title: "Database & SQL", icon: "🗃️", overview: "Storing and querying structured data using SQL.", keyPoints: ["SELECT retrieves data; INSERT adds rows", "WHERE filters results; ORDER BY sorts", "Primary key uniquely identifies each row"], formula: "SELECT * FROM table WHERE condition;", example: { problem: "Get all students scoring above 80", solution: "SELECT * FROM students WHERE score > 80;", tip: "Always use WHERE clause to filter — never fetch all rows unnecessarily" } },
    { title: "Networking", icon: "🌐", overview: "How computers communicate over networks.", keyPoints: ["IP address uniquely identifies a device", "TCP/IP: reliable, connection-based protocol", "HTTP/HTTPS: protocol for web communication"], formula: "IP Address: 4 octets, e.g. 192.168.1.1", example: { problem: "What is the purpose of DNS?", solution: "DNS translates domain names (google.com) to IP addresses", tip: "Think of DNS as the internet's phone book" } },
    { title: "Web Technology", icon: "💻", overview: "Building web pages with HTML, CSS, and JavaScript.", keyPoints: ["HTML: structure (content)", "CSS: styling (appearance)", "JavaScript: interactivity (behaviour)"], formula: "<html> → structure, .css → style, .js → behaviour", example: { problem: "Change paragraph colour to red in CSS?", solution: "p { color: red; }", tip: "Use browser DevTools (F12) to inspect and test CSS in real-time" } },
  ],
  Hindi: [
    { title: "संज्ञा (Noun)", icon: "📝", overview: "किसी व्यक्ति, वस्तु, स्थान या भाव के नाम को संज्ञा कहते हैं।", keyPoints: ["व्यक्तिवाचक: किसी विशेष का नाम (राम, दिल्ली)", "जातिवाचक: पूरी जाति का नाम (नदी, पर्वत)", "भाववाचक: गुण या भाव (सुंदरता, बचपन)"], formula: "संज्ञा = व्यक्तिवाचक + जातिवाचक + भाववाचक", example: { problem: "'राम गंगा नदी के किनारे खेलता है' — संज्ञा पहचानें", solution: "राम (व्यक्तिवाचक), गंगा (व्यक्तिवाचक), नदी (जातिवाचक)", tip: "जिस शब्द से किसी का नाम पता चले, वह संज्ञा है" } },
    { title: "संधि (Sandhi)", icon: "🔤", overview: "दो वर्णों के मेल से होने वाले विकार को संधि कहते हैं।", keyPoints: ["स्वर संधि: दो स्वरों का मेल", "व्यंजन संधि: व्यंजन + स्वर या व्यंजन का मेल", "विसर्ग संधि: विसर्ग से पहले स्वर या व्यंजन"], formula: "विद्या + आलय = विद्यालय (दीर्घ संधि)", example: { problem: "हिम + आलय = ?", solution: "हिमालय (स्वर संधि — दीर्घ)", tip: "संधि में शब्दों का मेल होता है, वे मिलकर एक नया शब्द बनाते हैं" } },
    { title: "अलंकार (Alankar)", icon: "✨", overview: "काव्य की शोभा बढ़ाने वाले शब्द-चित्र अलंकार कहलाते हैं।", keyPoints: ["उपमा: दो वस्तुओं की तुलना (सा, सी, जैसा)", "रूपक: उपमेय को उपमान मान लेना", "अनुप्रास: एक वर्ण की आवृत्ति"], formula: "उपमा: 'चाँद-सा मुखड़ा' — तुलना में 'सा' जरूरी", example: { problem: "'कमल से नयन हैं उसके' — अलंकार पहचानें", solution: "उपमा अलंकार — नयन की तुलना कमल से", tip: "उपमा में 'सा/सी/से/जैसा' जरूर होगा" } },
    { title: "रस (Ras)", icon: "🎭", overview: "काव्य पढ़ते समय जो आनंद मिलता है उसे रस कहते हैं।", keyPoints: ["नौ रस: श्रृंगार, हास्य, करुण, रौद्र, वीर, भयानक, वीभत्स, अद्भुत, शांत", "स्थायी भाव हर रस का मूल होता है", "विभाव, अनुभाव और संचारी भाव से रस बनता है"], formula: "विभाव + अनुभाव + संचारी भाव → रस", example: { problem: "वीर रस का स्थायी भाव क्या है?", solution: "उत्साह — वीर कार्य देखकर उत्साह जागता है", tip: "श्रृंगार रस का स्थायी भाव 'रति' (प्रेम) है" } },
    { title: "समास (Samas)", icon: "🔗", overview: "दो या अधिक शब्दों का संक्षेप में एक नया शब्द बनाना समास है।", keyPoints: ["तत्पुरुष: उत्तर पद प्रधान (राजमहल = राजा का महल)", "द्वंद्व: दोनों पद समान (माता-पिता, सुख-दुख)", "बहुव्रीहि: दोनों के बजाय तीसरे का अर्थ"], formula: "समास-विग्रह: समस्त पद को खोलकर लिखना", example: { problem: "'पाठशाला' का समास-विग्रह करें", solution: "पाठ के लिए शाला — तत्पुरुष समास", tip: "विग्रह करने पर जो कारक-चिह्न आए, उससे समास का भेद पहचानें" } },
  ],
  Marathi: [
    { title: "नाम (Noun)", icon: "📝", overview: "व्यक्ती, वस्तू, ठिकाण किंवा भावना यांच्या नावाला नाम म्हणतात.", keyPoints: ["सामान्यनाम: सर्व एकाच प्रकारच्या (मुलगा, नदी)", "विशेषनाम: एखाद्या विशिष्टाचे नाव (मुंबई, राम)", "भाववाचकनाम: गुण किंवा अवस्था (चांगुलपणा, बालपण)"], formula: "नाम = सामान्य + विशेष + भाववाचक", example: { problem: "'सुनीता मुंबईत राहते' — नाम ओळखा", solution: "सुनीता (विशेषनाम), मुंबई (विशेषनाम)", tip: "ज्या शब्दाने कशाचे तरी नाव कळते तो नाम असतो" } },
    { title: "क्रियापद (Verb)", icon: "🏃", overview: "वाक्यात क्रिया सांगणाऱ्या शब्दाला क्रियापद म्हणतात.", keyPoints: ["सकर्मक क्रियापद: कर्म असते (मी भात खातो)", "अकर्मक क्रियापद: कर्म नसते (तो धावतो)", "काळ: वर्तमान, भूत, भविष्य"], formula: "क्रियापद = काळ + पुरुष + वचन", example: { problem: "'ती शाळेत जाते' — क्रियापद ओळखा", solution: "'जाते' हे क्रियापद (वर्तमान काळ, एकवचन)", tip: "वाक्यात क्रिया सांगणारा शब्द क्रियापद असतो" } },
    { title: "समास (Samas)", icon: "🔗", overview: "दोन किंवा अधिक शब्दांचा एकत्र येऊन नवीन शब्द बनणे.", keyPoints: ["तत्पुरुष: उत्तर पद प्रमुख (राजवाडा = राजाचा वाडा)", "द्वंद्व: दोन्ही पद समान (आई-बाबा, हात-पाय)", "बहुव्रीहि: तृतीय अर्थाचे (पीतांबर = पिवळे वस्त्र ज्याने घातले)"], formula: "समास विग्रह: एकत्र शब्दाचा वेगळा अर्थ सांगणे", example: { problem: "'देशभक्ती' चा समास विग्रह करा", solution: "देशावरील भक्ती — तत्पुरुष समास", tip: "विग्रह करताना कारकचिह्न लिहावे" } },
    { title: "अलंकार (Alankar)", icon: "✨", overview: "काव्याची शोभा वाढवणाऱ्या शब्दरचनेला अलंकार म्हणतात.", keyPoints: ["उपमा: दोन गोष्टींची तुलना ('जणू, सारखा')", "रूपक: एकाला दुसरेच म्हणणे", "अनुप्रास: एकाच वर्णाची पुनरावृत्ती"], formula: "उपमा: 'चंद्रासारखे मुख' — तुलनेत 'सारखे' हवे", example: { problem: "'तुझे नयन कमळासारखे आहेत' — अलंकार ओळखा", solution: "उपमा अलंकार — नयनाची तुलना कमळाशी", tip: "'जणू, सारखे, जसे' हे उपमा अलंकाराची चिन्हे" } },
    { title: "संधी (Sandhi)", icon: "🔤", overview: "दोन वर्णांच्या एकत्र येण्याने होणाऱ्या बदलाला संधी म्हणतात.", keyPoints: ["स्वरसंधी: दोन स्वर एकत्र येतात", "व्यंजनसंधी: व्यंजन + स्वर किंवा व्यंजन", "विसर्गसंधी: विसर्गाचा बदल"], formula: "विद्या + आलय = विद्यालय (दीर्घ स्वरसंधी)", example: { problem: "हिम + आलय = ?", solution: "हिमालय — दीर्घ स्वरसंधी", tip: "संधी म्हणजे जोडणे, शब्द मिळून नवीन शब्द तयार होतो" } },
  ],
  English: [
    { title: "Parts of Speech", icon: "📚", overview: "Classification of words by their role in sentences.", keyPoints: ["Noun: names a person/place/thing/idea", "Verb: expresses action or state of being", "Adjective: modifies nouns; Adverb: modifies verbs"], formula: "Sentence = Subject (Noun) + Predicate (Verb)", example: { problem: "Identify parts of speech: 'The quick brown fox jumps'", solution: "The (article), quick/brown (adjective), fox (noun), jumps (verb)", tip: "Ask 'what is it doing?' to find the verb" } },
    { title: "Tenses", icon: "⏰", overview: "Expressing time of action using verb forms.", keyPoints: ["Present Simple: I write / She writes", "Past Simple: I wrote", "Future Simple: I will write"], formula: "12 tenses = 4 types × 3 time periods", example: { problem: "Convert to Past Perfect: 'She finishes the work'", solution: "She had finished the work", tip: "Past Perfect = had + past participle" } },
    { title: "Active & Passive Voice", icon: "🔄", overview: "Changing focus between subject and object in sentences.", keyPoints: ["Active: subject performs action (The dog bit the man)", "Passive: subject receives action (The man was bitten by the dog)", "Passive = be + past participle"], formula: "Active: S + V + O  →  Passive: O + be + V(p.p.) + by S", example: { problem: "Change to passive: 'The teacher teaches the class'", solution: "The class is taught by the teacher", tip: "Identify the object — it becomes the subject in passive voice" } },
    { title: "Comprehension Skills", icon: "📖", overview: "Understanding and interpreting written passages effectively.", keyPoints: ["Identify main idea — usually in first/last paragraph", "Look for keywords that match questions", "Inferences come from reading between the lines"], formula: "Read → Understand → Answer from passage", example: { problem: "How to answer: 'What does the author imply?'", solution: "Find sentences suggesting the idea (not stated directly) and paraphrase", tip: "Implied means NOT directly stated — look for hints" } },
    { title: "Essay & Letter Writing", icon: "✍️", overview: "Structuring formal and informal writing effectively.", keyPoints: ["Formal letter: Sender → Date → Receiver → Subject → Body → Closing", "Essay: Introduction → Body (3 para) → Conclusion", "Use topic sentences to begin each paragraph"], formula: "PEEL: Point → Evidence → Explain → Link", example: { problem: "Write a topic sentence about deforestation?", solution: "Deforestation is one of the most pressing environmental crises of our time.", tip: "Topic sentence = main idea of paragraph in one line" } },
  ],
  "Social Science": [
    { title: "Indian History", icon: "🏛️", overview: "Key events in India's history from ancient to modern era.", keyPoints: ["Indus Valley Civilisation: 2600–1900 BCE", "Mughal Empire: 1526–1857", "Indian Independence: 15 August 1947"], formula: "Timeline: Ancient → Medieval → Modern History", example: { problem: "When did Quit India Movement begin?", solution: "1942 — launched by Mahatma Gandhi on 8 August 1942", tip: "Connect movements to their leaders and dates" } },
    { title: "Indian Constitution", icon: "📜", overview: "India's supreme law adopted on 26 January 1950.", keyPoints: ["Fundamental Rights: Articles 12–35 (Right to equality, freedom etc.)", "Directive Principles: Guidelines for state policy", "Fundamental Duties: Article 51A (11 duties)"], formula: "Republic Day = 26 Jan 1950 (Constitution adopted)", example: { problem: "Article 21 of Indian Constitution?", solution: "Protection of life and personal liberty — 'No person shall be deprived of his life or personal liberty except according to procedure established by law'", tip: "Articles 12–35 = Fundamental Rights (6 categories)" } },
    { title: "Geography of India", icon: "🗺️", overview: "Physical features, climate zones and resources of India.", keyPoints: ["Himalayan range in the north forms natural boundary", "Indo-Gangetic Plains: most fertile agricultural land", "Peninsular Plateau: oldest land mass of India"], formula: "India: 28 states + 8 Union Territories", example: { problem: "Longest river in India?", solution: "Ganga — approximately 2,525 km long", tip: "Brahmaputra is longest if measured from Tibet" } },
    { title: "Economics: Market & Trade", icon: "💹", overview: "Supply, demand, markets and India's economy.", keyPoints: ["Law of Demand: higher price → lower quantity demanded", "GDP = total value of goods produced in a country", "Primary (agriculture), Secondary (industry), Tertiary (services) sectors"], formula: "GDP = C + I + G + (X − M)", example: { problem: "If demand increases but supply stays same, what happens to price?", solution: "Price rises (demand-pull effect)", tip: "Supply and demand always move price — draw a diagram to help" } },
    { title: "Disaster Management", icon: "🚨", overview: "Understanding natural disasters and preparedness strategies.", keyPoints: ["Earthquakes measured on Richter scale", "Cyclones form over warm ocean water", "Mitigation = reducing impact before disaster occurs"], formula: "Risk = Hazard × Vulnerability", example: { problem: "What is a richter scale measure of 7.0?", solution: "Major earthquake — causes serious damage over large areas", tip: "Each 1.0 increase on Richter scale = 10× more ground motion" } },
  ],
  "EVS/Science": [
    { title: "Environment & Ecology", icon: "🌿", overview: "Ecosystems, food chains and environmental conservation.", keyPoints: ["Biodiversity: variety of life on Earth", "Food chain: Grass → Rabbit → Fox", "Greenhouse effect: CO₂ traps heat → global warming"], formula: "10% Energy Rule: Only 10% energy passes up each trophic level", example: { problem: "Why are decomposers important?", solution: "They break down dead matter and recycle nutrients back into the soil", tip: "Without decomposers, the Earth would be buried in dead organic material!" } },
    { title: "Force & Motion", icon: "🚗", overview: "Newton's laws and types of forces in everyday life.", keyPoints: ["Force = mass × acceleration (F = ma)", "Balanced forces → no change in motion", "Friction opposes motion"], formula: "F = ma", example: { problem: "A 4kg box accelerates at 2 m/s². What force acts on it?", solution: "F = 4 × 2 = 8 N", tip: "Double the mass → double the force needed for same acceleration" } },
    { title: "Atoms & Molecules", icon: "⚛️", overview: "Structure of matter at the atomic level.", keyPoints: ["Atom: smallest unit of element", "Molecule: group of atoms bonded together", "H₂O = 2 hydrogen + 1 oxygen atom"], formula: "Atomic mass ≈ Protons + Neutrons", example: { problem: "How many atoms in one molecule of CO₂?", solution: "3 atoms: 1 Carbon + 2 Oxygen", tip: "Subscript numbers in formula show how many atoms of each element" } },
    { title: "Light & Sound", icon: "💡", overview: "Properties and behaviour of light and sound waves.", keyPoints: ["Light travels at 3×10⁸ m/s", "Sound needs a medium to travel (not in vacuum)", "Reflection: angle of incidence = angle of reflection"], formula: "Speed = frequency × wavelength (v = fλ)", example: { problem: "Why can't sound travel in space?", solution: "Sound needs molecules to vibrate — space is a vacuum with no molecules", tip: "Light can travel in vacuum; sound cannot" } },
    { title: "Human Body Systems", icon: "🫀", overview: "Major organ systems and their functions in the human body.", keyPoints: ["Circulatory: heart pumps blood through arteries/veins", "Digestive: breaks food into nutrients absorbed in intestines", "Respiratory: lungs exchange O₂ and CO₂"], formula: "Heart rate × stroke volume = Cardiac output", example: { problem: "Where does digestion begin?", solution: "In the mouth — saliva contains amylase that breaks down starch", tip: "Each organ system works together — they are all interconnected" } },
  ],
  Science: [
    { title: "Force & Motion", icon: "🚀", overview: "Newton's laws and the physics of moving objects.", keyPoints: ["1st Law: Inertia — objects resist change in motion", "2nd Law: F = ma", "3rd Law: Action-reaction forces"], formula: "F = ma,  v = u + at,  s = ut + ½at²", example: { problem: "Ball thrown up at 20 m/s. Time to reach max height?", solution: "v = u − gt → 0 = 20 − 10t → t = 2 s", tip: "At maximum height, velocity = 0" } },
    { title: "Electricity", icon: "⚡", overview: "Electric charge, current, voltage and circuits.", keyPoints: ["Current (I) = Charge/Time — measured in Amperes", "Voltage (V) = Energy/Charge — measured in Volts", "Ohm's Law: V = IR"], formula: "V = IR,  P = IV", example: { problem: "Resistance of device using 240V and 2A current?", solution: "R = V/I = 240/2 = 120 Ω", tip: "Use triangle: V on top, I and R below" } },
    { title: "Chemical Reactions", icon: "⚗️", overview: "Types and indicators of chemical reactions.", keyPoints: ["Exothermic: releases heat (combustion)", "Endothermic: absorbs heat (photosynthesis)", "Signs: colour change, gas, precipitate, temperature change"], formula: "Reactants → Products", example: { problem: "Is rusting exothermic or endothermic?", solution: "Exothermic (releases heat slowly but is still an oxidation reaction)", tip: "Iron + Oxygen + Water → Iron oxide (rust)" } },
    { title: "Biological Diversity", icon: "🌳", overview: "Classification of living organisms into groups.", keyPoints: ["5 kingdoms: Monera, Protista, Fungi, Plantae, Animalia", "Classification: Kingdom → Phylum → Class → Order → Family → Genus → Species", "Binomial nomenclature: Genus species (Homo sapiens)"], formula: "King Philip Came Over For Good Soup (mnemonic)", example: { problem: "Scientific name of humans?", solution: "Homo sapiens (Genus: Homo, Species: sapiens)", tip: "Binomial names are always italicised with genus capitalised" } },
    { title: "Nutrition in Plants & Animals", icon: "🌱", overview: "How living organisms obtain and use food.", keyPoints: ["Autotrophs: make own food (plants via photosynthesis)", "Heterotrophs: consume other organisms", "Nutrition types: holozoic, saprotrophic, parasitic"], formula: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂", example: { problem: "What is the process by which amoeba feeds?", solution: "Holozoic nutrition — engulfs food by phagocytosis", tip: "Amoeba surrounds food with pseudopodia to form a food vacuole" } },
  ],
}

// SVG Visualisation components per subject
function SubjectVisualization({ subject }: { subject: string }) {
  if (subject === "Mathematics") {
    return (
      <svg width="100%" height="160" viewBox="0 0 400 160" style={{ borderRadius: "10px", background: "#f8f6ff" }}>
        <text x="10" y="20" fontSize="11" fill="#888">Parabola: y = x²</text>
        {/* Axes */}
        <line x1="200" y1="10" x2="200" y2="155" stroke="#ccc" strokeWidth="1" />
        <line x1="20" y1="140" x2="380" y2="140" stroke="#ccc" strokeWidth="1" />
        {/* Labels */}
        <text x="205" y="18" fontSize="9" fill="#999">y</text>
        <text x="375" y="150" fontSize="9" fill="#999">x</text>
        {/* Parabola y = x² scaled */}
        <path d={Array.from({ length: 61 }, (_, i) => {
          const xi = (i - 30) * 5
          const x = xi + 200
          const y = 140 - (xi * xi) / 120
          return `${i === 0 ? "M" : "L"} ${x} ${y}`
        }).join(" ")} stroke="#6c55e8" strokeWidth="2.5" fill="none" />
        {/* Vertex label */}
        <circle cx="200" cy="140" r="4" fill="#6c55e8" />
        <text x="208" y="138" fontSize="10" fill="#6c55e8">Vertex (0,0)</text>
      </svg>
    )
  }
  if (subject === "Physics" || subject === "Science") {
    return (
      <svg width="100%" height="160" viewBox="0 0 400 160" style={{ borderRadius: "10px", background: "#fdf6ff" }}>
        <text x="10" y="20" fontSize="11" fill="#888">v-t Graph: Uniform Acceleration</text>
        <line x1="40" y1="130" x2="380" y2="130" stroke="#bbb" strokeWidth="1" />
        <line x1="40" y1="10" x2="40" y2="130" stroke="#bbb" strokeWidth="1" />
        <text x="5" y="135" fontSize="9" fill="#999">0</text>
        <text x="370" y="145" fontSize="9" fill="#999">t (s)</text>
        <text x="42" y="18" fontSize="9" fill="#999">v (m/s)</text>
        <line x1="40" y1="120" x2="360" y2="30" stroke="#a855f7" strokeWidth="2.5" />
        <text x="330" y="25" fontSize="10" fill="#a855f7">v = u + at</text>
        <circle cx="40" cy="120" r="3" fill="#a855f7" />
        <circle cx="360" cy="30" r="3" fill="#a855f7" />
      </svg>
    )
  }
  if (subject === "Chemistry") {
    return (
      <svg width="100%" height="160" viewBox="0 0 400 160" style={{ borderRadius: "10px", background: "#f0fdf4" }}>
        <text x="10" y="20" fontSize="11" fill="#888">pH Scale</text>
        {[...Array(15)].map((_, i) => (
          <rect key={i} x={20 + i * 25} y="50" width="22" height="40" rx="3"
            fill={i < 5 ? `hsl(${0 + i * 10},80%,55%)` : i < 8 ? "#ffd700" : `hsl(${140 + i * 8},70%,45%)`} />
        ))}
        {[0, 2, 4, 6, 7, 8, 10, 12, 14].map((n) => (
          <text key={n} x={22 + n * 25} y="105" fontSize="8" fill="#555">{n}</text>
        ))}
        <text x="20" y="125" fontSize="9" fill="#e53935">← Acidic</text>
        <text x="170" y="125" fontSize="9" fill="#888">Neutral</text>
        <text x="290" y="125" fontSize="9" fill="#388e3c">Alkaline →</text>
      </svg>
    )
  }
  if (subject === "Biology") {
    return (
      <svg width="100%" height="160" viewBox="0 0 400 160" style={{ borderRadius: "10px", background: "#f1f8e9" }}>
        <text x="10" y="20" fontSize="11" fill="#888">Food Chain</text>
        {[
          { label: "Sun ☀️", x: 30, y: 70, color: "#ffd700" },
          { label: "Plant 🌿", x: 110, y: 70, color: "#66bb6a" },
          { label: "Herbivore 🐇", x: 210, y: 70, color: "#42a5f5" },
          { label: "Carnivore 🦊", x: 320, y: 70, color: "#ef5350" },
        ].map((item, i, arr) => (
          <g key={item.label}>
            <circle cx={item.x + 30} cy={item.y} r="26" fill={item.color} opacity="0.85" />
            <text x={item.x + 30} y={item.y + 4} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">{item.label}</text>
            {i < arr.length - 1 && <line x1={item.x + 57} y1={item.y} x2={arr[i + 1].x + 3} y2={arr[i + 1].y} stroke="#999" strokeWidth="1.5" markerEnd="url(#arr)" />}
          </g>
        ))}
        <text x="10" y="150" fontSize="9" fill="#666">Energy flows right → 10% transferred at each level</text>
      </svg>
    )
  }
  if (subject === "IT") {
    return (
      <svg width="100%" height="160" viewBox="0 0 400 160" style={{ borderRadius: "10px", background: "#e8eaf6" }}>
        <text x="10" y="20" fontSize="11" fill="#888">Python: If-Else Flow</text>
        <rect x="140" y="30" width="120" height="30" rx="15" fill="#5c6bc0" />
        <text x="200" y="50" textAnchor="middle" fontSize="10" fill="#fff">condition?</text>
        <line x1="200" y1="60" x2="200" y2="85" stroke="#999" strokeWidth="1.5" />
        <rect x="80" y="85" width="80" height="28" rx="5" fill="#26a69a" />
        <text x="120" y="103" textAnchor="middle" fontSize="10" fill="#fff">True Block</text>
        <rect x="240" y="85" width="80" height="28" rx="5" fill="#ef5350" />
        <text x="280" y="103" textAnchor="middle" fontSize="10" fill="#fff">False Block</text>
        <line x1="200" y1="60" x2="120" y2="85" stroke="#26a69a" strokeWidth="1.5" />
        <line x1="200" y1="60" x2="280" y2="85" stroke="#ef5350" strokeWidth="1.5" />
        <text x="130" y="80" fontSize="9" fill="#26a69a">True</text>
        <text x="250" y="80" fontSize="9" fill="#ef5350">False</text>
        <line x1="120" y1="113" x2="200" y2="140" stroke="#999" strokeWidth="1" strokeDasharray="3" />
        <line x1="280" y1="113" x2="200" y2="140" stroke="#999" strokeWidth="1" strokeDasharray="3" />
        <text x="185" y="155" fontSize="9" fill="#666">Continue</text>
      </svg>
    )
  }
  // Default: bar chart for Hindi/Marathi/English/SS
  const labels = ["Foundation", "Developing", "Proficient", "Advanced", "Mastery"]
  const values = [90, 72, 55, 38, 20]
  return (
    <svg width="100%" height="160" viewBox="0 0 400 160" style={{ borderRadius: "10px", background: "#fff8f0" }}>
      <text x="10" y="20" fontSize="11" fill="#888">Difficulty Level Distribution</text>
      {labels.map((label, i) => (
        <g key={label}>
          <rect x={30 + i * 70} y={140 - values[i]} width="50" height={values[i]} rx="4"
            fill={["#6c55e8", "#3b9fd4", "#f5a623", "#e05252", "#28835e"][i]} opacity="0.85" />
          <text x={55 + i * 70} y="155" textAnchor="middle" fontSize="7" fill="#666">{label}</text>
          <text x={55 + i * 70} y={134 - values[i]} textAnchor="middle" fontSize="8" fill="#555">{values[i]}%</text>
        </g>
      ))}
    </svg>
  )
}

// Subject mini quiz component
function SubjectMiniQuiz({ grade, subject, onClose }: { grade: string; subject: string; onClose: () => void }) {
  const sessionKey = `learnova_quiz_${grade}_${subject}`
  const usedIds: string[] = (() => {
    try { return JSON.parse(sessionStorage.getItem(sessionKey) || "[]") } catch { return [] }
  })()

  const questions = useMemo(() => {
    const qs = getRandomUniqueQuestions(grade, subject, 5, usedIds)
    if (qs.length === 0) {
      // Reset if all used
      try { sessionStorage.removeItem(sessionKey) } catch {}
      return getRandomUniqueQuestions(grade, subject, 5, [])
    }
    return qs
  }, [])

  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [answered, setAnswered] = useState(false)

  const q = questions[step]

  const handleAnswer = (idx: number) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    if (idx === q?.correct) setScore((s) => s + 1)
  }

  const next = () => {
    if (step >= questions.length - 1) {
      const newUsed = [...usedIds, ...questions.map((q) => q.id)]
      try { sessionStorage.setItem(sessionKey, JSON.stringify(newUsed)) } catch {}
      setDone(true)
    } else {
      setStep(step + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  const emoji = subjectEmoji[subject] || "📚"

  if (!q) return <div style={{ padding: "20px" }}>No questions available.</div>

  return (
    <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", maxWidth: "560px", margin: "0 auto", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#888", fontWeight: 700, letterSpacing: "1px" }}>{emoji} {subject} QUIZ · {grade}</span>
          <div style={{ fontSize: "13px", color: "#555", marginTop: "2px" }}>Question {step + 1} of {questions.length}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#999" }}>✕</button>
      </div>

      {!done ? (
        <>
          <div style={{ background: "#f5f3ff", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", color: "#7c6dda", fontWeight: 700, marginBottom: "6px" }}>{q.topic} · {q.difficulty}</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a1730" }}>{q.prompt}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {q.answers.map((ans, i) => {
              const isCorrect = i === q.correct
              const isSelected = i === selected
              let bg = "#f8f8fc"
              let border = "1.5px solid #e0ddf5"
              let color = "#333"
              if (answered) {
                if (isCorrect) { bg = "#e8f7f1"; border = "1.5px solid #28835e"; color = "#28835e" }
                else if (isSelected) { bg = "#fff0f0"; border = "1.5px solid #e05252"; color = "#e05252" }
              }
              return (
                <button key={ans} onClick={() => handleAnswer(i)} disabled={answered}
                  style={{ background: bg, border, color, borderRadius: "10px", padding: "10px 14px", textAlign: "left", fontSize: "13px", cursor: answered ? "default" : "pointer", display: "flex", gap: "10px", alignItems: "center", fontWeight: isSelected || (answered && isCorrect) ? 700 : 400 }}>
                  <span style={{ minWidth: "22px", height: "22px", borderRadius: "50%", background: answered && isCorrect ? "#28835e" : "#e0ddf5", color: answered && isCorrect ? "#fff" : "#6c55e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700 }}>{String.fromCharCode(65 + i)}</span>
                  {ans}
                  {answered && isCorrect && <span style={{ marginLeft: "auto" }}>✅</span>}
                  {answered && isSelected && !isCorrect && <span style={{ marginLeft: "auto" }}>❌</span>}
                </button>
              )
            })}
          </div>
          {answered && (
            <div style={{ marginTop: "12px", padding: "10px 14px", background: selected === q.correct ? "#e8f7f1" : "#fff5f5", borderRadius: "8px", fontSize: "12px", color: "#555" }}>
              <strong>{selected === q.correct ? "✅ Correct!" : "❌ Incorrect."}</strong> {q.explanation}
            </div>
          )}
          {answered && (
            <button onClick={next} style={{ marginTop: "14px", width: "100%", padding: "12px", background: "var(--violet, #6c55e8)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              {step < questions.length - 1 ? "Next Question →" : "See Results →"}
            </button>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>{score === questions.length ? "🏆" : score >= questions.length * 0.6 ? "🎯" : "📖"}</div>
          <h3 style={{ margin: "0 0 8px" }}>Quiz Complete!</h3>
          <p style={{ color: "#666", fontSize: "14px" }}>You scored <strong style={{ color: "#6c55e8" }}>{score} / {questions.length}</strong> ({Math.round(score / questions.length * 100)}%)</p>
          <p style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>Questions automatically rotate — next quiz will have different questions!</p>
          <button onClick={onClose} style={{ marginTop: "14px", padding: "10px 24px", background: "#6c55e8", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Back to Subjects</button>
        </div>
      )}
    </div>
  )
}

function SubjectModuleView({
  grade,
  onNavigate,
  initialSubject,
  initialLessonIdx,
}: {
  grade: string
  onNavigate: (p: string) => void
  initialSubject?: string | null
  initialLessonIdx?: number | null
}) {
  const subjects = gradeSubjects[grade] || gradeSubjects["Grade 10"]
  const [activeSubject, setActiveSubject] = useState<string | null>(initialSubject || null)
  const [activeLessonIdx, setActiveLessonIdx] = useState<number | null>(initialLessonIdx ?? null)
  const [quizSubject, setQuizSubject] = useState<string | null>(null)

  useEffect(() => {
    if (initialSubject) {
      setActiveSubject(initialSubject)
      setActiveLessonIdx(initialLessonIdx ?? null)
    }
  }, [initialSubject, initialLessonIdx])

  const subjectLessonList = activeSubject ? (subjectLessons[activeSubject] || []) : []
  const activeLesson = activeLessonIdx !== null ? subjectLessonList[activeLessonIdx] : null

  if (quizSubject) {
    return <SubjectMiniQuiz grade={grade} subject={quizSubject} onClose={() => setQuizSubject(null)} />
  }

  return (
    <div>
      {/* Header */}
      <section style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#7c6dda", textTransform: "uppercase", marginBottom: "4px" }}>
          📚 SUBJECT MODULES
        </p>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1a1730", margin: "0 0 6px" }}>
          {grade} — Subject Explorer
        </h1>
        <p style={{ color: "#74708a", fontSize: "14px", margin: 0 }}>
          Select a subject to open lessons, visualisations, and practice quizzes.
        </p>
      </section>

      {/* Subject grid */}
      {!activeSubject && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px" }}>
          {subjects.map((subj) => {
            const col = subjectColor[subj] || subjectColor["Mathematics"]
            return (
              <button
                key={subj}
                onClick={() => { setActiveSubject(subj); setActiveLessonIdx(null) }}
                style={{ background: col.bg, border: `2px solid ${col.border}`, borderRadius: "16px", padding: "20px 16px", textAlign: "left", cursor: "pointer", transition: "transform 0.15s", display: "flex", flexDirection: "column", gap: "8px" }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <span style={{ fontSize: "28px" }}>{subjectEmoji[subj] || "📚"}</span>
                <strong style={{ color: col.text, fontSize: "14px" }}>{subj}</strong>
                <span style={{ fontSize: "11px", color: "#888" }}>{(subjectLessons[subj] || []).length} lessons · Click to open</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Subject detail */}
      {activeSubject && !activeLesson && (
        <div>
          <button onClick={() => setActiveSubject(null)} style={{ background: "none", border: "none", color: "#6c55e8", fontWeight: 700, cursor: "pointer", fontSize: "13px", marginBottom: "16px" }}>
            ← Back to Subjects
          </button>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "36px" }}>{subjectEmoji[activeSubject]}</span>
            <div>
              <h2 style={{ margin: "0 0 4px", color: "#1a1730" }}>{activeSubject}</h2>
              <p style={{ margin: 0, color: "#74708a", fontSize: "13px" }}>{grade} · {subjectLessonList.length} Lessons</p>
            </div>
            <button
              onClick={() => setQuizSubject(activeSubject)}
              style={{ marginLeft: "auto", background: "#6c55e8", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >
              🎯 Take Quiz
            </button>
          </div>

          {/* Visualisation */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", color: "#888", fontWeight: 700, marginBottom: "6px", letterSpacing: "1px" }}>📊 CONCEPT VISUALIZATION</div>
            <SubjectVisualization subject={activeSubject} />
          </div>

          {/* Lessons list */}
          <div style={{ fontSize: "11px", color: "#888", fontWeight: 700, marginBottom: "10px", letterSpacing: "1px" }}>📖 LESSON MODULES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {subjectLessonList.map((lesson, idx) => (
              <button
                key={lesson.title}
                onClick={() => setActiveLessonIdx(idx)}
                style={{ background: "#fff", border: "1.5px solid #e8e4fa", borderRadius: "12px", padding: "14px 16px", textAlign: "left", cursor: "pointer", display: "flex", gap: "14px", alignItems: "center" }}
                onMouseOver={(e) => { e.currentTarget.style.background = "#f5f3ff"; e.currentTarget.style.borderColor = "#c5b9ff" }}
                onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e8e4fa" }}
              >
                <span style={{ fontSize: "24px", minWidth: "36px", textAlign: "center" }}>{lesson.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#1a1730", fontSize: "14px" }}>{lesson.title}</div>
                  <div style={{ fontSize: "12px", color: "#74708a", marginTop: "2px" }}>{lesson.overview.slice(0, 70)}…</div>
                </div>
                <span style={{ fontSize: "18px", color: "#c5b9ff" }}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lesson detail */}
      {activeLesson && (
        <div>
          <button onClick={() => setActiveLessonIdx(null)} style={{ background: "none", border: "none", color: "#6c55e8", fontWeight: 700, cursor: "pointer", fontSize: "13px", marginBottom: "16px" }}>
            ← Back to {activeSubject}
          </button>
          <div style={{ background: "#fff", borderRadius: "16px", border: "1.5px solid #e8e4fa", padding: "24px", maxWidth: "640px" }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>{activeLesson.icon}</div>
            <h2 style={{ margin: "0 0 6px", color: "#1a1730" }}>{activeLesson.title}</h2>
            <p style={{ color: "#74708a", fontSize: "14px", marginBottom: "20px" }}>{activeLesson.overview}</p>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#7c6dda", letterSpacing: "1px", marginBottom: "8px" }}>🔑 KEY POINTS</div>
              {activeLesson.keyPoints.map((pt, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
                  <span style={{ color: "#6c55e8", fontWeight: 800, minWidth: "16px" }}>{i + 1}.</span>
                  <span style={{ color: "#333", fontSize: "13px" }}>{pt}</span>
                </div>
              ))}
            </div>

            {activeLesson.formula && (
              <div style={{ background: "#f5f3ff", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontFamily: "monospace", fontSize: "14px", color: "#4527a0", fontWeight: 600 }}>
                📐 {activeLesson.formula}
              </div>
            )}

            {activeLesson.example && (
              <div style={{ background: "#f0fdf4", border: "1.5px solid #a5d6a7", borderRadius: "10px", padding: "14px 16px", marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#2e7d32", marginBottom: "8px", letterSpacing: "1px" }}>💡 WORKED EXAMPLE</div>
                <div style={{ fontWeight: 600, color: "#1a1730", fontSize: "13px", marginBottom: "6px" }}>Q: {activeLesson.example.problem}</div>
                <div style={{ color: "#2e7d32", fontSize: "13px", marginBottom: "6px" }}>✅ {activeLesson.example.solution}</div>
                <div style={{ fontSize: "12px", color: "#74708a", fontStyle: "italic" }}>💡 {activeLesson.example.tip}</div>
              </div>
            )}

            {/* Visualisation inside lesson */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: "#888", fontWeight: 700, marginBottom: "6px", letterSpacing: "1px" }}>📊 VISUAL AID</div>
              <SubjectVisualization subject={activeSubject || ""} />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setQuizSubject(activeSubject)}
                style={{ flex: 1, background: "#6c55e8", color: "#fff", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
              >
                🎯 Practice Quiz
              </button>
              <button
                onClick={() => {
                  const next = (activeLessonIdx ?? 0) + 1
                  if (next < subjectLessonList.length) setActiveLessonIdx(next)
                  else setActiveLessonIdx(null)
                }}
                style={{ padding: "12px 18px", background: "#f5f3ff", color: "#6c55e8", border: "1.5px solid #c5b9ff", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
              >
                Next Lesson →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- */
/* MAIN APP ROOT                                                 */
/* ------------------------------------------------------------- */
export default function App() {
  const [page, setPage] = useState("home")
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [diagnosticOpen, setDiagnosticOpen] = useState(false)
  const [topbarSearch, setTopbarSearch] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedSubjectFromSearch, setSelectedSubjectFromSearch] = useState<string | null>(null)
  const [selectedLessonIdxFromSearch, setSelectedLessonIdxFromSearch] = useState<number | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [activePersona, setActivePersona] = useState<"alex" | "maya" | "liam">(
    "alex",
  )

  // Click outside to dismiss search popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Global Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsSearchFocused(true)
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
      if (e.key === "Escape") {
        setIsSearchFocused(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Real-time reactive search index computation
  const searchResults = useMemo(() => {
    const q = topbarSearch.trim().toLowerCase()
    if (!q) {
      return { totalCount: 0, lessons: [], subjects: [], sections: [] }
    }

    // 1. Lessons across all curriculum subjects
    const matchingLessons: { subject: string; lesson: (typeof subjectLessons)[string][0]; lessonIdx: number }[] = []
    Object.entries(subjectLessons).forEach(([subj, lessons]) => {
      lessons.forEach((l, idx) => {
        if (
          l.title.toLowerCase().includes(q) ||
          l.overview.toLowerCase().includes(q) ||
          (l.formula && l.formula.toLowerCase().includes(q)) ||
          subj.toLowerCase().includes(q)
        ) {
          matchingLessons.push({ subject: subj, lesson: l, lessonIdx: idx })
        }
      })
    })

    // 2. Curriculum Subjects
    const allSubjects = Object.keys(subjectLessons)
    const matchingSubjects = allSubjects.filter((s) => s.toLowerCase().includes(q))

    // 3. Platform Tools & Cycle Stages
    const matchingSections = navItems.filter(
      (item) => item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
    )

    return {
      totalCount: matchingLessons.length + matchingSubjects.length + matchingSections.length,
      lessons: matchingLessons.slice(0, 5),
      subjects: matchingSubjects.slice(0, 3),
      sections: matchingSections.slice(0, 3),
    }
  }, [topbarSearch])

  // Auth state: check localStorage
  const [currentUser, setCurrentUser] = useState<{
    name: string
    grade: string
    email?: string
    isTeacher?: boolean
  } | null>(() => {
    try {
      const saved = localStorage.getItem("learnova_auth_user")
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Auth view state: "cover" entrance page vs "login" page
  const [authView, setAuthView] = useState<"cover" | "login">("cover")

  const refreshProfile = async (customName?: string, customGrade?: string) => {
    if (currentUser?.isTeacher) return
    const targetName = customName || currentUser?.name
    const targetGrade = customGrade || currentUser?.grade
    try {
      let data = await api.getProfile()
      if (targetName) {
        data = await api.login(targetName, targetGrade)
      }
      setProfile(data)
    } catch {
      // Offline / zero-downtime fallback: ensure user profile is set so app never hangs
      if (targetName) {
        setProfile((prev) =>
          prev
            ? { ...prev, name: targetName, grade: targetGrade || prev.grade }
            : buildFallbackProfile(targetName, targetGrade || "Grade 10")
        )
      }
    }
  }

  useEffect(() => {
    if (!currentUser?.isTeacher) {
      refreshProfile()
    }
  }, [currentUser?.isTeacher])

  // Safety fallback: if user is logged in, ensure loading screen transitions smoothly
  useEffect(() => {
    if (currentUser && !currentUser.isTeacher && !profile) {
      const timer = setTimeout(() => {
        setProfile((prev) => prev || buildFallbackProfile(currentUser.name, currentUser.grade))
      }, 900)
      return () => clearTimeout(timer)
    }
  }, [currentUser, profile])

  const handleLogin = async (user: {
    name: string
    grade: string
    email?: string
    isTeacher?: boolean
  }) => {
    setCurrentUser(user)
    try {
      localStorage.setItem("learnova_auth_user", JSON.stringify(user))
    } catch {
      // ignore
    }

    if (user.isTeacher) {
      return
    }

    // Check if it's one of the presets
    if (user.name.toLowerCase().includes("maya")) {
      setActivePersona("maya")
      try { await api.setPersona("maya") } catch {}
    } else if (user.name.toLowerCase().includes("liam")) {
      setActivePersona("liam")
      try { await api.setPersona("liam") } catch {}
    } else if (user.name.toLowerCase().includes("alex")) {
      setActivePersona("alex")
      try { await api.setPersona("alex") } catch {}
    }

    // Update custom name in backend or initialize profile
    try {
      const updated = await api.login(user.name, user.grade)
      setProfile(updated)
    } catch {
      if (profile) {
        setProfile({
          ...profile,
          name: user.name,
          grade: user.grade,
          avatar: user.name.slice(0, 2).toUpperCase(),
        })
      } else {
        setProfile(buildFallbackProfile(user.name, user.grade))
      }
    }
    setPage("home")
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem("learnova_auth_user")
    } catch {
      // ignore
    }
    setCurrentUser(null)
    setAuthView("cover")
  }

  const handleSwitchPersona = async (p: "alex" | "maya" | "liam") => {
    setActivePersona(p)
    try {
      const updated = await api.setPersona(p)
      setProfile(updated)
      setCurrentUser({
        name: updated.name,
        grade: updated.grade,
      })
      localStorage.setItem(
        "learnova_auth_user",
        JSON.stringify({ name: updated.name, grade: updated.grade }),
      )
    } catch {
      // Fallback
    }
  }

  const handleCompleteDiagnostic = (updatedProfile: StudentProfile) => {
    setProfile(updatedProfile)
    setDiagnosticOpen(false)
    setPage("analysis")
  }

  // If not logged in, show Cover Page entrance first, or Login page
  if (!currentUser) {
    if (authView === "login") {
      return (
        <LoginPage
          onLogin={handleLogin}
          onBackToCover={() => setAuthView("cover")}
        />
      )
    }
    return (
      <CoverPageView
        onGetStarted={() => setAuthView("login")}
        onQuickLogin={(demoName, demoGrade, isTeacher) => {
          handleLogin({ name: demoName, grade: demoGrade, isTeacher })
        }}
      />
    )
  }

  // Teacher / Educator Portal View
  if (currentUser.isTeacher) {
    return (
      <TeacherDashboardView
        onLogout={handleLogout}
        onSwitchToStudent={() => {
          handleLogin({ name: "Neha", grade: "Grade 10" })
        }}
      />
    )
  }

  if (!profile) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Icon name="spark" size={36} />
          <h2 style={{ marginTop: "14px" }}>
            Personalizing Learning Environment for {currentUser.name}...
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        {/* BRAND */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Icon name="spark" size={20} />
          </div>
          <div className="sidebar-brand-text">
            <strong className="sidebar-brand-title">Learnova</strong>
            <span className="sidebar-brand-tag">ADAPTIVE AI ENGINE</span>
          </div>
        </div>

        {/* STRUCTURED NAVIGATION SECTIONS */}
        <nav>
          {SIDEBAR_NAV_GROUPS.map((group) => (
            <div key={group.title} style={{ marginBottom: "14px" }}>
              <div className="sidebar-section-title">{group.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {group.items.map((item) => {
                  const isActive = page === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`sidebar-nav-btn ${isActive ? "active" : ""}`}
                      onClick={() => {
                        if (item.id === "diagnostic") {
                          setDiagnosticOpen(true)
                        } else {
                          setPage(item.id)
                        }
                      }}
                    >
                      <div
                        className="sidebar-nav-icon"
                        style={{
                          background: isActive ? item.gradient : item.badgeBg,
                          color: isActive ? "#ffffff" : item.badgeColor,
                          boxShadow: isActive ? "0 3px 10px rgba(99, 91, 219, 0.28)" : undefined,
                          borderColor: isActive ? "transparent" : item.badgeBorder,
                        }}
                      >
                        <Icon name={item.icon} size={15} />
                      </div>
                      <span className="sidebar-nav-label">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className="sidebar-nav-badge"
                          style={{
                            background: isActive ? item.gradient : item.badgeBg,
                            borderColor: isActive ? "transparent" : item.badgeBorder,
                            color: isActive ? "#ffffff" : item.badgeColor,
                            boxShadow: isActive ? "0 2px 8px rgba(99, 91, 219, 0.25)" : undefined,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* GAMIFIED DAILY GOAL CARD */}
        <div className="daily-goal">
          <div className="daily-goal-head">
            <span className="daily-goal-title">
              <span>🎯</span>
              <span>Daily Study Goal</span>
            </span>
            <strong className="daily-goal-val">42 / 50m (84%)</strong>
          </div>
          <div className="goal-bar">
            <span />
          </div>
          <p className="daily-goal-sub">
            <span>🔥</span>
            <span>8 min remaining to extend streak!</span>
          </p>
        </div>

        {/* SIDEBAR PROFILE & HIGHLIGHTED LOGOUT */}
        <div className="sidebar-profile">
          <div className="sidebar-profile-user">
            <div className="sidebar-profile-avatar">{profile.avatar}</div>
            <div className="sidebar-profile-meta">
              <strong>{profile.name}</strong>
              <small>{profile.grade}</small>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-logout-icon-btn"
            onClick={handleLogout}
            title="Log Out of this session"
          >
            <Icon name="logout" size={14} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main>
        {/* TOPBAR */}
        <header className="topbar">
          <div className="mobile-brand">
            <Icon name="spark" />
            <strong>Learnova</strong>
          </div>

          {/* LEFT: Clean Greeting & Grade */}
          <div className="topbar-left">
            <div className="topbar-user-greeting">
              <div className="greeting-headline">
                <span className="greeting-salutation">Hello,</span>
                <strong className="greeting-name">{profile.name}</strong>
              </div>
              <div className="greeting-sub">
                <span className="grade-tag">{profile.grade || "Grade 10 · SSC"}</span>
              </div>
            </div>
          </div>

          {/* CENTER: Interactive Command Search Bar with Live Results Dropdown */}
          <div className="topbar-search-container" ref={searchContainerRef}>
            <div className={`topbar-search ${isSearchFocused ? "focused" : ""}`}>
              <Icon name="search" size={15} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search concepts, formulas, lessons..."
                className="topbar-search-field"
                value={topbarSearch}
                onChange={(e) => {
                  setTopbarSearch(e.target.value)
                  setIsSearchFocused(true)
                }}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (searchResults.lessons.length > 0) {
                      const first = searchResults.lessons[0]
                      setSelectedSubjectFromSearch(first.subject)
                      setSelectedLessonIdxFromSearch(first.lessonIdx)
                      setPage("subjects")
                      setIsSearchFocused(false)
                      setTopbarSearch("")
                    } else if (searchResults.subjects.length > 0) {
                      setSelectedSubjectFromSearch(searchResults.subjects[0])
                      setSelectedLessonIdxFromSearch(null)
                      setPage("subjects")
                      setIsSearchFocused(false)
                      setTopbarSearch("")
                    } else if (searchResults.sections.length > 0) {
                      setPage(searchResults.sections[0].id)
                      setIsSearchFocused(false)
                      setTopbarSearch("")
                    } else {
                      setPage("library")
                      setIsSearchFocused(false)
                    }
                  }
                  if (e.key === "Escape") {
                    setIsSearchFocused(false)
                  }
                }}
              />
              {topbarSearch ? (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setTopbarSearch("")
                    searchInputRef.current?.focus()
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              ) : (
                <kbd className="cmd-badge">⌘K</kbd>
              )}
            </div>

            {/* INTERACTIVE LIVE SEARCH RESULTS DROPDOWN */}
            {isSearchFocused && (
              <div className="search-dropdown-menu">
                {!topbarSearch.trim() ? (
                  /* Zero query discovery hints */
                  <div className="search-quick-hints">
                    <div className="search-group-title">
                      <span>QUICK JUMP & POPULAR TOPICS</span>
                      <small style={{ fontSize: "9px", color: "#8a869e", textTransform: "none" }}>Click to open</small>
                    </div>
                    <div className="search-suggestions-chips">
                      {[
                        "Quadratic Equations",
                        "Newton's Laws",
                        "Organic Chemistry",
                        "Photosynthesis",
                        "Trigonometry",
                        "Python Basics",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="search-chip"
                          onClick={() => setTopbarSearch(tag)}
                        >
                          🔍 {tag}
                        </button>
                      ))}
                    </div>

                    <div className="search-group-title" style={{ marginTop: "14px" }}>
                      <span>DIRECT ACTIONS & TOOLS</span>
                    </div>
                    <div className="search-actions-list">
                      <button
                        type="button"
                        className="search-result-item"
                        onClick={() => {
                          setDiagnosticOpen(true)
                          setIsSearchFocused(false)
                        }}
                      >
                        <span className="search-item-icon" style={{ background: "#f5f3ff", color: "#635bdb" }}>
                          🎯
                        </span>
                        <div className="search-item-info">
                          <strong>Baseline Diagnostic Assessment</strong>
                          <small>Recalibrate grade mastery and diagnose concept gaps</small>
                        </div>
                        <span className="search-item-badge">Assessment</span>
                      </button>

                      <button
                        type="button"
                        className="search-result-item"
                        onClick={() => {
                          setPage("challenge")
                          setIsSearchFocused(false)
                        }}
                      >
                        <span className="search-item-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
                          ⚡
                        </span>
                        <div className="search-item-info">
                          <strong>Daily Adaptive Challenge</strong>
                          <small>Rotational questions with instant feedback</small>
                        </div>
                        <span className="search-item-badge">Practice</span>
                      </button>

                      <button
                        type="button"
                        className="search-result-item"
                        onClick={() => {
                          setSelectedSubjectFromSearch(null)
                          setSelectedLessonIdxFromSearch(null)
                          setPage("subjects")
                          setIsSearchFocused(false)
                        }}
                      >
                        <span className="search-item-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                          📚
                        </span>
                        <div className="search-item-info">
                          <strong>Curriculum Subject Explorer</strong>
                          <small>Browse all Grade {profile.grade || "10"} subject modules</small>
                        </div>
                        <span className="search-item-badge">Curriculum</span>
                      </button>
                    </div>
                  </div>
                ) : searchResults.totalCount === 0 ? (
                  /* No results found */
                  <div className="search-no-results">
                    <span style={{ fontSize: "28px" }}>🔍</span>
                    <p>
                      No matches found for "<strong>{topbarSearch}</strong>"
                    </p>
                    <small>Try searching for "equations", "physics", "acids", "python", or "geometry"</small>
                  </div>
                ) : (
                  /* Filtered categorized results */
                  <div className="search-results-list">
                    {/* LESSONS */}
                    {searchResults.lessons.length > 0 && (
                      <div className="search-section">
                        <div className="search-group-title">
                          <span>📖 LESSON MODULES ({searchResults.lessons.length})</span>
                          <small style={{ fontSize: "9px", color: "#8a869e", textTransform: "none" }}>Instant module launch</small>
                        </div>
                        {searchResults.lessons.map((item, idx) => (
                          <button
                            key={item.subject + item.lesson.title + idx}
                            type="button"
                            className="search-result-item"
                            onClick={() => {
                              setSelectedSubjectFromSearch(item.subject)
                              setSelectedLessonIdxFromSearch(item.lessonIdx)
                              setPage("subjects")
                              setIsSearchFocused(false)
                              setTopbarSearch("")
                            }}
                          >
                            <span className="search-item-icon" style={{ background: "#f0edff", color: "#5548c8" }}>
                              {item.lesson.icon || "📖"}
                            </span>
                            <div className="search-item-info">
                              <strong>{item.lesson.title}</strong>
                              <small>
                                {item.subject} · {item.lesson.overview.slice(0, 65)}...
                              </small>
                            </div>
                            <span className="search-item-badge" style={{ background: "#f5f3ff", color: "#6c55e8" }}>
                              {item.subject}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* SUBJECTS */}
                    {searchResults.subjects.length > 0 && (
                      <div className="search-section">
                        <div className="search-group-title">
                          <span>📚 SUBJECTS ({searchResults.subjects.length})</span>
                        </div>
                        {searchResults.subjects.map((subj) => (
                          <button
                            key={subj}
                            type="button"
                            className="search-result-item"
                            onClick={() => {
                              setSelectedSubjectFromSearch(subj)
                              setSelectedLessonIdxFromSearch(null)
                              setPage("subjects")
                              setIsSearchFocused(false)
                              setTopbarSearch("")
                            }}
                          >
                            <span className="search-item-icon" style={{ background: "#fdf4ff", color: "#c026d3" }}>
                              {subjectEmoji[subj] || "📚"}
                            </span>
                            <div className="search-item-info">
                              <strong>{subj}</strong>
                              <small>{(subjectLessons[subj] || []).length} Lessons + Visual Graphs</small>
                            </div>
                            <span className="search-item-badge" style={{ background: "#fdf4ff", color: "#a21caf" }}>
                              Open Subject
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* PLATFORM TOOLS */}
                    {searchResults.sections.length > 0 && (
                      <div className="search-section">
                        <div className="search-group-title">
                          <span>⚡ PLATFORM TOOLS ({searchResults.sections.length})</span>
                        </div>
                        {searchResults.sections.map((sec) => (
                          <button
                            key={sec.id}
                            type="button"
                            className="search-result-item"
                            onClick={() => {
                              if (sec.id === "diagnostic") setDiagnosticOpen(true)
                              else setPage(sec.id)
                              setIsSearchFocused(false)
                              setTopbarSearch("")
                            }}
                          >
                            <span className="search-item-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                              <Icon name={sec.icon} size={16} />
                            </span>
                            <div className="search-item-info">
                              <strong>{sec.label}</strong>
                              <small>Adaptive cycle feature</small>
                            </div>
                            <span className="search-item-badge">Navigate →</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Gamified Streak & XP + Teacher Portal + Profile & Highlighted Logout */}
          <div className="topbar-right">
            {/* STREAK BADGE */}
            <div className="metric-badge streak-badge" title="Continuous active study streak">
              <div className="metric-icon-wrap streak-icon">
                <Icon name="flame" size={16} />
              </div>
              <div className="metric-text-wrap">
                <strong className="metric-val">{profile.streakDays} Days</strong>
                <span className="metric-lbl">Daily Streak</span>
              </div>
            </div>

            {/* XP BADGE */}
            <div className="metric-badge xp-badge" title="Mastery XP earned through questions and lessons">
              <div className="metric-icon-wrap xp-icon">
                <Icon name="trophy" size={15} />
              </div>
              <div className="metric-text-wrap">
                <strong className="metric-val">{profile.xp.toLocaleString()}</strong>
                <span className="metric-lbl">Mastery XP</span>
              </div>
            </div>

            {/* DEMO TEACHER PORTAL BUTTON */}
            <button
              type="button"
              className="topbar-teacher-btn"
              onClick={() => handleLogin({ name: "Prof Sharma", grade: "Faculty", isTeacher: true })}
              title="Access Demo Teacher Classroom Analytics & Student Gaps"
            >
              <span style={{ fontSize: "14px" }}>👨‍🏫</span>
              <span>Teacher Portal</span>
            </button>

            {/* STUDENT USER PROFILE CARD */}
            <div className="topbar-profile-card">
              <div className="topbar-avatar">{profile.avatar}</div>
              <div className="topbar-profile-info">
                <span className="profile-name">{profile.name}</span>
                <span className="profile-grade">{profile.grade}</span>
              </div>
            </div>

            {/* PROMINENTLY HIGHLIGHTED LOGOUT BUTTON */}
            <button
              type="button"
              className="topbar-logout-pill"
              onClick={handleLogout}
              title="Log Out of this session and Switch Account"
            >
              <Icon name="logout" size={13} />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="content">
          {/* TOP ADAPTIVE LEARNING CYCLE STEPPER */}
          <CycleStepper
            currentStage={page}
            onSelectStage={(stage) => {
              if (stage === "diagnostic") setDiagnosticOpen(true)
              else setPage(stage)
            }}
          />

          {page === "home" && (
            <DashboardView
              profile={profile}
              onStartDiagnostic={() => setDiagnosticOpen(true)}
              onNavigate={setPage}
              grade={currentUser?.grade || profile.grade || "Grade 10"}
            />
          )}

          {page === "analysis" && (
            <KnowledgeAnalysisView profile={profile} onNavigate={setPage} />
          )}

          {page === "path" && (
            <LearningPathView
              onNavigate={setPage}
              onRefreshProfile={refreshProfile}
            />
          )}

          {page === "challenge" && (
            <AdaptiveQuizView
              onFinish={refreshProfile}
              onNavigate={setPage}
              grade={currentUser?.grade || profile.grade || "Grade 10"}
            />
          )}

          {page === "recommendations" && (
            <UpdatedRecommendationsView
              profile={profile}
              onNavigate={setPage}
              onStartDiagnostic={() => setDiagnosticOpen(true)}
            />
          )}

          {page === "subjects" && (
            <SubjectModuleView
              grade={currentUser?.grade || profile.grade || "Grade 10"}
              onNavigate={setPage}
              initialSubject={selectedSubjectFromSearch}
              initialLessonIdx={selectedLessonIdxFromSearch}
            />
          )}

          {page === "tutor" && <CoachView profile={profile} />}

          {page === "library" && <LibraryView onNavigate={setPage} />}
        </div>
      </main>

      {/* DIAGNOSTIC MODAL */}
      {diagnosticOpen && (
        <DiagnosticModal
          onClose={() => setDiagnosticOpen(false)}
          onComplete={handleCompleteDiagnostic}
          grade={currentUser?.grade || profile.grade || "Grade 10"}
        />
      )}
    </div>
  )
}
