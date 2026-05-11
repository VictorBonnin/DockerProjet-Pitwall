import { prisma } from "@/lib/db/prisma"
import { getCircuitReference } from "@/lib/circuit-reference"
import { getCurrentLiveSession } from "@/lib/services/live-query.service"

type LiveSessionModel = {
  status: string
  session: {
    name: string
  }
}

function buildFallbackHomeLuxuryData() {
  return {
    header: {
      logo: "PitWall",
      seasonLabel: "Saison",
    },
    landing: {
      eyebrow: "Prochain Grand Prix",
      grandPrixName: "Grand Prix a confirmer",
      highlight: "confirmer",
      circuitSubtitle: "Circuit a confirmer",
      localityLabel: "Lieu a confirmer",
      countdownTargetIso: null,
      footerText: "La course des rois.",
      footerAccent: "L'adrenaline de l'elite.",
      cornerLeft: "F1",
      cornerRight: "Round -- · --",
    },
    overlays: {
      seasons: {
        title: "Palmares Historique",
        highlight: "Historique",
        subtitle: "Champions du Monde",
        rows: [] as Array<{
          year: number
          driverName: string
          constructorName: string
          winsLabel: string
        }>,
      },
      circuits: {
        title: "Les Circuits",
        highlight: "Circuits",
        subtitle: "Temples de la Vitesse",
        rows: [] as Array<{
          name: string
          country: string
          detailA: string
          detailB: string
          detailC: string
          winnerLabel: string
          isFinished: boolean
        }>,
      },
      status: {
        title: "Statut",
        highlight: "Statut",
        subtitle: "Saison",
        stateLabel: "Veille",
        helper: "Base indisponible ou session live inactive",
      },
    },
    countdownDateLabel: "Date a confirmer",
  }
}

function formatDateShort(date: Date | null) {
  if (!date) return "Date a confirmer"

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

function formatDateLong(date: Date | null) {
  if (!date) return "Date a confirmer"

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  })
    .format(date)
    .replace(",", "")
}

export function normalizeGrandPrixLocation(
  name: string | null | undefined,
  circuitName: string | null | undefined,
  country?: string | null,
) {
  const raw =
    name
      ?.replace(/^Formula 1\s+/i, "")
      .replace(/\bcrypto\.com\b/gi, "")
      .replace(/\betihad airways\b/gi, "")
      .replace(/\bqatar airways\b/gi, "")
      .replace(/\bmsc cruises\b/gi, "")
      .replace(/\bmoet & chandon\b/gi, "")
      .replace(/\bpirelli\b/gi, "")
      .replace(/\baws\b/gi, "")
      .replace(/\baramco\b/gi, "")
      .replace(/\bgrand prix\b/gi, "")
      .replace(/\bdu\b/gi, "")
      .replace(/\bde\b/gi, "")
      .replace(/d['’]/gi, "")
      .replace(/\s+/g, " ")
      .trim() || country?.trim() || circuitName?.trim() || "A venir"

  const normalized = raw
    .replace(/^the\s+/i, "")
    .replace(/\b20\d{2}\b/g, "")
    .replace(/\s+/g, " ")
    .trim()

  if (/^canadian$/i.test(normalized)) return "Canada"

  return normalized
}

export function buildDisplayGrandPrixName(location: string) {
  if (!location) return "Grand Prix a confirmer"
  if (/^canada$/i.test(location)) return "Grand Prix du Canada"

  return /^[aeiouyhàâäéèêëîïôöùûü]/i.test(location)
    ? `Grand Prix d’${location}`
    : `Grand Prix de ${location}`
}

export function isRaceWeekendFinished<
  T extends {
    status: string
    endDate?: Date | null
    startDate?: Date | null
  },
>(weekend: T, now = new Date()) {
  if (weekend.status === "COMPLETED") return true

  const referenceDate = weekend.endDate ?? weekend.startDate ?? null
  return referenceDate ? referenceDate.getTime() < now.getTime() : false
}

export function pickNextRaceWeekend<
  T extends {
    round: number
    status: string
    startDate?: Date | null
    endDate?: Date | null
  },
>(weekends: T[], now = new Date()) {
  const sorted = [...weekends].sort((a, b) => a.round - b.round)
  return (
    sorted.find((weekend) => !isRaceWeekendFinished(weekend, now)) ??
    sorted.find((weekend) => weekend.status !== "COMPLETED") ??
    sorted.at(-1) ??
    null
  )
}

export async function getHomeLuxuryData(now = new Date()) {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: { year: "desc" },
      include: {
        driverStandings: {
          where: { position: 1 },
          include: {
            driver: true,
            constructor: true,
          },
        },
        raceWeekends: {
          include: {
            circuit: true,
            raceResults: {
              where: {
                finishPosition: 1,
              },
              include: {
                driver: true,
                constructor: false,
              },
              take: 1,
            },
          },
          orderBy: { round: "asc" },
        },
      },
    })

    const currentSeason = seasons[0] ?? null
    const nextGrandPrix = currentSeason ? pickNextRaceWeekend(currentSeason.raceWeekends, now) : null
    const liveSession = (await getCurrentLiveSession()) as LiveSessionModel | null
    const grandPrixLocation = normalizeGrandPrixLocation(
      nextGrandPrix?.name,
      nextGrandPrix?.circuit.name,
      nextGrandPrix?.country,
    )

    return {
      header: {
        logo: "PitWall",
        seasonLabel: currentSeason ? `Saison ${currentSeason.year}` : "Saison",
      },
      landing: {
        eyebrow: "Prochain Grand Prix",
        grandPrixName: buildDisplayGrandPrixName(grandPrixLocation),
        highlight: grandPrixLocation,
        circuitSubtitle: nextGrandPrix?.circuit.name ?? "Circuit a confirmer",
        localityLabel: nextGrandPrix?.circuit.locality ?? nextGrandPrix?.country ?? "Lieu a confirmer",
        countdownTargetIso: nextGrandPrix?.startDate?.toISOString() ?? null,
        footerText: "La course des rois.",
        footerAccent: "L'adrenaline de l'elite.",
        cornerLeft:
          nextGrandPrix?.circuit.locality && nextGrandPrix?.country
            ? `${nextGrandPrix.circuit.locality} · ${nextGrandPrix.country}`
            : nextGrandPrix?.circuit.name ?? "F1",
        cornerRight:
          nextGrandPrix && currentSeason
            ? `Round ${String(nextGrandPrix.round).padStart(2, "0")} · ${formatDateShort(nextGrandPrix.startDate)}`
            : "Round -- · --",
      },
      overlays: {
        seasons: {
          title: "Palmares Historique",
          highlight: "Historique",
          subtitle:
            seasons.length > 0
              ? `Champions du Monde · ${seasons.at(-1)?.year ?? ""} — ${seasons[0]?.year ?? ""}`
              : "Champions du Monde",
          rows: seasons
            .map((season) => {
              const champion = season.driverStandings[0]
              if (!champion) return null

              return {
                year: season.year,
                driverName: champion.driver.fullName,
                constructorName: champion.constructor?.name ?? "Ecurie inconnue",
                winsLabel: `${champion.wins} victoire${champion.wins > 1 ? "s" : ""}`,
              }
            })
            .filter((row): row is NonNullable<typeof row> => row !== null),
        },
        circuits: {
          title: "Les Circuits",
          highlight: "Circuits",
          subtitle: currentSeason ? `Temples de la Vitesse · Saison ${currentSeason.year}` : "Temples de la Vitesse",
          rows:
            currentSeason?.raceWeekends.map((weekend) => {
              const reference = getCircuitReference(weekend.circuit.name)

              return {
                name: weekend.circuit.name,
                country: weekend.country ?? weekend.circuit.country,
                detailA: `Longueur · ${reference.lengthKm}`,
                detailB: `Manche · Round ${weekend.round}`,
                detailC: `Fenetre · ${formatDateShort(weekend.startDate)}`,
                winnerLabel: weekend.raceResults[0]?.driver.fullName ?? "À déterminer",
                isFinished: isRaceWeekendFinished(weekend, now),
              }
            }) ?? [],
        },
        status: {
          title: "Statut",
          highlight: "Statut",
          subtitle: currentSeason ? `Saison ${currentSeason.year}` : "Saison",
          stateLabel: liveSession ? liveSession.status : "Veille",
          helper:
            liveSession?.session.name ??
            (nextGrandPrix ? `Prochaine course · ${nextGrandPrix.name}` : "Aucune session live active"),
        },
      },
      countdownDateLabel: nextGrandPrix?.startDate ? `${formatDateLong(nextGrandPrix.startDate)} (heure de Paris)` : "Date a confirmer",
    }
  } catch {
    return buildFallbackHomeLuxuryData()
  }
}
