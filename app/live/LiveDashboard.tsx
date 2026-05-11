"use client"

import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
import Link from "next/link"
import type { LivePageData } from "@/lib/services/live-page.service"

const POLL_MS = 3_000
const MARKER_TRANSITION_MS = POLL_MS - 250

function compoundClass(compound: string) {
  return `live-tyre live-tyre-${compound.toLowerCase().replace(/\s+/g, "-")}`
}

function SunIcon() {
  return (
    <svg aria-hidden="true" className="live-weather-icon" viewBox="0 0 48 48">
      <circle cx="24" cy="24" fill="none" r="9" stroke="currentColor" strokeWidth="2" />
      <line stroke="currentColor" strokeLinecap="round" strokeWidth="2" x1="24" x2="24" y1="4" y2="11" />
      <line stroke="currentColor" strokeLinecap="round" strokeWidth="2" x1="24" x2="24" y1="37" y2="44" />
      <line stroke="currentColor" strokeLinecap="round" strokeWidth="2" x1="4" x2="11" y1="24" y2="24" />
      <line stroke="currentColor" strokeLinecap="round" strokeWidth="2" x1="37" x2="44" y1="24" y2="24" />
      <line stroke="currentColor" strokeLinecap="round" strokeWidth="2" x1="9.5" x2="14.5" y1="9.5" y2="14.5" />
      <line stroke="currentColor" strokeLinecap="round" strokeWidth="2" x1="33.5" x2="38.5" y1="33.5" y2="38.5" />
      <line stroke="currentColor" strokeLinecap="round" strokeWidth="2" x1="9.5" x2="14.5" y1="38.5" y2="33.5" />
      <line stroke="currentColor" strokeLinecap="round" strokeWidth="2" x1="33.5" x2="38.5" y1="14.5" y2="9.5" />
    </svg>
  )
}

function RainIcon() {
  return (
    <svg aria-hidden="true" className="live-weather-icon live-weather-icon--rain" viewBox="0 0 48 48">
      <path
        d="M10 26a8 8 0 010-16 7.97 7.97 0 0114-3.2A8 8 0 0138 18a6 6 0 010 12H10z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <line stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" x1="15" x2="13" y1="34" y2="43" />
      <line stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" x1="24" x2="22" y1="34" y2="43" />
      <line stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" x1="33" x2="31" y1="34" y2="43" />
    </svg>
  )
}

export default function LiveDashboard({ initial }: { initial: LivePageData }) {
  const [data, setData] = useState(initial)
  const [stale, setStale] = useState(false)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/live/data", { cache: "no-store" })
        if (!res.ok) throw new Error("fetch failed")
        const json = await res.json() as LivePageData
        setData(json)
        setStale(false)
      } catch {
        setStale(true)
      }
    }

    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [])

  const isRaining = data.weather.rainfall === "Pluie"

  return (
    <main className="live-page">
      <header className="live-topbar">
        <Link className="live-brand" href="/">
          PitWall
        </Link>

        <div className="live-topbar-center">
          <span className={`live-air-badge${data.isLive ? " live-air-badge--on" : ""}`}>
            <span className="live-air-dot" />
            {data.isLive ? "On Air" : "Standby"}
          </span>
          <h1 className="live-topbar-title">{data.session.title}</h1>
        </div>

        <div className="live-topbar-right">
          <span
            className={`live-sync-dot${stale ? " live-sync-dot--stale" : " live-sync-dot--active"}`}
            title={stale ? "Signal perdu" : "En direct"}
          />
          <nav className="live-nav">
            <Link href="/">Accueil</Link>
            <Link href="/live">Live</Link>
          </nav>
        </div>
      </header>

      {/* ── Vue principale plein écran ── */}
      <div className="live-main-view">

        {/* Colonne gauche : classement */}
        <aside className="live-sidebar">
          {!data.isLive ? (
            <div className="live-idle">
              <span>{data.emptyState.helper}</span>
            </div>
          ) : null}

          <div className="live-section-heading">
            <span>Classement</span>
            <strong>{data.leaderboard.length} pilotes</strong>
          </div>
          <div className="live-leaderboard">
            {data.leaderboard.length > 0 ? (
              data.leaderboard.map((driver) => (
                <article
                  className="live-driver-row"
                  key={driver.driverNumber}
                  style={{ "--team": driver.teamColor } as CSSProperties}
                >
                  <div className="live-driver-position">{driver.position}</div>
                  <div className="live-driver-main">
                    <span>{driver.driverCode}</span>
                    <strong>{driver.driverName}</strong>
                    <small>{driver.teamName}</small>
                  </div>
                  <div className="live-driver-gap">
                    <span>{driver.gapToLeader}</span>
                    <small>{driver.interval}</small>
                  </div>
                  <div className={compoundClass(driver.tyre.compound)}>
                    <span>{driver.tyre.compound[0]}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="live-panel-empty">Le classement se remplira pendant la session.</div>
            )}
          </div>
        </aside>

        {/* Colonne droite : circuit + météo incrustée */}
        <div className="live-map-area">
          <div className="live-track-map">
            {data.track.circuitImagePath ? (
              <img alt="" className="live-circuit-image" src={data.track.circuitImagePath} />
            ) : (
              <svg aria-hidden="true" className="live-circuit-svg" viewBox="0 0 210 132">
                <path d={data.track.tracePath} />
              </svg>
            )}

            {data.track.markers.map((marker) => (
              <div
                className="live-car-marker"
                key={marker.driverCode}
                style={{
                  top: `${marker.yPercent}%`,
                  left: `${marker.xPercent}%`,
                  "--team": marker.teamColor,
                  "--marker-transition": `${MARKER_TRANSITION_MS}ms`,
                } as CSSProperties}
                title={`${marker.position}. ${marker.driverName}`}
              >
                <span>{marker.driverCode}</span>
              </div>
            ))}

            {data.track.markers.length === 0 ? (
              <div className="live-track-empty">Positions indisponibles</div>
            ) : null}
          </div>

          {/* Météo flottante haut-droite */}
          <div className={`live-weather-overlay${isRaining ? " live-weather-overlay--rain" : ""}`}>
            <div className="live-weather-top">
              {isRaining ? <RainIcon /> : <SunIcon />}
              <span className="live-weather-condition">{data.weather.rainfall}</span>
            </div>
            <p className="live-weather-stats">
              <span>{data.weather.airTemp}</span>
              <span className="live-weather-sep">·</span>
              <span>{data.weather.trackTemp}</span>
              <span className="live-weather-sep">·</span>
              <span>{data.weather.windSpeed}</span>
            </p>
          </div>

          {/* Label circuit bas-gauche */}
          <div className="live-circuit-label">
            <span>Circuit</span>
            <strong>{data.track.circuitName}</strong>
          </div>
        </div>
      </div>

      {/* ── Données au scroll ── */}
      <section className="live-data-section">
        <div className="live-data-heading">
          <span>Données de session</span>
        </div>

        <div className="live-data-grid">
          <div className="live-panel">
            <div className="live-section-heading">
              <span>Telemetrie 2026</span>
              <strong>Top 6 pilotes</strong>
            </div>
            <div className="live-telemetry-list">
              {data.leaderboard.slice(0, 6).map((driver) => (
                <div className="live-telemetry-row" key={driver.driverNumber}>
                  <span>{driver.driverCode}</span>
                  <strong>{driver.telemetry.speed}</strong>
                  <small>Accel. {driver.telemetry.throttle}</small>
                  <small>Frein {driver.telemetry.brake}</small>
                  <small>Rapport {driver.telemetry.gear}</small>
                  <small>Aero {driver.telemetry.activeAero}</small>
                  <small>Energie {driver.telemetry.energy}</small>
                </div>
              ))}
              {data.leaderboard.length === 0 ? (
                <div className="live-panel-empty">La telemetrie apparaitra avec la session active.</div>
              ) : null}
            </div>
          </div>

          <div className="live-panel">
            <div className="live-section-heading">
              <span>Race control</span>
              <strong>Messages</strong>
            </div>
            <div className="live-race-control">
              {data.raceControl.length > 0 ? (
                data.raceControl.map((message, index) => (
                  <div className="live-control-message" key={`${message.message}-${index}`}>
                    <span>{message.flag ?? message.category}</span>
                    <strong>{message.message}</strong>
                    <small>{message.dateLabel}</small>
                  </div>
                ))
              ) : (
                <div className="live-panel-empty">Aucun message race control pour le moment.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
