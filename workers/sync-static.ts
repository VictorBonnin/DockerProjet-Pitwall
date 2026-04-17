import { prisma } from "@/lib/db/prisma"
import { syncHistoricalSeason } from "@/lib/services/history-sync.service"

async function main() {
  const year = new Date().getUTCFullYear()
  console.log(`[sync-static] start year=${year}`)
  const result = await syncHistoricalSeason(year)
  console.log("[sync-static] done")
  console.log(JSON.stringify(result))
}

main()
  .catch((error) => {
    console.error("[sync-static] failed", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
