"use client"

import { Fragment, useEffect, useMemo, useRef } from "react"

type NeonReelProps = {
  name: string
  targetIso: string | null
  formattedDate: string
}

const imagePool = [
  "/img/1016916442-SCH-19850519-85MC-852-1-A2-1.jpg",
  "/img/images.jpg",
  "/img/images (1).jpg",
  "/img/img1.png",
  "/img/img2.png",
  "/img/img3.png",
  "/img/img4.png",
  "/img/img5.png",
]

const reelSlots = 18

export function HomeNeonReel({ name, targetIso, formattedDate }: NeonReelProps) {
  const filmBackRef = useRef<HTMLDivElement | null>(null)
  const filmFrontRef = useRef<HTMLDivElement | null>(null)
  const ringWrapRef = useRef<HTMLElement | null>(null)
  const segmentsRef = useRef<Record<string, HTMLDivElement | null>>({})
  const cardsRef = useRef<HTMLDivElement[]>([])

  const images = useMemo(
    () => Array.from({ length: reelSlots }, (_, index) => imagePool[index % imagePool.length] ?? imagePool[0] ?? ""),
    [],
  )

  useEffect(() => {
    const cards = cardsRef.current
    const ringWrap = ringWrapRef.current
    const filmBack = filmBackRef.current
    const filmFront = filmFrontRef.current

    if (!cards.length || !ringWrap || !filmBack || !filmFront) return

    let orbitRadiusX = 0
    let orbitRadiusY = 0
    let orbitAngle = 0
    let lastFrame = 0
    let animationFrameId = 0

    const measureOrbit = () => {
      const size = Math.min(ringWrap.clientWidth, ringWrap.clientHeight)
      orbitRadiusX = size * 0.37
      orbitRadiusY = orbitRadiusX * 0.9
    }

    const renderOrbit = () => {
      for (const card of cards) {
        const baseAngle = Number(card.dataset.baseAngle ?? "0")
        const angle = (((baseAngle + orbitAngle) % 360) * Math.PI) / 180
        const x = Math.sin(angle) * orbitRadiusX
        const y = -Math.cos(angle) * orbitRadiusY
        const depth = (y + orbitRadiusY) / (orbitRadiusY * 2)
        const scale = 0.76 + depth * 0.42
        const brightness = 0.62 + depth * 0.48
        const saturation = 0.86 + depth * 0.32
        const targetLayer = y > 0 ? filmFront : filmBack

        if (card.parentElement !== targetLayer) {
          targetLayer.appendChild(card)
        }

        card.style.zIndex = String(Math.round(depth * 100))
        card.style.opacity = String(0.48 + depth * 0.52)
        card.style.filter = `brightness(${brightness}) saturate(${saturation})`
        card.style.transform = `translate(-50%,-50%) translate(${x}px, ${y}px) scale(${scale})`
      }
    }

    const animateOrbit = (timestamp: number) => {
      if (!lastFrame) {
        lastFrame = timestamp
      }

      const delta = timestamp - lastFrame
      lastFrame = timestamp
      orbitAngle = (orbitAngle + delta * 0.0065) % 360
      renderOrbit()
      animationFrameId = window.requestAnimationFrame(animateOrbit)
    }

    measureOrbit()
    renderOrbit()
    animationFrameId = window.requestAnimationFrame(animateOrbit)
    window.addEventListener("resize", measureOrbit)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", measureOrbit)
    }
  }, [])

  useEffect(() => {
    const setSegment = (key: string, value: string) => {
      const segment = segmentsRef.current[key]
      const valueEl = segment?.querySelector(".value")

      if (!segment || !valueEl || valueEl.textContent === value) {
        return
      }

      segment.classList.remove("flip")
      void segment.offsetWidth
      segment.classList.add("flip")
      valueEl.textContent = value
    }

    const pad = (value: number) => String(value).padStart(2, "0")

    const updateCountdown = () => {
      if (!targetIso) {
        setSegment("days", "00")
        setSegment("hours", "00")
        setSegment("minutes", "00")
        setSegment("seconds", "00")
        return
      }

      const now = new Date()
      const target = new Date(targetIso)
      let diff = target.getTime() - now.getTime()

      if (diff <= 0) {
        setSegment("days", "00")
        setSegment("hours", "00")
        setSegment("minutes", "00")
        setSegment("seconds", "00")
        return
      }

      const days = Math.floor(diff / 86400000)
      diff -= days * 86400000
      const hours = Math.floor(diff / 3600000)
      diff -= hours * 3600000
      const minutes = Math.floor(diff / 60000)
      diff -= minutes * 60000
      const seconds = Math.floor(diff / 1000)

      setSegment("days", pad(days))
      setSegment("hours", pad(hours))
      setSegment("minutes", pad(minutes))
      setSegment("seconds", pad(seconds))
    }

    updateCountdown()
    const intervalId = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(intervalId)
  }, [targetIso])

  return (
    <section className="neon-reel-hero">
      <div className="noise" />
      <div className="corners" />
      <div className="scanlines" />
      <div className="vignette" />

      <div className="page">
        <div className="halo" />

        <section ref={ringWrapRef} className="ring-wrap">
          <div className="dial" />
          <div className="film-track" />
          <div ref={filmBackRef} className="film-layer film-layer-back" />

          <section className="center">
            <div className="content">
              <div className="eyebrow">Prochain Grand Prix</div>
              <div className="timer">
                {[
                  ["days", "Jours"],
                  ["hours", "Heures"],
                  ["minutes", "Minutes"],
                  ["seconds", "Secondes"],
                ].map(([key, label], index) => (
                  <Fragment key={key}>
                    {index > 0 ? <div className="separator">:</div> : null}
                    <div
                      ref={(node) => {
                        segmentsRef.current[key] = node
                      }}
                      className="segment"
                      data-key={key}
                    >
                      <span className="value">00</span>
                      <span className="unit">{label}</span>
                    </div>
                  </Fragment>
                ))}
              </div>
              <div className="gp">{name}</div>
              <div className="date">{formattedDate}</div>
            </div>
          </section>

          <div ref={filmFrontRef} className="film-layer film-layer-front" />

          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              ref={(node) => {
                if (node) {
                  cardsRef.current[index] = node
                }
              }}
              className="item"
              data-base-angle={String((360 / reelSlots) * index)}
              style={{ ["--img" as string]: `url("${encodeURI(image)}")` }}
            >
              <div className="sprocket" />
            </div>
          ))}
        </section>

        <div className="footer-badge">Variant V1 / Neon Reel</div>
      </div>

      <style jsx>{`
        .neon-reel-hero {
          --bg: #06070b;
          --bg-2: #0c1119;
          --text: #f4f7fb;
          --muted: #a7b1c4;
          --red: #ff2538;
          --radius: min(36vw, 360px);
          --card-w: 122px;
          --card-h: 156px;
          position: relative;
          min-height: 100svh;
          overflow: hidden;
          color: var(--text);
          font-family: Bahnschrift, "Arial Narrow", Arial, sans-serif;
          background:
            radial-gradient(circle at 50% 50%, rgba(255, 37, 56, 0.12), transparent 18%),
            radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.06), transparent 20%),
            radial-gradient(circle at 82% 80%, rgba(255, 37, 56, 0.08), transparent 26%),
            linear-gradient(145deg, #030407, var(--bg) 40%, var(--bg-2));
          isolation: isolate;
        }

        .page {
          position: relative;
          min-height: 100svh;
          display: grid;
          place-items: center;
          padding: 20px;
          isolation: isolate;
        }

        .scanlines,
        .vignette,
        .noise,
        .corners {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .scanlines {
          background: repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.055) 0 1px, transparent 1px 4px);
          opacity: 0.18;
          mix-blend-mode: soft-light;
          z-index: 7;
        }

        .noise {
          background-image:
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.34) 0 1px, transparent 1px),
            radial-gradient(circle at 75% 35%, rgba(255, 255, 255, 0.28) 0 1px, transparent 1px),
            radial-gradient(circle at 45% 78%, rgba(255, 255, 255, 0.26) 0 1px, transparent 1px);
          background-size: 180px 180px, 220px 220px, 210px 210px;
          mix-blend-mode: screen;
          opacity: 0.08;
          animation: drift 18s linear infinite;
          z-index: 1;
        }

        .vignette {
          background: radial-gradient(circle at 50% 46%, transparent 34%, rgba(0, 0, 0, 0.3) 58%, rgba(0, 0, 0, 0.82) 100%);
          z-index: 6;
        }

        .corners {
          z-index: 5;
        }

        .corners::before,
        .corners::after {
          content: "";
          position: absolute;
          width: 220px;
          height: 220px;
          opacity: 0.52;
          background:
            linear-gradient(90deg, transparent 0 18%, rgba(255, 37, 56, 0.35) 18% 19%, transparent 19% 100%),
            linear-gradient(0deg, transparent 0 18%, rgba(255, 37, 56, 0.35) 18% 19%, transparent 19% 100%),
            repeating-linear-gradient(90deg, transparent 0 28px, rgba(255, 255, 255, 0.06) 28px 29px, transparent 29px 100%),
            repeating-linear-gradient(0deg, transparent 0 28px, rgba(255, 255, 255, 0.06) 28px 29px, transparent 29px 100%);
          filter: drop-shadow(0 0 18px rgba(255, 37, 56, 0.24));
        }

        .corners::before {
          top: 14px;
          left: 14px;
          clip-path: polygon(0 0, 100% 0, 100% 18%, 18% 18%, 18% 100%, 0 100%);
        }

        .corners::after {
          right: 14px;
          bottom: 14px;
          transform: rotate(180deg);
          clip-path: polygon(0 0, 100% 0, 100% 18%, 18% 18%, 18% 100%, 0 100%);
        }

        .halo {
          position: absolute;
          width: min(84vw, 980px);
          aspect-ratio: 1;
          border-radius: 50%;
          background:
            radial-gradient(circle, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0) 34%),
            conic-gradient(
              from 0deg,
              rgba(255, 37, 56, 0.65),
              rgba(255, 37, 56, 0) 18%,
              rgba(255, 255, 255, 0.06) 30%,
              rgba(255, 37, 56, 0.42) 48%,
              rgba(255, 37, 56, 0) 66%,
              rgba(255, 255, 255, 0.04) 78%,
              rgba(255, 37, 56, 0.62)
            );
          filter: blur(34px);
          opacity: 0.92;
          animation: spin 20s linear infinite;
          z-index: 0;
        }

        .ring-wrap {
          position: relative;
          width: min(90vw, 980px);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          z-index: 2;
        }

        .dial,
        .film-track,
        .film-layer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
        }

        .dial {
          background:
            radial-gradient(circle, transparent 58%, rgba(255, 255, 255, 0.05) 58.3%, rgba(255, 255, 255, 0.05) 59.2%, transparent 59.5%),
            radial-gradient(circle, transparent 72.5%, rgba(255, 255, 255, 0.08) 72.8%, rgba(255, 255, 255, 0.08) 73.6%, transparent 73.9%),
            repeating-conic-gradient(from 0deg, rgba(255, 255, 255, 0.04) 0deg 1deg, transparent 1deg 3deg);
          filter: drop-shadow(0 0 26px rgba(255, 37, 56, 0.18));
          opacity: 0.95;
        }

        .film-track {
          filter: drop-shadow(0 24px 50px rgba(0, 0, 0, 0.45));
          z-index: 1;
        }

        .film-track::before {
          content: "";
          position: absolute;
          inset: 9%;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            inset 0 0 0 34px rgba(255, 255, 255, 0.018),
            inset 0 0 44px rgba(255, 255, 255, 0.05),
            0 0 40px rgba(255, 37, 56, 0.12);
        }

        .film-track::after {
          content: "";
          position: absolute;
          inset: 13.5%;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .film-layer {
          pointer-events: none;
        }

        .film-layer-back {
          z-index: 2;
        }

        .film-layer-front {
          z-index: 4;
        }

        .item {
          position: absolute;
          top: 50%;
          left: 50%;
          width: var(--card-w);
          height: var(--card-h);
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow:
            0 18px 42px rgba(0, 0, 0, 0.42),
            0 0 18px rgba(255, 37, 56, 0.14);
          transform: translate(-50%, -50%);
          transform-origin: center;
          background: #0c1017;
          will-change: transform, filter, opacity;
        }

        .item::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.16), transparent 20%, transparent 72%, rgba(0, 0, 0, 0.45)),
            var(--img);
          background-size: cover;
          background-position: center;
          filter: saturate(1.1) contrast(1.02);
        }

        .item::after {
          content: "";
          position: absolute;
          inset: 8px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .sprocket {
          position: absolute;
          inset: 0;
          border-radius: 24px;
          background:
            radial-gradient(circle at 10px 14px, rgba(0, 0, 0, 0.82) 0 4px, transparent 4.2px),
            radial-gradient(circle at calc(100% - 10px) 14px, rgba(0, 0, 0, 0.82) 0 4px, transparent 4.2px),
            radial-gradient(circle at 10px calc(100% - 14px), rgba(0, 0, 0, 0.82) 0 4px, transparent 4.2px),
            radial-gradient(circle at calc(100% - 10px) calc(100% - 14px), rgba(0, 0, 0, 0.82) 0 4px, transparent 4.2px);
          opacity: 0.95;
        }

        .center {
          position: relative;
          width: min(49vw, 470px);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background:
            radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.16), transparent 24%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow:
            inset 0 0 42px rgba(255, 255, 255, 0.05),
            inset 0 0 120px rgba(255, 37, 56, 0.08),
            0 25px 90px rgba(0, 0, 0, 0.52);
          backdrop-filter: blur(16px);
          z-index: 3;
        }

        .center::before {
          content: "";
          position: absolute;
          inset: 16px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .center::after {
          content: "";
          position: absolute;
          width: 76px;
          aspect-ratio: 1;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.24) 26%, rgba(255, 37, 56, 0.4) 40%, rgba(255, 37, 56, 0.08) 68%, transparent 72%);
          box-shadow: 0 0 36px rgba(255, 37, 56, 0.5);
          z-index: -1;
        }

        .content {
          width: min(90%, 400px);
          text-align: center;
        }

        .eyebrow {
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.32em;
          font-size: 11px;
          color: var(--muted);
        }

        .timer {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: clamp(4px, 0.9vw, 10px);
          flex-wrap: nowrap;
          white-space: nowrap;
        }

        .segment {
          flex: 0 1 clamp(50px, 9.6vw, 76px);
          min-width: 0;
          min-height: clamp(108px, 11vw, 126px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(6px, 0.7vw, 10px);
          padding: clamp(10px, 1vw, 14px) 0;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.11);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
          text-align: center;
        }

        .value {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          font-size: clamp(22px, 4vw, 48px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: 0.03em;
          text-shadow: 0 0 18px rgba(255, 37, 56, 0.24);
          text-align: center;
          font-variant-numeric: tabular-nums;
        }

        .segment.flip .value {
          animation: digitPulse 0.36s ease;
        }

        .unit {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          font-size: clamp(8px, 1vw, 11px);
          letter-spacing: clamp(0.08em, 0.18vw, 0.18em);
          color: var(--muted);
          text-transform: uppercase;
          line-height: 1;
          text-align: center;
        }

        .separator {
          font-size: clamp(20px, 3.2vw, 38px);
          line-height: 1;
          color: var(--red);
          text-shadow: 0 0 22px rgba(255, 37, 56, 0.55);
          transform: translateY(-7px);
        }

        .gp {
          margin-top: 18px;
          font-size: clamp(18px, 1.9vw, 21px);
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .date {
          margin-top: 8px;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.5;
        }

        .footer-badge {
          position: absolute;
          left: 28px;
          bottom: 24px;
          padding: 12px 16px;
          border-radius: 999px;
          border: 1px solid rgba(255, 37, 56, 0.38);
          background: rgba(18, 11, 16, 0.66);
          font-size: 12px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          box-shadow: 0 0 22px rgba(255, 37, 56, 0.18);
          animation: pulse 2.2s ease-in-out infinite;
          z-index: 8;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 0 22px rgba(255, 37, 56, 0.18);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 28px rgba(255, 37, 56, 0.34);
          }
        }

        @keyframes digitPulse {
          0% {
            transform: rotateX(0deg) scale(1);
          }
          45% {
            transform: rotateX(90deg) scale(0.95);
            opacity: 0.75;
          }
          100% {
            transform: rotateX(0deg) scale(1);
          }
        }

        @keyframes drift {
          from {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-12px, 9px, 0);
          }
          to {
            transform: translate3d(0, 0, 0);
          }
        }

        @media (max-width: 820px) {
          .neon-reel-hero {
            --radius: min(34vw, 260px);
            --card-w: 88px;
            --card-h: 116px;
          }

          .center {
            width: min(78vw, 410px);
          }

          .content {
            width: 92%;
          }

          .timer {
            gap: 6px;
          }

          .segment {
            flex-basis: 58px;
            min-height: 104px;
            gap: 8px;
            padding: 10px 8px;
          }

          .separator {
            font-size: 24px;
            transform: translateY(-3px);
          }

          .footer-badge {
            left: 18px;
            bottom: 18px;
            font-size: 11px;
          }
        }

        @media (max-width: 560px) {
          .neon-reel-hero {
            --card-w: 74px;
            --card-h: 100px;
          }

          .page {
            padding: 12px;
          }

          .center {
            width: min(96vw, 380px);
          }

          .content {
            width: 95%;
          }

          .eyebrow {
            margin-bottom: 12px;
            letter-spacing: 0.24em;
            font-size: 10px;
          }

          .timer {
            gap: 4px;
          }

          .segment {
            flex-basis: 50px;
            min-height: 94px;
            gap: 6px;
            padding: 8px 6px;
            border-radius: 14px;
          }

          .value {
            font-size: clamp(20px, 7vw, 30px);
          }

          .unit {
            font-size: 8px;
            letter-spacing: 0.08em;
          }

          .separator {
            font-size: 18px;
            transform: translateY(-2px);
          }

          .gp {
            font-size: 16px;
          }

          .date {
            font-size: 12px;
          }

          .corners::before,
          .corners::after {
            width: 150px;
            height: 150px;
          }
        }

        @media (max-width: 400px) {
          .center {
            width: min(98vw, 360px);
          }

          .segment {
            flex-basis: 46px;
            min-height: 88px;
            padding: 8px 5px;
          }

          .value {
            font-size: 20px;
          }

          .unit {
            font-size: 7px;
          }

          .separator {
            font-size: 16px;
          }
        }
      `}</style>
    </section>
  )
}
