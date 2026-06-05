import { describe, it, expect } from "vitest"
import { buildDriverPageModel } from "../lib/services/driver-page.service"

const driverFixture = {
  code: "NOR",
  fullName: "Lando Norris",
  firstName: "Lando",
  lastName: "Norris",
  nationality: "British",
  permanentNumber: 4,
  imagePath: "/assets/drivers/nor.jpg",
  heroImagePath: "/assets/drivers/hero/nor.webp",
}

const standingFixture = {
  position: 1,
  points: 133,
  wins: 3,
  constructor: {
    name: "McLaren",
    slug: "mclaren",
    logoPath: "/assets/teams/mclaren.webp",
  },
}

describe("driver-page service", () => {
  it("builds a driver page model with current season results", () => {
    const model = buildDriverPageModel({
      driver: driverFixture,
      standing: standingFixture,
      raceResults: [
        {
          seasonYear: 2025,
          raceWeekend: { round: 1, name: "Australian Grand Prix", slug: "2025-01-australian-grand-prix" },
          finishPosition: 1,
          points: 25,
        },
        {
          seasonYear: 2025,
          raceWeekend: { round: 2, name: "Chinese Grand Prix", slug: "2025-02-chinese-grand-prix" },
          finishPosition: 2,
          points: 18,
        },
        {
          seasonYear: 2024,
          raceWeekend: { round: 22, name: "Abu Dhabi Grand Prix", slug: "2024-22-abu-dhabi-grand-prix" },
          finishPosition: 2,
          points: 18,
        },
      ],
    })

    expect(model.hero.name).toBe("Lando Norris")
    expect(model.hero.imagePath).toBe("/assets/drivers/hero/nor.webp")
    expect(model.hero.teamName).toBe("McLaren")
    expect(model.hero.teamHref).toBe("/teams/mclaren")
    expect(model.hero.teamColor).toBe("#ff8000")
    expect(model.summary.position).toBe(1)
    expect(model.availableSeasons).toEqual([2025, 2024])
    expect(model.selectedSeason).toBe(2025)
    expect(model.results.length).toBe(2)
    expect(model.results[0]?.seasonYear).toBe(2025)
    expect(model.results[0]?.entries[0]?.raceName).toBe("Australian Grand Prix")
    expect(model.results[0]?.entries[0]?.roundLabel).toBe("1er GP")
    expect(model.results[0]?.entries[0]?.raceHref).toBe("/races/2025/1")
    expect(model.results[0]?.entries[1]?.roundLabel).toBe("2e GP")
    expect(model.results[1]?.seasonYear).toBe(2024)
  })

  it("filters results by selected season", () => {
    const model = buildDriverPageModel({
      driver: driverFixture,
      standing: standingFixture,
      raceResults: [
        {
          seasonYear: 2025,
          raceWeekend: { round: 1, name: "Australian Grand Prix", slug: "2025-01-australian-grand-prix" },
          finishPosition: 1,
          points: 25,
        },
        {
          seasonYear: 2024,
          raceWeekend: { round: 22, name: "Abu Dhabi Grand Prix", slug: "2024-22-abu-dhabi-grand-prix" },
          finishPosition: 2,
          points: 18,
        },
      ],
      selectedSeason: 2024,
    })

    expect(model.selectedSeason).toBe(2024)
    expect(model.visibleResults.length).toBe(1)
    expect(model.visibleResults[0]?.seasonYear).toBe(2024)
  })

  it("falls back to first available season when selectedSeason is not in results", () => {
    const model = buildDriverPageModel({
      driver: driverFixture,
      standing: standingFixture,
      raceResults: [
        {
          seasonYear: 2025,
          raceWeekend: { round: 1, name: "Australian Grand Prix", slug: "2025-01-australian-grand-prix" },
          finishPosition: 1,
          points: 25,
        },
      ],
      selectedSeason: 2020,
    })

    expect(model.selectedSeason).toBe(2025)
  })

  it("returns null selectedSeason and empty visibleResults when raceResults is empty", () => {
    const model = buildDriverPageModel({
      driver: driverFixture,
      standing: standingFixture,
      raceResults: [],
    })

    expect(model.availableSeasons).toHaveLength(0)
    expect(model.selectedSeason).toBeNull()
    expect(model.visibleResults).toHaveLength(0)
  })

  it("uses imagePath as fallback when heroImagePath is null", () => {
    const model = buildDriverPageModel({
      driver: { ...driverFixture, heroImagePath: null },
      standing: standingFixture,
      raceResults: [],
    })

    expect(model.hero.imagePath).toBe(driverFixture.imagePath)
  })

  it("returns null team info when standing is null", () => {
    const model = buildDriverPageModel({
      driver: driverFixture,
      standing: null,
      raceResults: [],
    })

    expect(model.hero.teamName).toBeNull()
    expect(model.hero.teamHref).toBeNull()
    expect(model.hero.teamLogoPath).toBeNull()
    expect(model.summary.position).toBeNull()
    expect(model.summary.points).toBe(0)
    expect(model.summary.wins).toBe(0)
  })
})
