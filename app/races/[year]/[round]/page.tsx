import Image from "next/image"
import { notFound } from "next/navigation"

import { getRaceWeekendPage } from "@/lib/services/race-weekend-page.service"
import { StartingGridClient } from "./starting-grid-client"

function CircuitFact({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string | null
}) {
  return (
    <div className="rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-center">
      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[var(--home-muted)]">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
      {detail ? (
        <p className="mt-2 text-[0.72rem] uppercase tracking-[0.12em] text-[var(--home-muted-strong)]">
          {detail}
        </p>
      ) : null}
    </div>
  )
}

function CircuitTrace({
  path,
  imagePath,
  alt,
}: {
  path: string
  imagePath: string | null
  alt: string
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl justify-center rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:px-8 sm:py-10">
      {imagePath ? (
        <div className="relative h-[18rem] w-full max-w-[52rem] sm:h-[20rem]">
          <Image
            src={imagePath}
            alt={alt}
            fill
            sizes="(max-width: 768px) 92vw, 52rem"
            className="object-contain scale-[1.18] [filter:brightness(1.14)_contrast(1.22)_saturate(1.02)_drop-shadow(0_0_14px_rgba(140,225,255,0.16))]"
          />
        </div>
      ) : (
        <svg viewBox="0 0 210 130" className="h-[18rem] w-full max-w-[52rem] sm:h-[20rem]">
          <defs>
            <linearGradient id="track-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8ce1ff" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ff8f3d" />
            </linearGradient>
          </defs>
          <path
            d={path}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill="none"
            stroke="url(#track-glow)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_16px_rgba(140,225,255,0.28)]"
          />
        </svg>
      )}
    </div>
  )
}

function PodiumCard({
  item,
  className,
}: {
  item: {
    position: number | null
    driverName: string
    driverCode: string | null
    constructorName: string
    points: number
    status: string | null
  }
  className?: string
}) {
  const isWinner = item.position === 1
  const isSecond = item.position === 2
  const isThird = item.position === 3

  const accentClassName = isWinner
    ? "border-[rgba(255,215,128,0.45)] bg-[linear-gradient(180deg,rgba(255,215,128,0.2),rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_24px_80px_rgba(255,200,90,0.18)]"
    : isSecond
      ? "border-[rgba(196,205,219,0.22)] bg-[linear-gradient(180deg,rgba(196,205,219,0.12),rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
      : isThird
        ? "border-[rgba(205,127,82,0.24)] bg-[linear-gradient(180deg,rgba(205,127,82,0.13),rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
        : "border-[rgba(255,255,255,0.09)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]"

  const rankClassName = isWinner
    ? "text-[#ffcc66]"
    : isSecond
      ? "text-[#cfd8e6]"
      : isThird
        ? "text-[#d49a73]"
        : "text-[var(--home-orange)]"

  const nameClassName = isWinner ? "text-[#ffe7a6]" : "text-white"

  return (
    <article className={`flex h-full flex-col rounded-[1.7rem] border p-5 ${accentClassName} ${className ?? ""}`}>
      <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.24em] ${rankClassName}`}>
        P{item.position ?? "-"}
      </p>
      <h3 className={`mt-4 text-2xl font-semibold ${nameClassName}`}>{item.driverName}</h3>
      <p className="mt-2 text-[0.74rem] uppercase tracking-[0.16em] text-[var(--home-muted-strong)]">
        {item.driverCode ?? "DRV"} · {item.constructorName}
      </p>
      <div className="mt-auto flex items-end justify-between gap-4 pt-8">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--home-muted)]">
            Points
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">{item.points}</p>
        </div>
        <p className="text-right text-[0.72rem] uppercase tracking-[0.16em] text-[var(--home-muted)]">
          {item.status ?? "Classement valide"}
        </p>
      </div>
    </article>
  )
}

function Podium({
  items,
}: {
  items: Array<{
    position: number | null
    driverName: string
    driverCode: string | null
    constructorName: string
    points: number
    status: string | null
  }>
}) {
  const first = items.find((item) => item.position === 1) ?? null
  const second = items.find((item) => item.position === 2) ?? null
  const third = items.find((item) => item.position === 3) ?? null

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:items-end">
      <div className="lg:order-1">{second ? <PodiumCard item={second} className="min-h-[15.5rem] lg:min-h-[16.5rem]" /> : null}</div>
      <div className="lg:order-2">{first ? <PodiumCard item={first} className="min-h-[17rem] lg:min-h-[18.5rem]" /> : null}</div>
      <div className="lg:order-3">{third ? <PodiumCard item={third} className="min-h-[13.75rem] lg:min-h-[14.75rem]" /> : null}</div>
    </div>
  )
}

function ClassificationTable({
  rows,
}: {
  rows: Array<{
    position: number | null
    driverName: string
    driverCode: string | null
    constructorName: string
    points: number
    status: string | null
  }>
}) {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]">
      <div className="grid grid-cols-[5rem_1.4fr_1fr_5rem] gap-3 border-b border-[rgba(255,255,255,0.06)] px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--home-muted)]">
        <span>Pos.</span>
        <span>Pilote</span>
        <span>Ecurie</span>
        <span className="text-right">Pts</span>
      </div>
      <div className="grid">
        {rows.map((row) => (
          <div
            key={`${row.position}-${row.driverCode ?? row.driverName}`}
            className="grid grid-cols-[5rem_1.4fr_1fr_5rem] gap-3 border-b border-[rgba(255,255,255,0.05)] px-5 py-4 last:border-b-0"
          >
            <span className="text-sm font-semibold text-white">P{row.position ?? "-"}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{row.driverName}</p>
              <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-[var(--home-muted)]">
                {row.driverCode ?? "DRV"} {row.status ? `· ${row.status}` : ""}
              </p>
            </div>
            <p className="truncate text-sm text-[var(--home-muted-strong)]">{row.constructorName}</p>
            <p className="text-right text-sm font-semibold text-white">{row.points}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultsSection({
  title,
  eyebrow,
  podium,
  classification,
}: {
  title: string
  eyebrow: string
  podium: Array<{
    position: number | null
    driverName: string
    driverCode: string | null
    constructorName: string
    points: number
    status: string | null
  }>
  classification: Array<{
    position: number | null
    driverName: string
    driverCode: string | null
    constructorName: string
    points: number
    status: string | null
  }>
}) {
  return (
    <section className="rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(13,16,22,0.88),rgba(8,10,14,0.94))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--home-muted)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-4xl font-[family-name:var(--font-display)] leading-none tracking-[-0.04em] text-white">
        {title}
      </h2>
      {podium.length ? (
        <div className="mt-8">
          <Podium items={podium} />
        </div>
      ) : null}
      {classification.length ? (
        <div className="mt-6">
          <ClassificationTable rows={classification} />
        </div>
      ) : null}
    </section>
  )
}

export default async function RaceWeekendPage({
  params,
}: {
  params: Promise<{ year: string; round: string }>
}) {
  const { year: yearParam, round: roundParam } = await params
  const year = Number(yearParam)
  const round = Number(roundParam)

  const page = await getRaceWeekendPage(year, round)

  if (!page) {
    notFound()
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2.3rem] border border-[rgba(255,255,255,0.08)] bg-[radial-gradient(circle_at_top,rgba(77,214,255,0.12),transparent_26%),linear-gradient(180deg,rgba(12,15,21,0.95),rgba(7,9,13,0.98))] px-6 py-10 text-center shadow-[0_32px_120px_rgba(0,0,0,0.36)] sm:px-10">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--home-orange)]">
          {page.hero.roundLabel} · {page.hero.seasonLabel}
        </p>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl leading-none tracking-[-0.05em] text-white sm:text-7xl">
          {page.hero.grandPrixTitle}
        </h1>
        <p className="mt-4 text-xl font-semibold text-[var(--home-muted-strong)] sm:text-2xl">
          {page.hero.circuitName}
        </p>
        <p className="mt-3 text-[0.82rem] uppercase tracking-[0.22em] text-[var(--home-muted)]">
          {page.hero.dateLabel} · {page.hero.locationLabel}
        </p>

        <div className="mt-10">
          <CircuitTrace
            path={page.circuit.tracePath}
            imagePath={page.circuit.officialImagePath}
            alt={`Trace officiel du ${page.hero.circuitName}`}
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <CircuitFact label="Longueur" value={page.circuit.lengthLabel} />
          <CircuitFact
            label="Meilleur tour connu"
            value={page.circuit.bestLapLabel}
            detail={page.circuit.bestLapDriverName}
          />
          <CircuitFact
            label="Course"
            value={page.circuit.raceLapsLabel}
            detail={page.circuit.raceDurationLabel}
          />
        </div>
      </section>

      <section className="rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(13,16,22,0.88),rgba(8,10,14,0.94))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
        <div className="mt-8">
          {page.qualifying.hasData ? (
            <StartingGridClient rows={page.qualifying.gridRows} />
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.015)] px-5 py-10 text-center text-sm text-[var(--home-muted)]">
              Aucune donnee qualification disponible pour ce week-end.
            </div>
          )}
        </div>
      </section>

      {page.sprint.hasData ? (
        <ResultsSection
          title="Sprint"
          eyebrow="Sprint Session"
          podium={page.sprint.podium}
          classification={page.sprint.classification}
        />
      ) : null}

      <ResultsSection
        title="Resultats de course"
        eyebrow="Race Results"
        podium={page.race.podium}
        classification={page.race.classification}
      />
    </main>
  )
}
