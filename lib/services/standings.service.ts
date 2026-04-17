import { prisma } from "@/lib/db/prisma"
import { getConstructorStandings, getDriverStandings } from "@/lib/providers/jolpica"

export async function getDriverStandingsForYear(year: number) {
  const season = await prisma.season.findUnique({
    where: { year },
  })

  if (season) {
    const items = await prisma.driverStanding.findMany({
      where: {
        seasonId: season.id,
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
        items,
      }
    }
  }

  return {
    source: "provider",
    year,
    items: await getDriverStandings(year),
  }
}

export async function getConstructorStandingsForYear(year: number) {
  const season = await prisma.season.findUnique({
    where: { year },
  })

  if (season) {
    const items = await prisma.constructorStanding.findMany({
      where: {
        seasonId: season.id,
      },
      include: {
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
        items,
      }
    }
  }

  return {
    source: "provider",
    year,
    items: await getConstructorStandings(year),
  }
}
