import Image from "next/image"
import { notFound } from "next/navigation"

import { getDriverPageData } from "@/lib/services/driver-page.service"
import { withAlpha } from "@/lib/team-colors"

export default async function DriverPage({
  params,
  searchParams,
}: {
  params: Promise<{ driverCode: string }>
  searchParams: Promise<{ season?: string }>
}) {
  const { driverCode } = await params
  const { season } = await searchParams
  const selectedSeason = season ? Number.parseInt(season, 10) : undefined
  const page = await getDriverPageData(
    driverCode.toUpperCase(),
    2025,
    Number.isFinite(selectedSeason) ? selectedSeason : undefined,
  )

  if (!page) {
    notFound()
  }

  const accent = page.hero.teamColor
  const accentSoft = withAlpha(accent, 0.2)
  const accentFaint = withAlpha(accent, 0.08)
  const accentGlow = withAlpha(accent, 0.3)

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `radial-gradient(circle at top left, ${accentFaint}, transparent 24%), radial-gradient(circle at 82% 10%, ${withAlpha(accent, 0.12)}, transparent 20%)`,
      }}
    >
      <section className="items-stretch grid gap-5 lg:grid-cols-[320px_1fr]">
        <div
          className="overflow-hidden rounded-[2rem] border bg-[rgba(10,12,17,0.9)] p-4"
          style={{
            borderColor: accentSoft,
            boxShadow: `0 0 0 1px ${withAlpha(accent, 0.08)}, 0 24px 80px ${withAlpha(accent, 0.18)}`,
          }}
        >
          <div className="relative h-full min-h-[26rem] overflow-hidden rounded-[1.5rem] bg-[rgba(255,255,255,0.03)]">
            {page.hero.imagePath ? (
              <Image
                src={page.hero.imagePath}
                alt={page.hero.name}
                fill
                sizes="(max-width: 1024px) 100vw, 320px"
                className="object-cover object-top"
              />
            ) : (
              <div className="flex h-full min-h-[26rem] items-center justify-center text-[var(--home-muted)]">
                No image
              </div>
            )}
          </div>
        </div>

        <section
          className="rounded-[2rem] border bg-[rgba(10,12,17,0.9)] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.35)]"
          style={{
            borderColor: accentSoft,
            boxShadow: `0 0 0 1px ${withAlpha(accent, 0.08)}, 0 30px 100px rgba(0,0,0,0.35), 0 0 60px ${withAlpha(accent, 0.12)}`,
          }}
        >
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.28em]" style={{ color: accent }}>
            Driver Profile
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-none tracking-[-0.05em] text-white">
            {page.hero.name}
          </h1>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.2rem] border bg-[rgba(255,255,255,0.03)] p-4" style={{ borderColor: accentSoft }}>
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--home-muted)]">Code</p>
              <p className="mt-2 text-xl font-semibold text-white">{page.hero.code ?? "N/A"}</p>
            </div>
            <div className="rounded-[1.2rem] border bg-[rgba(255,255,255,0.03)] p-4" style={{ borderColor: accentSoft }}>
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--home-muted)]">Position</p>
              <p className="mt-2 text-xl font-semibold text-white">{page.summary.position ?? "-"}</p>
            </div>
            <div className="rounded-[1.2rem] border bg-[rgba(255,255,255,0.03)] p-4" style={{ borderColor: accentSoft }}>
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--home-muted)]">Points</p>
              <p className="mt-2 text-xl font-semibold text-white">{page.summary.points}</p>
            </div>
          </div>

          {page.hero.teamName && page.hero.teamHref ? (
            <a
              href={page.hero.teamHref}
              className="mt-6 inline-flex items-center gap-3 rounded-full border bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm font-semibold text-[var(--home-muted-strong)] transition hover:text-white"
              style={{ borderColor: accentSoft }}
            >
              {page.hero.teamLogoPath ? (
                <Image src={page.hero.teamLogoPath} alt={page.hero.teamName} width={56} height={22} className="max-h-[22px] w-auto object-contain" />
              ) : null}
              {page.hero.teamName}
            </a>
          ) : null}
        </section>
      </section>

      <section
        className="rounded-[2rem] border bg-[rgba(10,12,17,0.9)] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.35)]"
        style={{
          borderColor: accentSoft,
          boxShadow: `0 0 0 1px ${withAlpha(accent, 0.08)}, 0 30px 100px rgba(0,0,0,0.35), 0 0 50px ${withAlpha(accent, 0.1)}`,
        }}
      >
        <p className="text-[0.74rem] font-semibold uppercase tracking-[0.28em]" style={{ color: accent }}>
          Race Results
        </p>
        {page.availableSeasons.length ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {page.availableSeasons.map((seasonYear) => {
              const isActive = seasonYear === page.selectedSeason

              return (
                <a
                  key={seasonYear}
                  href={`/drivers/${page.hero.code ?? driverCode.toUpperCase()}?season=${seasonYear}`}
                  className="rounded-full border px-4 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] transition"
                  style={{
                    borderColor: isActive ? accentSoft : withAlpha(accent, 0.12),
                    backgroundColor: isActive ? accentFaint : "rgba(255,255,255,0.03)",
                    color: isActive ? accent : "rgba(212, 220, 231, 0.84)",
                    boxShadow: isActive ? `0 0 18px ${accentGlow}` : "none",
                  }}
                >
                  Saison {seasonYear}
                </a>
              )
            })}
          </div>
        ) : null}
        <div className="mt-5 grid gap-6">
          {page.visibleResults.map((season) => (
            <section key={season.seasonYear} className="grid gap-3">
              {season.entries.map((result) => (
                <a
                  key={result.raceHref}
                  href={result.raceHref}
                  className="group relative flex items-center gap-4 overflow-hidden rounded-[1.2rem] border px-4 py-3 transition duration-200 hover:-translate-y-[1px]"
                  style={{
                    borderColor: accentSoft,
                    background: `linear-gradient(135deg, ${withAlpha(accent, 0.08)}, rgba(255,255,255,0.025) 28%, rgba(255,255,255,0.03) 100%)`,
                    boxShadow: `0 0 0 1px ${withAlpha(accent, 0.06)}, inset 0 1px 0 rgba(255,255,255,0.03)`,
                  }}
                >
                  <span
                    className="absolute inset-y-2 left-2 w-1 rounded-full transition duration-200 group-hover:shadow-[0_0_18px_currentColor]"
                    style={{ backgroundColor: accent, color: accent }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                    {result.roundLabel} · {result.raceName}
                  </span>
                  <span
                    className="shrink-0 rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      borderColor: withAlpha(accent, 0.2),
                      backgroundColor: withAlpha(accent, 0.08),
                      color: accent,
                    }}
                  >
                    P{result.finishPosition ?? "-"}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-[var(--home-muted-strong)]">
                    {result.points} <span className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--home-muted)]">pts</span>
                  </span>
                </a>
              ))}
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}
