import express from "express"
import config from "../config.json" assert {type: "json"}

const { PAYPAL_CLIENT_ID } = config

const router = express.Router()

router.get("/", (req, res) => {
    res.render("home")
})

router.get("/coins", (req, res) => {
    res.render("coins", {
        paypalClientId: PAYPAL_CLIENT_ID
    })
})

router.get("/success", (req, res) => {
    res.render("success")
})

export default router