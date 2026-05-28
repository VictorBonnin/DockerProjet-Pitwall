import { describe, it, expect } from "vitest"
import { getTeamColor, withAlpha } from "../lib/team-colors"

describe("getTeamColor", () => {
  it("returns the correct color for a known team slug", () => {
    expect(getTeamColor("mclaren")).toBe("#ff8000")
    expect(getTeamColor("ferrari")).toBe("#ff3b30")
    expect(getTeamColor("mercedes")).toBe("#00d2be")
    expect(getTeamColor("red-bull")).toBe("#1e5bff")
    expect(getTeamColor("williams")).toBe("#64c4ff")
  })

  it("returns the fallback color for an unknown team slug", () => {
    expect(getTeamColor("unknown-team")).toBe("#4dd6ff")
  })

  it("returns the fallback color when slug is null", () => {
    expect(getTeamColor(null)).toBe("#4dd6ff")
  })

  it("returns the fallback color when slug is undefined", () => {
    expect(getTeamColor(undefined)).toBe("#4dd6ff")
  })

  it("returns the fallback color when slug is an empty string", () => {
    expect(getTeamColor("")).toBe("#4dd6ff")
  })
})

describe("withAlpha", () => {
  it("converts a hex color to rgba with the given alpha", () => {
    expect(withAlpha("#ff8000", 0.5)).toBe("rgba(255, 128, 0, 0.5)")
    expect(withAlpha("#00d2be", 1)).toBe("rgba(0, 210, 190, 1)")
  })

  it("strips the leading # before parsing", () => {
    expect(withAlpha("#ffffff", 0.8)).toBe("rgba(255, 255, 255, 0.8)")
    expect(withAlpha("#000000", 0.1)).toBe("rgba(0, 0, 0, 0.1)")
  })

  it("returns the fallback rgba when the hex is not 6 characters", () => {
    expect(withAlpha("#fff", 0.5)).toBe("rgba(77,214,255,0.5)")
    expect(withAlpha("invalid", 1)).toBe("rgba(77,214,255,1)")
  })
})
