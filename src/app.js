import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import errorHandler from "./middlewares/errors.middleware.js"

const app = express()
  
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit: "16mb" }))
app.use(express.urlencoded({extended:true, limit:"20kb"}))
app.use(express.static("public"))
app.use(cookieParser())


import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import recommendationRouter from "./routes/recommendations.routes.js"
import healthRouter from "./routes/health.routes.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/recommend",recommendationRouter)
app.use("/api/v1/health", healthRouter)

app.use(errorHandler);


export { app }