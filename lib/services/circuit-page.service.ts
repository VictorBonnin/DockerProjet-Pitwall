import { getCircuitReference } from "@/lib/circuit-reference"
import { toCircuitSlug } from "@/lib/circuit-slug"
import { prisma } from "@/lib/db/prisma"

function formatDate(date: Date | null) {
  if (!date) return "Date a confirmer"

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function buildCircuitPageModel({
  circuit,
  weekends,
}: {
  circuit: {
    id: string
    name: string
    country: string
    locality: string | null
  }
  weekends: Array<{
    round: number
    name: string
    startDate: Date | null
    season: {
      year: number
    }
    raceResults: Array<{
      finishPosition: number | null
      driver: {
        fullName: string
        code: string | null
      }
      constructor: {
        name: string
      }
    }>
  }>
}) {
  const reference = getCircuitReference(circuit.name)

  const history = weekends
    .slice()
    .sort((a, b) => b.season.year - a.season.year)
    .map((weekend) => {
      const winner =
        weekend.raceResults
          .slice()
          .sort((a, b) => (a.finishPosition ?? Number.MAX_SAFE_INTEGER) - (b.finishPosition ?? Number.MAX_SAFE_INTEGER))[0] ??
        null

      return {
        year: weekend.season.year,
        grandPrixName: weekend.name,
        dateLabel: formatDate(weekend.startDate),
        winnerName: winner?.driver.fullName ?? "Aucun vainqueur",
        winnerCode: winner?.driver.code ?? null,
        constructorName: winner?.constructor.name ?? null,
        href: `/races/${weekend.season.year}/${weekend.round}`,
      }
    })

  const winsByDriver = new Map<
    string,
    { driverName: string; driverCode: string | null; wins: number }
  >()

  for (const item of history) {
    if (item.winnerName === "Aucun vainqueur") continue

    const key = item.winnerCode ?? item.winnerName
    const current = winsByDriver.get(key)

    winsByDriver.set(key, {
      driverName: item.winnerName,
      driverCode: item.winnerCode,
      wins: (current?.wins ?? 0) + 1,
    })
  }

  const mostWins = Array.from(winsByDriver.values())
    .sort((a, b) => b.wins - a.wins || a.driverName.localeCompare(b.driverName))
    .slice(0, 3)
    .map((driver, index) => ({
      rank: index + 1,
      ...driver,
    }))

  return {
    hero: {
      circuitName: circuit.name,
      locationLabel: [circuit.locality, circuit.country].filter(Boolean).join(", "),
      lengthLabel: reference.lengthKm,
      officialImagePath: reference.officialImagePath,
      tracePath: reference.tracePath,
      editionsCount: history.length,
      slug: toCircuitSlug(circuit.name),
    },
    mostWins,
    history,
  }
}

export async function getCircuitPageData(slug: string) {
  const circuits = await prisma.circuit.findMany({
    include: {
      raceWeekends: {
        include: {
          season: true,
          raceResults: {
            include: {
              driver: true,
              constructor: true,
            },
          },
        },
      },
    },
  })

  const circuit = circuits.find((item) => toCircuitSlug(item.name) === slug)
  if (!circuit) return null

  return buildCircuitPageModel({
    circuit: {
      id: circuit.id,
      name: circuit.name,
      country: circuit.country,
      locality: circuit.locality,
    },
    weekends: circuit.raceWeekends.map((weekend) => ({
      round: weekend.round,
      name: weekend.name,
      startDate: weekend.startDate,
      season: {
        year: weekend.season.year,
      },
      raceResults: weekend.raceResults.map((result) => ({
        finishPosition: result.finishPosition,
        driver: {
          fullName: result.driver.fullName,
          code: result.driver.code,
        },
        constructor: {
          name: result.constructor.name,
        },
      })),
    })),
  })
}
