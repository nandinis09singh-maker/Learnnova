# Learnova — Adaptive AI Learning Platform

Learnova is a next-generation adaptive education platform with a built-in AI study coach, live gap analysis radar, curriculum-aligned question banks (Grades 8–12), teacher portal, and persistent SQLite 3 database.

---

## Features
- **Adaptive Diagnostic Assessment**: Calibrates baseline ability across Bloom's Taxonomy.
- **Dynamic Knowledge Gap Radar**: Identifies concept blockers, prerequisites, and learning velocity.
- **Gamified Learning Path**: Personalized remedial and advancement units.
- **Adaptive Practice Quiz**: Real-time CAT (Computerized Adaptive Testing) adjusting question difficulty.
- **Nova AI Study Coach**: Step-by-step problem solver with multi-grade curriculum intelligence.
- **Curriculum Coverage**: Grade 8 through Grade 12 (Maths, Physics, Chemistry, Biology, IT, English, Hindi, Marathi, Social Science).
- **Educator / Teacher Portal**: Live student monitoring, gap heatmaps, and classroom intervention flags.
- **Persistent SQLite Database**: High-speed WAL mode database at `server/data/learnova.db` with ACID guarantees.

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) (v1.1+) OR [Node.js](https://nodejs.org) (v18+)

### Installation & Run

1. **Install dependencies**:
   ```bash
   bun install
   ```
   *(or `npm install`)*

2. **Start the Development Server**:
   ```bash
   bun run dev
   ```
   *(or `npm run dev`)*

3. **Open in Browser**:
   ```
   http://localhost:8443
   ```

---

## Demo Accounts (Pre-configured in SQLite)

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Educator / Teacher** | `teacher` | `teacher123` | Inspect live student rosters and classroom gap analytics |
| **Student** | `alex` | `alex123` | Grade 10 student (Alex Morgan) |
| **Student** | `maya` | `maya123` | Grade 10 student (Maya Patel) |
| **Student** | `liam` | `liam123` | Grade 11 student (Liam Chen) |

*You can also click **Create your learner account** on the login screen to register a new student with your own credentials.*

---

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide/Custom Icons
- **Backend**: Express 5, Vite Middleware Plugin, Bun Native Engine
- **Database**: SQLite 3 with Write-Ahead Logging (WAL)
