import assert from "node:assert/strict"

export async function runRaceGridLayoutTests() {
  const {
    getGridSlotLayout,
  } = await import("../lib/race-grid-layout")

  assert.deepEqual(getGridSlotLayout(1), {
    laneLabel: "Ligne 1",
    side: "left",
    offsetClassName: "md:w-[78%] md:-translate-x-3 md:justify-self-start",
    rowOffsetClassName: "",
  })

  assert.deepEqual(getGridSlotLayout(2), {
    laneLabel: "Ligne 1",
    side: "right",
    offsetClassName: "md:w-[78%] md:translate-x-3 md:justify-self-end",
    rowOffsetClassName: "md:translate-y-12",
  })

  assert.deepEqual(getGridSlotLayout(7), {
    laneLabel: "Ligne 4",
    side: "left",
    offsetClassName: "md:w-[78%] md:-translate-x-3 md:justify-self-start",
    rowOffsetClassName: "",
  })

  assert.deepEqual(getGridSlotLayout(8), {
    laneLabel: "Ligne 4",
    side: "right",
    offsetClassName: "md:w-[78%] md:translate-x-3 md:justify-self-end",
    rowOffsetClassName: "md:translate-y-12",
  })
}
