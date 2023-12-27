import fs from "fs"

const delay = millis => new Promise(r => setTimeout(r, millis))

async function readLines() {
    let lines = []

    try {
        const fileDescriptor = fs.openSync("C:/Users/Zippy/Desktop/java-to-js.txt", "r+")
        const buffer = fs.readFileSync(fileDescriptor)
        const bufferContent = buffer.toString("utf-8")
        lines = bufferContent.split("\n").filter(line => line.trim() !== "")

        fs.ftruncateSync(fileDescriptor, 0)
        fs.closeSync(fileDescriptor) // release lock
    } catch (err) {
        console.error(err)
    }

    return lines
}

function handleLine(line) {
    console.log("Read line: " + line)
}

while (true) {
    console.log("reading")
    const lines = await readLines()
    console.log("read")

    for (let line of lines) {
        handleLine(line)
    }

    await delay(1000)
}