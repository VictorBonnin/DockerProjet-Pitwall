import { describe, it, expect, vi, afterEach } from "vitest"
import {
  getSessionsByYear,
  getLatestSession,
  getSessionByKey,
  getDriversBySession,
  getLapsBySession,
  getWeatherBySession,
} from "@/lib/providers/openf1"

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(body),
  })
}

const sessionPayload = [
  {
    session_key: 9971,
    session_name: "Race",
    session_type: "Race",
    meeting_name: "Australian Grand Prix",
    date_start: "2025-03-16T04:00:00+00:00",
  },
]

describe("OpenF1 provider (web mocks)", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("getSessionsByYear calls the correct URL with year param", async () => {
    const fetchMock = mockFetch(sessionPayload)
    vi.stubGlobal("fetch", fetchMock)

    const result = await getSessionsByYear(2025)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("sessions?year=2025")
    expect(result[0]?.session_key).toBe(9971)
  })

  it("getLatestSession calls the endpoint with session_key=latest", async () => {
    const fetchMock = mockFetch(sessionPayload)
    vi.stubGlobal("fetch", fetchMock)

    await getLatestSession()

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("session_key=latest")
  })

  it("getSessionByKey calls the endpoint with the correct session key", async () => {
    const fetchMock = mockFetch(sessionPayload)
    vi.stubGlobal("fetch", fetchMock)

    await getSessionByKey(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("session_key=9971")
  })

  it("getDriversBySession calls the drivers endpoint", async () => {
    const driversPayload = [
      { driver_number: 4, name_acronym: "NOR", full_name: "Lando Norris", team_name: "McLaren" },
    ]
    const fetchMock = mockFetch(driversPayload)
    vi.stubGlobal("fetch", fetchMock)

    const result = await getDriversBySession(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("drivers")
    expect(url).toContain("session_key=9971")
    expect(result[0]?.driver_number).toBe(4)
  })

  it("getLapsBySession calls the laps endpoint with session key", async () => {
    const lapsPayload = [
      { session_key: 9971, driver_number: 4, lap_number: 1, lap_duration: 92.345 },
    ]
    const fetchMock = mockFetch(lapsPayload)
    vi.stubGlobal("fetch", fetchMock)

    const result = await getLapsBySession(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("laps")
    expect(url).toContain("session_key=9971")
    expect(result[0]?.lap_duration).toBe(92.345)
  })

  it("getWeatherBySession calls the weather endpoint", async () => {
    const weatherPayload = [
      { session_key: 9971, air_temperature: 24.5, track_temperature: 37.2 },
    ]
    const fetchMock = mockFetch(weatherPayload)
    vi.stubGlobal("fetch", fetchMock)

    await getWeatherBySession(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("weather")
    expect(url).toContain("session_key=9971")
  })

  it("throws when the API returns a non-ok response", async () => {
    vi.stubGlobal("fetch", mockFetch({ error: "Rate limit exceeded" }, 429))

    await expect(getSessionsByYear(2025)).rejects.toThrow("OpenF1 request failed: 429")
  })

  it("sends User-Agent header on every request", async () => {
    const fetchMock = mockFetch(sessionPayload)
    vi.stubGlobal("fetch", fetchMock)

    await getSessionsByYear(2025)

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = options?.headers as Record<string, string>
    expect(headers?.["User-Agent"]).toContain("PitWall")
  })
})
