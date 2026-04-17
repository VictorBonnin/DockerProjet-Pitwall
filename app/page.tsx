import { HomeDriverStandings } from "./home-driver-standings"
import { HomeNeonReel } from "./home-neon-reel"
import { getHomePageData } from "@/lib/services/home-page.service"
import { withAlpha } from "@/lib/team-colors"

const numberFormatter = new Intl.NumberFormat("fr-FR")

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[1.8rem] border border-[rgba(255,255,255,0.09)] bg-[linear-gradient(180deg,rgba(13,16,22,0.88),rgba(9,11,15,0.94))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.38)] backdrop-blur">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--home-muted)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-none tracking-[-0.04em] text-white">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-[1.2rem] border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] p-5 text-sm leading-6 text-[var(--home-muted)]">
      {message}
    </div>
  )
}

function TeamRow({
  position,
  title,
  wins,
  drivers,
  points,
  href,
  logoPath,
  teamColor,
}: {
  position: number
  title: string
  wins: number
  drivers: Array<{
    fullName: string
    code: string | null
  }>
  points: number
  href: string | null
  logoPath: string | null
  teamColor: string
}) {
  const formattedDrivers = drivers.slice(0, 2).map((driver, index) => {
    const nameParts = driver.fullName.trim().split(/\s+/)
    const lastName = nameParts.pop() ?? driver.fullName
    const firstName = nameParts.join(" ")

    return {
      ...driver,
      slotLabel: index === 0 ? "Driver 1" : "Driver 2",
      firstName,
      lastName,
    }
  })

  const content = (
    <div
      className="team-pulse relative overflow-hidden rounded-[1rem] border px-3 py-3 transition hover:bg-[rgba(255,255,255,0.05)]"
      style={{
        ["--team-color" as string]: teamColor,
        ["--team-color-soft" as string]: withAlpha(teamColor, 0.22),
        ["--team-color-faint" as string]: withAlpha(teamColor, 0.08),
        borderColor: withAlpha(teamColor, 0.28),
        background: `linear-gradient(135deg, ${withAlpha(teamColor, 0.16)}, ${withAlpha(teamColor, 0.08)} 35%, ${withAlpha(teamColor, 0.03)} 100%)`,
        boxShadow: `0 0 0 1px ${withAlpha(teamColor, 0.08)}, 0 0 28px ${withAlpha(teamColor, 0.18)}`,
      }}
    >
      {logoPath ? (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute left-2 top-1/2 h-[98%] w-[44%] -translate-y-1/2 opacity-[0.34]"
            style={{
              backgroundColor: withAlpha("#ffffff", 0.95),
              WebkitMaskImage: `url(${logoPath})`,
              maskImage: `url(${logoPath})`,
              WebkitMaskPosition: "left center",
              maskPosition: "left center",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              filter: "drop-shadow(0 0 24px rgba(255,255,255,0.14))",
            }}
          />
          <div
            className="absolute left-0 top-1/2 h-[112%] w-[52%] -translate-y-1/2 opacity-[0.14]"
            style={{
              backgroundColor: teamColor,
              WebkitMaskImage: `url(${logoPath})`,
              maskImage: `url(${logoPath})`,
              WebkitMaskPosition: "left center",
              maskPosition: "left center",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              filter: "blur(1px)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${withAlpha(teamColor, 0.18)} 0%, ${withAlpha(teamColor, 0.08)} 36%, rgba(12,14,18,0.02) 70%, rgba(10,11,15,0.08) 100%)`,
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,11,15,0.02),rgba(10,11,15,0.08)_22%,rgba(10,11,15,0.28)_52%,rgba(10,11,15,0.6)_100%)]" />
        </div>
      ) : null}
      <div className="relative z-10 flex min-h-[7.2rem] flex-col">
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[0.78rem] font-semibold"
            style={{
              borderColor: withAlpha(teamColor, 0.35),
              backgroundColor: withAlpha(teamColor, 0.12),
              color: teamColor,
            }}
          >
            {position}
          </div>
          <div className="min-w-0 flex-1 pt-0.5 text-right">
            <p className="text-[0.56rem] uppercase tracking-[0.16em] text-[var(--home-muted)]">Ecurie</p>
            <p className="truncate text-[0.98rem] font-semibold text-white">{title}</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-10">
          {formattedDrivers.length ? (
            <div className="grid w-full max-w-[13.75rem] gap-2">
              {formattedDrivers.map((driver) => (
                <div
                  key={`${driver.code ?? driver.fullName}-${title}`}
                  className="grid min-h-[2.8rem] place-items-center rounded-[0.9rem] border px-3 py-2"
                  style={{
                    borderColor: withAlpha(teamColor, 0.16),
                    backgroundColor: withAlpha(teamColor, 0.07),
                  }}
                >
                  <span className="text-[0.5rem] font-semibold uppercase tracking-[0.16em] text-[var(--home-muted)]">
                    {driver.slotLabel}
                  </span>
                  <div className="min-w-0 text-center">
                    {driver.firstName ? (
                      <p className="truncate text-[0.54rem] font-medium uppercase tracking-[0.1em] text-[var(--home-muted-strong)]">
                        {driver.firstName}
                      </p>
                    ) : null}
                    <p className="truncate text-[0.82rem] font-semibold uppercase tracking-[0.04em] text-white">
                      {driver.lastName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-2 flex items-end justify-between gap-3">
          <p
            className="rounded-full border px-2 py-[0.2rem] text-[0.54rem] font-semibold uppercase tracking-[0.14em]"
            style={{
              borderColor: withAlpha(teamColor, 0.18),
              backgroundColor: withAlpha(teamColor, 0.08),
              color: "rgba(255,255,255,0.88)",
            }}
          >
            {wins} victoires
          </p>
          <div className="text-right">
            <p className="text-[0.92rem] font-semibold text-white">{numberFormatter.format(points)}</p>
            <p className="text-[0.58rem] uppercase tracking-[0.16em] text-[var(--home-muted)]">points</p>
          </div>
        </div>
      </div>
    </div>
  )

  return href ? <a href={href}>{content}</a> : content
}

export default async function HomePage() {
  const home = await getHomePageData(2025)

  return (
    <main className="home-grid-pulse">
      <HomeNeonReel
        name={home.nextGrandPrix?.name ?? "Aucun Grand Prix programme"}
        targetIso={home.nextGrandPrix?.countdownTargetIso ?? null}
        formattedDate={home.nextGrandPrix?.countdownDateLabel ?? "Date a confirmer"}
      />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-5 xl:grid-cols-2">
          <HomeDriverStandings items={home.standings.drivers} />

          <Panel eyebrow="Constructors" title="Standings constructeurs">
            {home.standings.constructors.length ? (
              <ol className="grid gap-3">
                {home.standings.constructors.map((constructor) => (
                  <TeamRow
                    key={`${constructor.position}-${constructor.constructorName}`}
                    position={constructor.position}
                    title={constructor.constructorName}
                    wins={constructor.wins}
                    drivers={constructor.drivers}
                    points={constructor.points}
                    href={constructor.href}
                    logoPath={constructor.logoPath}
                    teamColor={constructor.teamColor}
                  />
                ))}
              </ol>
            ) : (
              <EmptyPanel message="Aucun standing constructeur disponible pour la saison locale." />
            )}
          </Panel>
        </section>
      </section>
    </main>
  )
}
