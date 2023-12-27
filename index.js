import express from "express"
import renderRouter from "./render/index.js"
import requestsRouter from "./requests/index.js"

const PORT = 80
const app = express()

app.set("views", "views")
app.set("view engine", "pug")

app.use(express.static("public"))
app.use(express.json())
// app.use(cookieParser())

app.use("/", renderRouter)
app.use("/requests", requestsRouter)

app.listen(PORT, () => {
    console.info("Express server listening on port " + PORT)
})