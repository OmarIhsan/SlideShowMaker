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
  return (
    <div className="relative h-full w-full overflow-hidden select-none" style={{ backgroundColor: theme.hexBg }}>
      {logoUrl && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-10">
          <img src={logoUrl} alt="Watermark Logo" className="h-[55%] w-[60%] object-contain" />
        </div>
      )}

      <div className="absolute bottom-4 left-8 right-8 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[10px] text-slate-400">
        <span>
          Lecturer: <strong>{lecturerName || "Academic Staff"}</strong>
        </span>
        <span>Academic Lecture Series</span>
      </div>

      {(() => {
        switch (slide.layout) {
          case "STANDARD_CONTENT":
            return <ContentSlide slide={slide} theme={theme} />
          case "TABULAR_DATA":
            return <TableSlide slide={slide} theme={theme} />
          default:
            return <ContentSlide slide={slide} theme={theme} />
        }
      })()}
    </div>
  )
}

function ContentSlide({ slide, theme }: { slide: Slide; theme: Theme }) {
  return (
    <div className="relative flex h-full flex-col justify-center px-10 pb-16 select-text">
      <div className="absolute left-0 top-[31.1%] h-[56.8%] w-1.5 rounded-r" style={{ backgroundColor: theme.hexPrimary }} aria-hidden="true" />

      <div className="flex flex-col items-start gap-4">
        <h2 className="w-full text-left text-2xl font-bold leading-none tracking-tight font-sans sm:text-3xl" style={{ color: theme.hexPrimary }}>
          {slide.title}
        </h2>

        <div className="min-h-[350px] h-[56.8%] max-w-[86%] flex flex-col justify-center space-y-3 overflow-hidden break-words pr-2 text-left">
          {slide.content.map((text, i) => {
            const isListItem = text.startsWith("-") || text.startsWith("*") || text.startsWith("•") || /^\d+[.)]/.test(text)
            if (isListItem) {
              return (
                <div key={i} className="flex items-start gap-2.5 text-sm leading-normal text-slate-600 sm:text-base sm:leading-normal">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: theme.hexPrimary }} />
                  <span>{text.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim()}</span>
                </div>
              )
            }

            return (
              <p key={i} className="text-pretty text-sm leading-normal text-slate-600 sm:text-base sm:leading-normal">
                {text}
              </p>
            )
          })}
        </div>
      </div>
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
    <div className="flex h-full flex-col justify-center px-8 py-10 sm:px-12">
      <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: theme.hexPrimary }}>
        {slide.title}
      </h2>
      <div className="mt-4 max-h-[60%] overflow-y-auto rounded-xl border border-slate-200 pr-1">
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
    </div>
  )
}
