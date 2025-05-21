"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const app_1 = __importDefault(require("./app"));
// Constraints
const STORAGE_PATH = path_1.default.join(__dirname, "..", "cache");
// Routes
app_1.default.post("/unlock", UnlockController);
// Controllers
async function UnlockController(request, reply) {
    try {
        const parts = request.parts();
        const unclockInput = { file: undefined, password: "" };
        for await (const part of parts) {
            if (part.type === "file" && part.fieldname === 'file') {
                unclockInput.file = part;
            }
            else if (part.type === "field" && part.fieldname === 'password') {
                unclockInput.password = part.value;
            }
        }
        if (!unclockInput.file || !unclockInput.password) {
            return reply.status(400).send({ message: "There is empty fields." });
        }
        if (!unclockInput.file.filename.endsWith(".pdf")) {
            return reply.status(400).send({ error: "The must be a pdf!" });
        }
        const { status, message, body } = await UnlockUseCase(unclockInput);
        if (status !== 200) {
            return reply.status(status).send({ message, body });
        }
        // fs.unlink(lockedFilePath, () => {})
        // fs.unlink(unlockedFilePath, () => {})
        return reply
            .status(status)
            .header("content-type", "application/pdf")
            .header("content-disposition", `attachment; filename="${Date.now()}.pdf"`)
            .send(body);
    }
    catch (error) {
        return reply.send(500).send({ message: "Internal server error." });
    }
}
// Use Cases
async function UnlockUseCase(unlockInfos) {
    const { file, password } = unlockInfos;
    const lockedFileName = `Locked_${Date.now()}_${file?.filename}`;
    const unlockedFileName = `Unlocked_${Date.now()}_${file?.filename}`;
    const lockedFilePath = path_1.default.join(STORAGE_PATH, lockedFileName);
    const unlockedFilePath = path_1.default.join(STORAGE_PATH, unlockedFileName);
    try {
        const execAsync = (0, util_1.promisify)(child_process_1.exec);
        const pump = (0, util_1.promisify)(require("stream").pipeline);
        await pump(file?.file, fs_1.default.createWriteStream(lockedFilePath));
        await execAsync(`qpdf --password=${password} --decrypt "${lockedFilePath}" "${unlockedFilePath}"`);
        return {
            status: 200,
            message: "File has been unlocked successfully!",
            body: fs_1.default.createReadStream(unlockedFilePath)
        };
    }
    catch (error) {
        return {
            status: 400,
            message: "An error has occurred while trying to unlock the PDF!"
        };
    }
}
// Main
async function main() {
    try {
        await app_1.default.listen({ port: Number(process.env.PORT) });
        console.log("Server is running...");
    }
    catch (error) {
        app_1.default.log.error(error);
    }
}
main();
