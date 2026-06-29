import type { Slide, Theme } from "@/lib/slide-engine"

// ============================================================
// GLOBAL DESIGN TOKENS (Contrast Avant-Garde framework)
//   Canvas Base:            #F8F9FA  (Clinical Base)
//   Bullet Glyph:           #0F4C81  (Ceramic Cobalt)
//   Body Text:              #1E293B  (Deep Enamel)
//   Structural Anchor:      #C5A059  (Dentin Gold) — solid 24px left column
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
}: {
  slide: Slide
  theme: Theme
  logoUrl: string | null
  lecturerName: string
}) {
  const isTitleSlide = slide.id === 1

  // ── CHAPTER DIVIDER ─────────────────────────────────────────
  // Full-bleed #1E293B canvas (left 60%) + solid #C5A059 block (right 40%).
  // Zero background photography, zero floating lines.
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
          {/* Small underline accent in gold beneath the title */}
          <div className="mt-5 h-1 w-20" style={{ backgroundColor: TOKEN.gold }} />
        </div>
      </div>
    )
  }

  // ── STANDARD SLIDES ─────────────────────────────────────────
  return (
    <div
      className="relative flex flex-col h-full w-full justify-between overflow-hidden select-none pb-14 text-left pl-14 pr-10 pt-8"
      style={{ backgroundColor: TOKEN.canvas, fontFamily: "Inter, sans-serif" }}
    >
      {/* === STRUCTURAL ARCHITECTURAL BLOCK ===
          Solid 24px (#C5A059) Dentin Gold anchoring column.
          Stretches from absolute top to absolute bottom of every standard slide.
          Completely replaces all floating line dividers. */}
      {!isTitleSlide && (
        <div
          className="absolute left-0 top-0 bottom-0 z-10"
          style={{ width: "24px", backgroundColor: TOKEN.gold }}
          aria-hidden="true"
        />
      )}

      {/* ── TITLE SLIDE header (id === 1 only) ── */}
      {isTitleSlide && (
        <div className="z-10 w-full mb-6">
          <div className="mt-10 mb-6">
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight leading-tight"
              style={{ color: TOKEN.cobalt }}
            >
              {slide.title}
            </h1>
            <div className="mt-5 h-0.5 w-32" style={{ backgroundColor: TOKEN.cobalt }} />
          </div>
        </div>
      )}

      {/* ── MAIN BODY ── */}
      <div
        className={`flex-grow flex flex-col ${isTitleSlide ? "justify-start" : "justify-center"} w-full overflow-hidden break-words z-10`}
      >
        {(() => {
          switch (slide.layout) {
            case "TABULAR_DATA":
              return <TableSlide slide={slide} theme={theme} />
            default:
              return <ContentSlide slide={slide} isTitleSlide={isTitleSlide} />
          }
        })()}
      </div>

      {/* ── FOOTER ── */}
      <div className="absolute bottom-3 left-10 right-8 flex items-center justify-between border-t pt-2 z-10"
           style={{ borderColor: "rgba(100,116,139,0.25)" }}>
        <span className="text-[10px]" style={{ color: TOKEN.caption, fontFamily: "Inter, sans-serif" }}>
          Lecturer: <strong>{lecturerName || "Academic Staff"}</strong>
        </span>
        <span />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// ContentSlide
// Typography template (§2):
//   Standard slide text: text-2xl md:text-3xl font-medium tracking-wide leading-relaxed
//   Bullet spacing: space-y-6 (matches 28pt PPTX line-spacing)
//   Bullet glyph: solid #0F4C81 square (■) — no default disc marker
// ──────────────────────────────────────────────────────────────
function ContentSlide({ slide, isTitleSlide }: { slide: Slide; isTitleSlide?: boolean }) {
  const isWarning = (text: string) => {
    const lower = text.toLowerCase()
    return ["warning", "caution", "ethics", "fabrication", "fraud", "violation", "critical"].some(
      (w) => lower.includes(w),
    )
  }

  return (
    <div className="w-full">
      <ul className="list-none space-y-6 pl-0">
        {slide.content.map((text, i) => {
          const cleanText = text
            .replace(/^[-*•]\s*/, "")
            .replace(/^\d+[.)]\s*/, "")
            .replace(/^[a-zA-Z][.)]\s*/, "")
            .trim()

          if (!cleanText) return null

          // Warning / callout item
          if (isWarning(cleanText)) {
            return (
              <li key={i} className="list-none">
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
                    className="text-lg font-semibold leading-relaxed"
                    style={{ color: TOKEN.enamel }}
                  >
                    {cleanText}
                  </span>
                </div>
              </li>
            )
          }

          // Standard bullet item
          return (
            <li
              key={i}
              className={`flex items-start ${
                isTitleSlide
                  ? "text-xl font-semibold tracking-normal leading-relaxed"
                  : "text-xl md:text-2xl font-semibold tracking-normal leading-relaxed"
              }`}
            >
              {/* Square bullet glyph — Ceramic Cobalt #0F4C81 */}
              <span
                className="shrink-0 mt-2 mr-4"
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
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

// ──────────────────────────────────────────────────────────────
// TableSlide
// ──────────────────────────────────────────────────────────────
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
