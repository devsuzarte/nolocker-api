import "dotenv/config"
import { FastifyReply, FastifyRequest } from "fastify";
import { MultipartFile } from "@fastify/multipart";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs"

import app from "./app";

// Constraints
const STORAGE_PATH = path.join(__dirname, "..", "cache")

// Routes
app.post("/unlock", UnlockController)

interface UnlockInput {
    file: MultipartFile | undefined,
    password: string
}

// Controllers
async function UnlockController(request: FastifyRequest, reply: FastifyReply) {
    try {

        const parts = request.parts()

        const unclockInput: UnlockInput = { file: undefined, password: "" }

        for await (const part of parts) {
            if(part.type === "file" && part.fieldname === 'file') {
                unclockInput.file = part
            } else if(part.type === "field" && part.fieldname === 'password') {
                unclockInput.password = part.value as string
            }
        }

        if(!unclockInput.file || !unclockInput.password) {
            return reply.status(400).send({ message: "There is empty fields." })
        }

        if (!unclockInput.file.filename.endsWith(".pdf")) {
            return reply.status(400).send({ error: "The must be a pdf!" });
        }
        
        const { status, message, body } = await UnlockUseCase(unclockInput);

        if(status !== 200) {
            return reply.status(status).send({ message, body })
        }

        return reply
            .status(status)
            .header("content-type", "application/pdf")
            .header("content-disposition", `attachment; filename="${Date.now()}.pdf"`)
            .send(body)

    } catch (error) {
        return reply.send(500).send({ message: "Internal server error." })
    }
}

interface AppResponse {
    status: number
    message: string
    body?: unknown
}

// Use Cases
async function UnlockUseCase(unlockInfos: UnlockInput): Promise<AppResponse> {

    const { file, password } = unlockInfos

    const lockedFileName = `Locked_${Date.now()}_${file?.filename}`
    const unlockedFileName = `Unlocked_${Date.now()}_${file?.filename}`

    const lockedFilePath = path.join(STORAGE_PATH, lockedFileName);
    const unlockedFilePath = path.join(STORAGE_PATH, unlockedFileName);

    try {

        const execAsync = promisify(exec);
        const pump = promisify(require("stream").pipeline);

        await pump(file?.file, fs.createWriteStream(lockedFilePath))
        await execAsync(`qpdf --password=${password} --decrypt "${lockedFilePath}" "${unlockedFilePath}"`)

        return {
            status: 200,
            message: "File has been unlocked successfully!",
            body: fs.createReadStream(unlockedFilePath)
        }
        
    } 
    
    catch (error) {
        app.log.error(error)
        console.log(error)
        return {
            status: 400,
            message: "An error has occurred while trying to unlock the PDF!"
        }
    }
}

// Main
async function main() {
    try {

        await app.listen({ port: Number(process.env.PORT), host: "0.0.0.0" })

        console.log("Server is running...");

    } catch (error) {
        app.log.error(error)
        console.log(error)
        process.exit(1)
    }
}

main()