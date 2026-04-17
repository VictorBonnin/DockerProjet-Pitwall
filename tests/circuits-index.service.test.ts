import assert from "node:assert/strict"

export async function runCircuitsIndexServiceTests() {
  const { buildCircuitsIndexModel } = await import("../lib/services/circuits-index.service")

  const model = buildCircuitsIndexModel({
    year: 2025,
    weekends: [
      {
        round: 1,
        name: "Australian Grand Prix",
        country: "Australia",
        startDate: new Date("2025-03-14T00:00:00Z"),
        circuit: {
          name: "Albert Park Grand Prix Circuit",
          locality: "Melbourne",
        },
      },
    ],
  })

  assert.equal(model.year, 2025)
  assert.equal(model.items[0]?.href, "/circuits/albert-park-grand-prix-circuit")
  assert.equal(model.items[0]?.latestRaceHref, "/races/2025/1")
  assert.equal(model.items[0]?.circuitSlug, "albert-park-grand-prix-circuit")
  assert.equal(model.items[0]?.locationLabel, "Melbourne, Australia")
  assert.equal(model.items[0]?.officialImagePath, "/assets/circuits/australia.webp")
  assert.equal(model.items[0]?.lengthLabel, "5.278 km")

  const { buildCircuitsIndexModel: buildAliasModel } = await import("../lib/services/circuits-index.service")
  const aliasModel = buildAliasModel({
    year: 2025,
    weekends: [
      {
        round: 16,
        name: "Italian Grand Prix",
        country: "Italy",
        startDate: new Date("2025-09-05T00:00:00Z"),
        circuit: {
          name: "Autodromo Nazionale di Monza",
          locality: "Monza",
        },
      },
      {
        round: 18,
        name: "Mexico City Grand Prix",
        country: "Mexico",
        startDate: new Date("2025-10-24T00:00:00Z"),
        circuit: {
          name: "Autódromo Hermanos Rodríguez",
          locality: "Mexico City",
        },
      },
      {
        round: 21,
        name: "Sao Paulo Grand Prix",
        country: "Brazil",
        startDate: new Date("2025-11-07T00:00:00Z"),
        circuit: {
          name: "Autódromo José Carlos Pace",
          locality: "Sao Paulo",
        },
      },
      {
        round: 23,
        name: "Qatar Grand Prix",
        country: "Qatar",
        startDate: new Date("2025-11-28T00:00:00Z"),
        circuit: {
          name: "Losail International Circuit",
          locality: "Lusail",
        },
      },
    ],
  })

  assert.equal(aliasModel.items[0]?.officialImagePath, "/assets/circuits/italy.webp")
  assert.equal(aliasModel.items[1]?.officialImagePath, "/assets/circuits/mexico.webp")
  assert.equal(aliasModel.items[2]?.officialImagePath, "/assets/circuits/brazil.webp")
  assert.equal(aliasModel.items[3]?.officialImagePath, "/assets/circuits/qatar.webp")
}
