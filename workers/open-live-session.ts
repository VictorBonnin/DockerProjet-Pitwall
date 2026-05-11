import { prisma } from "@/lib/db/prisma"
import {
  openLiveSession,
  parseLiveOpenArgs,
} from "@/lib/services/live-session-control.service"

function log(message: string) {
  console.log(`[live:open] ${message}`)
}

async function main() {
  const options = parseLiveOpenArgs(process.argv.slice(2))
  const liveSession = await openLiveSession(options)

  log(`LiveSession ${liveSession.id} is ${liveSession.status}`)
  log(`sessionId=${liveSession.sessionId}`)
  log(`providerSessionKey=${liveSession.providerSessionKey}`)
  log(`frequency=${liveSession.ingestFrequencyMs}ms`)
  log("next: npm run worker:sync-live")
}

main()
  .catch((error) => {
    console.error("[live:open] failed", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
