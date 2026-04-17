import { prisma } from "@/lib/db/prisma"

type SessionLike = {
  id: string
  type: string
  name: string
}

type WeekendLike = {
  id: string
  round: number
  name: string
  country: string | null
  status: string
  startDate: Date | null
  endDate: Date | null
  circuit: {
    name: string
    country: string
    locality: string | null
  }
  sessions: SessionLike[]
}

type SessionCounts = {
  race: number
  qualifying: number
  sprint: number
  laps: number
  pitStops: number
  weatherSamples: number
}

type ResultDriverLike = {
  fullName: string
  code: string | null
}

type ResultConstructorLike = {
  name: string
}

type RaceResultLike = {
  finishPosition: number | null
  driver: ResultDriverLike
  constructor: ResultConstructorLike
}

type QualifyingResultLike = {
  position: number
  driver: ResultDriverLike
  constructor: ResultConstructorLike
}

type SprintResultLike = {
  position: number | null
  driver: ResultDriverLike
  constructor: ResultConstructorLike
}

type DashboardModelInput = {
  season: {
    year: number
  }
  driverStandings: Array<{
    position: number
    points: number
    wins: number
    driver: ResultDriverLike
    constructor: ResultConstructorLike | null
  }>
  constructorStandings: Array<{
    position: number
    points: number
    wins: number
    constructor: ResultConstructorLike
  }>
  raceWeekends: WeekendLike[]
  featuredWeekendId: string | null
  resultCountsBySessionId: Record<string, SessionCounts>
  featuredRaceResults: RaceResultLike[]
  featuredQualifyingResults: QualifyingResultLike[]
  featuredSprintResults: SprintResultLike[]
}

function formatDate(date: Date | null) {
  if (!date) return "Date a confirmer"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

function createEmptyCounts(): SessionCounts {
  return {
    race: 0,
    qualifying: 0,
    sprint: 0,
    laps: 0,
    pitStops: 0,
    weatherSamples: 0,
  }
}

function mergeCounts(target: SessionCounts, patch?: Partial<SessionCounts>) {
  if (!patch) return target
  return {
    race: target.race + (patch.race ?? 0),
    qualifying: target.qualifying + (patch.qualifying ?? 0),
    sprint: target.sprint + (patch.sprint ?? 0),
    laps: target.laps + (patch.laps ?? 0),
    pitStops: target.pitStops + (patch.pitStops ?? 0),
    weatherSamples: target.weatherSamples + (patch.weatherSamples ?? 0),
  }
}

export function pickFeaturedWeekend<T extends WeekendLike>(raceWeekends: T[]) {
  const sorted = [...raceWeekends].sort((a, b) => a.round - b.round)
  const completed = sorted.filter((weekend) => weekend.status === "COMPLETED")
  return completed.at(-1) ?? sorted[0] ?? null
}

export function buildWeekendCompletion({
  sessions,
  raceResultCount,
  qualifyingResultCount,
  sprintResultCount,
  lapCount,
  pitStopCount,
  weatherSampleCount,
}: {
  sessions: SessionLike[]
  raceResultCount: number
  qualifyingResultCount: number
  sprintResultCount: number
  lapCount: number
  pitStopCount: number
  weatherSampleCount: number
}) {
  const hasRaceSession = sessions.some((session) => session.type === "RACE")
  const hasQualifyingSession = sessions.some((session) => session.type === "QUALIFYING")
  const hasSprintSession = sessions.some((session) => session.type === "SPRINT")
  const hasDetails = lapCount > 0 || pitStopCount > 0 || weatherSampleCount > 0

  const items = [
    { label: "Course", ready: hasRaceSession || raceResultCount > 0 },
    { label: "Qualifs", ready: hasQualifyingSession || qualifyingResultCount > 0 },
    { label: "Sprint", ready: hasSprintSession || sprintResultCount > 0 },
    { label: "Detail", ready: hasDetails },
  ]

  const score = items.filter((item) => item.ready).length

  return {
    race: items[0]?.ready ?? false,
    qualifying: items[1]?.ready ?? false,
    sprint: items[2]?.ready ?? false,
    details: items[3]?.ready ?? false,
    score,
    total: items.length,
    label: `${score}/${items.length}`,
    items,
  }
}

export function buildHistoricalDashboardModel({
  season,
  driverStandings,
  constructorStandings,
  raceWeekends,
  featuredWeekendId,
  resultCountsBySessionId,
  featuredRaceResults,
  featuredQualifyingResults,
  featuredSprintResults,
}: DashboardModelInput) {
  const calendar = raceWeekends
    .slice()
    .sort((a, b) => a.round - b.round)
    .map((weekend) => {
      const aggregate = weekend.sessions.reduce(
        (counts, session) => mergeCounts(counts, resultCountsBySessionId[session.id]),
        createEmptyCounts(),
      )

      const completion = buildWeekendCompletion({
        sessions: weekend.sessions,
        raceResultCount: aggregate.race,
        qualifyingResultCount: aggregate.qualifying,
        sprintResultCount: aggregate.sprint,
        lapCount: aggregate.laps,
        pitStopCount: aggregate.pitStops,
        weatherSampleCount: aggregate.weatherSamples,
      })

      return {
        id: weekend.id,
        round: weekend.round,
        name: weekend.name,
        country: weekend.country ?? weekend.circuit.country,
        circuitName: weekend.circuit.name,
        locality: weekend.circuit.locality,
        status: weekend.status,
        completionLabel: completion.label,
        completionScore: completion.score,
        startsAtLabel: formatDate(weekend.startDate),
        isFeatured: weekend.id === featuredWeekendId,
      }
    })

  const featuredWeekend = raceWeekends.find((weekend) => weekend.id === featuredWeekendId) ?? null
  const featuredAggregate = featuredWeekend
    ? featuredWeekend.sessions.reduce(
        (counts, session) => mergeCounts(counts, resultCountsBySessionId[session.id]),
        createEmptyCounts(),
      )
    : createEmptyCounts()

  const featuredCompletion = featuredWeekend
    ? buildWeekendCompletion({
        sessions: featuredWeekend.sessions,
        raceResultCount: featuredAggregate.race,
        qualifyingResultCount: featuredAggregate.qualifying,
        sprintResultCount: featuredAggregate.sprint,
        lapCount: featuredAggregate.laps,
        pitStopCount: featuredAggregate.pitStops,
        weatherSampleCount: featuredAggregate.weatherSamples,
      })
    : buildWeekendCompletion({
        sessions: [],
        raceResultCount: 0,
        qualifyingResultCount: 0,
        sprintResultCount: 0,
        lapCount: 0,
        pitStopCount: 0,
        weatherSampleCount: 0,
      })

  return {
    hero: {
      year: season.year,
      seasonLabel: `Saison ${season.year}`,
      kpis: {
        totalWeekends: raceWeekends.length,
        completedWeekends: raceWeekends.filter((weekend) => weekend.status === "COMPLETED").length,
        totalLaps: Object.values(resultCountsBySessionId).reduce((sum, counts) => sum + counts.laps, 0),
        totalPitStops: Object.values(resultCountsBySessionId).reduce(
          (sum, counts) => sum + counts.pitStops,
          0,
        ),
        totalWeatherSamples: Object.values(resultCountsBySessionId).reduce(
          (sum, counts) => sum + counts.weatherSamples,
          0,
        ),
      },
    },
    standings: {
      drivers: driverStandings.map((entry) => ({
        position: entry.position,
        driverName: entry.driver.fullName,
        code: entry.driver.code,
        constructorName: entry.constructor?.name ?? "Ecurie inconnue",
        points: entry.points,
        wins: entry.wins,
      })),
      constructors: constructorStandings.map((entry) => ({
        position: entry.position,
        constructorName: entry.constructor.name,
        points: entry.points,
        wins: entry.wins,
      })),
    },
    calendar,
    focus: featuredWeekend
      ? {
          weekendName: featuredWeekend.name,
          country: featuredWeekend.country ?? featuredWeekend.circuit.country,
          circuitName: featuredWeekend.circuit.name,
          locality: featuredWeekend.circuit.locality,
          status: featuredWeekend.status,
          completionLabel: featuredCompletion.label,
          podium: featuredRaceResults
            .filter((result) => result.finishPosition !== null)
            .sort((a, b) => (a.finishPosition ?? 999) - (b.finishPosition ?? 999))
            .slice(0, 3)
            .map((result) => ({
              position: result.finishPosition ?? 0,
              driverName: result.driver.fullName,
              driverCode: result.driver.code,
              constructorName: result.constructor.name,
            })),
          pole:
            featuredQualifyingResults
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((result) => ({
                position: result.position,
                driverName: result.driver.fullName,
                driverCode: result.driver.code,
                constructorName: result.constructor.name,
              }))[0] ?? null,
          sprintWinner:
            featuredSprintResults
              .filter((result) => result.position !== null)
              .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
              .map((result) => ({
                position: result.position ?? 0,
                driverName: result.driver.fullName,
                driverCode: result.driver.code,
                constructorName: result.constructor.name,
              }))[0] ?? null,
          detailCounts: {
            laps: featuredAggregate.laps,
            pitStops: featuredAggregate.pitStops,
            weatherSamples: featuredAggregate.weatherSamples,
          },
          sessionTypes: featuredWeekend.sessions.map((session) => session.type),
        }
      : null,
  }
}

export async function getHistoricalDashboard(year: number) {
  const season = await prisma.season.findUnique({
    where: { year },
    include: {
      raceWeekends: {
        include: {
          circuit: true,
          sessions: {
            orderBy: { startsAt: "asc" },
          },
        },
        orderBy: { round: "asc" },
      },
    },
  })

  if (!season) {
    return buildHistoricalDashboardModel({
      season: { year },
      driverStandings: [],
      constructorStandings: [],
      raceWeekends: [],
      featuredWeekendId: null,
      resultCountsBySessionId: {},
      featuredRaceResults: [],
      featuredQualifyingResults: [],
      featuredSprintResults: [],
    })
  }

  const driverStandings = await prisma.driverStanding.findMany({
    where: { seasonId: season.id },
    include: {
      driver: true,
      constructor: true,
    },
    orderBy: { position: "asc" },
    take: 5,
  })

  const constructorStandings = await prisma.constructorStanding.findMany({
    where: { seasonId: season.id },
    include: {
      constructor: true,
    },
    orderBy: { position: "asc" },
    take: 5,
  })

  const featuredWeekend = pickFeaturedWeekend(season.raceWeekends)
  const seasonSessionIds = season.raceWeekends.flatMap((weekend) => weekend.sessions.map((session) => session.id))
  const featuredSessionIds = featuredWeekend?.sessions.map((session) => session.id) ?? []

  const [
    raceCounts,
    qualifyingCounts,
    sprintCounts,
    lapCounts,
    pitStopCounts,
    weatherCounts,
    featuredRaceResults,
    featuredQualifyingResults,
    featuredSprintResults,
  ] = await Promise.all([
    prisma.raceResult.groupBy({
      by: ["sessionId"],
      where: { sessionId: { in: seasonSessionIds } },
      _count: { _all: true },
    }),
    prisma.qualifyingResult.groupBy({
      by: ["sessionId"],
      where: { sessionId: { in: seasonSessionIds } },
      _count: { _all: true },
    }),
    prisma.sprintResult.groupBy({
      by: ["sessionId"],
      where: { sessionId: { in: seasonSessionIds } },
      _count: { _all: true },
    }),
    prisma.lap.groupBy({
      by: ["sessionId"],
      where: { sessionId: { in: seasonSessionIds } },
      _count: { _all: true },
    }),
    prisma.pitStop.groupBy({
      by: ["sessionId"],
      where: { sessionId: { in: seasonSessionIds } },
      _count: { _all: true },
    }),
    prisma.weatherSample.groupBy({
      by: ["sessionId"],
      where: { sessionId: { in: seasonSessionIds } },
      _count: { _all: true },
    }),
    prisma.raceResult.findMany({
      where: { sessionId: { in: featuredSessionIds } },
      include: {
        driver: true,
        constructor: true,
      },
      orderBy: { finishPosition: "asc" },
    }),
    prisma.qualifyingResult.findMany({
      where: { sessionId: { in: featuredSessionIds } },
      include: {
        driver: true,
        constructor: true,
      },
      orderBy: { position: "asc" },
    }),
    prisma.sprintResult.findMany({
      where: { sessionId: { in: featuredSessionIds } },
      include: {
        driver: true,
        constructor: true,
      },
      orderBy: { position: "asc" },
    }),
  ])

  const resultCountsBySessionId: Record<string, SessionCounts> = {}

  for (const sessionId of seasonSessionIds) {
    resultCountsBySessionId[sessionId] = createEmptyCounts()
  }

  for (const row of raceCounts) {
    resultCountsBySessionId[row.sessionId] = mergeCounts(resultCountsBySessionId[row.sessionId] ?? createEmptyCounts(), {
      race: row._count._all,
    })
  }

  for (const row of qualifyingCounts) {
    resultCountsBySessionId[row.sessionId] = mergeCounts(resultCountsBySessionId[row.sessionId] ?? createEmptyCounts(), {
      qualifying: row._count._all,
    })
  }

  for (const row of sprintCounts) {
    resultCountsBySessionId[row.sessionId] = mergeCounts(resultCountsBySessionId[row.sessionId] ?? createEmptyCounts(), {
      sprint: row._count._all,
    })
  }

  for (const row of lapCounts) {
    resultCountsBySessionId[row.sessionId] = mergeCounts(resultCountsBySessionId[row.sessionId] ?? createEmptyCounts(), {
      laps: row._count._all,
    })
  }

  for (const row of pitStopCounts) {
    resultCountsBySessionId[row.sessionId] = mergeCounts(resultCountsBySessionId[row.sessionId] ?? createEmptyCounts(), {
      pitStops: row._count._all,
    })
  }

  for (const row of weatherCounts) {
    resultCountsBySessionId[row.sessionId] = mergeCounts(resultCountsBySessionId[row.sessionId] ?? createEmptyCounts(), {
      weatherSamples: row._count._all,
    })
  }

  return buildHistoricalDashboardModel({
    season: { year: season.year },
    driverStandings,
    constructorStandings,
    raceWeekends: season.raceWeekends,
    featuredWeekendId: featuredWeekend?.id ?? null,
    resultCountsBySessionId,
    featuredRaceResults,
    featuredQualifyingResults,
    featuredSprintResults,
  })
}
