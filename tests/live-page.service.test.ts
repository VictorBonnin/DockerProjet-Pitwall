import { describe, it, expect } from "vitest"
import { buildLivePageModel } from "@/lib/services/live-page.service"

describe("live-page service", () => {
  it("builds a live page model with real-time data", () => {
    const model = buildLivePageModel({
      session: {
        session_key: 9001,
        meeting_name: "Miami Grand Prix",
        session_name: "Race",
        session_type: "Race",
        country_name: "United States",
        location: "Miami",
        circuit_short_name: "Miami",
        date_start: "2026-05-03T20:00:00+00:00",
      },
      drivers: [
        {
          driver_number: 4,
          name_acronym: "NOR",
          full_name: "Lando Norris",
          team_name: "McLaren",
          team_colour: "FF8000",
          headshot_url: "/drivers/nor.webp",
        },
        {
          driver_number: 1,
          name_acronym: "VER",
          full_name: "Max Verstappen",
          team_name: "Red Bull",
          team_colour: "3671C6",
        },
      ],
      positions: [
        { driver_number: 4, position: 2, date: "2026-05-03T20:02:00+00:00" },
        { driver_number: 4, position: 1, date: "2026-05-03T20:04:00+00:00" },
        { driver_number: 1, position: 2, date: "2026-05-03T20:04:01+00:00" },
      ],
      intervals: [
        { driver_number: 4, gap_to_leader: null, interval: null, date: "2026-05-03T20:04:00+00:00" },
        { driver_number: 1, gap_to_leader: 1.427, interval: 1.427, date: "2026-05-03T20:04:01+00:00" },
      ],
      locations: [
        { driver_number: 4, x: 100, y: 100, date: "2026-05-03T20:04:00+00:00" },
        { driver_number: 1, x: 300, y: 500, date: "2026-05-03T20:04:01+00:00" },
      ],
      stints: [
        { driver_number: 4, compound: "MEDIUM", tyre_age_at_start: 3, stint_number: 1 },
        { driver_number: 1, compound: "HARD", tyre_age_at_start: 8, stint_number: 1 },
      ],
      carData: [
        { driver_number: 4, speed: 312, throttle: 96, brake: 0, gear: 8, drs: 10, date: "2026-05-03T20:04:00+00:00" },
      ],
      weather: [{ air_temperature: 28.5, track_temperature: 41.2, rainfall: 0, wind_speed: 2.4 }],
      raceControl: [{ category: "Flag", flag: "GREEN", message: "Track clear", date: "2026-05-03T20:01:00+00:00" }],
      fallbackRace: null,
    })

    expect(model.isLive).toBe(true)
    expect(model.session.title).toBe("Miami Grand Prix")
    expect(model.session.name).toBe("Race")
    expect(model.leaderboard[0]?.driverCode).toBe("NOR")
    expect(model.leaderboard[0]?.position).toBe(1)
    expect(model.leaderboard[0]?.gapToLeader).toBe("Leader")
    expect(model.leaderboard[1]?.driverCode).toBe("VER")
    expect(model.leaderboard[1]?.gapToLeader).toBe("+1.427s")
    expect(model.leaderboard[1]?.tyre.compound).toBe("HARD")
    expect(model.track.markers.length).toBe(2)
    expect((model.track.markers[0]?.xPercent ?? 0) < (model.track.markers[1]?.xPercent ?? 0)).toBe(true)
    expect(model.weather.trackTemp).toBe("41.2°C")
    expect(model.raceControl[0]?.message).toBe("Track clear")
    expect(model.leaderboard[0]?.telemetry.activeAero).toBe("Mode ligne droite")
    expect(model.leaderboard[0]?.telemetry.energy).toBe("N/D OpenF1")
  })

  it("builds an idle model with a fallback race when no live session is active", () => {
    const model = buildLivePageModel({
      session: null,
      drivers: [],
      positions: [],
      intervals: [],
      locations: [],
      stints: [],
      carData: [],
      weather: [],
      raceControl: [],
      fallbackRace: {
        name: "Canadian Grand Prix",
        circuitName: "Circuit Gilles Villeneuve",
        locationLabel: "Montreal, Canada",
        startsAt: new Date("2026-05-24T20:00:00.000Z"),
      },
    })

    expect(model.isLive).toBe(false)
    expect(model.session.title).toBe("Canadian Grand Prix")
    expect(model.session.name).toBe("Veille live")
    expect(model.emptyState.title).toBe("Aucune session live active")
  })
})
