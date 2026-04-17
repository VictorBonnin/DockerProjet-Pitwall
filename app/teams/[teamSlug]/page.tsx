import Image from "next/image"
import { notFound } from "next/navigation"

import { getTeamPageData } from "@/lib/services/team-page.service"

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>
}) {
  const { teamSlug } = await params
  const page = await getTeamPageData(teamSlug, 2025)

  if (!page) {
    notFound()
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,12,17,0.9)] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.74rem] font-semibold uppercase tracking-[0.28em] text-[var(--home-cyan)]">
              Team Profile
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-none tracking-[-0.05em] text-white">
              {page.hero.name}
            </h1>
          </div>
          <div className="flex h-[88px] w-[180px] items-center justify-center rounded-[1.5rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            {page.hero.logoPath ? (
              <Image src={page.hero.logoPath} alt={page.hero.name} width={160} height={48} className="max-h-[48px] w-auto object-contain" />
            ) : (
              <span className="text-sm text-[var(--home-muted)]">No logo</span>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--home-muted)]">Position</p>
            <p className="mt-2 text-xl font-semibold text-white">{page.summary.position ?? "-"}</p>
          </div>
          <div className="rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--home-muted)]">Points</p>
            <p className="mt-2 text-xl font-semibold text-white">{page.summary.points}</p>
          </div>
          <div className="rounded-[1.2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--home-muted)]">Wins</p>
            <p className="mt-2 text-xl font-semibold text-white">{page.summary.wins}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,12,17,0.9)] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <p className="text-[0.74rem] font-semibold uppercase tracking-[0.28em] text-[var(--home-orange)]">
          Drivers
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {page.drivers.map((driver) => (
            <a
              key={driver.href ?? driver.fullName}
              href={driver.href ?? "#"}
              className="grid grid-cols-[88px_1fr] items-center gap-4 rounded-[1.3rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 transition hover:border-[rgba(77,214,255,0.2)]"
            >
              <div className="overflow-hidden rounded-[1rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]">
                {driver.imagePath ? (
                  <Image src={driver.imagePath} alt={driver.fullName} width={88} height={112} className="h-[112px] w-[88px] object-cover object-top" />
                ) : (
                  <div className="flex h-[112px] w-[88px] items-center justify-center text-[var(--home-muted)]">N/A</div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{driver.fullName}</p>
                <p className="text-sm text-[var(--home-muted)]">{driver.code ?? "DRV"}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
