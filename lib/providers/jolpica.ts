import { getEnv } from "@/lib/env"

const JOLPICA_BASE_URL = getEnv().JOLPICA_BASE_URL ?? "https://api.jolpi.ca/ergast/f1"

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    const error = new Error(
      `Jolpica request failed: ${response.status} ${response.statusText}`,
    ) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  return response.json() as Promise<T>
}

export type JolpicaSchedulePayload = {
  MRData: {
    RaceTable: {
      season: string
      Races: Array<Record<string, unknown>>
    }
  }
}

export type JolpicaDriverStandingsPayload = {
  MRData: {
    StandingsTable: {
      season: string
      StandingsLists: Array<{
        season: string
        round: string
        DriverStandings: Array<Record<string, unknown>>
      }>
    }
  }
}

export type JolpicaConstructorStandingsPayload = {
  MRData: {
    StandingsTable: {
      season: string
      StandingsLists: Array<{
        season: string
        round: string
        ConstructorStandings: Array<Record<string, unknown>>
      }>
    }
  }
}

export type JolpicaRaceResultsPayload = {
  MRData: {
    RaceTable: {
      season: string
      round: string
      Races: Array<Record<string, unknown>>
    }
  }
}

export type JolpicaQualifyingResultsPayload = JolpicaRaceResultsPayload

export type JolpicaSprintResultsPayload = JolpicaRaceResultsPayload

export async function getSeasonSchedule(year: number) {
  return fetchJson<JolpicaSchedulePayload>(`${JOLPICA_BASE_URL}/${year}.json`)
}

export async function getDriverStandings(year: number) {
  return fetchJson<JolpicaDriverStandingsPayload>(
    `${JOLPICA_BASE_URL}/${year}/driverstandings.json`,
  )
}

export async function getConstructorStandings(year: number) {
  return fetchJson<JolpicaConstructorStandingsPayload>(
    `${JOLPICA_BASE_URL}/${year}/constructorstandings.json`,
  )
}

export async function getRaceResults(year: number, round: number) {
  return fetchJson<JolpicaRaceResultsPayload>(
    `${JOLPICA_BASE_URL}/${year}/${round}/results.json`,
  )
}

export async function getQualifyingResults(year: number, round: number) {
  return fetchJson<JolpicaQualifyingResultsPayload>(
    `${JOLPICA_BASE_URL}/${year}/${round}/qualifying.json`,
  )
}

export async function getSprintResults(year: number, round: number) {
  return fetchJson<JolpicaSprintResultsPayload>(
    `${JOLPICA_BASE_URL}/${year}/${round}/sprint.json`,
  )
}
