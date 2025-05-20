import fastifyMultipart from "@fastify/multipart"
import Fastify from "fastify"

const app = Fastify({ logger: true })

// Configs
app.register(fastifyMultipart)

export default app