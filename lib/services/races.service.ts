import { prisma } from "@/lib/db/prisma"
import { getSeasonSchedule } from "@/lib/providers/jolpica"

export async function getRacesForYear(year: number) {
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

  if (season?.raceWeekends.length) {
    return {
      source: "database",
      year,
      items: season.raceWeekends,
    }
  }

  const payload = await getSeasonSchedule(year)

  return {
    source: "provider",
    year,
    items: payload,
  }
}
