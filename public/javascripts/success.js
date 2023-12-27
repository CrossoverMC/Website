window.addEventListener("load", async () => {
    const infoElement = byId("info")

    for (let i = 5; i >= 1; i--) {
        infoElement.innerHTML = `Redirecting in ${i}...`
        await new Promise(r => setTimeout(r, 1000))
    }

    location.href = "/"
})