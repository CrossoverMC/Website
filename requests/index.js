import express from "express"
import { write } from "../server/writer.js"
import ordersRouter from "./orders.js"

const router = express.Router()

router.get("/minecraft-uuid/:username", async (req, res) => {
    const { username } = req.params

    const { id } = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`).then(res => res.json())

    if (id == null) {
        res.status(404).json({ error: "Failed to find Minecraft user." })
        return
    }

    res.status(200).json({ uuid: id })
})

router.use("/orders", ordersRouter)

export default router