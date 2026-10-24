import { createRequire } from "node:module"
import path from "node:path"
import fs from "node:fs"

const require = createRequire(import.meta.url)

// Ensure data directory exists (support writable /tmp in serverless / Vercel environments)
const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION)
const DATA_DIR = isVercel ? path.resolve("/tmp") : path.resolve(process.cwd(), "server/data")
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  } catch {}
}

const DB_PATH = path.join(DATA_DIR, "learnova.db")

export interface IDatabase {
  run(sql: string, params?: any[]): any
  query(sql: string): {
    get(...args: any[]): any
    all(...args: any[]): any[]
  }
}

function createDatabase(): IDatabase {
  // 1. Try Bun SQLite
  try {
    if (typeof (globalThis as any).Bun !== "undefined") {
      const { Database } = require("bun:sqlite")
      const bunDb = new Database(DB_PATH, { create: true })
      try {
        bunDb.run("PRAGMA journal_mode = WAL;")
        bunDb.run("PRAGMA foreign_keys = ON;")
      } catch {}
      return {
        run(sql: string, params?: any[]) {
          return bunDb.run(sql, params)
        },
        query(sql: string) {
          const q = bunDb.query(sql)
          return {
            get(...args: any[]) {
              return q.get(...args)
            },
            all(...args: any[]) {
              return q.all(...args)
            },
          }
        },
      }
    }
  } catch {}

  // 2. Try Node native SQLite
  try {
    const { DatabaseSync } = require("node:sqlite")
    const targetPath = isVercel ? ":memory:" : DB_PATH
    const nodeDb = new DatabaseSync(targetPath)
    if (!isVercel) {
      try {
        nodeDb.exec("PRAGMA journal_mode = WAL;")
        nodeDb.exec("PRAGMA foreign_keys = ON;")
      } catch {}
    }
    return {
      run(sql: string, params?: any[]) {
        try {
          if (params && params.length > 0) {
            return nodeDb.prepare(sql).run(...params)
          }
          return nodeDb.exec(sql)
        } catch {
          return {}
        }
      },
      query(sql: string) {
        try {
          const stmt = nodeDb.prepare(sql)
          return {
            get(...args: any[]) {
              try {
                const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args
                return stmt.get(...params) ?? null
              } catch {
                return null
              }
            },
            all(...args: any[]) {
              try {
                const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args
                return stmt.all(...params)
              } catch {
                return []
              }
            },
          }
        } catch {
          return {
            get() { return null },
            all() { return [] },
          }
        }
      },
    }
  } catch {}

  // 3. Fallback dummy in case SQLite is not available
  console.warn("[Learnova DB] SQLite engine not available. Using fallback mock database.")
  return {
    run() { return {} },
    query() {
      return {
        get() { return null },
        all() { return [] },
      }
    },
  }
}

// Initialize database instance
export const db: IDatabase = createDatabase()

/**
 * Initialize all database tables and seed default data
 */
export function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
      name TEXT NOT NULL,
      grade TEXT NOT NULL DEFAULT 'Grade 10',
      email TEXT,
      avatar TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login_at TEXT
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      persona TEXT DEFAULT 'custom',
      overall_mastery INTEGER NOT NULL DEFAULT 65,
      recommended_level TEXT NOT NULL DEFAULT 'Developing',
      learning_velocity REAL NOT NULL DEFAULT 1.0,
      streak_days INTEGER NOT NULL DEFAULT 1,
      study_time_minutes INTEGER NOT NULL DEFAULT 42,
      xp INTEGER NOT NULL DEFAULT 1200,
      cycle_stage INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS concept_mastery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      concept_id TEXT NOT NULL,
      name TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT 'Mathematics',
      mastery INTEGER NOT NULL DEFAULT 50,
      status TEXT NOT NULL DEFAULT 'developing' CHECK(status IN ('mastered', 'developing', 'gap')),
      bloom_level TEXT NOT NULL DEFAULT 'Apply',
      confidence INTEGER NOT NULL DEFAULT 70,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, concept_id)
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS diagnostic_submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      gaps_json TEXT NOT NULL DEFAULT '[]',
      answers_json TEXT NOT NULL DEFAULT '[]',
      starting_level TEXT NOT NULL,
      ai_summary TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      grade TEXT NOT NULL DEFAULT 'Grade 10',
      subject TEXT NOT NULL DEFAULT 'Mathematics',
      question_id TEXT NOT NULL,
      selected_answer INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      time_spent_seconds INTEGER NOT NULL DEFAULT 15,
      difficulty TEXT NOT NULL DEFAULT 'Medium',
      xp_earned INTEGER NOT NULL DEFAULT 20,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS learning_path_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      unit_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      score INTEGER DEFAULT 0,
      completed_at TEXT,
      UNIQUE(user_id, unit_id)
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS tutor_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sender TEXT NOT NULL CHECK(sender IN ('user', 'tutor')),
      message TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'explanation',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL,
      title TEXT NOT NULL,
      details_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Check if default seed data exists, if not seed demo users
  seedDefaultData()
}

/**
 * Seed initial demo accounts (Teacher + Alex, Maya, Liam)
 */
function seedDefaultData() {
  const teacherCheck = db.query("SELECT id FROM users WHERE username = 'teacher'").get()
  if (!teacherCheck) {
    db.run(
      `INSERT INTO users (id, username, password, role, name, grade, email, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "usr_teacher_demo",
        "teacher",
        "teacher123",
        "teacher",
        "Dr. Sharma (Head of Pedagogy)",
        "Faculty / All Grades",
        "sharma@learnova.edu",
        "DS",
      ]
    )
  }

  // Demo Students
  const demoStudents = [
    {
      id: "usr_alex_demo",
      username: "alex",
      password: "alex123",
      name: "Alex Morgan",
      grade: "Grade 10",
      email: "alex@learnova.edu",
      avatar: "AM",
      persona: "alex",
      overallMastery: 72,
      recommendedLevel: "Proficient",
      velocity: 1.35,
      streak: 6,
      studyTime: 185,
      xp: 2450,
      stage: 3,
      concepts: [
        { id: "c1", name: "Quadratic Equations", subject: "Mathematics", mastery: 85, status: "mastered", bloom: "Evaluate", conf: 90 },
        { id: "c2", name: "Trigonometric Identities", subject: "Mathematics", mastery: 42, status: "gap", bloom: "Analyze", conf: 45 },
        { id: "c3", name: "Linear Inequalities", subject: "Mathematics", mastery: 78, status: "mastered", bloom: "Apply", conf: 82 },
        { id: "c4", name: "Coordinate Geometry", subject: "Mathematics", mastery: 64, status: "developing", bloom: "Understand", conf: 68 },
        { id: "c5", name: "Polynomial Theorems", subject: "Mathematics", mastery: 38, status: "gap", bloom: "Apply", conf: 40 },
        { id: "c6", name: "Arithmetic Progressions", subject: "Mathematics", mastery: 88, status: "mastered", bloom: "Evaluate", conf: 92 },
      ]
    },
    {
      id: "usr_maya_demo",
      username: "maya",
      password: "maya123",
      name: "Maya Patel",
      grade: "Grade 10",
      email: "maya@learnova.edu",
      avatar: "MP",
      persona: "maya",
      overallMastery: 48,
      recommendedLevel: "Foundation",
      velocity: 0.92,
      streak: 3,
      studyTime: 95,
      xp: 1100,
      stage: 1,
      concepts: [
        { id: "c1", name: "Quadratic Equations", subject: "Mathematics", mastery: 45, status: "gap", bloom: "Understand", conf: 40 },
        { id: "c2", name: "Trigonometric Identities", subject: "Mathematics", mastery: 30, status: "gap", bloom: "Remember", conf: 35 },
        { id: "c3", name: "Linear Inequalities", subject: "Mathematics", mastery: 52, status: "developing", bloom: "Understand", conf: 55 },
        { id: "c4", name: "Coordinate Geometry", subject: "Mathematics", mastery: 48, status: "gap", bloom: "Understand", conf: 45 },
        { id: "c5", name: "Polynomial Theorems", subject: "Mathematics", mastery: 62, status: "developing", bloom: "Apply", conf: 65 },
        { id: "c6", name: "Arithmetic Progressions", subject: "Mathematics", mastery: 50, status: "developing", bloom: "Understand", conf: 50 },
      ]
    },
    {
      id: "usr_liam_demo",
      username: "liam",
      password: "liam123",
      name: "Liam Chen",
      grade: "Grade 10",
      email: "liam@learnova.edu",
      avatar: "LC",
      persona: "liam",
      overallMastery: 91,
      recommendedLevel: "Mastery",
      velocity: 1.85,
      streak: 14,
      studyTime: 320,
      xp: 4620,
      stage: 5,
      concepts: [
        { id: "c1", name: "Quadratic Equations", subject: "Mathematics", mastery: 95, status: "mastered", bloom: "Create", conf: 98 },
        { id: "c2", name: "Trigonometric Identities", subject: "Mathematics", mastery: 88, status: "mastered", bloom: "Evaluate", conf: 92 },
        { id: "c3", name: "Linear Inequalities", subject: "Mathematics", mastery: 92, status: "mastered", bloom: "Evaluate", conf: 95 },
        { id: "c4", name: "Coordinate Geometry", subject: "Mathematics", mastery: 86, status: "mastered", bloom: "Analyze", conf: 88 },
        { id: "c5", name: "Polynomial Theorems", subject: "Mathematics", mastery: 90, status: "mastered", bloom: "Evaluate", conf: 94 },
        { id: "c6", name: "Arithmetic Progressions", subject: "Mathematics", mastery: 96, status: "mastered", bloom: "Create", conf: 99 },
      ]
    }
  ]

  for (const s of demoStudents) {
    const studentCheck = db.query("SELECT id FROM users WHERE username = ?").get(s.username)
    if (!studentCheck) {
      db.run(
        `INSERT INTO users (id, username, password, role, name, grade, email, avatar)
         VALUES (?, ?, ?, 'student', ?, ?, ?, ?)`,
        [s.id, s.username, s.password, s.name, s.grade, s.email, s.avatar]
      )

      db.run(
        `INSERT INTO student_profiles (user_id, persona, overall_mastery, recommended_level, learning_velocity, streak_days, study_time_minutes, xp, cycle_stage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.persona, s.overallMastery, s.recommendedLevel, s.velocity, s.streak, s.studyTime, s.xp, s.stage]
      )

      for (const c of s.concepts) {
        db.run(
          `INSERT OR REPLACE INTO concept_mastery (user_id, concept_id, name, subject, mastery, status, bloom_level, confidence)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, c.id, c.name, c.subject, c.mastery, c.status, c.bloom, c.conf]
        )
      }

      // Seed sample quiz attempts
      db.run(
        `INSERT INTO quiz_attempts (id, user_id, grade, subject, question_id, selected_answer, is_correct, time_spent_seconds, difficulty, xp_earned)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`qa_${s.username}_1`, s.id, s.grade, "Mathematics", "q1", 0, 1, 12, "Medium", 30]
      )
    }
  }
}

// Auto-initialize when module is loaded
try {
  initDatabase()
} catch (err) {
  console.warn("[Learnova DB] initDatabase warning:", err)
}
