import { getCircuitReference } from "@/lib/circuit-reference"
import { toCircuitSlug } from "@/lib/circuit-slug"
import { prisma } from "@/lib/db/prisma"

function formatDate(date: Date | null) {
  if (!date) return "Date a confirmer"

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

export function buildCircuitsIndexModel({
  year,
  weekends,
}: {
  year: number
  weekends: Array<{
    round: number
    name: string
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
      .map((weekend) => {
        const reference = getCircuitReference(weekend.circuit.name)

        return {
          round: weekend.round,
          grandPrixName: weekend.name,
          circuitName: weekend.circuit.name,
          circuitSlug: toCircuitSlug(weekend.circuit.name),
          locationLabel: [weekend.circuit.locality, weekend.country ?? "Unknown"].filter(Boolean).join(", "),
          dateLabel: formatDate(weekend.startDate),
          lengthLabel: reference.lengthKm,
          officialImagePath: reference.officialImagePath,
          tracePath: reference.tracePath,
          href: `/circuits/${toCircuitSlug(weekend.circuit.name)}`,
          latestRaceHref: `/races/${year}/${weekend.round}`,
        }
      }),
  }
}

export async function getCircuitsIndexData(year: number) {
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

  return buildCircuitsIndexModel({
    year,
    weekends: season?.raceWeekends ?? [],
  })
}
