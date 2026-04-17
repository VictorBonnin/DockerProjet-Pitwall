import { prisma } from "@/lib/db/prisma"

async function main() {
  console.log("[consolidate-session] bootstrap worker ready")
  await prisma.$queryRaw`SELECT 1`
  console.log("[consolidate-session] database connection ok")
}

main()
  .catch((error) => {
    console.error("[consolidate-session] failed", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
