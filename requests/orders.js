import express from "express"
import { write } from "../server/writer.js"
import config from "../config.json" assert {type: "json"}

const router = express.Router()

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = config
const base = "https://api-m.sandbox.paypal.com"

async function generateAccessToken() {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            throw new Error("Missing API credentials")
        }

        const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET).toString("base64")
        const response = await fetch(`${base}/v1/oauth2/token`, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
                Authorization: `Basic ${auth}`,
            }
        })

        const data = await response.json()
        return data.access_token
    } catch (error) {
        console.error("Failed to generate Access Token:", error)
    }
}

const coinPackages = {
    0: {
        amount: 10,
        price: 1.0
    },
    1: {
        amount: 20,
        price: 2.0
    },
    2: {
        amount: 50,
        price: 5.0
    },
    3: {
        amount: 100,
        price: 10.0
    }
}

function isValidProductId(id) {
    for (let key of Object.keys(coinPackages)) {
        if (parseInt(key) === id) return true
    }

    return false
}

async function createOrder(productId) {
    const { amount: totalCoins, price: totalPrice } = coinPackages[productId]

    const purchaseUnits = [
        {
            custom_id: productId,
            amount: {
                currency_code: "USD",
                value: totalPrice,
                breakdown: {
                    item_total: {
                        currency_code: "USD",
                        value: totalPrice
                    }
                }
            },
            items: [
                {
                    name: `Coins - ${totalCoins} Pack`,
                    quantity: 1,
                    category: "DIGITAL_GOODS",
                    unit_amount: {
                        currency_code: "USD",
                        value: totalPrice
                    }
                }
            ]
        }
    ]

    const accessToken = await generateAccessToken()
    const response = await fetch(`${base}/v2/checkout/orders`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
            // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
            // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
        method: "POST",
        body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: purchaseUnits
        })
    })

    return handleResponse(response)
}

/**
* Capture payment for the created order to complete the transaction.
* @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
*/
async function captureOrder(orderId) {
    const accessToken = await generateAccessToken()
    const url = `${base}/v2/checkout/orders/${orderId}/capture`

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
            // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
            // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        }
    })

    return handleResponse(response)
}

async function handleResponse(response) {
    try {
        const jsonResponse = await response.json()

        return {
            jsonResponse,
            httpStatusCode: response.status,
        }
    } catch (err) {
        const errorMessage = await response.text()
        throw new Error(errorMessage)
    }
}

function handlePurchasedItem(productId, minecraftUuid) {
    const { amount, price } = coinPackages[productId]
    write(`add_coins ${minecraftUuid} ${amount}`)
    write(`add_purchase ${price}`)
}

function shortToLongUuid(shortUuid) {
    return `${shortUuid.slice(0, 8)}-${shortUuid.slice(8, 12)}-${shortUuid.slice(12, 16)}-${shortUuid.slice(16, 20)}-${shortUuid.slice(20)}`
}

router.post("/", async (req, res) => {
    const { productId } = req.body

    if (!isValidProductId(productId)) {
        res.status(400).json({ error: "Invalid product ID." })
        return
    }

    try {
        const { jsonResponse, httpStatusCode } = await createOrder(productId)
        res.status(httpStatusCode).json(jsonResponse)
    } catch (error) {
        console.error("Failed to create order:", error)
        res.status(500).json({ error: "Failed to create order." })
    }
})

router.post("/:orderId/capture", async (req, res) => {
    const { body, params } = req
    const { username } = body
    const { orderId } = params

    const { id: shortUuid } = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`).then(res => res.json())

    if (!shortUuid) {
        res.status(404).json({ error: "Failed to find Minecraft user." })
        return
    }

    const minecraftUuid = shortToLongUuid(shortUuid)
    let productId

    try {
        const accessToken = await generateAccessToken()
        const { purchase_units } = await fetch(base + `/v2/checkout/orders/${orderId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            }
        }).then(res => res.json())

        productId = purchase_units[0].custom_id
    } catch (err) {
        console.error("Failed to get order uitems:", err)
        res.status(500).json({ error: "Could not get order items." })
        return
    }
    try {
        const { jsonResponse, httpStatusCode } = await captureOrder(orderId)
        const { status } = jsonResponse

        if (status === "COMPLETED") {
            handlePurchasedItem(productId, minecraftUuid)
        }

        res.status(httpStatusCode).json(jsonResponse)
    } catch (err) {
        console.error("Failed to create order:", err)
        res.status(500).json({ error: "Failed to capture order." })
    }
})

export default router