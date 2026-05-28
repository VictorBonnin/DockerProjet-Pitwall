import { describe, it, expect } from "vitest"
import { buildRaceWeekendPageModel, buildStartingGridRows } from "../lib/services/race-weekend-page.service"

const weekendFixture = {
  id: "weekend-1",
  round: 1,
  name: "Australian Grand Prix",
  country: "Australia",
  startDate: new Date("2025-03-14T01:30:00Z"),
  endDate: new Date("2025-03-16T04:00:00Z"),
  circuit: {
    id: "circuit-1",
    name: "Albert Park Grand Prix Circuit",
    country: "Australia",
    locality: "Melbourne",
  },
} as const

describe("race-weekend-page service", () => {
  describe("buildStartingGridRows", () => {
    it("builds grid rows from qualifying results", () => {
      const rows = buildStartingGridRows([
        { position: 1, driver: { fullName: "Lando Norris", code: "NOR" }, constructor: { name: "McLaren", slug: "mclaren" }, q3Ms: 75096 },
        { position: 2, driver: { fullName: "Max Verstappen", code: "VER" }, constructor: { name: "Red Bull", slug: "red-bull" }, q3Ms: 75210 },
        { position: 3, driver: { fullName: "Oscar Piastri", code: "PIA" }, constructor: { name: "McLaren", slug: "mclaren" }, q3Ms: 75301 },
      ])

      expect(rows.length).toBe(2)
      expect(rows[0]?.left?.driverName).toBe("Lando Norris")
      expect(rows[0]?.right?.driverName).toBe("Max Verstappen")
      expect(rows[1]?.left?.driverCode).toBe("PIA")
      expect(rows[0]?.left?.constructorSlug).toBe("mclaren")
      expect(rows[0]?.left?.qualifyingTimeLabel).toBe("1:15.096")
      expect(rows[0]?.left?.gapToPoleLabel).toBe("Pole")
      expect(rows[0]?.right?.gapToPoleLabel).toBe("+0.114s")
      expect(rows[1]?.left?.gapToAheadLabel).toBe("+0.091s")
      expect(rows[1]?.right).toBeNull()
    })

    it("handles tied qualifying times", () => {
      const rows = buildStartingGridRows([
        { position: 14, driver: { fullName: "Driver Fourteen", code: "D14" }, constructor: { name: "Williams", slug: "williams" }, q2Ms: 81234 },
        { position: 15, driver: { fullName: "Driver Fifteen", code: "D15" }, constructor: { name: "Alpine", slug: "alpine-f1-team" }, q2Ms: 81234 },
      ])

      expect(rows[0]?.left?.gapToPoleLabel).toBe("Pole")
      expect(rows[0]?.right?.gapToAheadLabel).toBe("+0.000s")
    })

    it("uses best Q segment time for delta calculation", () => {
      const rows = buildStartingGridRows([
        { position: 15, driver: { fullName: "Driver Fifteen", code: "D15" }, constructor: { name: "Haas F1 Team", slug: "haas-f1-team" }, q1Ms: 73074, q2Ms: 73315 },
        { position: 16, driver: { fullName: "Driver Sixteen", code: "D16" }, constructor: { name: "Sauber", slug: "sauber" }, q1Ms: 73190 },
      ])

      expect(rows[0]?.left?.qualifyingTimeLabel).toBe("1:13.074")
      expect(rows[0]?.right?.gapToAheadLabel).toBe("+0.116s")
    })
  })

  it("builds a full race weekend page model", () => {
    const model = buildRaceWeekendPageModel({
      year: 2025,
      weekend: weekendFixture,
      sessions: [
        { type: "RACE", startsAt: new Date("2025-03-16T04:00:00Z"), endsAt: new Date("2025-03-16T05:32:03Z") },
      ],
      raceResults: [
        { finishPosition: 1, points: 25, status: "Finished", lapsCompleted: 58, totalTimeMs: 5523000, driver: { fullName: "Lando Norris", code: "NOR" }, constructor: { name: "McLaren" } },
        { finishPosition: 2, points: 18, status: "Finished", lapsCompleted: 58, totalTimeMs: 5538000, driver: { fullName: "Max Verstappen", code: "VER" }, constructor: { name: "Red Bull" } },
        { finishPosition: 4, points: 12, status: "Finished", lapsCompleted: 58, totalTimeMs: 5601000, driver: { fullName: "George Russell", code: "RUS" }, constructor: { name: "Mercedes" } },
      ],
      qualifyingResults: [
        { position: 1, driver: { fullName: "Lando Norris", code: "NOR" }, constructor: { name: "McLaren", slug: "mclaren" }, q3Ms: 75096 },
        { position: 2, driver: { fullName: "Max Verstappen", code: "VER" }, constructor: { name: "Red Bull", slug: "red-bull" }, q3Ms: 75210 },
      ],
      sprintResults: [
        { position: 1, points: 8, status: "Finished", driver: { fullName: "Oscar Piastri", code: "PIA" }, constructor: { name: "McLaren" } },
        { position: 4, points: 5, status: "Finished", driver: { fullName: "Charles Leclerc", code: "LEC" }, constructor: { name: "Ferrari" } },
      ],
      bestKnownLap: {
        lapTimeMs: 78123,
        driver: { fullName: "Charles Leclerc", code: "LEC" },
        session: { name: "Race", raceWeekend: { name: "Australian Grand Prix", season: { year: 2024 } } },
      },
    })

    expect(model.hero.grandPrixTitle).toBe("Australian Grand Prix")
    expect(model.hero.circuitName).toBe("Albert Park Grand Prix Circuit")
    expect(model.circuit.lengthLabel).toBe("5.278 km")
    expect(model.circuit.officialImagePath).toBe("/assets/circuits/australia.webp")
    expect(model.circuit.bestLapLabel).toBe("1:18.123")
    expect(model.circuit.bestLapDriverName).toBe("Charles Leclerc")
    expect(model.circuit.raceLapsLabel).toBe("58 tours")
    expect(model.circuit.raceDurationLabel).toBe("1h 32m 03s")
    expect(model.qualifying.hasData).toBe(true)
    expect(model.qualifying.gridRows[0]?.left?.qualifyingTimeLabel).toBe("1:15.096")
    expect(model.qualifying.gridRows[0]?.right?.gapToPoleLabel).toBe("+0.114s")
    expect(model.race.podium.length).toBe(2)
    expect(model.race.podium[0]?.driverName).toBe("Lando Norris")
    expect(model.race.classification[0]?.position).toBe(4)
    expect(model.sprint.hasData).toBe(true)
    expect(model.sprint.podium[0]?.driverCode).toBe("PIA")
    expect(model.sprint.classification[0]?.driverCode).toBe("LEC")
  })
})
