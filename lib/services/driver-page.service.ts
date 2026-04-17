import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { getTeamColor } from "@/lib/team-colors"

const raceResultSelect = {
  finishPosition: true,
  points: true,
  raceWeekend: {
    select: {
      seasonId: true,
      round: true,
      name: true,
      slug: true,
    },
  },
} as unknown as Prisma.RaceResultSelect

export function buildDriverPageModel({
  driver,
  standing,
  raceResults,
  selectedSeason,
}: {
  driver: {
    code: string | null
    fullName: string
    firstName: string
    lastName: string
    nationality: string | null
    permanentNumber: number | null
    imagePath: string | null
    heroImagePath: string | null
  }
  standing: {
    position: number
    points: number
    wins: number
    constructor: {
      name: string
      slug: string | null
      logoPath: string | null
    } | null
  } | null
  raceResults: Array<{
    seasonYear: number
    raceWeekend: {
      round: number
      name: string
      slug: string
    }
    finishPosition: number | null
    points: number
  }>
  selectedSeason?: number
}) {
  const results = raceResults.reduce<Array<{
    seasonYear: number
    entries: Array<{
      round: number
      roundLabel: string
      raceName: string
      raceHref: string
      finishPosition: number | null
      points: number
    }>
  }>>((groups, result) => {
    const entry = {
      round: result.raceWeekend.round,
      roundLabel: result.raceWeekend.round === 1 ? "1er GP" : `${result.raceWeekend.round}e GP`,
      raceName: result.raceWeekend.name,
      raceHref: `/races/${result.seasonYear}/${result.raceWeekend.round}`,
      finishPosition: result.finishPosition,
      points: result.points,
    }

    const currentSeason = groups.at(-1)
    if (currentSeason?.seasonYear === result.seasonYear) {
      currentSeason.entries.push(entry)
      return groups
    }

    groups.push({
      seasonYear: result.seasonYear,
      entries: [entry],
    })

    return groups
  }, [])

  const availableSeasons = results.map((season) => season.seasonYear)
  const resolvedSelectedSeason =
    selectedSeason && availableSeasons.includes(selectedSeason)
      ? selectedSeason
      : availableSeasons[0] ?? null

  return {
    hero: {
      name: driver.fullName,
      code: driver.code,
      imagePath: driver.heroImagePath ?? driver.imagePath,
      nationality: driver.nationality,
      permanentNumber: driver.permanentNumber,
      teamName: standing?.constructor?.name ?? null,
      teamHref: standing?.constructor?.slug ? `/teams/${standing.constructor.slug}` : null,
      teamLogoPath: standing?.constructor?.logoPath ?? null,
      teamColor: getTeamColor(standing?.constructor?.slug),
    },
    summary: {
      position: standing?.position ?? null,
      points: standing?.points ?? 0,
      wins: standing?.wins ?? 0,
    },
    availableSeasons,
    selectedSeason: resolvedSelectedSeason,
    results,
    visibleResults:
      resolvedSelectedSeason === null
        ? results
        : results.filter((season) => season.seasonYear === resolvedSelectedSeason),
  }
}

export async function getDriverPageData(driverCode: string, year: number, selectedSeason?: number) {
  const driver = await prisma.driver.findUnique({
    where: { code: driverCode },
  })

  if (!driver) return null

  const season = await prisma.season.findUnique({
    where: { year },
  })

  const standing = season
    ? await prisma.driverStanding.findUnique({
        where: {
          seasonId_driverId: {
            seasonId: season.id,
            driverId: driver.id,
          },
        },
        include: {
          constructor: true,
        },
      })
    : null

  const raceResults = await prisma.raceResult.findMany({
    where: {
      driverId: driver.id,
    },
    select: raceResultSelect,
    orderBy: [
      {
        raceWeekend: {
          season: {
            year: "desc",
          },
        },
      },
      {
        raceWeekend: {
          round: "asc",
        },
      },
    ],
  })

  const seasonIds = [...new Set(raceResults.map((result) => result.raceWeekend.seasonId))]
  const seasons = await prisma.season.findMany({
    where: {
      id: {
        in: seasonIds,
      },
    },
    select: {
      id: true,
      year: true,
    },
  })
  const seasonYears = new Map(seasons.map((entry) => [entry.id, entry.year]))

  return buildDriverPageModel({
    driver,
    standing,
    raceResults: raceResults.map((result) => ({
      seasonYear: seasonYears.get(result.raceWeekend.seasonId) ?? year,
      raceWeekend: {
        round: result.raceWeekend.round,
        name: result.raceWeekend.name,
        slug: result.raceWeekend.slug,
      },
      finishPosition: result.finishPosition,
      points: result.points,
    })),
    selectedSeason,
  })
}
