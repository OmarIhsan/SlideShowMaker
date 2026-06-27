import type { Slide, Theme } from "@/lib/slide-engine"

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

  return (
    <div 
      className="relative flex flex-col h-full w-full justify-between overflow-hidden select-none px-10 pt-10 pb-16 text-left" 
      style={{ backgroundColor: theme.hexBg }}
    >
      {logoUrl && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-10">
          <img src={logoUrl} alt="Watermark Logo" className="h-[55%] w-[60%] object-contain" />
        </div>
      )}

      {/* Visual Accent bar mirroring coordinates of PowerPoint */}
      {!isTitleSlide && (
        <div 
          className="absolute left-0 w-1.5 rounded-r" 
          style={{ 
            top: "26.7%", // 1.5 inches out of 5.625 inches
            height: "60.4%", // 3.4 inches out of 5.625 inches
            backgroundColor: theme.hexPrimary 
          }} 
          aria-hidden="true" 
        />
      )}

      {/* Slide Title Header Box */}
      <div className="mb-6 border-b pb-2">
        <h2 
          className="text-3xl md:text-4xl font-bold font-sans tracking-tight leading-none text-teal-800" 
          style={{ color: theme.hexPrimary }}
        >
          {slide.title}
        </h2>
      </div>

      {/* Main Slide Body Content (maps into an independent, vertically centered middle container box) */}
      <div className="flex-grow flex flex-col justify-center pb-12 text-left max-w-[86%] overflow-hidden break-words pr-2">
        {(() => {
          switch (slide.layout) {
            case "TABULAR_DATA":
              return <TableSlide slide={slide} theme={theme} />
            default:
              return <ContentSlide slide={slide} theme={theme} />
          }
        })()}
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-8 right-8 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[10px] text-slate-400">
        <span>
          Lecturer: <strong>{lecturerName || "Academic Staff"}</strong>
        </span>
        <span />
      </div>
    </div>
  )
}

function ContentSlide({ slide, theme }: { slide: Slide; theme: Theme }) {
  return (
    <div className="w-full">
      <ul className="list-disc pl-6 space-y-4">
        {slide.content.map((text, i) => {
          const cleanText = text
            .replace(/^[-*•]\s*/, "")
            .replace(/^\d+[.)]\s*/, "")
            .replace(/^[a-zA-Z][.)]\s*/, "")
            .trim()
          return (
            <li 
              key={i} 
              className="text-xl md:text-2xl font-medium leading-relaxed text-slate-700 list-item"
              style={{ color: theme.hexPrimary }}
            >
              <span className="text-slate-700">{cleanText}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function TableSlide({ slide, theme }: { slide: Slide; theme: Theme }) {
  const rowsParsed = slide.content.map((rowText) => {
    return rowText
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim())
  })

  const headers = rowsParsed[0] || []
  const bodyRows = rowsParsed.slice(1)

  return (
    <div className="w-full max-h-[90%] overflow-y-auto rounded-xl border border-slate-200 pr-1">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-white" style={{ backgroundColor: theme.hexPrimary }}>
            {headers.map((header, index) => (
              <th key={index} className="px-3 py-2 font-semibold">
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
                  className={`px-3 py-2 ${cellIndex === 0 ? "font-semibold" : "text-slate-600"}`}
                  style={cellIndex === 0 ? { color: theme.hexPrimary } : undefined}
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
