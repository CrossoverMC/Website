import fs from "fs"

const delay = millis => new Promise(r => setTimeout(r, millis))
const toWrite = []

export function write(data) {
    toWrite.push(data)
}

function attemptWrite() {
    let data = toWrite.join("\n")
    if (toWrite.length > 0) data += "\n"

    try {
        const fileDescriptor = fs.openSync("C:/Users/Zippy/Desktop/js-to-java.txt", "a")
        fs.writeFileSync(fileDescriptor, data)
        fs.closeSync(fileDescriptor) // release lock
        toWrite.length = 0
    } catch (err) {
        console.error(err)
    }
}

setTimeout(async () => {
    while (true) {
        attemptWrite()
        await delay(1000)
    }
})