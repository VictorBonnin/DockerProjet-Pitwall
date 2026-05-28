import { getEnv } from "@/lib/env"

const OPENF1_BASE_URL = getEnv().OPENF1_BASE_URL ?? "https://api.openf1.org/v1"

async function fetchJson<T>(url: string): Promise<T> {
  const apiKey = getEnv().OPENF1_API_KEY
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "PitWall/0.1 (+local-dev)",
  }
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`

  const response = await fetch(url, {
    headers,
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
export type OpenF1DriverPayload = Array<Record<string, unknown>>
export type OpenF1PositionPayload = Array<Record<string, unknown>>
export type OpenF1IntervalPayload = Array<Record<string, unknown>>
export type OpenF1LocationPayload = Array<Record<string, unknown>>
export type OpenF1StintPayload = Array<Record<string, unknown>>
export type OpenF1CarDataPayload = Array<Record<string, unknown>>
export type OpenF1LapPayload = Array<Record<string, unknown>>
export type OpenF1PitPayload = Array<Record<string, unknown>>
export type OpenF1WeatherPayload = Array<Record<string, unknown>>
export type OpenF1RaceControlPayload = Array<Record<string, unknown>>

type SessionKey = number | "latest"

function withSince(endpoint: string, sessionKey: SessionKey, sinceIso?: string | null) {
  const sinceQuery = sinceIso ? `&date>=${encodeURIComponent(sinceIso)}` : ""

  return `${OPENF1_BASE_URL}/${endpoint}?session_key=${sessionKey}${sinceQuery}`
}

export async function getSessionsByYear(year: number) {
  return fetchJson<OpenF1SessionPayload>(`${OPENF1_BASE_URL}/sessions?year=${year}`)
}

export async function getLatestSession() {
  return fetchJson<OpenF1SessionPayload>(`${OPENF1_BASE_URL}/sessions?session_key=latest`)
}

export async function getSessionByKey(sessionKey: number) {
  return fetchJson<OpenF1SessionPayload>(`${OPENF1_BASE_URL}/sessions?session_key=${sessionKey}`)
}

export async function getDriversBySession(sessionKey: SessionKey) {
  return fetchJson<OpenF1DriverPayload>(`${OPENF1_BASE_URL}/drivers?session_key=${sessionKey}`)
}

export async function getPositionBySession(sessionKey: SessionKey, sinceIso?: string | null) {
  return fetchJson<OpenF1PositionPayload>(withSince("position", sessionKey, sinceIso))
}

export async function getIntervalsBySession(sessionKey: SessionKey, sinceIso?: string | null) {
  return fetchJson<OpenF1IntervalPayload>(withSince("intervals", sessionKey, sinceIso))
}

export async function getLocationBySession(sessionKey: SessionKey, sinceIso?: string | null) {
  return fetchJson<OpenF1LocationPayload>(withSince("location", sessionKey, sinceIso))
}

export async function getStintsBySession(sessionKey: SessionKey) {
  return fetchJson<OpenF1StintPayload>(`${OPENF1_BASE_URL}/stints?session_key=${sessionKey}`)
}

export async function getCarDataBySession(sessionKey: SessionKey, sinceIso?: string | null) {
  return fetchJson<OpenF1CarDataPayload>(withSince("car_data", sessionKey, sinceIso))
}

export async function getLapsBySession(sessionKey: number, sinceIso?: string | null) {
  return fetchJson<OpenF1LapPayload>(withSince("laps", sessionKey, sinceIso))
}

export async function getPitBySession(sessionKey: number, sinceIso?: string | null) {
  return fetchJson<OpenF1PitPayload>(withSince("pit", sessionKey, sinceIso))
}

export async function getWeatherBySession(sessionKey: number) {
  return fetchJson<OpenF1WeatherPayload>(`${OPENF1_BASE_URL}/weather?session_key=${sessionKey}`)
}

export async function getWeatherByLiveSession(sessionKey: SessionKey, sinceIso?: string | null) {
  return fetchJson<OpenF1WeatherPayload>(withSince("weather", sessionKey, sinceIso))
}

export async function getRaceControlBySession(sessionKey: SessionKey, sinceIso?: string | null) {
  return fetchJson<OpenF1RaceControlPayload>(withSince("race_control", sessionKey, sinceIso))
}
