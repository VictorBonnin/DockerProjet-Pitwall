import { prisma } from "@/lib/db/prisma"
import { getQualifyingResults, getRaceResults, getSprintResults } from "@/lib/providers/jolpica"

async function findWeekend(year: number, round: number) {
  return prisma.raceWeekend.findFirst({
    where: {
      round,
      season: {
        year,
      },
    },
    include: {
      sessions: true,
      circuit: true,
    },
  })
}

export async function getRaceResultsForRound(year: number, round: number) {
  const weekend = await findWeekend(year, round)
  const raceSession = weekend?.sessions.find((session) => session.type === "RACE")

  if (weekend && raceSession) {
    const items = await prisma.raceResult.findMany({
      where: {
        sessionId: raceSession.id,
      },
      include: {
        driver: true,
        constructor: true,
      },
      orderBy: {
        finishPosition: "asc",
      },
    })

    if (items.length) {
      return {
        source: "database",
        year,
        round,
        item: {
          weekend,
          results: items,
        },
      }
    }
  }

  return {
    source: "provider",
    year,
    round,
    item: await getRaceResults(year, round),
  }
}

export async function getQualifyingResultsForRound(year: number, round: number) {
  const weekend = await findWeekend(year, round)
  const qualifyingSession = weekend?.sessions.find((session) => session.type === "QUALIFYING")

  if (weekend && qualifyingSession) {
    const items = await prisma.qualifyingResult.findMany({
      where: {
        sessionId: qualifyingSession.id,
      },
      include: {
        driver: true,
        constructor: true,
      },
      orderBy: {
        position: "asc",
      },
    })

    if (items.length) {
      return {
        source: "database",
        year,
        round,
        item: {
          weekend,
          results: items,
        },
      }
    }
  }

  return {
    source: "provider",
    year,
    round,
    item: await getQualifyingResults(year, round),
  }
}

export async function getSprintResultsForRound(year: number, round: number) {
  const weekend = await findWeekend(year, round)
  const sprintSession = weekend?.sessions.find((session) => session.type === "SPRINT")

  if (weekend && sprintSession) {
    const items = await prisma.sprintResult.findMany({
      where: {
        sessionId: sprintSession.id,
      },
      include: {
        driver: true,
        constructor: true,
      },
      orderBy: {
        position: "asc",
      },
    })

    if (items.length) {
      return {
        source: "database",
        year,
        round,
        item: {
          weekend,
          results: items,
        },
      }
    }
  }

  return {
    source: "provider",
    year,
    round,
    item: await getSprintResults(year, round),
  }
}
