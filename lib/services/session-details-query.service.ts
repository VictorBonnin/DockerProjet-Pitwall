import { prisma } from "@/lib/db/prisma"

async function findRaceSession(year: number, round: number) {
  const weekend = await prisma.raceWeekend.findFirst({
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

  const session = weekend?.sessions.find((item) => item.type === "RACE")
  return { weekend, session }
}

export async function getLapsForRound(year: number, round: number) {
  const { weekend, session } = await findRaceSession(year, round)

  if (weekend && session) {
    const items = await prisma.lap.findMany({
      where: {
        sessionId: session.id,
      },
      include: {
        driver: true,
      },
      orderBy: [{ lapNumber: "asc" }],
    })

    if (items.length) {
      return {
        source: "database",
        year,
        round,
        item: {
          weekend,
          laps: items,
        },
      }
    }
  }

  return {
    source: "database",
    year,
    round,
    item: {
      weekend,
      laps: [],
    },
  }
}

export async function getPitStopsForRound(year: number, round: number) {
  const { weekend, session } = await findRaceSession(year, round)

  if (weekend && session) {
    const items = await prisma.pitStop.findMany({
      where: {
        sessionId: session.id,
      },
      include: {
        driver: true,
      },
      orderBy: [{ lapNumber: "asc" }],
    })

    if (items.length) {
      return {
        source: "database",
        year,
        round,
        item: {
          weekend,
          pitStops: items,
        },
      }
    }
  }

  return {
    source: "database",
    year,
    round,
    item: {
      weekend,
      pitStops: [],
    },
  }
}

export async function getWeatherForRound(year: number, round: number) {
  const { weekend, session } = await findRaceSession(year, round)

  if (weekend && session) {
    const items = await prisma.weatherSample.findMany({
      where: {
        sessionId: session.id,
      },
      orderBy: [{ sampledAt: "asc" }],
    })

    if (items.length) {
      return {
        source: "database",
        year,
        round,
        item: {
          weekend,
          weather: items,
        },
      }
    }
  }

  return {
    source: "database",
    year,
    round,
    item: {
      weekend,
      weather: [],
    },
  }
}
