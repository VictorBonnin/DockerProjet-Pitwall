import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  getSeasonSchedule,
  getDriverStandings,
  getConstructorStandings,
  getRaceResults,
  getQualifyingResults,
  getSprintResults,
} from "@/lib/providers/jolpica"

const mockScheduleResponse = {
  MRData: {
    RaceTable: {
      season: "2025",
      Races: [
        {
          round: "1",
          raceName: "Australian Grand Prix",
          date: "2025-03-16",
          Circuit: { circuitId: "albert_park", circuitName: "Albert Park" },
        },
      ],
    },
  },
}

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(body),
  })
}

describe("Jolpica provider (web mocks)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch(mockScheduleResponse))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("getSeasonSchedule calls the correct URL and returns parsed data", async () => {
    const fetchMock = mockFetch(mockScheduleResponse)
    vi.stubGlobal("fetch", fetchMock)

    const result = await getSeasonSchedule(2025)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("2025.json")
    expect(result.MRData.RaceTable.season).toBe("2025")
    expect(result.MRData.RaceTable.Races[0]?.raceName).toBe("Australian Grand Prix")
  })

  it("getDriverStandings calls the correct URL", async () => {
    const driverStandingsResponse = {
      MRData: {
        StandingsTable: {
          season: "2025",
          StandingsLists: [{ season: "2025", round: "1", DriverStandings: [] }],
        },
      },
    }
    const fetchMock = mockFetch(driverStandingsResponse)
    vi.stubGlobal("fetch", fetchMock)

    const result = await getDriverStandings(2025)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("2025/driverstandings.json")
    expect(result.MRData.StandingsTable.season).toBe("2025")
  })

  it("getConstructorStandings calls the correct URL", async () => {
    const constructorStandingsResponse = {
      MRData: {
        StandingsTable: {
          season: "2025",
          StandingsLists: [{ season: "2025", round: "1", ConstructorStandings: [] }],
        },
      },
    }
    const fetchMock = mockFetch(constructorStandingsResponse)
    vi.stubGlobal("fetch", fetchMock)

    const result = await getConstructorStandings(2025)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("2025/constructorstandings.json")
    expect(result.MRData.StandingsTable.season).toBe("2025")
  })

  it("getRaceResults calls the correct URL with year and round", async () => {
    const raceResultsResponse = {
      MRData: { RaceTable: { season: "2025", round: "1", Races: [] } },
    }
    const fetchMock = mockFetch(raceResultsResponse)
    vi.stubGlobal("fetch", fetchMock)

    await getRaceResults(2025, 1)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("2025/1/results.json")
  })

  it("getQualifyingResults calls the correct URL", async () => {
    const qualifyingResponse = {
      MRData: { RaceTable: { season: "2025", round: "1", Races: [] } },
    }
    const fetchMock = mockFetch(qualifyingResponse)
    vi.stubGlobal("fetch", fetchMock)

    await getQualifyingResults(2025, 1)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("2025/1/qualifying.json")
  })

  it("getSprintResults calls the correct URL", async () => {
    const sprintResponse = {
      MRData: { RaceTable: { season: "2025", round: "2", Races: [] } },
    }
    const fetchMock = mockFetch(sprintResponse)
    vi.stubGlobal("fetch", fetchMock)

    await getSprintResults(2025, 2)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("2025/2/sprint.json")
  })

  it("throws when the API returns a non-ok response", async () => {
    vi.stubGlobal("fetch", mockFetch({ error: "Not Found" }, 404))

    await expect(getSeasonSchedule(9999)).rejects.toThrow("Jolpica request failed: 404")
  })
})
