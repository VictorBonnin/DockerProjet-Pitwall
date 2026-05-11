import assert from "node:assert/strict"

export async function runLivePageServiceTests() {
  const { buildLivePageModel } = await import("@/lib/services/live-page.service")

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

  assert.equal(model.isLive, true)
  assert.equal(model.session.title, "Miami Grand Prix")
  assert.equal(model.session.name, "Race")
  assert.equal(model.leaderboard[0]?.driverCode, "NOR")
  assert.equal(model.leaderboard[0]?.position, 1)
  assert.equal(model.leaderboard[0]?.gapToLeader, "Leader")
  assert.equal(model.leaderboard[1]?.driverCode, "VER")
  assert.equal(model.leaderboard[1]?.gapToLeader, "+1.427s")
  assert.equal(model.leaderboard[1]?.tyre.compound, "HARD")
  assert.equal(model.track.markers.length, 2)
  assert.ok((model.track.markers[0]?.xPercent ?? 0) < (model.track.markers[1]?.xPercent ?? 0))
  assert.equal(model.weather.trackTemp, "41.2°C")
  assert.equal(model.raceControl[0]?.message, "Track clear")

  assert.equal(model.leaderboard[0]?.telemetry.activeAero, "Mode ligne droite")
  assert.equal(model.leaderboard[0]?.telemetry.energy, "N/D OpenF1")

  const idleModel = buildLivePageModel({
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

  assert.equal(idleModel.isLive, false)
  assert.equal(idleModel.session.title, "Canadian Grand Prix")
  assert.equal(idleModel.session.name, "Veille live")
  assert.equal(idleModel.emptyState.title, "Aucune session live active")
}
