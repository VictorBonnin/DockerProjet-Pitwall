import assert from "node:assert/strict"

export async function runEnvTests() {
  const { parseEnv } = await import("@/lib/env")
  const parsed = parseEnv({
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/pitwall",
    REDIS_URL: "redis://localhost:6379",
  })

  assert.match(parsed.DATABASE_URL, /^postgresql:\/\//)
  assert.equal(parsed.REDIS_URL, "redis://localhost:6379")

  assert.throws(() =>
    parseEnv({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/pitwall",
    }),
  )
}
