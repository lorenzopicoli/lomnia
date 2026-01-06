import "dotenv/config";
import cors from "@fastify/cors";
import {
  type CreateFastifyContextOptions,
  type FastifyTRPCPluginOptions,
  fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { EnvVar, getEnvVarOrDefault } from "./helpers/envVars";
import { type AppRouter, appRouter } from "./routes/router";

export function createContext({ req, res }: CreateFastifyContextOptions) {
  const user = { name: req.headers.username ?? "anonymous" };
  return { req, res, user };
}
export type Context = Awaited<ReturnType<typeof createContext>>;

const fastify = Fastify({
  logger: false,
  maxParamLength: 5000,
});

export class Server {
  public async listen() {
    const allowedOrigins = this.getCorsOrigins();
    await fastify.register(cors, {
      origin: (origin, cb) => {
        if (!origin) {
          cb(null, true);
          return;
        }
        if (allowedOrigins === "*" || allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          cb(new Error("CORS not allowed"), false);
        }
      },
    });

    fastify.register(fastifyTRPCPlugin, {
      prefix: "/trpc",
      trpcOptions: {
        router: appRouter,
        createContext,
        onError({ path, error }) {
          console.error(`Error in tRPC handler on path '${path}':`, error);
        },
      } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
    });

    fastify.listen({ host: "0.0.0.0", port: 3010 }, async (err) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
      console.log("Server listening on port 3010");
    });
  }

  private getCorsOrigins() {
    const raw = getEnvVarOrDefault(EnvVar.CORS_ORIGINS, "*");

    if (!raw || raw === "*") {
      return "*";
    }

    return raw
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }
}

new Server().listen();
