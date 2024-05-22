import 'dotenv/config'
import cors from '@fastify/cors'
import Fastify, { type FastifyInstance } from 'fastify'
import diaryRoutes from './routes/diaryEntries'
import habitRoutes from './routes/habits'
import locationsRoutes from './routes/locations'
import weatherRoutes from './routes/weather'

const fastify = Fastify({
  logger: true,
})

type RouteRegister = (fastify: FastifyInstance) => void

export class Server {
  routes: RouteRegister[] = [
    locationsRoutes,
    diaryRoutes,
    habitRoutes,
    weatherRoutes,
  ]

  public async listen() {
    await fastify.register(cors, {
      origin: (origin, cb) => {
        if (!origin) {
          cb(null, true)
          return
        }
        const hostname = new URL(origin ?? '').hostname
        if (hostname === 'localhost') {
          //  Request from localhost will pass
          cb(null, true)
          return
        }
        // Generate an error on other origins, disabling access
        cb(new Error('Not allowed'), false)
      },
    })

    for (const route of this.routes) {
      route(fastify)
    }

    fastify.listen({ host: '0.0.0.0', port: 3010 }, async (err) => {
      if (err) {
        fastify.log.error(err)
        process.exit(1)
      }
      console.log('Server listening on port 3010')
    })
  }
}

new Server().listen()
