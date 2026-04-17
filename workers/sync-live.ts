import { prisma } from "@/lib/db/prisma"
import { getCurrentLiveSession } from "@/lib/services/live-query.service"

async function main() {
  console.log("[sync-live] bootstrap worker ready")
  const current = await getCurrentLiveSession()

  if (!current) {
    console.log("[sync-live] no open live session")
  } else {
    console.log("[sync-live] live session found")
  }
}

main()
  .catch((error) => {
    console.error("[sync-live] failed", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
