import { getRacesIndexData } from "@/lib/services/races-index.service"

export default async function RacesPage() {
  const data = await getRacesIndexData(2025)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,12,17,0.9)] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <p className="text-[0.74rem] font-semibold uppercase tracking-[0.28em] text-[var(--home-cyan)]">
          Season Calendar
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-none tracking-[-0.05em] text-white">
          Saison {data.year}
        </h1>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-[1.5rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,12,17,0.88)] p-5 transition hover:border-[rgba(77,214,255,0.2)] hover:bg-[rgba(255,255,255,0.04)]"
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--home-muted)]">
              Round {item.round}
            </p>
            <h2 className="mt-3 text-2xl font-[family-name:var(--font-display)] text-white">
              {item.name}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--home-muted-strong)]">
              {item.locationLabel} • {item.circuitName}
            </p>
            <div className="mt-4 flex items-center justify-between text-sm text-[var(--home-muted)]">
              <span>{item.dateLabel}</span>
              <span>{item.status}</span>
            </div>
          </a>
        ))}
      </section>
    </main>
  )
}
