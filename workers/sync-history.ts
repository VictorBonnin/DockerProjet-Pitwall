import { prisma } from "@/lib/db/prisma"
import { syncHistoricalSeason } from "@/lib/services/history-sync.service"

function resolveYear() {
  const argIndex = process.argv.findIndex((arg) => arg === "--year")
  const value = argIndex >= 0 ? process.argv[argIndex + 1] : undefined
  const parsed = value ? Number(value) : new Date().getUTCFullYear()

  if (!Number.isInteger(parsed) || parsed < 1950 || parsed > 2100) {
    throw new Error("Invalid year argument")
  }

  return parsed
}

async function main() {
  const year = resolveYear()
  console.log(`[sync-history] start year=${year}`)
  const result = await syncHistoricalSeason(year)
  console.log("[sync-history] done")
  console.log(JSON.stringify(result))
}

main()
  .catch((error) => {
    console.error("[sync-history] failed", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
