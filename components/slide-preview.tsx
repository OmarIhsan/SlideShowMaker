import type { Slide, Theme } from "@/lib/slide-engine"

// ============================================================
// GLOBAL DESIGN TOKENS (Contrast Avant-Garde framework)
//   Canvas Base:            #F8F9FA  (Clinical Base)
//   Bullet Glyph:           #0F4C81  (Ceramic Cobalt)
//   Body Text:              #1E293B  (Deep Enamel)
//   Structural Anchor:      #0F4C81  (Ceramic Cobalt)
//   Precision Highlight:    #C5A059  (Dentin Gold)
// ============================================================

const TOKEN = {
  cobalt:  "#0F4C81",
  gold:    "#C5A059",
  enamel:  "#1E293B",
  canvas:  "#F8F9FA",
  snow:    "#F8F9FA",
  caption: "#64748B",
}

export function SlideRenderer({
  slide,
  theme,
  logoUrl,
  lecturerName,
  brandHeader = "DR. CUBE DENTISTRY • ACADEMIC LECTURE SERIES",
  brandFooterLeft = "DR. CUBE DENTISTRY",
  brandFooterRight = "2026 EDITION",
}: {
  slide: Slide
  theme: Theme
  logoUrl: string | null
  lecturerName: string
  brandHeader?: string
  brandFooterLeft?: string
  brandFooterRight?: string
}) {
  // ── CHAPTER DIVIDER ─────────────────────────────────────────
  if (slide.layout === "CHAPTER_DIVIDER") {
    return (
      <div
        className="relative flex h-full w-full overflow-hidden select-none"
        style={{ backgroundColor: TOKEN.enamel, fontFamily: "Inter, sans-serif" }}
      >
        {/* Solid Dentin Gold right-side anchor block */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[40%]"
          style={{ backgroundColor: TOKEN.gold }}
          aria-hidden="true"
        />

        {/* Chapter title — left panel */}
        <div className="relative z-10 flex flex-col justify-center px-12 w-[60%]">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight" style={{ color: TOKEN.snow }}>
            {slide.title}
          </h1>
          <div className="mt-5 h-1 w-20" style={{ backgroundColor: TOKEN.gold }} />
        </div>
      </div>
    )
  }

  // ── STANDARD SLIDES (Unified Layout: Slide 1 is mirrored identically) ──
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

      {/* left-accent line/Cobalt column matching accentX: 1.0, accentY: 1.4, accentW: 0.05, accentH: 3.2 */}
      {/* Structural Accent Bar (accentX: 1.0 -> 10%) */}
      <div 
        className="absolute z-10 rounded-r"
        style={{
          left: '10%',
          top: "21.3%",
          width: '0.5%',
          height: "67.6%",
          backgroundColor: TOKEN.cobalt,
        }}
        aria-hidden="true"
      />

      {/* Vertical right limit line matching pptx x: 8.0 (left: 80%), y: 1.0 (top: 17.8%), h: 4.0 (height: 71.1%) */}
      <div
        className="absolute z-10"
        style={{
          left: "80%",
          top: "17.8%",
          width: "1px",
          height: "71.1%",
          backgroundColor: "#E2E8F0"
        }}
        aria-hidden="true"
      />

      {/* Subtle Brand Metadata Header at top left (x: 1.4, y: 0.6) */}
      <div
        className="absolute z-10 text-xs font-bold tracking-widest uppercase"
        style={{
          left: "14%",
          top: "10.6%",
          color: TOKEN.gold,
          fontFamily: "Inter, sans-serif"
        }}
      >
        {brandHeader}
      </div>

      {/* Main slide content bounding box: x: 1.4 (left: 14%), y: 1.2 (top: 21.3%), w: 6.4 (width: 64%), h: 3.8 (height: 67.6%) */}
      <div
        className="absolute flex flex-col justify-center text-left overflow-hidden break-words pr-2 z-10"
        style={{
          left: "14%",
          top: "21.3%",
          width: "64%",
          height: "67.6%"
        }}
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

      {/* Running Footer */}
      <div
        className="absolute bottom-4 left-13 right-13 flex items-center justify-between border-t pt-2 z-10"
        style={{ borderColor: "#F1F5F9" }}
      >
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: TOKEN.caption, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {brandFooterLeft}
        </span>
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: TOKEN.caption, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {brandFooterRight}
        </span>
      </div>
    </div>
  )
}

export function parseAndHighlightMetrics(text: string) {
  const metricRegex = /(\b\d+%\b|\b\d+-\d+\s*nm\b|\bHV\s*=\s*\d+\b|\b\d+,\d+\s*rods\b|\b\d+(?:\.\d+)?\s*(?:µm|mm)\b)/gi;
  if (!metricRegex.test(text)) return text;

  const parts = text.split(metricRegex);
  return parts.map((part, i) =>
    metricRegex.test(part) ? <strong key={i} style={{ color: TOKEN.gold, fontWeight: 'bold' }}>{part}</strong> : part
  );
}

function ContentSlide({ slide }: { slide: Slide }) {
  const isWarning = (text: string) => {
    const lower = text.toLowerCase()
    return ["warning", "caution", "ethics", "fabrication", "fraud", "violation", "critical"].some(
      (w) => lower.includes(w),
    )
  }

  const contentToRender = slide.content;

  return (
    <div className="w-full">
      <ul className="space-y-4 pl-0">
        {contentToRender.filter(line => line.trim().length > 0).map((lineText: string, index: number) => {
          const cleanText = lineText
            .replace(/^[-*•]\s*/, "")
            .replace(/^\d+[.)]\s*/, "")
            .replace(/^[a-zA-Z][.)]\s*/, "")
            .trim()

          if (!cleanText) return null

          // Warning / callout item
          if (isWarning(cleanText)) {
            return (
              <li key={index} className="list-none">
                <div
                  className="flex items-start p-4 border-l-4"
                  style={{
                    borderColor: TOKEN.gold,
                    backgroundColor: "rgba(197,160,89,0.10)",
                  }}
                >
                  <svg className="w-5 h-5 mr-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
                       stroke={TOKEN.gold} strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span
                    className="font-semibold leading-relaxed text-xl md:text-2xl font-medium"
                    style={{ color: TOKEN.enamel }}
                  >
                    {cleanText}
                  </span>
                </div>
              </li>
            )
          }

          return (
            <li
              key={index}
              className="flex items-start font-medium list-item tracking-wide text-xl md:text-2xl font-medium"
              style={{ 
                fontFamily: "'Cabinet Grotesk', 'Cl clash', 'Plus Jakarta Sans', sans-serif", 
                lineHeight: 1.35
              }}
            >
              {/* Circle bullet glyph colored in Ceramic Cobalt (#0F4C81) */}
              <span className="shrink-0 mt-2 mr-4 rounded-full"
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  backgroundColor: TOKEN.cobalt,
                }}
                aria-hidden="true"
              />
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
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim()),
  )

  const headers = rowsParsed[0] || []
  const bodyRows = rowsParsed.slice(1)

  return (
    <div className="w-full max-h-[90%] overflow-y-auto rounded-xl border border-slate-200 pr-1">
      <table className="w-full text-left text-sm">
        <thead>
          <tr
            className="text-xs uppercase tracking-wide text-white"
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
                  className={`px-4 py-3 ${cellIndex === 0 ? "font-semibold" : ""}`}
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
