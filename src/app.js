import expess from "express"
import cookieParser from "cookie-parser"
import cors from "cors"


const app = expess()


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(expess.json({limit: "20kb" }))
app.use(express.urlencoded({extended:true, limit:"20kb"}))
app.use(expess.static("public"))
app.use(cookieParser())
export { app }