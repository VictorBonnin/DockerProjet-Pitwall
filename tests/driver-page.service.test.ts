import assert from "node:assert/strict"

export async function runDriverPageServiceTests() {
  const { buildDriverPageModel } = await import("../lib/services/driver-page.service")

  const model = buildDriverPageModel({
    driver: {
      code: "NOR",
      fullName: "Lando Norris",
      firstName: "Lando",
      lastName: "Norris",
      nationality: "British",
      permanentNumber: 4,
      imagePath: "/assets/drivers/nor.jpg",
      heroImagePath: "/assets/drivers/hero/nor.webp",
    },
    standing: {
      position: 1,
      points: 133,
      wins: 3,
      constructor: {
        name: "McLaren",
        slug: "mclaren",
        logoPath: "/assets/teams/mclaren.webp",
      },
    },
    raceResults: [
      {
        seasonYear: 2025,
        raceWeekend: {
          round: 1,
          name: "Australian Grand Prix",
          slug: "2025-01-australian-grand-prix",
        },
        finishPosition: 1,
        points: 25,
      },
      {
        seasonYear: 2025,
        raceWeekend: {
          round: 2,
          name: "Chinese Grand Prix",
          slug: "2025-02-chinese-grand-prix",
        },
        finishPosition: 2,
        points: 18,
      },
      {
        seasonYear: 2024,
        raceWeekend: {
          round: 22,
          name: "Abu Dhabi Grand Prix",
          slug: "2024-22-abu-dhabi-grand-prix",
        },
        finishPosition: 2,
        points: 18,
      },
    ],
  })

  assert.equal(model.hero.name, "Lando Norris")
  assert.equal(model.hero.imagePath, "/assets/drivers/hero/nor.webp")
  assert.equal(model.hero.teamName, "McLaren")
  assert.equal(model.hero.teamHref, "/teams/mclaren")
  assert.equal(model.hero.teamColor, "#ff8000")
  assert.equal(model.summary.position, 1)
  assert.deepEqual(model.availableSeasons, [2025, 2024])
  assert.equal(model.selectedSeason, 2025)
  assert.equal(model.results.length, 2)
  assert.equal(model.results[0]?.seasonYear, 2025)
  assert.equal(model.results[0]?.entries[0]?.raceName, "Australian Grand Prix")
  assert.equal(model.results[0]?.entries[0]?.roundLabel, "1er GP")
  assert.equal(model.results[0]?.entries[0]?.raceHref, "/races/2025/1")
  assert.equal(model.results[0]?.entries[1]?.roundLabel, "2e GP")
  assert.equal(model.results[1]?.seasonYear, 2024)

  const filteredModel = buildDriverPageModel({
    driver: {
      code: "NOR",
      fullName: "Lando Norris",
      firstName: "Lando",
      lastName: "Norris",
      nationality: "British",
      permanentNumber: 4,
      imagePath: "/assets/drivers/nor.jpg",
      heroImagePath: "/assets/drivers/hero/nor.webp",
    },
    standing: {
      position: 1,
      points: 133,
      wins: 3,
      constructor: {
        name: "McLaren",
        slug: "mclaren",
        logoPath: "/assets/teams/mclaren.webp",
      },
    },
    raceResults: [
      {
        seasonYear: 2025,
        raceWeekend: {
          round: 1,
          name: "Australian Grand Prix",
          slug: "2025-01-australian-grand-prix",
        },
        finishPosition: 1,
        points: 25,
      },
      {
        seasonYear: 2024,
        raceWeekend: {
          round: 22,
          name: "Abu Dhabi Grand Prix",
          slug: "2024-22-abu-dhabi-grand-prix",
        },
        finishPosition: 2,
        points: 18,
      },
    ],
    selectedSeason: 2024,
  })

  assert.equal(filteredModel.selectedSeason, 2024)
  assert.equal(filteredModel.visibleResults.length, 1)
  assert.equal(filteredModel.visibleResults[0]?.seasonYear, 2024)
}
