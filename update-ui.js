const fs = require('fs');

// 1. Rewrite components/slide-preview.tsx to use a locked 960x720 canvas and scale responsively.
const slidePreviewCode = `"use client"

import { useEffect, useRef, useState } from "react"
import type { Slide, Theme } from "@/lib/slide-engine"

const TOKEN = {
  cobalt:  "#0F4C81",
  gold:    "#C5A059",
  enamel:  "#1E293B",
  canvas:  "#F8F9FA",
  snow:    "#F8F9FA",
  caption: "#64748B",
}

// Outer wrapper that manages scale
export function SlideRenderer({
  slide,
  theme,
  logoUrl,
  brandHeader = "DR. CUBE DENTISTRY • ACADEMIC LECTURE SERIES",
  brandFooterLeft = "DR. CUBE DENTISTRY",
  brandFooterRight = "2026 EDITION",
}: {
  slide: Slide
  theme: Theme
  logoUrl: string | null
  brandHeader?: string
  brandFooterLeft?: string
  brandFooterRight?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return
      const parent = containerRef.current.parentElement
      if (!parent) return
      const parentWidth = parent.clientWidth
      const parentHeight = parent.clientHeight

      // Fit 960x720 into parent container
      const scaleX = parentWidth / 960
      const scaleY = parentHeight / 720
      const newScale = Math.min(scaleX, scaleY)
      setScale(newScale)
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    const parent = containerRef.current?.parentElement
    let observer = null
    if (parent) {
      observer = new ResizeObserver(() => handleResize())
      observer.observe(parent)
    }

    return () => {
      window.removeEventListener("resize", handleResize)
      if (observer) observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center overflow-hidden w-full h-full bg-slate-950"
    >
      <div
        style={{
          width: "960px",
          height: "720px",
          transform: \`scale(\${scale})\`,
          transformOrigin: "center center",
          flexShrink: 0,
        }}
      >
        <SlideRendererInner
          slide={slide}
          theme={theme}
          logoUrl={logoUrl}
          brandHeader={brandHeader}
          brandFooterLeft={brandFooterLeft}
          brandFooterRight={brandFooterRight}
        />
      </div>
    </div>
  )
}

function SlideRendererInner({
  slide,
  theme,
  logoUrl,
  brandHeader,
  brandFooterLeft,
  brandFooterRight,
}: {
  slide: Slide
  theme: Theme
  logoUrl: string | null
  brandHeader: string
  brandFooterLeft: string
  brandFooterRight: string
}) {
  // ── CHAPTER DIVIDER ─────────────────────────────────────────
  if (slide.layout === "CHAPTER_DIVIDER") {
    return (
      <div
        className="relative flex flex-col h-full w-full overflow-hidden select-none items-center justify-center"
        style={{ backgroundColor: "#1E293B", fontFamily: "Inter, sans-serif" }}
      >
        {/* Title: centered, y: 1.5 -> 1.5 * 128 = 192px */}
        <h1
          className="absolute font-bold text-center w-full px-8"
          style={{
            color: "#C5A059",
            fontSize: "78px",
            top: "192px",
            left: "0"
          }}
        >
          {slide.title}
        </h1>

        {/* Aesthetic Geometric Anchor: centered, top: 44.44% (320px), w: 53.33% (512px), h: 53.33% (384px) */}
        <div
          className="absolute overflow-hidden flex flex-col items-center justify-center"
          style={{
            top: "320px",
            width: "512px",
            height: "384px",
            left: "224px",
            backgroundColor: TOKEN.cobalt,
            borderTop: \`4px solid \${TOKEN.gold}\`,
          }}
        >
          {/* Abstract geometric lines inside the block */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: \`linear-gradient(45deg, transparent 48%, \${TOKEN.gold} 49%, \${TOKEN.gold} 51%, transparent 52%)\`,
            backgroundSize: '20px 20px'
          }}></div>
          <div className="w-12 h-12 border-2 rotate-45 z-10" style={{ borderColor: TOKEN.gold }}></div>
        </div>
      </div>
    )
  }

  // ── EVIDENCE & COMPARATIVE DATA (Layout C) ─────────────────────────────
  if (slide.layout === "EVIDENCE_COMPARATIVE") {
    return (
      <div
        className="relative flex flex-col h-full w-full overflow-hidden select-none"
        style={{ backgroundColor: TOKEN.canvas }}
      >
        {/* Subtle Brand Metadata Header at top left (0.5 left margin -> 64px) */}
        <div
          className="absolute z-10 text-[16px] font-bold tracking-widest uppercase"
          style={{ left: "64px", top: "64px", color: "#94A3B8", fontFamily: "Inter, sans-serif" }}
        >
          {brandHeader}
        </div>

        {/* Header */}
        <div
          className="absolute z-10 text-[32px] font-bold"
          style={{ left: "64px", top: "100px", color: TOKEN.cobalt, fontFamily: "Inter, sans-serif" }}
        >
          {slide.title}
        </div>

        {/* Split Aesthetic Container */}
        <div
          className="absolute flex flex-row items-center justify-between"
          style={{ left: "64px", top: "180px", width: "832px", height: "396px" }}
        >
          {/* Left Block - Charcoal Anchor */}
          <div className="w-[48%] h-full flex flex-col items-center justify-center">
            <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: TOKEN.enamel, borderBottom: \`3px solid \${TOKEN.cobalt}\` }}>
               {/* Inner geometric accent */}
               <div className="absolute inset-4 border opacity-30" style={{ borderColor: TOKEN.canvas }}></div>
            </div>
            <span className="mt-3 text-[14px] italic font-sans" style={{ color: TOKEN.caption }}>Baseline clinical framework.</span>
          </div>

          {/* Right Block - Cobalt Anchor */}
          <div className="w-[48%] h-full flex flex-col items-center justify-center">
            <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: TOKEN.cobalt, borderBottom: \`3px solid \${TOKEN.gold}\` }}>
               {/* Inner geometric accent */}
               <div className="absolute inset-4 border opacity-30" style={{ borderColor: TOKEN.gold }}></div>
            </div>
            <span className="mt-3 text-[14px] italic font-sans" style={{ color: TOKEN.caption }}>Targeted procedural outcome.</span>
          </div>
        </div>

        {/* Running Footer */}
        <div
          className="absolute bottom-8 flex items-center justify-between border-t pt-4 z-10"
          style={{ borderColor: "#F1F5F9", left: "64px", width: "832px" }}
        >
          <span className="text-[14px] font-bold tracking-widest uppercase" style={{ color: TOKEN.cobalt }}>
            {brandFooterLeft}
          </span>
          <span className="text-[14px] font-bold tracking-widest uppercase" style={{ color: "#94A3B8" }}>
            {brandFooterRight}
          </span>
        </div>
      </div>
    )
  }

  // ── STANDARD SLIDES (Layout B - Clinical Step-by-Step) ──
  return (
    <div
      className="relative flex flex-col h-full w-full overflow-hidden select-none"
      style={{ backgroundColor: TOKEN.canvas }}
    >
      {logoUrl && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-10">
          <img src={logoUrl} alt="Watermark Logo" className="h-[55%] w-[60%] object-contain" />
        </div>
      )}

      {/* Vertical dividing line (1px Ceramic Cobalt) at X = 0.39 inches -> 50px */}
      <div
        className="absolute z-10"
        style={{ left: "50px", top: "141px", width: "1px", height: "435px", backgroundColor: TOKEN.cobalt }}
        aria-hidden="true"
      />

      {/* Subtle Brand Metadata Header at top left (0.55 inches -> 70px) */}
      <div
        className="absolute z-10 text-[16px] font-bold tracking-widest uppercase"
        style={{ left: "70px", top: "64px", color: "#94A3B8", fontFamily: "Inter, sans-serif" }}
      >
        {brandHeader}
      </div>

      {/* Main slide content bounding box: bodyX=0.54 (69px), bodyY=1.1 (141px), bodyW=3.45 (442px), bodyH=3.4 (435px) */}
      <div
        className="absolute flex flex-col justify-center text-left overflow-hidden break-words pr-2 z-10"
        style={{ left: "69px", top: "141px", width: "442px", height: "435px", fontFamily: "Plus Jakarta Sans, sans-serif" }}
      >
        {(() => {
          switch (slide.layout) {
            case "TABULAR_DATA":
              return <TableSlide slide={slide} theme={theme} />
            default:
              return <ContentSlide slide={slide} />
          }
        })()}
      </div>

      {/* Running Footer aligned to left: 64px and width: 832px */}
      <div
        className="absolute bottom-8 flex items-center justify-between border-t pt-4 z-10"
        style={{ borderColor: "#F1F5F9", left: "64px", width: "832px" }}
      >
        <span className="text-[14px] font-bold tracking-widest uppercase" style={{ color: TOKEN.cobalt }}>
          {brandFooterLeft}
        </span>
        <span className="text-[14px] font-bold tracking-widest uppercase" style={{ color: "#94A3B8" }}>
          {brandFooterRight}
        </span>
      </div>
    </div>
  )
}

export function parseAndHighlightMetrics(text: string) {
  const metricRegex = /(\\b\\d+%\\b|\\b\\d+-\\d+\\s*nm\\b|\\bHV\\s*=\\s*\\d+\\b|\\b\\d+,\\d+\\s*rods\\b|\\b\\d+(?:\\.\\d+)?\\s*(?:µm|mm)\\b)/gi;
  if (!metricRegex.test(text)) return text;

  const parts = text.split(metricRegex);
  return parts.map((part, i) =>
    metricRegex.test(part) ? <strong key={i} style={{ color: TOKEN.gold, fontWeight: 'bold' }}>{part}</strong> : part
  );
}

function ContentSlide({ slide }: { slide: Slide }) {
  const contentToRender = slide.content;

  return (
    <div className="w-full">
      <ul className="space-y-6 pl-0">
        {contentToRender.filter(line => line.trim().length > 0).map((lineText: string, index: number) => {
          const isUnordered = !slide.isPasteMode && (lineText.startsWith("-") || lineText.startsWith("*") || lineText.startsWith("•"))
          const isOrdered = !slide.isPasteMode && (/^\\d+[.)]/.test(lineText) || /^[a-zA-Z][.)]/.test(lineText))
          const isListItem = isUnordered || isOrdered

          const cleanText = slide.isPasteMode
            ? lineText
            : lineText
                .replace(/^[-*•]\\s*/, "")
                .replace(/^\\d+[.)]\\s*/, "")
                .replace(/^[a-zA-Z][.)]\\s*/, "")
                .trim()

          if (!cleanText) return null

          return (
            <li
              key={index}
              className="flex items-start font-semibold tracking-normal text-[26.6px] font-['Plus_Jakarta_Sans'] text-justify"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                lineHeight: 1.3,
                textAlign: "justify"
              }}
            >
              {/* Circle bullet glyph colored in Ceramic Cobalt (#0F4C81) */}
              {isListItem && (
                <span className="shrink-0 mt-3 mr-4 rounded-full"
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    backgroundColor: TOKEN.cobalt,
                  }}
                  aria-hidden="true"
                />
              )}
              <span style={{ color: TOKEN.enamel }}>{cleanText}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function TableSlide({ slide, theme }: { slide: Slide; theme: Theme }) {
  const rowsParsed = slide.content.map((rowText) =>
    rowText
      .replace(/^\\|/, "")
      .replace(/\\|$/, "")
      .split("|")
      .map((cell) => cell.trim()),
  )

  const headers = rowsParsed[0] || []
  const bodyRows = rowsParsed.slice(1)

  return (
    <div className="w-full max-h-[380px] overflow-y-auto rounded-xl border border-slate-200 pr-1">
      <table className="w-full text-left">
        <thead>
          <tr
            className="text-[26.6px] uppercase tracking-wide text-white"
            style={{ backgroundColor: TOKEN.cobalt }}
          >
            {headers.map((header, index) => (
              <th key={index} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bodyRows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={\`px-4 py-3 text-[24px] \${cellIndex === 0 ? "font-semibold" : ""}\`}
                  style={{
                    color: cellIndex === 0 ? TOKEN.cobalt : TOKEN.enamel,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
`;

fs.writeFileSync('components/slide-preview.tsx', slidePreviewCode);
console.log('slide-preview updated successfully.');
