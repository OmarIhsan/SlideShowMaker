import type { Slide, Theme } from "@/lib/slide-engine"

// ============================================================
// GLOBAL DESIGN TOKENS (Clinical Minimalist framework)
//   Canvas Base:            #F8F9FA  (Clinical Off-White)
//   Bullet Glyph:           #0F4C81  (Ceramic Cobalt)
//   Body Text:              #1E293B  (Slate Charcoal)
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
  // ── CHAPTER DIVIDER ─────────────────────────────────────────
  if (slide.layout === "CHAPTER_DIVIDER") {
    return (
      <div
        className="relative flex flex-col h-full w-full overflow-hidden select-none items-center justify-center"
        style={{ backgroundColor: "#1E293B", fontFamily: "Inter, sans-serif" }}
      >
        {/* Title: centered, y: 1.5 (top: 26.67%) */}
        <h1 
          className="absolute font-bold text-center w-full px-4" 
          style={{ 
            color: "#C5A059",
            fontSize: "44px",
            top: "26.67%",
            left: "0"
          }}
        >
          {slide.title}
        </h1>

        {/* Aesthetic Geometric Anchor: centered, top: 44.44%, w: 53.33%, h: 53.33% */}
        <div
          className="absolute overflow-hidden flex flex-col items-center justify-center"
          style={{
            top: "44.44%",
            width: "53.33%",
            height: "53.33%",
            left: "23.33%",
            backgroundColor: TOKEN.cobalt,
            borderTop: `4px solid ${TOKEN.gold}`,
          }}
        >
          {/* Abstract geometric lines inside the block */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `linear-gradient(45deg, transparent 48%, ${TOKEN.gold} 49%, ${TOKEN.gold} 51%, transparent 52%)`,
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
        {/* Subtle Brand Metadata Header at top left (0.5 left margin -> 6.67%) */}
        <div
          className="absolute z-10 text-xs font-bold tracking-widest uppercase"
          style={{ left: "6.67%", top: "8.9%", color: "#94A3B8", fontFamily: "Inter, sans-serif" }}
        >
          {brandHeader}
        </div>

        {/* Header */}
        <div
          className="absolute z-10 text-lg font-bold"
          style={{ left: "6.67%", top: "14%", color: TOKEN.cobalt, fontFamily: "Inter, sans-serif" }}
        >
          {slide.title}
        </div>

        {/* Split Aesthetic Container */}
        <div 
          className="absolute flex flex-row items-center justify-between"
          style={{ left: "6.67%", top: "25%", width: "86.66%", height: "55%" }}
        >
          {/* Left Block - Charcoal Anchor */}
          <div className="w-[48%] h-full flex flex-col items-center justify-center">
            <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: TOKEN.enamel, borderBottom: `3px solid ${TOKEN.cobalt}` }}>
               {/* Inner geometric accent */}
               <div className="absolute inset-4 border opacity-30" style={{ borderColor: TOKEN.canvas }}></div>
            </div>
            <span className="mt-3 text-[10px] italic font-sans" style={{ color: TOKEN.caption }}>Baseline clinical framework.</span>
          </div>
          
          {/* Right Block - Cobalt Anchor */}
          <div className="w-[48%] h-full flex flex-col items-center justify-center">
            <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: TOKEN.cobalt, borderBottom: `3px solid ${TOKEN.gold}` }}>
               {/* Inner geometric accent */}
               <div className="absolute inset-4 border opacity-30" style={{ borderColor: TOKEN.gold }}></div>
            </div>
            <span className="mt-3 text-[10px] italic font-sans" style={{ color: TOKEN.caption }}>Targeted procedural outcome.</span>
          </div>
        </div>

        {/* Running Footer */}
        <div
          className="absolute bottom-4 flex items-center justify-between border-t pt-2 z-10"
          style={{ borderColor: "#F1F5F9", left: "20.0%", width: "46.66%" }}
        >
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: TOKEN.cobalt }}>
            {brandFooterLeft}
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#94A3B8" }}>
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

      {/* Vertical dividing line (1px Ceramic Cobalt) */}
      <div
        className="absolute z-10"
        style={{ left: "20.0%", top: "19.6%", width: "1px", height: "60.4%", backgroundColor: TOKEN.cobalt }}
        aria-hidden="true"
      />

      {/* Subtle Brand Metadata Header at top left */}
      <div
        className="absolute z-10 text-xs font-bold tracking-widest uppercase"
        style={{ left: "7.33%", top: "8.9%", color: "#94A3B8", fontFamily: "Inter, sans-serif" }}
      >
        {brandHeader}
      </div>

      {/* Main slide content bounding box */}
      <div
        className="absolute flex flex-col justify-center text-left overflow-hidden break-words pr-2 z-10"
        style={{ left: "20.67%", top: "22.22%", width: "46.0%", height: "60.44%", fontFamily: "Plus Jakarta Sans, sans-serif" }}
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

      {/* Running Footer aligned to left: 6.67% and width: 86.66% */}
      <div
        className="absolute bottom-4 flex items-center justify-between border-t pt-2 z-10"
        style={{ borderColor: "#F1F5F9", left: "6.67%", width: "86.66%" }}
      >
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: TOKEN.cobalt }}>
          {brandFooterLeft}
        </span>
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#94A3B8" }}>
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
  const contentToRender = slide.content;

  return (
    <div className="w-full">
      <ul className="space-y-4 pl-0">
        {contentToRender.filter(line => line.trim().length > 0).map((lineText: string, index: number) => {
          const isUnordered = lineText.startsWith("-") || lineText.startsWith("*") || lineText.startsWith("•")
          const isOrdered = /^\d+[.)]/.test(lineText) || /^[a-zA-Z][.)]/.test(lineText)
          const isListItem = isUnordered || isOrdered

          const cleanText = lineText
            .replace(/^[-*•]\s*/, "")
            .replace(/^\d+[.)]\s*/, "")
            .replace(/^[a-zA-Z][.)]\s*/, "")
            .trim()

          if (!cleanText) return null

          return (
            <li
              key={index}
              className="flex items-start font-semibold tracking-normal text-[15px] font-['Plus_Jakarta_Sans'] text-justify"
              style={{ 
                fontFamily: "'Cabinet Grotesk', 'Cl clash', 'Plus Jakarta Sans', sans-serif", 
                lineHeight: 1.3,
                textAlign: "justify"
              }}
            >
              {/* Circle bullet glyph colored in Ceramic Cobalt (#0F4C81) */}
              {isListItem && (
                <span className="shrink-0 mt-2 mr-4 rounded-full"
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
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
