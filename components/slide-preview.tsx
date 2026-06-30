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
        className="relative flex flex-col h-full w-full overflow-hidden select-none items-center justify-center"
        style={{ backgroundColor: "#1E293B", fontFamily: "Inter, sans-serif" }}
      >
        {/* Title: centered, y: 1.5 (top: 26.67%) */}
        <h1 
          className="absolute font-bold text-center w-full px-4" 
          style={{ 
            color: "#C5A059",
            fontSize: "44px", // Updated to 44pt
            top: "26.67%",
            left: "0"
          }}
        >
          {slide.title}
        </h1>

        {/* Media Frame: centered, y: 2.5, w: 4.0, h: 3.0, Borderless Raw Crop */}
        <div
          className="absolute overflow-hidden rounded flex flex-col items-center justify-center bg-slate-800 border border-slate-700/50"
          style={{
            top: "44.44%",
            width: "53.33%",
            height: "53.33%",
            left: "23.33%"
          }}
        >
          <svg className="w-10 h-10 text-[#C5A059]/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] font-bold text-[#C5A059] tracking-widest uppercase">
            Centered Macro Isolation View
          </span>
          <span className="text-[8px] text-slate-400 mt-1 uppercase">Borderless Raw Crop</span>
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

        {/* Header (Optional display for Layout C context) */}
        <div
          className="absolute z-10 text-lg font-bold"
          style={{ left: "6.67%", top: "14%", color: TOKEN.cobalt, fontFamily: "Inter, sans-serif" }}
        >
          {slide.title}
        </div>

        {/* Split Media Container */}
        <div 
          className="absolute flex flex-row items-center justify-between"
          style={{ left: "6.67%", top: "25%", width: "86.66%", height: "55%" }}
        >
          {/* Left Block */}
          <div className="w-[48%] h-full flex flex-col items-center justify-center">
            <div className="w-full h-full bg-slate-200 border border-slate-300 rounded flex flex-col items-center justify-center">
               <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
               </svg>
               <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Pre-Op State</span>
            </div>
            <span className="mt-3 text-[10px] italic text-slate-500 font-sans">Baseline clinical observation prior to intervention.</span>
          </div>
          
          {/* Right Block */}
          <div className="w-[48%] h-full flex flex-col items-center justify-center">
            <div className="w-full h-full bg-slate-200 border border-slate-300 rounded flex flex-col items-center justify-center">
               <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
               </svg>
               <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Post-Op Outcome</span>
            </div>
            <span className="mt-3 text-[10px] italic text-slate-500 font-sans">Final restoration state following targeted procedure.</span>
          </div>
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

      {/* Vertical dividing line (1px Ceramic Cobalt) matching pptx x: 0.5 (left: 6.67%), top: 19.6%, h: 3.4 */}
      <div
        className="absolute z-10"
        style={{ left: "6.67%", top: "19.6%", width: "1px", height: "60.4%", backgroundColor: TOKEN.cobalt }}
        aria-hidden="true"
      />

      {/* Subtle Brand Metadata Header at top left (x: 0.55 -> 7.33%, y: 0.5) */}
      <div
        className="absolute z-10 text-xs font-bold tracking-widest uppercase"
        style={{ left: "7.33%", top: "8.9%", color: "#94A3B8", fontFamily: "Inter, sans-serif" }}
      >
        {brandHeader}
      </div>

      {/* Main slide content bounding box: x: 0.55 (left: 7.33%), y: 1.25 (top: 22.22%), w: 2.55 (width: 34.0%), h: 3.4 (height: 60.44%) */}
      <div
        className="absolute flex flex-col justify-center text-left overflow-hidden break-words pr-2 z-10"
        style={{ left: "7.33%", top: "22.22%", width: "34.0%", height: "60.44%" }}
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

      {/* Media Frame on standard slides: x: 3.1 (left: 41.33%), y: 1.25 (top: 22.22%), w: 3.9 (width: 52.0%), h: 3.4 (height: 60.44%) */}
      {/* Massive unbordered 4:3 media container */}
      <div
        className="absolute rounded flex flex-col items-center justify-center p-3 text-center z-10 bg-slate-200"
        style={{ left: "41.33%", top: "22.22%", width: "52.0%", height: "60.44%" }}
      >
        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          Intraoral Macro Photo
        </span>
        <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-[9px] text-slate-500 uppercase">Unbordered Operative Imagery</span>
        
        {/* Annotation gold vector arrow (Dentin Gold #C5A059) */}
        <div className="absolute bottom-4 right-4 flex items-center text-[10px] font-bold text-[#C5A059]">
          <span>Structural Detail Focus</span>
          <svg className="w-3.5 h-3.5 ml-1 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
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
          const isUnordered = lineText.startsWith("-") || lineText.startsWith("*") || lineText.startsWith("•")
          const isOrdered = /^\d+[.)]/.test(lineText) || /^[a-zA-Z][.)]/.test(lineText)
          const isListItem = isUnordered || isOrdered

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
                    className="font-semibold leading-relaxed text-lg font-medium tracking-normal text-justify"
                    style={{ color: TOKEN.enamel, textAlign: "justify" }}
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
              className="flex items-start font-medium tracking-normal text-lg font-medium text-justify"
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
