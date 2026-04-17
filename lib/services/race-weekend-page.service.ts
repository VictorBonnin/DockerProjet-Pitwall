import { prisma } from "@/lib/db/prisma"
import { getCircuitReference } from "@/lib/circuit-reference"

type WeekendLike = {
  id: string
  round: number
  name: string
  country: string | null
  startDate: Date | null
  endDate: Date | null
  circuit: {
    id?: string
    name: string
    country: string
    locality: string | null
  }
}

type DriverLike = {
  fullName: string
  code: string | null
}

type ConstructorLike = {
  name: string
  slug?: string | null
}

type SessionLike = {
  type: string
  startsAt: Date | null
  endsAt: Date | null
}

type RaceResultLike = {
  finishPosition: number | null
  points: number
  status: string | null
  lapsCompleted?: number | null
  totalTimeMs?: number | null
  driver: DriverLike
  constructor: ConstructorLike
}

type QualifyingResultLike = {
  position: number
  q1Ms?: number | null
  q2Ms?: number | null
  q3Ms?: number | null
  driver: DriverLike
  constructor: ConstructorLike
}

type SprintResultLike = {
  position: number | null
  points: number
  status?: string | null
  driver: DriverLike
  constructor: ConstructorLike
}

type BestLapLike = {
  lapTimeMs: number
  driver: DriverLike
  session: {
    name: string
    raceWeekend: {
      name: string
      season: {
        year: number
      }
    }
  }
}

function formatWeekendWindow(startDate: Date | null, endDate: Date | null) {
  if (!startDate && !endDate) return "Dates à confirmer"

  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  if (startDate && endDate) {
    return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
  }

  return formatter.format(startDate ?? endDate ?? new Date())
}

function formatLapTime(ms: number | null | undefined) {
  if (!ms || ms <= 0) return null
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = ms % 1000
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`
}

function formatGapTime(ms: number | null | undefined) {
  if (ms === null || ms === undefined) return null
  const seconds = ms / 1000
  const sign = seconds > 0 ? "+" : seconds < 0 ? "-" : "+"
  return `${sign}${Math.abs(seconds).toFixed(3)}s`
}

function formatRaceDuration(ms: number | null | undefined) {
  if (!ms || ms <= 0) return null

  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`
}

function getBestQualifyingSegment(result: QualifyingResultLike) {
  return formatLapTime(getBestQualifyingSegmentMs(result))
}

function getBestQualifyingSegmentMs(result: QualifyingResultLike) {
  const candidates = [result.q1Ms, result.q2Ms, result.q3Ms].filter(
    (value): value is number => typeof value === "number" && value > 0,
  )

  if (!candidates.length) return null

  return Math.min(...candidates)
}

function buildClassification<T extends { position: number | null }>(
  entries: T[],
  mapper: (entry: T) => {
    position: number | null
    driverName: string
    driverCode: string | null
    constructorName: string
    points: number
    status: string | null
  },
) {
  const ordered = entries
    .slice()
    .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
    .map(mapper)

  return {
    podium: ordered.filter((entry) => (entry.position ?? 999) <= 3),
    classification: ordered.filter((entry) => (entry.position ?? 999) > 3),
  }
}

export function buildStartingGridRows(results: QualifyingResultLike[]) {
  const orderedSource = results
    .slice()
    .sort((a, b) => a.position - b.position)

  const poleTimeMs = getBestQualifyingSegmentMs(orderedSource[0] ?? { position: 0 } as QualifyingResultLike)

  const ordered = results
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((result, index, items) => {
      const timeMs = getBestQualifyingSegmentMs(result)
      const aheadTimeMs = index > 0 ? getBestQualifyingSegmentMs(items[index - 1] ?? null as never) : null

      return {
        position: result.position,
        driverName: result.driver.fullName,
        driverCode: result.driver.code,
        constructorName: result.constructor.name,
        constructorSlug: result.constructor.slug ?? null,
        qualifyingTimeLabel: getBestQualifyingSegment(result),
        gapToPoleLabel:
          index === 0
            ? "Pole"
            : timeMs !== null && poleTimeMs !== null
              ? formatGapTime(timeMs - poleTimeMs)
              : "Indisponible",
        gapToAheadLabel:
          index === 0
            ? "Pole"
            : timeMs !== null && aheadTimeMs !== null
              ? formatGapTime(timeMs - aheadTimeMs)
              : "Indisponible",
      }
    })

  const rows: Array<{
    left: (typeof ordered)[number] | null
    right: (typeof ordered)[number] | null
  }> = []

  for (let index = 0; index < ordered.length; index += 2) {
    rows.push({
      left: ordered[index] ?? null,
      right: ordered[index + 1] ?? null,
    })
  }

  return rows
}

export function buildRaceWeekendPageModel({
  year,
  weekend,
  sessions,
  raceResults,
  qualifyingResults,
  sprintResults,
  bestKnownLap,
}: {
  year: number
  weekend: WeekendLike
  sessions: SessionLike[]
  raceResults: RaceResultLike[]
  qualifyingResults: QualifyingResultLike[]
  sprintResults: SprintResultLike[]
  bestKnownLap: BestLapLike | null
}) {
  const circuitReference = getCircuitReference(weekend.circuit.name)
  const raceSession = sessions.find((session) => session.type === "RACE") ?? null
  const winningRaceResult =
    raceResults
      .slice()
      .sort((a, b) => (a.finishPosition ?? Number.MAX_SAFE_INTEGER) - (b.finishPosition ?? Number.MAX_SAFE_INTEGER))[0] ??
    null
  const lapsCompleted = Math.max(0, ...raceResults.map((result) => result.lapsCompleted ?? 0))
  const sessionDurationMs =
    raceSession?.startsAt && raceSession?.endsAt ? raceSession.endsAt.getTime() - raceSession.startsAt.getTime() : null
  const raceDurationLabel =
    formatRaceDuration(winningRaceResult?.totalTimeMs ?? null) ??
    formatRaceDuration(sessionDurationMs) ??
    "Durée indisponible"

  return {
    hero: {
      grandPrixTitle: weekend.name,
      circuitName: weekend.circuit.name,
      dateLabel: formatWeekendWindow(weekend.startDate, weekend.endDate),
      roundLabel: `Round ${weekend.round}`,
      seasonLabel: `Saison ${year}`,
      locationLabel: `${weekend.circuit.locality ? `${weekend.circuit.locality}, ` : ""}${weekend.country ?? weekend.circuit.country}`,
    },
    circuit: {
      officialImagePath: circuitReference.officialImagePath,
      tracePath: circuitReference.tracePath,
      lengthLabel: circuitReference.lengthKm,
      bestLapLabel: bestKnownLap ? (formatLapTime(bestKnownLap.lapTimeMs) ?? "Aucun temps connu") : "Aucun temps connu",
      bestLapDriverName: bestKnownLap?.driver.fullName ?? "Aucun pilote",
      bestLapContext: bestKnownLap
        ? `${bestKnownLap.session.raceWeekend.name} · ${bestKnownLap.session.raceWeekend.season.year}`
        : null,
      raceLapsLabel: lapsCompleted > 0 ? `${lapsCompleted} tours` : "Tours inconnus",
      raceDurationLabel,
    },
    qualifying: {
      hasData: qualifyingResults.length > 0,
      gridRows: buildStartingGridRows(qualifyingResults),
    },
    sprint: {
      hasData: sprintResults.length > 0,
      ...buildClassification(
        sprintResults.map((result) => ({
          position: result.position,
          points: result.points,
          status: result.status ?? null,
          driver: result.driver,
          constructor: result.constructor,
        })),
        (result) => ({
          position: result.position,
          driverName: result.driver.fullName,
          driverCode: result.driver.code,
          constructorName: result.constructor.name,
          points: result.points,
          status: result.status,
        }),
      ),
    },
    race: buildClassification(
      raceResults.map((result) => ({
        position: result.finishPosition,
        points: result.points,
        status: result.status,
        driver: result.driver,
        constructor: result.constructor,
      })),
      (result) => ({
        position: result.position,
        driverName: result.driver.fullName,
        driverCode: result.driver.code,
        constructorName: result.constructor.name,
        points: result.points,
        status: result.status,
      }),
    ),
  }
}

export async function getRaceWeekendPage(year: number, round: number) {
  const weekend = await prisma.raceWeekend.findFirst({
    where: {
      round,
      season: { year },
    },
    include: {
      circuit: true,
      sessions: true,
    },
  })

  if (!weekend) return null

  const sessionIds = weekend.sessions.map((session) => session.id)

  const [raceResults, qualifyingResults, sprintResults, bestKnownLap] = await Promise.all([
    prisma.raceResult.findMany({
      where: { sessionId: { in: sessionIds } },
      include: {
        driver: true,
        constructor: true,
      },
    }),
    prisma.qualifyingResult.findMany({
      where: { sessionId: { in: sessionIds } },
      include: {
        driver: true,
        constructor: true,
      },
    }),
    prisma.sprintResult.findMany({
      where: { sessionId: { in: sessionIds } },
      include: {
        driver: true,
        constructor: true,
      },
    }),
    prisma.lap.findFirst({
      where: {
        lapTimeMs: { gt: 0 },
        session: {
          raceWeekend: {
            circuitId: weekend.circuitId,
          },
        },
      },
      orderBy: {
        lapTimeMs: "asc",
      },
      include: {
        driver: true,
        session: {
          include: {
            raceWeekend: {
              include: {
                season: true,
              },
            },
          },
        },
      },
    }),
  ])

  return buildRaceWeekendPageModel({
    year,
    weekend: {
      id: weekend.id,
      round: weekend.round,
      name: weekend.name,
      country: weekend.country,
      startDate: weekend.startDate,
      endDate: weekend.endDate,
      circuit: {
        id: weekend.circuit.id,
        name: weekend.circuit.name,
        country: weekend.circuit.country,
        locality: weekend.circuit.locality,
      },
    },
    sessions: weekend.sessions.map((session) => ({
      type: session.type,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
    })),
    raceResults: raceResults.map((result) => ({
      finishPosition: result.finishPosition,
      points: result.points,
      status: result.status,
      lapsCompleted: result.lapsCompleted,
      totalTimeMs: result.totalTimeMs,
      driver: {
        fullName: result.driver.fullName,
        code: result.driver.code,
      },
      constructor: {
        name: result.constructor.name,
        slug: result.constructor.slug,
      },
    })),
    qualifyingResults,
    sprintResults,
    bestKnownLap:
      bestKnownLap && typeof bestKnownLap.lapTimeMs === "number" && bestKnownLap.lapTimeMs > 0
        ? {
            lapTimeMs: bestKnownLap.lapTimeMs,
            driver: {
              fullName: bestKnownLap.driver.fullName,
              code: bestKnownLap.driver.code,
            },
            session: {
              name: bestKnownLap.session.name,
              raceWeekend: {
                name: bestKnownLap.session.raceWeekend.name,
                season: {
                  year: bestKnownLap.session.raceWeekend.season.year,
                },
              },
            },
          }
        : null,
  })
}
