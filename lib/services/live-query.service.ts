import { prisma } from "@/lib/db/prisma"

type LiveSessionReader = {
  findCurrentLiveSession?: () => Promise<unknown>
}

export async function getCurrentLiveSession(
  reader: LiveSessionReader = {},
) {
  if (reader.findCurrentLiveSession) {
    return reader.findCurrentLiveSession()
  }

  return prisma.liveSession.findFirst({
    where: {
      status: "OPEN",
    },
    include: {
      session: {
        include: {
          raceWeekend: true,
        },
      },
    },
    orderBy: {
      openedAt: "desc",
    },
  })
}
