import express from "express"
import cors from "cors"
import apiRouter from "./routes/api"

const app = express()
const PORT = process.env.API_PORT || 3001

app.use(cors())
app.use(express.json())

// Mount API router (both with and without /api prefix for flexibility)
app.use("/api", apiRouter)
app.use(apiRouter)

// Root route
app.get("/", (_req, res) => {
  res.json({
    name: "Learnova Adaptive AI Platform Backend",
    endpoints: [
      "/api/health",
      "/api/profile",
      "/api/profile/persona",
      "/api/diagnostic/questions",
      "/api/diagnostic/submit",
      "/api/knowledge-graph",
      "/api/learning-path",
      "/api/learning-path/complete-unit",
      "/api/adaptive-quiz/start",
      "/api/adaptive-quiz/submit",
      "/api/tutor/chat",
      "/api/analytics",
    ],
  })
})

// Only start standalone server when run directly (not in Vercel Serverless)
if (!process.env.VERCEL && !process.env.NOW_REGION) {
  app.listen(PORT, () => {
    console.log(`[Learnova Backend] API server running on port ${PORT}`)
  })
}

export default app
