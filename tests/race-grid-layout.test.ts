import { describe, it, expect } from "vitest"
import { getGridSlotLayout } from "../lib/race-grid-layout"

describe("race-grid-layout", () => {
  it("returns left-side layout for odd positions", () => {
    expect(getGridSlotLayout(1)).toEqual({
      laneLabel: "Ligne 1",
      side: "left",
      offsetClassName: "md:w-[78%] md:-translate-x-3 md:justify-self-start",
      rowOffsetClassName: "",
    })
  })

  it("returns right-side layout with row offset for even positions", () => {
    expect(getGridSlotLayout(2)).toEqual({
      laneLabel: "Ligne 1",
      side: "right",
      offsetClassName: "md:w-[78%] md:translate-x-3 md:justify-self-end",
      rowOffsetClassName: "md:translate-y-12",
    })
  })

  it("returns correct lane for position 7", () => {
    expect(getGridSlotLayout(7)).toEqual({
      laneLabel: "Ligne 4",
      side: "left",
      offsetClassName: "md:w-[78%] md:-translate-x-3 md:justify-self-start",
      rowOffsetClassName: "",
    })
  })

  it("returns correct lane for position 8", () => {
    expect(getGridSlotLayout(8)).toEqual({
      laneLabel: "Ligne 4",
      side: "right",
      offsetClassName: "md:w-[78%] md:translate-x-3 md:justify-self-end",
      rowOffsetClassName: "md:translate-y-12",
    })
  })
})
