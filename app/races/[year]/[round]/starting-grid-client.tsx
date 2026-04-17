"use client"

import { useState } from "react"

import { getGridSlotLayout } from "@/lib/race-grid-layout"
import { getTeamColor, withAlpha } from "@/lib/team-colors"

type GridSlot = {
  position: number
  driverName: string
  driverCode: string | null
  constructorName: string
  constructorSlug: string | null
  qualifyingTimeLabel: string | null
  gapToPoleLabel: string | null
  gapToAheadLabel: string | null
}

type GridRow = {
  left: GridSlot | null
  right: GridSlot | null
}

const DISPLAY_OPTIONS = [
  { key: "qualifyingTimeLabel", label: "Temps qualif", caption: "Temps" },
  { key: "gapToPoleLabel", label: "Temps au 1er", caption: "Gap 1er" },
  { key: "gapToAheadLabel", label: "Temps au precedent", caption: "Gap precedent" },
] as const

type DisplayKey = (typeof DISPLAY_OPTIONS)[number]["key"]

export function StartingGridClient({ rows }: { rows: GridRow[] }) {
  const [displayMode, setDisplayMode] = useState<DisplayKey>("qualifyingTimeLabel")
  const activeOption = DISPLAY_OPTIONS.find((option) => option.key === displayMode) ?? DISPLAY_OPTIONS[0]

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--home-muted)]">
          Qualification
        </p>
        <div className="inline-flex flex-wrap rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-1">
          {DISPLAY_OPTIONS.map((option) => {
            const active = option.key === displayMode

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setDisplayMode(option.key)}
                className={`rounded-full px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] transition ${
                  active
                    ? "bg-[rgba(77,214,255,0.16)] text-white shadow-[0_0_18px_rgba(77,214,255,0.18)]"
                    : "text-[var(--home-muted)] hover:text-white"
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <h2 className="text-4xl font-[family-name:var(--font-display)] leading-none tracking-[-0.04em] text-white">
        Grille de depart
      </h2>

      <div className="overflow-hidden rounded-[1.7rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(18,21,28,0.98),rgba(8,10,14,0.99))] shadow-[0_30px_90px_rgba(0,0,0,0.38)]">
        <div
          className="h-5 w-full border-b border-[rgba(255,255,255,0.14)]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg,#ffffff 0 28px,#0d1117 28px 56px)",
          }}
        />
        <div
          className="h-5 w-full border-b border-[rgba(255,255,255,0.1)]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg,#0d1117 0 28px,#ffffff 28px 56px)",
          }}
        />

        <div className="relative overflow-hidden px-4 pb-12 pt-5 sm:px-6 sm:pb-14">
          <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.16),rgba(255,255,255,0))] md:block" />
          <div
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                "linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0)),radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent 28%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.03),transparent 24%)",
            }}
          />

          <div className="relative grid gap-6 md:gap-10">
            {rows.map((row, index) => (
              <div key={`grid-${index}`} className="grid gap-3 md:grid-cols-2">
                {[row.left, row.right].map((slot, slotIndex) => {
                  if (!slot) {
                    return (
                      <div
                        key={`empty-${index}-${slotIndex}`}
                        className="rounded-[1.35rem] border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.015)]"
                      />
                    )
                  }

                  const layout = getGridSlotLayout(slot.position)
                  const teamColor = getTeamColor(slot.constructorSlug)
                  const displayedValue = slot[displayMode] ?? "Indisponible"

                  return (
                    <article
                      key={`${slot.position}-${slot.driverCode ?? slot.driverName}`}
                      className={`relative overflow-hidden rounded-[1.35rem] border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] px-5 py-4 transition-transform ${layout.offsetClassName} ${layout.rowOffsetClassName}`}
                    >
                      <div className="pointer-events-none absolute inset-0">
                        <div
                          className="absolute inset-y-0 left-0 w-5"
                          style={{
                            background: `linear-gradient(180deg, ${withAlpha(teamColor, 0.9)}, ${withAlpha(teamColor, 0.18)})`,
                          }}
                        />
                      </div>

                      <div className="relative flex items-start justify-between gap-4 pl-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_10px_currentColor]"
                              style={{ color: teamColor, backgroundColor: teamColor }}
                            />
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--home-cyan)]">
                              {layout.laneLabel} · {layout.side === "left" ? "Interieur" : "Exterieur"}
                            </p>
                          </div>
                          <p className="mt-3 text-2xl font-semibold text-white">P{slot.position}</p>
                          <p className="mt-2 truncate text-base font-semibold text-white">{slot.driverName}</p>
                          <p className="mt-1 text-[0.72rem] uppercase tracking-[0.16em] text-[var(--home-muted-strong)]">
                            {slot.driverCode ?? "DRV"} · {slot.constructorName}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[var(--home-muted)]">
                            {activeOption.caption}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">{displayedValue}</p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
