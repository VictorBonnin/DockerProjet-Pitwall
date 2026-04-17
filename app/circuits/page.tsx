import Image from "next/image"
import { getCircuitsIndexData } from "@/lib/services/circuits-index.service"

function CircuitTraceCard({
  imagePath,
  tracePath,
  alt,
}: {
  imagePath: string | null
  tracePath: string
  alt: string
}) {
  return (
    <div className="flex h-[11rem] items-center justify-center overflow-hidden rounded-[1.5rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-5">
      {imagePath ? (
        <div className="relative h-full w-full">
          <Image
            src={imagePath}
            alt={alt}
            fill
            sizes="(max-width: 768px) 90vw, 28rem"
            className="object-contain scale-[1.12] [filter:brightness(1.12)_contrast(1.18)_drop-shadow(0_0_12px_rgba(140,225,255,0.14))]"
          />
        </div>
      ) : (
        <svg viewBox="0 0 210 130" className="h-full w-full max-w-[28rem]">
          <defs>
            <linearGradient id="circuits-track-glow" x1="0%" y1="0%" x2="100%" y2="100%">
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
            stroke="url(#circuits-track-glow)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}

export default async function CircuitsPage() {
  const data = await getCircuitsIndexData(2025)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,12,17,0.9)] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <p className="text-[0.74rem] font-semibold uppercase tracking-[0.28em] text-[var(--home-cyan)]">
          Circuit Gallery
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-none tracking-[-0.05em] text-white">
          Circuits {data.year}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--home-muted-strong)]">
          Tous les tracés de la saison avec leur format visuel officiel, leur longueur et un accès rapide au week-end de course.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="group rounded-[1.7rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,12,17,0.88)] p-5 transition hover:border-[rgba(77,214,255,0.2)] hover:bg-[rgba(255,255,255,0.04)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--home-cyan)]">
                  Round {item.round}
                </p>
                <h2 className="mt-3 text-2xl font-[family-name:var(--font-display)] leading-tight text-white">
                  {item.circuitName}
                </h2>
              </div>
              <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--home-muted)] transition group-hover:border-[rgba(77,214,255,0.2)] group-hover:text-white">
                {item.lengthLabel}
              </span>
            </div>

            <div className="mt-5">
              <CircuitTraceCard
                imagePath={item.officialImagePath}
                tracePath={item.tracePath}
                alt={`Trace du ${item.circuitName}`}
              />
            </div>

            <div className="mt-5">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--home-muted)]">
                {item.grandPrixName}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--home-muted-strong)]">
                {item.locationLabel}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm text-[var(--home-muted)]">
              <span>{item.dateLabel}</span>
              <span className="font-semibold uppercase tracking-[0.12em] text-white">Voir le circuit</span>
            </div>
          </a>
        ))}
      </section>
    </main>
  )
}
