import assert from "node:assert/strict"

export async function runRacesIndexServiceTests() {
  const { buildRacesIndexModel } = await import("../lib/services/races-index.service")

  const model = buildRacesIndexModel({
    year: 2025,
    weekends: [
      {
        round: 1,
        name: "Australian Grand Prix",
        slug: "2025-01-australian-grand-prix",
        status: "COMPLETED",
        country: "Australia",
        startDate: new Date("2025-03-14T00:00:00Z"),
        circuit: {
          name: "Albert Park",
          locality: "Melbourne",
        },
      },
    ],
  })

  assert.equal(model.year, 2025)
  assert.equal(model.items[0]?.href, "/races/2025/1")
  assert.equal(model.items[0]?.locationLabel, "Melbourne, Australia")
}
