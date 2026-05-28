"use client"

import { useEffect, useMemo, useRef, useState } from "react"

const ORBIT_IMAGES = [
  "/img/img1.png",
  "/img/img2.png",
  "/img/img3.png",
  "/img/img4.png",
  "/img/img5.png",
  "/img/images.jpg",
  "/img/images%20(1).jpg",
  "/img/1016916442-SCH-19850519-85MC-852-1-A2-1.jpg",
  "/img/img1.png",
  "/img/img2.png",
  "/img/img3.png",
  "/img/img4.png",
]

type HomeLuxuryProps = {
  home: {
    header: {
      logo: string
      seasonLabel: string
    }
    landing: {
      eyebrow: string
      grandPrixName: string
      highlight: string
      circuitSubtitle: string
      localityLabel: string
      countdownTargetIso: string | null
      footerText: string
      footerAccent: string
      cornerLeft: string
      cornerRight: string
    }
    overlays: {
      seasons: {
        title: string
        highlight: string
        subtitle: string
        rows: Array<{
          year: number
          driverName: string
          constructorName: string
          winsLabel: string
        }>
      }
      circuits: {
        title: string
        highlight: string
        subtitle: string
        rows: Array<{
          name: string
          country: string
          detailA: string
          detailB: string
          detailC: string
          winnerLabel: string
          isFinished: boolean
        }>
      }
      status: {
        title: string
        highlight: string
        subtitle: string
        stateLabel: string
        helper: string
      }
    }
    countdownDateLabel: string
  }
}

function pad(value: number) {
  return String(Math.max(0, value)).padStart(2, "0")
}

function buildTitleParts(grandPrixName: string, highlight: string) {
  const normalized = grandPrixName.trim()
  const safeHighlight = highlight.trim()

  if (!safeHighlight || !normalized.toLowerCase().includes(safeHighlight.toLowerCase())) {
    return {
      prefix: normalized,
      highlight: "",
    }
  }

  const matchIndex = normalized.toLowerCase().lastIndexOf(safeHighlight.toLowerCase())

  return {
    prefix: normalized.slice(0, matchIndex).trimEnd(),
    highlight: normalized.slice(matchIndex),
  }
}

export function HomeLuxury({ home }: Readonly<HomeLuxuryProps>) {
  const orbitWrapRef = useRef<HTMLDivElement | null>(null)
  const orbitItemRefs = useRef<Array<HTMLDivElement | null>>([])
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [activePage, setActivePage] = useState<"saisons" | "circuits" | "statut" | null>(null)
  const [liveSessionAction, setLiveSessionAction] = useState<{
    state: "idle" | "loading" | "success" | "error"
    message: string
  }>({ state: "idle", message: "" })
  const [countdown, setCountdown] = useState({
    days: "00",
    hours: "00",
    mins: "00",
    secs: "00",
  })

  const images = useMemo(
    () =>
      ORBIT_IMAGES.map((src, index) => ({
        src,
        baseAngle: (index / ORBIT_IMAGES.length) * Math.PI * 2,
      })),
    [],
  )

  const titleParts = useMemo(
    () => buildTitleParts(home.landing.grandPrixName, home.landing.highlight),
    [home.landing.grandPrixName, home.landing.highlight],
  )

  useEffect(() => {
    const container = orbitWrapRef.current
    if (!container) {
      return
    }

    let orbitAngle = 0
    const speed = 0.002
    let frameId = 0

    const render = () => {
      orbitAngle += speed

      const rx = container.offsetWidth * 0.44
      const ry = container.offsetHeight * 0.42

      images.forEach((image, index) => {
        const element = orbitItemRefs.current[index]
        if (!element) {
          return
        }

        const angle = image.baseAngle + orbitAngle
        const x = Math.cos(angle) * rx
        const y = Math.sin(angle) * ry
        const t = (Math.sin(angle) + 1) / 2
        const scale = 0.46 + 0.74 * t
        const opacity = 0.18 + 0.82 * t
        const blur = (1 - t) * 4.5
        const sepiaPct = Math.round((1 - t) * 40)

        element.style.transform =
          `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px)) scale(${scale.toFixed(3)})`
        element.style.opacity = opacity.toFixed(3)
        element.style.filter = `blur(${blur.toFixed(1)}px) sepia(${sepiaPct}%)`
        element.style.zIndex = String(Math.round(1 + t * 19))
      })

      frameId = requestAnimationFrame(render)
    }

    frameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [images])

  useEffect(() => {
    const canvas = noiseCanvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    const resize = () => {
      canvas.width = Math.max(1, globalThis.innerWidth)
      canvas.height = Math.max(1, globalThis.innerHeight)
    }

    const generateNoise = () => {
      if (canvas.width <= 0 || canvas.height <= 0) {
        return
      }

      const imageData = context.createImageData(canvas.width, canvas.height)
      const { data } = imageData

      for (let index = 0; index < data.length; index += 4) {
        const value = Math.random() * 28
        data[index] = value
        data[index + 1] = value
        data[index + 2] = value
        data[index + 3] = 255
      }

      context.putImageData(imageData, 0, 0)
    }

    resize()
    generateNoise()

    globalThis.addEventListener("resize", resize)
    const intervalId = globalThis.setInterval(generateNoise, 100)

    return () => {
      globalThis.removeEventListener("resize", resize)
      globalThis.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const target = home.landing.countdownTargetIso ? new Date(home.landing.countdownTargetIso) : null

    const updateCountdown = () => {
      const difference = target ? target.getTime() - Date.now() : 0
      const safeDiff = Math.max(0, difference)

      setCountdown({
        days: pad(Math.floor(safeDiff / 86_400_000)),
        hours: pad(Math.floor((safeDiff % 86_400_000) / 3_600_000)),
        mins: pad(Math.floor((safeDiff % 3_600_000) / 60_000)),
        secs: pad(Math.floor((safeDiff % 60_000) / 1000)),
      })
    }

    updateCountdown()
    const intervalId = globalThis.setInterval(updateCountdown, 1000)

    return () => {
      globalThis.clearInterval(intervalId)
    }
  }, [home.landing.countdownTargetIso])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePage(null)
      }
    }

    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  const openLiveFromStatus = async () => {
    setLiveSessionAction({
      state: "loading",
      message: "Ouverture de la session live...",
    })

    try {
      const response = await fetch("/api/live/sessions/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionKey: "next",
          ingestFrequencyMs: 3000,
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
        message?: string
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible d'ouvrir la session live.")
      }

      setLiveSessionAction({
        state: "success",
        message: payload.message ?? "Session live ouverte.",
      })
    } catch (error) {
      setLiveSessionAction({
        state: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'ouvrir la session live.",
      })
    }
  }

  const closeLiveFromStatus = async () => {
    setLiveSessionAction({
      state: "loading",
      message: "Arret du flux live...",
    })

    try {
      const response = await fetch("/api/live/sessions/close", {
        method: "POST",
      })
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
        message?: string
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible d'arreter la session live.")
      }

      setLiveSessionAction({
        state: "success",
        message: payload.message ?? "Flux live arrete.",
      })
    } catch (error) {
      setLiveSessionAction({
        state: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'arreter la session live.",
      })
    }
  }

  return (
    <main className="luxury-home">
      <canvas id="noise" ref={noiseCanvasRef} />

      <header className="site-header">
        <div className="header-logo">{home.header.logo}</div>
        <nav className="header-nav">
          <button className="nav-link" onClick={() => setActivePage("circuits")} type="button">
            {home.header.seasonLabel}
          </button>
          <button className="nav-link" onClick={() => setActivePage("saisons")} type="button">
            Historique
          </button>
          <a className="nav-link" href="/live">
            Live
          </a>
          <button className="nav-link" onClick={() => setActivePage("statut")} type="button">
            Statut
          </button>
        </nav>
      </header>

      <div className="corner corner-bl">{home.landing.cornerLeft}</div>
      <div className="corner corner-br">{home.landing.cornerRight}</div>

      <div className="scene">
        <div className="ornament">
          <div className="ornament-line" />
          <div className="ornament-diamond" />
          <div className="ornament-text">{home.landing.eyebrow}</div>
          <div className="ornament-diamond" />
          <div className="ornament-line r" />
        </div>

        <div className="race-title">
          {titleParts.prefix}
          <br />
          <em>{titleParts.highlight}</em>
        </div>
        <div className="subtitle">
          {home.landing.circuitSubtitle} · {home.landing.localityLabel}
        </div>

        <div className="orbit-wrap" id="orbitWrap" ref={orbitWrapRef}>
          <div className="ring-gold ring-gold-1" />
          <div className="ring-gold ring-gold-2" />
          <div className="ring-gold ring-gold-3" />
          <div className="inner-ring" />

          <div className="orbit-items" id="orbitItems">
            {images.map((image, index) => (
              <div
                className="c-item"
                key={`${image.src}-${index}`}
                ref={(node) => {
                  orbitItemRefs.current[index] = node
                }}
              >
                <img alt="" src={image.src} />
              </div>
            ))}
          </div>

          <div className="timer-center">
            <div className="timer-eyebrow">Compte à rebours</div>
            <div className="timer-digits">
              <div className="t-block">
                <div className="t-val">{countdown.days}</div>
                <div className="t-lbl">Jours</div>
              </div>
              <div className="t-sep">·</div>
              <div className="t-block">
                <div className="t-val">{countdown.hours}</div>
                <div className="t-lbl">Heures</div>
              </div>
              <div className="t-sep">·</div>
              <div className="t-block">
                <div className="t-val">{countdown.mins}</div>
                <div className="t-lbl">Min</div>
              </div>
              <div className="t-sep">·</div>
              <div className="t-block">
                <div className="t-val">{countdown.secs}</div>
                <div className="t-lbl">Sec</div>
              </div>
            </div>
            <div className="gold-divider">
              <div className="gold-divider-line" />
              <div className="gold-divider-dot" />
              <div className="gold-divider-line r" />
            </div>
          </div>
        </div>

        <div className="footer-info">
          <p>
            <strong>{home.landing.footerText}</strong> {home.landing.footerAccent}
          </p>
          <p className="landing-date">{home.countdownDateLabel}</p>
        </div>
      </div>

      <div className={`page-overlay ${activePage === "saisons" ? "active" : ""}`}>
        <button className="overlay-close" onClick={() => setActivePage(null)} type="button">
          ✕
        </button>
        <div className="overlay-header">
          <div className="ornament">
            <div className="ornament-line" />
            <div className="ornament-diamond" />
            <div className="ornament-text">Formule 1</div>
            <div className="ornament-diamond" />
            <div className="ornament-line r" />
          </div>
          <div className="overlay-title">
            {home.overlays.seasons.title.replace(home.overlays.seasons.highlight, "").trim()}{" "}
            <em>{home.overlays.seasons.highlight}</em>
          </div>
          <div className="overlay-subtitle">{home.overlays.seasons.subtitle}</div>
        </div>

        <div className="seasons-list">
          {home.overlays.seasons.rows.length > 0 ? (
            home.overlays.seasons.rows.map((row) => (
              <div className="season-row" key={row.year}>
                <span className="season-year">{row.year}</span>
                <span className="season-driver">{row.driverName}</span>
                <span className="season-team">{row.constructorName}</span>
                <span className="season-wins">{row.winsLabel}</span>
              </div>
            ))
          ) : (
            <div className="overlay-empty-state">
              <div className="ornament-line status-line" />
              <p>Historique indisponible</p>
              <span className="status-helper">Les saisons apparaitront ici des que la base sera accessible.</span>
              <div className="ornament-line r status-line" />
            </div>
          )}
        </div>
      </div>

      <div className={`page-overlay ${activePage === "circuits" ? "active" : ""}`}>
        <button className="overlay-close" onClick={() => setActivePage(null)} type="button">
          ✕
        </button>
        <div className="overlay-header">
          <div className="ornament">
            <div className="ornament-line" />
            <div className="ornament-diamond" />
            <div className="ornament-text">Formule 1</div>
            <div className="ornament-diamond" />
            <div className="ornament-line r" />
          </div>
          <div className="overlay-title">
            {home.overlays.circuits.title.replace(home.overlays.circuits.highlight, "").trim()}{" "}
            <em>{home.overlays.circuits.highlight}</em>
          </div>
          <div className="overlay-subtitle">{home.overlays.circuits.subtitle}</div>
        </div>

        <div className="circuits-grid">
          {home.overlays.circuits.rows.length > 0 ? (
            home.overlays.circuits.rows.map((row) => (
              <div className={`circuit-card ${row.isFinished ? "is-finished" : ""}`} key={`${row.name}-${row.country}`}>
                <div className="circuit-name">{row.country}</div>
                <div className="circuit-country">{row.name}</div>
                <div className="circuit-details">
                  <div className="circuit-detail">{row.detailA}</div>
                  <div className="circuit-detail">{row.detailB}</div>
                  <div className="circuit-detail">{row.detailC}</div>
                </div>
                <div className="circuit-winner">
                  <span className="circuit-winner-label">Vainqueur</span>
                  <span
                    className={`circuit-winner-name ${row.winnerLabel === "À déterminer" ? "is-pending" : ""}`}
                  >
                    {row.winnerLabel}
                  </span>
                </div>
                {row.isFinished ? <div className="circuit-status">Finished</div> : null}
              </div>
            ))
          ) : (
            <div className="overlay-empty-state">
              <div className="ornament-line status-line" />
              <p>Circuits indisponibles</p>
              <span className="status-helper">La grille circuits se remplira avec les donnees de saison disponibles.</span>
              <div className="ornament-line r status-line" />
            </div>
          )}
        </div>
      </div>

      <div className={`page-overlay ${activePage === "statut" ? "active" : ""}`}>
        <button className="overlay-close" onClick={() => setActivePage(null)} type="button">
          ✕
        </button>
        <div className="overlay-header">
          <div className="ornament">
            <div className="ornament-line" />
            <div className="ornament-diamond" />
            <div className="ornament-text">Formule 1</div>
            <div className="ornament-diamond" />
            <div className="ornament-line r" />
          </div>
          <div className="overlay-title">
            <em>{home.overlays.status.highlight}</em>
          </div>
          <div className="overlay-subtitle">{home.overlays.status.subtitle}</div>
        </div>

        <div className="overlay-empty-state status-control-state">
          <div className="ornament-line status-line" />
          <p>{home.overlays.status.stateLabel}</p>
          <span className="status-helper">{home.overlays.status.helper}</span>
          <div className="status-live-actions">
            <button
              className="status-live-button"
              disabled={liveSessionAction.state === "loading"}
              onClick={openLiveFromStatus}
              type="button"
            >
              {liveSessionAction.state === "loading" ? "Synchronisation..." : "Ouvrir le live"}
            </button>
            <button
              className="status-live-button status-live-button--danger"
              disabled={liveSessionAction.state === "loading"}
              onClick={closeLiveFromStatus}
              type="button"
            >
              Arreter le live
            </button>
          </div>
          {liveSessionAction.message ? (
            <span className={`status-action-message is-${liveSessionAction.state}`}>
              {liveSessionAction.message}
            </span>
          ) : null}
          <div className="ornament-line r status-line" />
        </div>
      </div>
    </main>
  )
}
