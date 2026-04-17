import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"

const driverStandingSelect = {
  driver: true,
} as unknown as Prisma.DriverStandingSelect

export function buildTeamPageModel({
  team,
  standing,
  drivers,
}: {
  team: {
    name: string
    slug: string | null
    logoPath: string | null
    nationality: string | null
  }
  standing: {
    position: number
    points: number
    wins: number
  } | null
  drivers: Array<{
    code: string | null
    fullName: string
    imagePath: string | null
  }>
}) {
  return {
    hero: {
      name: team.name,
      logoPath: team.logoPath,
      nationality: team.nationality,
    },
    summary: {
      position: standing?.position ?? null,
      points: standing?.points ?? 0,
      wins: standing?.wins ?? 0,
    },
    drivers: drivers.map((driver) => ({
      code: driver.code,
      fullName: driver.fullName,
      imagePath: driver.imagePath,
      href: driver.code ? `/drivers/${driver.code}` : null,
    })),
  }
}

export async function getTeamPageData(teamSlug: string, year: number) {
  const team = await prisma.constructor.findUnique({
    where: { slug: teamSlug },
  })

  if (!team) return null

  const season = await prisma.season.findUnique({
    where: { year },
  })

  const standing = season
    ? await prisma.constructorStanding.findUnique({
        where: {
          seasonId_constructorId: {
            seasonId: season.id,
            constructorId: team.id,
          },
        },
      })
    : null

  const drivers = season
      ? await prisma.driverStanding.findMany({
        where: {
          seasonId: season.id,
          constructorId: team.id,
        },
        select: driverStandingSelect,
        orderBy: {
          position: "asc",
        },
      })
    : []

  return buildTeamPageModel({
    team,
    standing,
    drivers: drivers.map((entry) => entry.driver),
  })
}
