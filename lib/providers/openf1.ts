import { getEnv } from "@/lib/env"

const OPENF1_BASE_URL = getEnv().OPENF1_BASE_URL ?? "https://api.openf1.org/v1"

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const error = new Error(
      `OpenF1 request failed: ${response.status} ${response.statusText}`,
    ) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  return response.json() as Promise<T>
}

export type OpenF1SessionPayload = Array<Record<string, unknown>>
export type OpenF1LapPayload = Array<Record<string, unknown>>
export type OpenF1PitPayload = Array<Record<string, unknown>>
export type OpenF1WeatherPayload = Array<Record<string, unknown>>

export async function getSessionsByYear(year: number) {
  return fetchJson<OpenF1SessionPayload>(`${OPENF1_BASE_URL}/sessions?year=${year}`)
}

export async function getLapsBySession(sessionKey: number) {
  return fetchJson<OpenF1LapPayload>(`${OPENF1_BASE_URL}/laps?session_key=${sessionKey}`)
}

export async function getPitBySession(sessionKey: number) {
  return fetchJson<OpenF1PitPayload>(`${OPENF1_BASE_URL}/pit?session_key=${sessionKey}`)
}

export async function getWeatherBySession(sessionKey: number) {
  return fetchJson<OpenF1WeatherPayload>(`${OPENF1_BASE_URL}/weather?session_key=${sessionKey}`)
}
