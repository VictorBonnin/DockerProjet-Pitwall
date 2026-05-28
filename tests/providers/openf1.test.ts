import { describe, it, expect, vi, afterEach } from "vitest"
import {
  getSessionsByYear,
  getLatestSession,
  getSessionByKey,
  getDriversBySession,
  getPositionBySession,
  getIntervalsBySession,
  getLocationBySession,
  getStintsBySession,
  getCarDataBySession,
  getLapsBySession,
  getPitBySession,
  getWeatherBySession,
  getWeatherByLiveSession,
  getRaceControlBySession,
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

const emptyPayload: unknown[] = []

describe("OpenF1 provider (web mocks)", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("getSessionsByYear calls the correct URL with year param", async () => {
    const fetchMock = mockFetch(sessionPayload)
    vi.stubGlobal("fetch", fetchMock)

    const result = await getSessionsByYear(2025)

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
    const fetchMock = mockFetch([{ driver_number: 4, name_acronym: "NOR" }])
    vi.stubGlobal("fetch", fetchMock)

    const result = await getDriversBySession(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("drivers")
    expect(url).toContain("session_key=9971")
    expect(result[0]?.driver_number).toBe(4)
  })

  it("getPositionBySession calls the position endpoint", async () => {
    const fetchMock = mockFetch(emptyPayload)
    vi.stubGlobal("fetch", fetchMock)

    await getPositionBySession(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("position")
    expect(url).toContain("session_key=9971")
  })

  it("getPositionBySession appends sinceIso when provided", async () => {
    const fetchMock = mockFetch(emptyPayload)
    vi.stubGlobal("fetch", fetchMock)

    await getPositionBySession(9971, "2025-03-16T04:00:00Z")

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("date>=")
  })

  it("getIntervalsBySession calls the intervals endpoint", async () => {
    const fetchMock = mockFetch(emptyPayload)
    vi.stubGlobal("fetch", fetchMock)

    await getIntervalsBySession(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("intervals")
  })

  it("getLocationBySession calls the location endpoint", async () => {
    const fetchMock = mockFetch(emptyPayload)
    vi.stubGlobal("fetch", fetchMock)

    await getLocationBySession(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("location")
  })

  it("getStintsBySession calls the stints endpoint", async () => {
    const fetchMock = mockFetch(emptyPayload)
    vi.stubGlobal("fetch", fetchMock)

    await getStintsBySession(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("stints")
    expect(url).toContain("session_key=9971")
  })

  it("getCarDataBySession calls the car_data endpoint", async () => {
    const fetchMock = mockFetch(emptyPayload)
    vi.stubGlobal("fetch", fetchMock)

    await getCarDataBySession(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("car_data")
  })

  it("getLapsBySession calls the laps endpoint with session key", async () => {
    const fetchMock = mockFetch([{ session_key: 9971, lap_duration: 92.345 }])
    vi.stubGlobal("fetch", fetchMock)

    const result = await getLapsBySession(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("laps")
    expect(url).toContain("session_key=9971")
    expect(result[0]?.lap_duration).toBe(92.345)
  })

  it("getPitBySession calls the pit endpoint", async () => {
    const fetchMock = mockFetch(emptyPayload)
    vi.stubGlobal("fetch", fetchMock)

    await getPitBySession(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("pit")
    expect(url).toContain("session_key=9971")
  })

  it("getWeatherBySession calls the weather endpoint", async () => {
    const fetchMock = mockFetch([{ air_temperature: 24.5, track_temperature: 37.2 }])
    vi.stubGlobal("fetch", fetchMock)

    await getWeatherBySession(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("weather")
    expect(url).toContain("session_key=9971")
  })

  it("getWeatherByLiveSession calls the weather endpoint with sinceIso", async () => {
    const fetchMock = mockFetch(emptyPayload)
    vi.stubGlobal("fetch", fetchMock)

    await getWeatherByLiveSession(9971, "2025-03-16T04:00:00Z")

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("weather")
    expect(url).toContain("date>=")
  })

  it("getRaceControlBySession calls the race_control endpoint", async () => {
    const fetchMock = mockFetch(emptyPayload)
    vi.stubGlobal("fetch", fetchMock)

    await getRaceControlBySession(9971)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("race_control")
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
