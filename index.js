import express from "express"
import fs from "fs"
import https from "https"
import renderRouter from "./render/index.js"
import requestsRouter from "./requests/index.js"

const PORT = 90
const app = express()

app.set("views", "views")
app.set("view engine", "pug")

app.use(express.static("public"))
app.use(express.json())
// app.use(cookieParser())

app.use("/", renderRouter)
app.use("/requests", requestsRouter)

const options = { // certificate includes both domains
    key: fs.readFileSync("/etc/letsencrypt/live/opawards.treverton.co.za/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/opawards.treverton.co.za/fullchain.pem")
}

https.createServer(options, app).listen(PORT, () => {
    console.info("Server started at port " + PORT)
})