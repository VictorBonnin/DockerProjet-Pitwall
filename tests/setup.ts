process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/pitwall?schema=public"
process.env.REDIS_URL = "redis://localhost:6379"
// JOLPICA_BASE_URL and OPENF1_BASE_URL are intentionally omitted to cover the ?? fallback branches
