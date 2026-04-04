import { httpRouter } from "convex/server"
import { authComponent, createAuth } from "./auth"

const http = httpRouter()

// Register all Better Auth routes with CORS support
authComponent.registerRoutes(http, createAuth, { cors: true })

export default http
