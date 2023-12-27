let minecraftUsername
let productId

const coinPackages = {
    0: 10,
    1: 20,
    2: 50,
    3: 100
}

function setInfo(text) {
    const e = byId("info-element")
    e.innerHTML = text
    setVisible(e, text != null)
}

function setView(id) {
    const viewsContainer = byId("views")

    for (let view of viewsContainer.children) {
        setVisible(view, view.getAttribute("data-view") == id)
    }
}

setView(0)

window.addEventListener("load", () => {
    const submitUsernameButton = byId("submit-username")
    submitUsernameButton.addEventListener("click", async () => {
        setVisible(submitUsernameButton, false)
        setInfo("Please wait...")

        const username = byId("username-input").value
        console.log(username)

        const { uuid } = await getRequest(`/minecraft-uuid/${username}`)

        if (uuid) {
            minecraftUsername = username
            byId("profile-picture").src = `https://api.mineatar.io/face/${uuid}?scale=8`
            setView(1)
            setInfo(null)
        } else {
            setVisible(submitUsernameButton)
            setInfo("That Minecraft account could not found.")
        }
    })
})

function productSelected(pId) {
    productId = pId
    byId("product-info").innerHTML = `${coinPackages[pId]} Coins for $${0.1 * coinPackages[pId]}`
    setView(2)
}

function onPaypalLoad() {
    window.paypal.Buttons({
        async createOrder() {
            try {
                const orderData = await postRequest("/orders", { productId })

                const { id, details } = orderData
                if (id) return id

                const errorDetail = details?.[0]
                const errorMessage = errorDetail ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                    : JSON.stringify(orderData)

                throw new Error(errorMessage)
            } catch (error) {
                console.error(error)
                setInfo(`Could not initiate PayPal Checkout...<br><br>${error}`)
            }
        },
        async onApprove(data, actions) {
            try {
                const orderData = await postRequest(`/orders/${data.orderID}/capture`, { username: minecraftUsername })

                // Three cases to handle:
                //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                //   (2) Other non-recoverable errors -> Show a failure message
                //   (3) Successful transaction -> Show confirmation or thank you message

                const errorDetail = orderData?.details?.[0]
                console.log(orderData)

                if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                    // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                    // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
                    setInfo("Payment declined.")
                    return actions.restart()
                } else if (errorDetail) {
                    // (2) Other non-recoverable errors -> Show a failure message
                    throw new Error(`${errorDetail.description} (${orderData.debug_id})`)
                } else if (!orderData.purchase_units) {
                    throw new Error(JSON.stringify(orderData))
                } else {
                    // (3) Successful transaction -> Show confirmation or thank you message
                    // Or go to another URL:  actions.redirect('thank_you.html')
                    setInfo("Please wait...")
                    location.href = "/success"
                }
            } catch (error) {
                console.error(error)
                setInfo(`Sorry, your transaction could not be processed...<br><br>${error}`)
            }
        }
    }).render("#paypal-button-container")
}