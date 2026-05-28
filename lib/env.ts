import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JOLPICA_BASE_URL: z.string().url().optional(),
  OPENF1_BASE_URL: z.string().url().optional(),
  OPENF1_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
})

export function parseEnv(input: NodeJS.ProcessEnv) {
  return envSchema.parse(input)
}

let cachedEnv: ReturnType<typeof parseEnv> | null = null

export function getEnv() {
  cachedEnv ??= parseEnv(process.env)
  return cachedEnv
}
