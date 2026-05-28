import { prisma } from "@/lib/db/prisma"

function formatDate(date: Date | null) {
  if (!date) return "Date a confirmer"
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

export function buildRacesIndexModel({
  year,
  weekends,
}: {
  year: number
  weekends: Array<{
    round: number
    name: string
    slug: string
    status: string
    country: string | null
    startDate: Date | null
    circuit: {
      name: string
      locality: string | null
    }
  }>
}) {
  return {
    year,
    items: weekends
      .slice()
      .sort((a, b) => a.round - b.round)
      .map((weekend) => ({
        round: weekend.round,
        name: weekend.name,
        status: weekend.status,
        href: `/races/${year}/${weekend.round}`,
        dateLabel: formatDate(weekend.startDate),
        locationLabel: [weekend.circuit.locality, weekend.country ?? "Unknown"].filter(Boolean).join(", "),
        circuitName: weekend.circuit.name,
      })),
  }
}

export async function getRacesIndexData(year: number) {
  const season = await prisma.season.findUnique({
    where: { year },
    include: {
      raceWeekends: {
        include: {
          circuit: true,
        },
        orderBy: { round: "asc" },
      },
    },
  })

  return buildRacesIndexModel({
    year,
    weekends: season?.raceWeekends ?? [],
  })
}
