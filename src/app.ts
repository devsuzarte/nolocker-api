import fastifyMultipart from "@fastify/multipart"
import Fastify from "fastify"
import cors from "@fastify/cors"

const app = Fastify({ logger: true })

// Configs
app.register(fastifyMultipart)
app.register(
    cors,
    {
        origin: [
            "https://nolocker-web-git-main-devsuzartes-projects.vercel.app",
            "https://nolocker-web-devsuzartes-projects.vercel.app",
            "https://nolocker-web.vercel.app"
        ],
        methods: ['POST']
    }
)

export default app