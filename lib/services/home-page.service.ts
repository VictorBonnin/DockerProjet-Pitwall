import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { getCurrentLiveSession } from "@/lib/services/live-query.service"
import { getTeamColor } from "@/lib/team-colors"

const driverStandingInclude = {
  driver: true,
} as unknown as Prisma.DriverStandingInclude

type SessionLike = {
  id: string
  type: string
  name: string
  startsAt: Date | null
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

function formatDateWindow(startDate: Date | null, endDate: Date | null) {
  if (!startDate && !endDate) return "Dates a confirmer"

  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  })

  if (startDate && endDate) {
    return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
  }

  return formatter.format(startDate ?? endDate ?? new Date())
}

function formatCountdownDate(date: Date | null) {
  if (!date) return "Date a confirmer"

  return `${new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  })
    .format(date)
    .replace(",", "")} (heure de Paris)`
}

export function pickNextRaceWeekend<T extends WeekendLike>(raceWeekends: T[]) {
  const sorted = [...raceWeekends].sort((a, b) => a.round - b.round)
  return sorted.find((weekend) => weekend.status !== "COMPLETED") ?? sorted.at(-1) ?? null
}

export function buildHomePageModel({
  year,
  raceWeekends,
  driverStandings,
  constructorStandings,
  liveSession,
}: {
  year: number
  raceWeekends: WeekendLike[]
  driverStandings: Array<{
    position: number
    points: number
    wins: number
    driver: {
      fullName: string
      code: string | null
      imagePath?: string | null
    }
    constructor: {
      name: string
      slug?: string | null
      logoPath?: string | null
    } | null
  }>
  constructorStandings: Array<{
    position: number
    points: number
    wins: number
    constructor: {
      name: string
      slug?: string | null
      logoPath?: string | null
    }
    drivers?: Array<{
      fullName: string
      code: string | null
    }>
  }>
  liveSession: {
    status: string
    session: {
      type: string
      name: string
      raceWeekend: {
        name: string
      }
    }
  } | null
}) {
  const nextGrandPrix = pickNextRaceWeekend(raceWeekends)
  const nextSession = nextGrandPrix?.sessions
    .slice()
    .sort((a, b) => (a.startsAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.startsAt?.getTime() ?? Number.MAX_SAFE_INTEGER))[0] ?? null

  return {
    season: {
      year,
    },
    nextGrandPrix: nextGrandPrix
        ? {
          name: nextGrandPrix.name,
          roundLabel: `Round ${nextGrandPrix.round}`,
          href: `/races/${year}/${nextGrandPrix.round}`,
          circuitName: nextGrandPrix.circuit.name,
          locationLabel: `${nextGrandPrix.circuit.locality ? `${nextGrandPrix.circuit.locality}, ` : ""}${nextGrandPrix.country ?? nextGrandPrix.circuit.country}`,
          status: nextGrandPrix.status,
          dateLabel: formatDateWindow(nextGrandPrix.startDate, nextGrandPrix.endDate),
          countdownTargetIso: nextGrandPrix.startDate?.toISOString() ?? null,
          countdownDateLabel: formatCountdownDate(nextGrandPrix.startDate),
          nextSessionLabel: nextSession?.name ?? "Session a confirmer",
          nextSessionType: nextSession?.type ?? null,
        }
      : null,
    live: liveSession
      ? {
          isActive: true,
          label: liveSession.session.name,
          type: liveSession.session.type,
          context: liveSession.session.raceWeekend.name,
          status: liveSession.status,
        }
      : {
          isActive: false,
          label: "Aucune session live",
          type: null,
          context: "Le live s'ouvrira a la prochaine session",
          status: "STANDBY",
        },
    standings: {
      drivers: driverStandings.map((entry) => ({
        position: entry.position,
        driverName: entry.driver.fullName,
        code: entry.driver.code,
        href: entry.driver.code ? `/drivers/${entry.driver.code}` : null,
        imagePath: entry.driver.imagePath ?? null,
        constructorName: entry.constructor?.name ?? "Ecurie inconnue",
        teamColor: getTeamColor(entry.constructor?.slug),
        points: entry.points,
        wins: entry.wins,
      })),
      constructors: constructorStandings.map((entry) => ({
        position: entry.position,
        constructorName: entry.constructor.name,
        href: entry.constructor.slug ? `/teams/${entry.constructor.slug}` : null,
        logoPath: entry.constructor.logoPath ?? null,
        teamColor: getTeamColor(entry.constructor.slug),
        points: entry.points,
        wins: entry.wins,
        drivers: entry.drivers ?? [],
      })),
    },
  }
}

export async function getHomePageData(year: number) {
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

  const [driverStandings, constructorStandings, liveSession] = await Promise.all([
    season
      ? prisma.driverStanding.findMany({
          where: { seasonId: season.id },
          include: {
            driver: true,
            constructor: true,
          },
          orderBy: { position: "asc" },
        })
      : Promise.resolve([]),
    season
      ? prisma.constructorStanding.findMany({
          where: { seasonId: season.id },
          include: {
            constructor: true,
            season: {
              include: {
                driverStandings: {
                  where: {
                    constructorId: {
                      not: null,
                    },
                  },
                  include: driverStandingInclude,
                  orderBy: {
                    position: "asc",
                  },
                },
              },
            },
          },
          orderBy: { position: "asc" },
        })
      : Promise.resolve([]),
    getCurrentLiveSession(),
  ])

  return buildHomePageModel({
    year,
    raceWeekends: season?.raceWeekends ?? [],
    driverStandings,
    constructorStandings: constructorStandings.map((entry) => ({
      ...entry,
      drivers: entry.season.driverStandings
        .filter((driverStanding) => driverStanding.constructorId === entry.constructorId)
        .slice(0, 2)
        .map((driverStanding) => ({
          fullName: driverStanding.driver.fullName,
          code: driverStanding.driver.code,
        })),
    })),
    liveSession: liveSession as {
      status: string
      session: {
        type: string
        name: string
        raceWeekend: {
          name: string
        }
      }
    } | null,
  })
}
