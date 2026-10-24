import type { Plugin } from "vite"

export function adaptiveApiPlugin(): Plugin {
  return {
    name: "adaptive-api-middleware",
    async configureServer(server) {
      const express = (await import("express")).default
      const cors = (await import("cors")).default
      const apiRouter = (await import("./routes/api")).default
      const app = express()
      app.use(cors())
      app.use(express.json())
      app.use("/api", apiRouter)
      server.middlewares.use(app)
    },
  }
}
