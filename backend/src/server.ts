import cors from '@fastify/cors'
import Fastify from 'fastify'

const fastify = Fastify({
  logger: true,
})

export class Server {
  public async listen() {
    await fastify.register(cors, {
      origin: (origin, cb) => {
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
    fastify.get('/locations/heatmap', async (request, reply) => {
      const {
        topLeftLat,
        topLeftLng,
        topRightLat,
        topRightLng,
        bottomRightLat,
        bottomRightLng,
        bottomLeftLat,
        bottomLeftLng,
      } = request.query as {
        topLeftLat: number
        topLeftLng: number
        topRightLat: number
        topRightLng: number
        bottomRightLat: number
        bottomRightLng: number
        bottomLeftLat: number
        bottomLeftLng: number
      }
      reply.send({ aha: 'a' })
    })

    fastify.listen({ host: '0.0.0.0', port: 3000 }, async (err) => {
      if (err) {
        fastify.log.error(err)
        process.exit(1)
      }
      console.log('Server listening on port 3000')
    })
  }
}

new Server().listen()
