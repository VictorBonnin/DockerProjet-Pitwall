import assert from "node:assert/strict"

export async function runTeamPageServiceTests() {
  const { buildTeamPageModel } = await import("../lib/services/team-page.service")

  const model = buildTeamPageModel({
    team: {
      name: "McLaren",
      slug: "mclaren",
      logoPath: "/assets/teams/mclaren.webp",
      nationality: "British",
    },
    standing: {
      position: 1,
      points: 241,
      wins: 5,
    },
    drivers: [
      {
        code: "NOR",
        fullName: "Lando Norris",
        imagePath: "/assets/drivers/nor.webp",
      },
    ],
  })

  assert.equal(model.hero.name, "McLaren")
  assert.equal(model.hero.logoPath, "/assets/teams/mclaren.webp")
  assert.equal(model.summary.position, 1)
  assert.equal(model.drivers[0]?.href, "/drivers/NOR")
}
