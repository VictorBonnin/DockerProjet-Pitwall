"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"

type DriverStandingItem = {
  position: number
  driverName: string
  code: string | null
  constructorName: string
  points: number
  href: string | null
  imagePath: string | null
  teamColor: string
}

type HomeDriverStandingsProps = {
  items: DriverStandingItem[]
}

const numberFormatter = new Intl.NumberFormat("fr-FR")

function toRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  const safe = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => char + char)
        .join("")
    : normalized

  const red = Number.parseInt(safe.slice(0, 2), 16)
  const green = Number.parseInt(safe.slice(2, 4), 16)
  const blue = Number.parseInt(safe.slice(4, 6), 16)

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return `rgba(255,255,255,${alpha})`
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export function HomeDriverStandings({ items }: HomeDriverStandingsProps) {
  const containerRef = useRef<HTMLOListElement | null>(null)
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>([])

  useEffect(() => {
    const cards = containerRef.current?.querySelectorAll<HTMLElement>("[data-driver-card]")

    if (!cards?.length) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const next = new Set(visibleIndexes)

        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index") ?? "-1")
            if (index >= 0) {
              next.add(index)
            }
          }
        }

        setVisibleIndexes(Array.from(next).sort((left, right) => left - right))
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      },
    )

    for (const card of cards) {
      observer.observe(card)
    }

    return () => observer.disconnect()
  }, [visibleIndexes])

  const visibleSet = useMemo(() => new Set(visibleIndexes), [visibleIndexes])

  return (
    <section className="driver-ledger rounded-[2.05rem] border border-[rgba(255,255,255,0.09)] bg-[linear-gradient(180deg,rgba(12,13,18,0.9),rgba(7,8,12,0.96))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur">
      <div className="driver-ledger__chrome" />
      <div className="driver-ledger__header">
        <p className="driver-ledger__eyebrow">Drivers</p>
        <h2 className="driver-ledger__title">Standings pilotes</h2>
        <p className="driver-ledger__subtitle">
          Classement complet de la saison avec lecture rapide du paddock et animation au scroll.
        </p>
      </div>

      {items.length ? (
        <ol ref={containerRef} className="driver-ledger__list">
          {items.map((driver, index) => {
            const card = (
              <li
                key={`${driver.position}-${driver.driverName}`}
                data-driver-card
                data-index={index}
                className={`driver-ledger__item ${visibleSet.has(index) ? "is-visible" : ""}`}
                style={
                  {
                    "--driver-color": driver.teamColor,
                    "--driver-color-soft": toRgba(driver.teamColor, 0.18),
                    "--driver-color-faint": toRgba(driver.teamColor, 0.08),
                    "--driver-color-border": toRgba(driver.teamColor, 0.3),
                    "--driver-delay": `${index * 60}ms`,
                  } as React.CSSProperties
                }
              >
                <div className="driver-ledger__glow" />
                <div className="driver-ledger__gridline" />
                <div className="driver-ledger__rank">{driver.position}</div>
                <div className="driver-ledger__portrait">
                  {driver.imagePath ? (
                    <Image
                      src={driver.imagePath}
                      alt={driver.driverName}
                      width={64}
                      height={64}
                      className="driver-ledger__portrait-image"
                    />
                  ) : (
                    <div className="driver-ledger__portrait-fallback">N/A</div>
                  )}
                </div>
                <div className="driver-ledger__identity">
                  <div className="driver-ledger__tag">{driver.code ?? "DRV"}</div>
                  <div className="driver-ledger__name-wrap">
                    <p className="driver-ledger__name">{driver.driverName}</p>
                    <p className="driver-ledger__team">{driver.constructorName}</p>
                  </div>
                </div>
                <div className="driver-ledger__points">
                  <p className="driver-ledger__points-value">{numberFormatter.format(driver.points)}</p>
                  <p className="driver-ledger__points-unit">points</p>
                </div>
              </li>
            )

            return driver.href ? (
              <a key={`${driver.position}-${driver.driverName}`} href={driver.href} className="driver-ledger__link">
                {card}
              </a>
            ) : (
              card
            )
          })}
        </ol>
      ) : (
        <div className="rounded-[1.2rem] border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] p-5 text-sm leading-6 text-[var(--home-muted)]">
          Aucun standing pilote disponible pour la saison locale.
        </div>
      )}

      <style jsx>{`
        .driver-ledger {
          position: relative;
          overflow: hidden;
        }

        .driver-ledger__chrome {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 16% 18%, rgba(255, 73, 91, 0.14), transparent 24%),
            radial-gradient(circle at 84% 14%, rgba(255, 255, 255, 0.05), transparent 18%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.03), transparent 24%);
          pointer-events: none;
        }

        .driver-ledger__header {
          position: relative;
          z-index: 1;
          margin-bottom: 1.4rem;
        }

        .driver-ledger__eyebrow {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.26em;
          color: rgba(196, 206, 220, 0.72);
        }

        .driver-ledger__title {
          margin: 0.6rem 0 0;
          font-family: var(--font-display);
          font-size: clamp(2rem, 3.4vw, 3.3rem);
          line-height: 0.96;
          letter-spacing: -0.05em;
          color: #ffffff;
          text-shadow: 0 0 22px rgba(255, 73, 91, 0.1);
        }

        .driver-ledger__subtitle {
          margin: 0.8rem 0 0;
          max-width: 34rem;
          font-size: 0.95rem;
          line-height: 1.6;
          color: rgba(200, 210, 222, 0.72);
        }

        .driver-ledger__list {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 0.78rem;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .driver-ledger__link {
          text-decoration: none;
        }

        .driver-ledger__item {
          position: relative;
          display: grid;
          grid-template-columns: 56px 68px minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.85rem;
          min-height: 88px;
          padding: 0.85rem 1rem;
          border-radius: 1.35rem;
          border: 1px solid var(--driver-color-border);
          background:
            linear-gradient(135deg, var(--driver-color-faint), rgba(255, 255, 255, 0.02) 34%, rgba(10, 12, 16, 0.76) 100%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 18px 42px rgba(0, 0, 0, 0.24);
          overflow: hidden;
          opacity: 0;
          transform: translateY(24px) scale(0.985);
          transition:
            transform 0.72s cubic-bezier(0.2, 0.85, 0.2, 1),
            opacity 0.72s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease,
            background 0.25s ease;
          transition-delay: var(--driver-delay);
        }

        .driver-ledger__item.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .driver-ledger__item:hover {
          border-color: var(--driver-color);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 22px 48px rgba(0, 0, 0, 0.34),
            0 0 30px var(--driver-color-soft);
        }

        .driver-ledger__glow {
          position: absolute;
          inset: -20% auto -20% -10%;
          width: 42%;
          background: radial-gradient(circle, var(--driver-color-soft), transparent 68%);
          opacity: 0.9;
          pointer-events: none;
        }

        .driver-ledger__gridline {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, transparent 0 88%, rgba(255, 255, 255, 0.045) 88% 88.4%, transparent 88.4% 100%),
            linear-gradient(180deg, transparent 0 82%, rgba(255, 255, 255, 0.035) 82% 82.5%, transparent 82.5% 100%);
          opacity: 0.5;
          pointer-events: none;
        }

        .driver-ledger__rank {
          position: relative;
          z-index: 1;
          display: grid;
          place-items: center;
          width: 56px;
          height: 56px;
          border-radius: 18px;
          border: 1px solid var(--driver-color-border);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
            var(--driver-color-faint);
          font-size: 1rem;
          font-weight: 800;
          color: #ffffff;
          text-shadow: 0 0 16px var(--driver-color-soft);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .driver-ledger__portrait {
          position: relative;
          z-index: 1;
          width: 68px;
          height: 68px;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 12px 28px rgba(0, 0, 0, 0.24);
        }

        .driver-ledger__portrait::after {
          content: "";
          position: absolute;
          inset: 8px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          pointer-events: none;
        }

        .driver-ledger__portrait-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
        }

        .driver-ledger__portrait-fallback {
          display: grid;
          place-items: center;
          width: 100%;
          height: 100%;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(255, 255, 255, 0.45);
        }

        .driver-ledger__identity {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          min-width: 0;
        }

        .driver-ledger__tag {
          flex-shrink: 0;
          min-width: 54px;
          padding: 0.52rem 0.7rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(255, 255, 255, 0.05);
          font-size: 0.66rem;
          font-weight: 800;
          line-height: 1;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: rgba(222, 230, 240, 0.84);
        }

        .driver-ledger__name-wrap {
          min-width: 0;
        }

        .driver-ledger__name {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(1.08rem, 1.6vw, 1.44rem);
          line-height: 1;
          letter-spacing: -0.03em;
          color: #ffffff;
        }

        .driver-ledger__team {
          margin: 0.42rem 0 0;
          font-size: 0.72rem;
          font-weight: 700;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: var(--driver-color);
        }

        .driver-ledger__points {
          position: relative;
          z-index: 1;
          min-width: 88px;
          text-align: right;
        }

        .driver-ledger__points-value {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 2vw, 2rem);
          line-height: 1;
          letter-spacing: -0.05em;
          color: #ffffff;
        }

        .driver-ledger__points-unit {
          margin: 0.45rem 0 0;
          font-size: 0.62rem;
          font-weight: 700;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: rgba(184, 194, 208, 0.72);
        }

        @media (max-width: 860px) {
          .driver-ledger__item {
            grid-template-columns: 52px 60px minmax(0, 1fr) auto;
            gap: 0.72rem;
            padding: 0.82rem 0.88rem;
          }

          .driver-ledger__rank {
            width: 52px;
            height: 52px;
          }

          .driver-ledger__portrait {
            width: 60px;
            height: 60px;
          }

          .driver-ledger__tag {
            min-width: 48px;
          }
        }

        @media (max-width: 640px) {
          .driver-ledger__item {
            grid-template-columns: 46px 54px minmax(0, 1fr);
            grid-template-areas:
              "rank portrait points"
              "identity identity identity";
            row-gap: 0.74rem;
          }

          .driver-ledger__rank {
            grid-area: rank;
            width: 46px;
            height: 46px;
            border-radius: 15px;
            font-size: 0.92rem;
          }

          .driver-ledger__portrait {
            grid-area: portrait;
            width: 54px;
            height: 54px;
            border-radius: 18px;
          }

          .driver-ledger__identity {
            grid-area: identity;
          }

          .driver-ledger__points {
            grid-area: points;
            min-width: 0;
            align-self: center;
          }

          .driver-ledger__subtitle {
            font-size: 0.88rem;
          }
        }
      `}</style>
    </section>
  )
}
