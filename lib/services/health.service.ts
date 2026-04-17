type HealthDependencies = {
  checkDatabase?: () => Promise<boolean>
  checkRedis?: () => Promise<boolean>
}

export async function buildHealthSnapshot({
  checkDatabase = async () => false,
  checkRedis = async () => false,
}: HealthDependencies = {}) {
  const [databaseOk, redisOk] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ])

  return {
    status: databaseOk && redisOk ? "ok" : "degraded",
    services: {
      database: databaseOk ? "up" : "down",
      redis: redisOk ? "up" : "down",
    },
    timestamp: new Date().toISOString(),
  }
}
