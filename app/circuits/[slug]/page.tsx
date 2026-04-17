import Image from "next/image"
import { notFound } from "next/navigation"

import { getCircuitPageData } from "@/lib/services/circuit-page.service"

function CircuitHeroTrace({
  imagePath,
  tracePath,
  alt,
}: {
  imagePath: string | null
  tracePath: string
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
            <linearGradient id="circuit-page-track-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8ce1ff" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ff8f3d" />
            </linearGradient>
          </defs>
          <path
            d={tracePath}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={tracePath}
            fill="none"
            stroke="url(#circuit-page-track-glow)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}

export default async function CircuitPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await getCircuitPageData(slug)

  if (!page) {
    notFound()
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2.3rem] border border-[rgba(255,255,255,0.08)] bg-[radial-gradient(circle_at_top,rgba(77,214,255,0.12),transparent_26%),linear-gradient(180deg,rgba(12,15,21,0.95),rgba(7,9,13,0.98))] px-6 py-10 text-center shadow-[0_32px_120px_rgba(0,0,0,0.36)] sm:px-10">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--home-cyan)]">
          Circuit Detail
        </p>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl leading-none tracking-[-0.05em] text-white sm:text-7xl">
          {page.hero.circuitName}
        </h1>
        <p className="mt-4 text-xl font-semibold text-[var(--home-muted-strong)] sm:text-2xl">
          {page.hero.locationLabel}
        </p>

        <div className="mt-10">
          <CircuitHeroTrace
            imagePath={page.hero.officialImagePath}
            tracePath={page.hero.tracePath}
            alt={`Trace du ${page.hero.circuitName}`}
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-center">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[var(--home-muted)]">
              Longueur
            </p>
            <p className="mt-3 text-lg font-semibold text-white">{page.hero.lengthLabel}</p>
          </div>
          <div className="rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-center">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[var(--home-muted)]">
              Editions connues
            </p>
            <p className="mt-3 text-lg font-semibold text-white">{page.hero.editionsCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,12,17,0.9)] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <p className="text-[0.74rem] font-semibold uppercase tracking-[0.28em] text-[var(--home-cyan)]">
          Winners Podium
        </p>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-none tracking-[-0.04em] text-white">
          Les pilotes les plus victorieux
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {page.mostWins.map((entry) => (
            <article
              key={`${entry.rank}-${entry.driverName}`}
              className="rounded-[1.7rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5"
            >
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--home-cyan)]">
                P{entry.rank}
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-white">{entry.driverName}</h3>
              <p className="mt-2 text-[0.74rem] uppercase tracking-[0.16em] text-[var(--home-muted-strong)]">
                {entry.driverCode ?? "DRV"}
              </p>
              <p className="mt-8 text-4xl font-semibold text-white">{entry.wins}</p>
              <p className="mt-2 text-[0.72rem] uppercase tracking-[0.18em] text-[var(--home-muted)]">
                victoires
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,12,17,0.9)] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <p className="text-[0.74rem] font-semibold uppercase tracking-[0.28em] text-[var(--home-cyan)]">
          History
        </p>
        <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-none tracking-[-0.04em] text-white">
          Historique des victoires
        </h2>

        <div className="mt-8 grid gap-4">
          {page.history.map((item) => (
            <a
              key={`${item.year}-${item.href}`}
              href={item.href}
              className="flex flex-col gap-4 rounded-[1.5rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-5 transition hover:border-[rgba(77,214,255,0.2)] hover:bg-[rgba(255,255,255,0.04)] md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] text-lg font-semibold text-white">
                  {item.year}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.winnerName}</p>
                  <p className="mt-1 text-[0.74rem] uppercase tracking-[0.14em] text-[var(--home-muted)]">
                    {item.winnerCode ?? "DRV"} {item.constructorName ? `• ${item.constructorName}` : ""}
                  </p>
                </div>
              </div>

              <div className="md:text-right">
                <p className="text-sm font-semibold text-white">{item.grandPrixName}</p>
                <p className="mt-1 text-[0.74rem] uppercase tracking-[0.14em] text-[var(--home-muted)]">
                  {item.dateLabel}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
