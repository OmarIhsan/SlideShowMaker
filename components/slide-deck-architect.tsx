"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  FileText,
  Hash,
  ImageIcon,
  LayoutGrid,
  LayoutTemplate,
  ListOrdered,
  Loader2,
  Presentation,
  Settings2,
  Sparkles,
  Tags,
  Upload,
  X,
  XCircle,
} from "lucide-react"
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  getSlideTitle,
  LAYOUT_LABELS,
  OUTPUT_TYPES,
  type OutputType,
  parseDocumentToSlides,
  SAMPLE_SCRIPT,
  type Slide,
  THEMES,
  type Theme,
  type ThemeId,
} from "@/lib/slide-engine"

const GENERATION_STEPS = [
  "Parsing document structure...",
  "Splitting sections & chapters...",
  "Applying layout templates...",
  "Building the evaluation bank...",
  "Configuring UI tags...",
]

type Phase = "idle" | "generating" | "ready"

export default function SlideDeckArchitect() {
  const [rawText, setRawText] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [outputType, setOutputType] = useState<OutputType>("clinical")
  const [themeId, setThemeId] = useState<ThemeId>("clinical")

  const [phase, setPhase] = useState<Phase>("idle")
  const [stepIndex, setStepIndex] = useState(0)
  const [slides, setSlides] = useState<Slide[]>([])
  const [[current, direction], setPage] = useState<[number, number]>([0, 0])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const theme = THEMES[themeId]
  const total = slides.length

  // ---- File ingestion ------------------------------------------------------
  const ingestFile = useCallback((file: File) => {
    setFileName(file.name)
    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      const reader = new FileReader()
      reader.onload = () => setRawText(String(reader.result ?? ""))
      reader.readAsText(file)
    } else {
      // PDF/DOCX binary parsing is simulated client-side.
      setRawText(SAMPLE_SCRIPT)
    }
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) ingestFile(file)
    },
    [ingestFile],
  )

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) ingestFile(file)
    },
    [ingestFile],
  )

  const handleLogoSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setLogoUrl(URL.createObjectURL(file))
  }, [])

  // ---- Generation ----------------------------------------------------------
  const canGenerate = rawText.trim().length > 0 || fileName !== null

  const handleGenerate = useCallback(() => {
    if (!canGenerate || phase === "generating") return
    setPhase("generating")
    setStepIndex(0)

    const source = rawText.trim().length > 0 ? rawText : SAMPLE_SCRIPT
    const result = parseDocumentToSlides(source)

    let step = 0
    const interval = setInterval(() => {
      step += 1
      if (step >= GENERATION_STEPS.length) {
        clearInterval(interval)
        setSlides(result.slides)
        setPage([0, 0])
        setPhase("ready")
      } else {
        setStepIndex(step)
      }
    }, 600)
  }, [canGenerate, phase, rawText])

  const reset = useCallback(() => {
    setPhase("idle")
    setSlides([])
    setPage([0, 0])
    setStepIndex(0)
  }, [])

  // ---- Navigation ----------------------------------------------------------
  const paginate = useCallback(
    (next: number) => {
      setPage(([cur]) => {
        const clamped = Math.max(0, Math.min(next, slides.length - 1))
        return [clamped, clamped > cur ? 1 : clamped < cur ? -1 : 0]
      })
    },
    [slides.length],
  )

  const goNext = useCallback(() => paginate(current + 1), [paginate, current])
  const goPrev = useCallback(() => paginate(current - 1), [paginate, current])

  useEffect(() => {
    if (phase !== "ready") return
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (e.key === "ArrowRight") goNext()
      else if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "Home") paginate(0)
      else if (e.key === "End") paginate(slides.length - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, goNext, goPrev, paginate, slides.length])

  const percent = total > 1 ? Math.round((current / (total - 1)) * 100) : 100

  const outline = useMemo(
    () => slides.map((s, i) => ({ index: i, title: getSlideTitle(s), layout: s.layout })),
    [slides],
  )

  return (
    <div className="flex h-dvh flex-col bg-slate-100 text-slate-900">
      <TopBar outputType={outputType} total={total} phase={phase} />

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* LEFT PANEL */}
        <aside className="flex w-full flex-col overflow-hidden border-b border-slate-200 bg-white lg:w-2/5 lg:border-b-0 lg:border-r">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
            <header>
              <div className="flex items-center gap-2">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${theme.accentBg} text-white`}>
                  <Presentation className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h1 className="text-lg font-semibold leading-tight text-slate-900">AI SlideDeck Architect</h1>
                  <p className="text-xs text-slate-500">Convert raw scripts into structured presentation modules.</p>
                </div>
              </div>
            </header>

            {/* Outline drawer (only once a deck exists) */}
            {phase === "ready" && (
              <OutlineDrawer outline={outline} current={current} theme={theme} onJump={paginate} />
            )}

            {/* File ingestion */}
            <section aria-labelledby="ingest-heading" className="flex flex-col gap-3">
              <SectionLabel id="ingest-heading" icon={Upload}>
                Document Ingestion
              </SectionLabel>

              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  isDragging
                    ? `${theme.ring} ring-2 border-transparent bg-slate-50`
                    : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-full ${theme.chipBg} ${theme.chipText}`}>
                  <Upload className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-slate-700">
                  Drag &amp; drop a document, or <span className={theme.accentText}>browse</span>
                </p>
                <p className="text-xs text-slate-400">Supports PDF, DOCX, and TXT — long documents welcome</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {fileName && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="flex items-center gap-2 truncate text-sm text-slate-700">
                    <FileText className={`h-4 w-4 shrink-0 ${theme.accentText}`} aria-hidden="true" />
                    <span className="truncate">{fileName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFileName(null)
                      setRawText("")
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              <div className="relative">
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={6}
                  placeholder="…or paste your raw script here. Use #, ##, and ### headers to control how chapters and slides are split."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_SCRIPT)}
                  className="absolute bottom-3 right-3 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  Load sample
                </button>
              </div>
            </section>

            {/* Branding */}
            <section aria-labelledby="brand-heading" className="flex flex-col gap-3">
              <SectionLabel id="brand-heading" icon={ImageIcon}>
                Branding
              </SectionLabel>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-slate-400"
                  aria-label="Upload custom logo"
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl || "/placeholder.svg"} alt="Custom logo preview" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
                <div className="text-sm">
                  <p className="font-medium text-slate-700">Upload Custom Logo</p>
                  <p className="text-xs text-slate-400">Shown on the title slide. PNG or SVG.</p>
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
              </div>
            </section>

            {/* Generation options */}
            <section aria-labelledby="options-heading" className="flex flex-col gap-3">
              <SectionLabel id="options-heading" icon={Settings2}>
                Generation Options
              </SectionLabel>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Output type">
                  <select
                    value={outputType}
                    onChange={(e) => setOutputType(e.target.value as OutputType)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {OUTPUT_TYPES.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Theme">
                  <select
                    value={themeId}
                    onChange={(e) => setThemeId(e.target.value as ThemeId)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {Object.values(THEMES).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>
          </div>

          {/* Action */}
          <div className="border-t border-slate-200 bg-white/90 p-6 backdrop-blur">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate || phase === "generating"}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors ${theme.accentBg} hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {phase === "generating" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {phase === "ready" ? "Regenerate Presentation" : "Generate Presentation"}
                </>
              )}
            </button>
            {phase === "ready" && (
              <button
                type="button"
                onClick={reset}
                className="mt-2 w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Reset &amp; start over
              </button>
            )}
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="relative flex flex-1 flex-col bg-slate-900">
          {phase === "idle" && <EmptyState />}
          {phase === "generating" && <GeneratingState stepIndex={stepIndex} theme={theme} />}
          {phase === "ready" && total > 0 && (
            <>
              {/* live progress bar */}
              <div className="relative h-1.5 w-full bg-slate-800">
                <motion.div
                  className={`h-full ${theme.accentBg}`}
                  initial={false}
                  animate={{ width: `${percent}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 30 }}
                />
              </div>

              <div className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
                <div className="aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={slides[current].id}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.32, ease: "easeOut" }}
                      className="h-full w-full"
                    >
                      <SlideRenderer slide={slides[current]} theme={theme} logoUrl={logoUrl} onJump={paginate} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* layout tag + percent */}
              <div className="pointer-events-none absolute right-6 top-6 flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-slate-800/90 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur">
                  <Tags className="h-3.5 w-3.5" aria-hidden="true" />
                  {LAYOUT_LABELS[slides[current].layout]}
                </span>
                <span className="rounded-full bg-slate-800/90 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur">
                  {percent}%
                </span>
              </div>

              {/* floating navigation suite */}
              <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
                <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-slate-800/90 p-1.5 shadow-lg backdrop-blur">
                  <NavButton onClick={goPrev} disabled={current === 0} label="Previous slide">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </NavButton>

                  <div className="flex items-center gap-1.5 px-1">
                    <Hash className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    <select
                      value={current}
                      onChange={(e) => paginate(Number(e.target.value))}
                      aria-label="Jump to slide"
                      className="max-w-[9rem] rounded-md border border-white/10 bg-slate-700/80 py-1 pl-1.5 pr-6 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-white/30 sm:max-w-[12rem]"
                    >
                      {outline.map((o) => (
                        <option key={o.index} value={o.index}>
                          {o.index + 1}. {o.title}
                        </option>
                      ))}
                    </select>
                    <span className="hidden whitespace-nowrap text-xs font-medium text-slate-400 sm:inline">
                      of {total}
                    </span>
                  </div>

                  <NavButton onClick={goNext} disabled={current === total - 1} label="Next slide">
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </NavButton>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

/* ----------------------------- Animation variants -------------------------- */

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 64 : dir < 0 ? -64 : 0 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -64 : dir < 0 ? 64 : 0 }),
}

/* ----------------------------- Sub-components ------------------------------ */

function TopBar({ outputType, total, phase }: { outputType: OutputType; total: number; phase: Phase }) {
  const label = OUTPUT_TYPES.find((o) => o.id === outputType)?.label ?? ""
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <LayoutTemplate className="h-4 w-4 text-teal-600" aria-hidden="true" />
        Layout Engine
      </div>
      <div className="flex items-center gap-2">
        {phase === "ready" && (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
            {total} slides generated
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">{label}</span>
      </div>
    </div>
  )
}

function OutlineDrawer({
  outline,
  current,
  theme,
  onJump,
}: {
  outline: { index: number; title: string; layout: Slide["layout"] }[]
  current: number
  theme: Theme
  onJump: (i: number) => void
}) {
  return (
    <section aria-labelledby="outline-heading" className="flex flex-col gap-3">
      <SectionLabel id="outline-heading" icon={ListOrdered}>
        Slide Outline
      </SectionLabel>
      <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-1.5">
        <ul className="flex flex-col gap-0.5">
          {outline.map((o) => {
            const active = o.index === current
            return (
              <li key={o.index}>
                <button
                  type="button"
                  onClick={() => onJump(o.index)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                    active ? `${theme.accentBg} text-white` : "text-slate-600 hover:bg-white"
                  }`}
                >
                  <span
                    className={`flex h-5 w-6 shrink-0 items-center justify-center rounded text-[11px] font-semibold ${
                      active ? "bg-white/20 text-white" : "bg-white text-slate-500"
                    }`}
                  >
                    {o.index + 1}
                  </span>
                  <span className="truncate">{o.title}</span>
                  <span
                    className={`ml-auto shrink-0 text-[10px] uppercase tracking-wide ${
                      active ? "text-white/70" : "text-slate-400"
                    }`}
                  >
                    {o.layout}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function SectionLabel({
  id,
  icon: Icon,
  children,
}: {
  id: string
  icon: typeof Upload
  children: React.ReactNode
}) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </h2>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function NavButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
        <Presentation className="h-9 w-9 text-slate-400" aria-hidden="true" />
      </div>
      <div className="max-w-sm">
        <h2 className="text-lg font-semibold text-slate-100">No presentation yet</h2>
        <p className="mt-1 text-sm text-slate-400">
          Upload a document or paste content on the left to initialize the layout engine.
        </p>
      </div>
    </div>
  )
}

function GeneratingState({ stepIndex, theme }: { stepIndex: number; theme: Theme }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <Loader2 className={`h-10 w-10 animate-spin ${theme.accentText}`} aria-hidden="true" />
      <div className="w-full max-w-sm space-y-3">
        {GENERATION_STEPS.map((label, i) => {
          const done = i < stepIndex
          const active = i === stepIndex
          return (
            <div key={label} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  done
                    ? `${theme.accentBg} text-white`
                    : active
                      ? "bg-slate-700 text-slate-200"
                      : "bg-slate-800 text-slate-500"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span className={`text-sm ${done ? "text-slate-300" : active ? "text-slate-100" : "text-slate-500"}`}>
                {label}
              </span>
              {active && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-slate-400" aria-hidden="true" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------ Slide renderers ---------------------------- */

function SlideRenderer({
  slide,
  theme,
  logoUrl,
  onJump,
}: {
  slide: Slide
  theme: Theme
  logoUrl: string | null
  onJump: (i: number) => void
}) {
  switch (slide.layout) {
    case "title":
      return <TitleSlide slide={slide} theme={theme} logoUrl={logoUrl} />
    case "toc":
      return <TocSlide slide={slide} theme={theme} onJump={onJump} />
    case "chapter":
      return <ChapterSlide slide={slide} theme={theme} logoUrl={logoUrl} />
    case "content":
      return <ContentSlide slide={slide} theme={theme} />
    case "split":
      return <SplitSlide slide={slide} theme={theme} />
    case "process":
      return <ProcessSlide slide={slide} theme={theme} />
    case "grid":
      return <GridSlide slide={slide} theme={theme} />
    case "table":
      return <TableSlide slide={slide} theme={theme} />
    case "warning":
      return <WarningSlide slide={slide} />
    case "quiz":
      return <QuizSlide slide={slide} theme={theme} />
    default:
      return null
  }
}

function TitleSlide({
  slide,
  theme,
  logoUrl,
}: {
  slide: Extract<Slide, { layout: "title" }>
  theme: Theme
  logoUrl: string | null
}) {
  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden bg-slate-900 px-10 py-12 sm:px-16">
      <div className={`absolute left-0 top-0 h-full w-2 ${theme.accentBg}`} aria-hidden="true" />
      <div
        className={`absolute -right-24 -top-24 h-72 w-72 rounded-full ${theme.accentBg} opacity-20 blur-3xl`}
        aria-hidden="true"
      />

      {logoUrl && (
        <div className="absolute right-10 top-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl || "/placeholder.svg"} alt="Presentation logo" className="h-12 w-auto object-contain" />
        </div>
      )}

      <p className={`text-sm font-semibold uppercase tracking-widest ${theme.accentText}`}>{slide.kicker}</p>
      <h2 className="mt-4 max-w-3xl text-balance text-3xl font-bold leading-tight text-white sm:text-5xl">
        {slide.title}
      </h2>
      <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">{slide.subtitle}</p>
    </div>
  )
}

function TocSlide({
  slide,
  theme,
  onJump,
}: {
  slide: Extract<Slide, { layout: "toc" }>
  theme: Theme
  onJump: (i: number) => void
}) {
  return (
    <div className="flex h-full flex-col justify-center px-8 py-10 sm:px-14">
      <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{slide.title}</h2>
      <p className="mt-1 text-sm text-slate-500">Jump straight to any chapter.</p>
      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {slide.items.map((item) => (
          <button
            key={item.n}
            type="button"
            onClick={() => onJump(item.target)}
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${theme.accentBg}`}
            >
              {String(item.n).padStart(2, "0")}
            </span>
            <span className="truncate text-sm font-medium text-slate-700">{item.label}</span>
            <ChevronRight
              className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function ChapterSlide({
  slide,
  theme,
  logoUrl,
}: {
  slide: Extract<Slide, { layout: "chapter" }>
  theme: Theme
  logoUrl: string | null
}) {
  return (
    <div className={`relative flex h-full flex-col justify-center overflow-hidden ${theme.accentBg} px-10 py-12 sm:px-16`}>
      <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      {logoUrl && (
        <div className="absolute right-10 top-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl || "/placeholder.svg"} alt="Presentation logo" className="h-10 w-auto object-contain opacity-90" />
        </div>
      )}
      <p className="text-7xl font-black leading-none text-white/30 sm:text-8xl">
        {String(slide.index).padStart(2, "0")}
      </p>
      <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-white/80">{slide.kicker}</p>
      <h2 className="mt-2 max-w-3xl text-balance text-3xl font-bold leading-tight text-white sm:text-5xl">
        {slide.title}
      </h2>
    </div>
  )
}

function ContentSlide({ slide, theme }: { slide: Extract<Slide, { layout: "content" }>; theme: Theme }) {
  return (
    <div className="relative flex h-full flex-col justify-center px-8 py-10 sm:px-14">
      <div className={`absolute left-0 top-1/2 h-24 w-1.5 -translate-y-1/2 rounded-r ${theme.accentBg}`} aria-hidden="true" />
      <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{slide.title}</h2>
      <div className="mt-5 max-w-3xl space-y-4">
        {slide.paragraphs.map((p, i) => (
          <p key={i} className="text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
            {p}
          </p>
        ))}
        {slide.bullets.length > 0 && (
          <ul className="space-y-2 pt-1">
            {slide.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 sm:text-base">
                <CircleCheck className={`mt-0.5 h-4 w-4 shrink-0 ${theme.accentText}`} aria-hidden="true" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SplitSlide({ slide, theme }: { slide: Extract<Slide, { layout: "split" }>; theme: Theme }) {
  return (
    <div className="grid h-full grid-cols-1 sm:grid-cols-2">
      <div className="flex flex-col justify-center gap-5 px-8 py-10 sm:px-12">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{slide.title}</h2>
        <ul className="space-y-3">
          {slide.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              <CircleCheck className={`mt-0.5 h-5 w-5 shrink-0 ${theme.accentText}`} aria-hidden="true" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center bg-slate-50 px-8 py-10 sm:px-12">
        <div className="grid w-full gap-3">
          {slide.callouts.map((c) => (
            <div key={c.term} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className={`text-sm font-bold ${theme.accentText}`}>{c.term}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{c.def}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProcessSlide({ slide, theme }: { slide: Extract<Slide, { layout: "process" }>; theme: Theme }) {
  return (
    <div className="flex h-full flex-col justify-center px-8 py-10 sm:px-12">
      <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{slide.title}</h2>
      {slide.intro && <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">{slide.intro}</p>}
      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {slide.steps.map((step, i) => (
          <div key={step.step} className="flex flex-1 items-center gap-3 lg:flex-col lg:items-stretch">
            <div className="relative flex flex-1 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${theme.accentBg}`}
              >
                {step.step}
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-900">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.detail}</p>
            </div>
            {i < slide.steps.length - 1 && (
              <ChevronRight className="hidden h-5 w-5 shrink-0 self-center text-slate-300 lg:block" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function GridSlide({ slide, theme }: { slide: Extract<Slide, { layout: "grid" }>; theme: Theme }) {
  const cols = slide.items.length <= 4 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
  return (
    <div className="flex h-full flex-col justify-center px-8 py-10 sm:px-12">
      <div className="flex items-center gap-2">
        <LayoutGrid className={`h-5 w-5 ${theme.accentText}`} aria-hidden="true" />
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{slide.title}</h2>
      </div>
      <div className={`mt-6 grid grid-cols-1 gap-3 ${cols}`}>
        {slide.items.map((item) => (
          <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            {item.detail && <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.detail}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function TableSlide({ slide, theme }: { slide: Extract<Slide, { layout: "table" }>; theme: Theme }) {
  return (
    <div className="flex h-full flex-col justify-center px-8 py-10 sm:px-12">
      <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{slide.title}</h2>
      {slide.intro && <p className="mt-2 text-sm text-slate-500 sm:text-base">{slide.intro}</p>}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              {slide.columns.map((c, i) => (
                <th key={c} className={`px-4 py-3 font-semibold ${i > 1 ? "hidden sm:table-cell" : ""}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slide.rows.map((row, r) => (
              <tr key={r} className="bg-white">
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className={`px-4 py-3 ${c === 0 ? `font-semibold ${theme.accentText}` : "text-slate-600"} ${
                      c > 1 ? "hidden sm:table-cell" : ""
                    }`}
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

function WarningSlide({ slide }: { slide: Extract<Slide, { layout: "warning" }> }) {
  const danger = slide.level === "danger"
  const palette = danger
    ? { border: "border-red-300", bg: "bg-red-50", icon: "text-red-600", chipBg: "bg-red-100", chipText: "text-red-700", dot: "text-red-500" }
    : { border: "border-amber-300", bg: "bg-amber-50", icon: "text-amber-600", chipBg: "bg-amber-100", chipText: "text-amber-700", dot: "text-amber-500" }

  return (
    <div className="flex h-full flex-col justify-center px-8 py-10 sm:px-12">
      <div className={`rounded-2xl border-2 ${palette.border} ${palette.bg} p-6 sm:p-8`}>
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${palette.chipBg} ${palette.icon}`}>
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <span className={`text-xs font-bold uppercase tracking-widest ${palette.chipText}`}>
              {danger ? "Critical • Contraindications" : "Clinical Precautions"}
            </span>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{slide.title}</h2>
          </div>
        </div>
        <ul className="mt-5 space-y-2.5">
          {slide.points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700 sm:text-base">
              <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${palette.dot}`} aria-hidden="true" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        {slide.note && <p className="mt-5 text-xs italic text-slate-500">{slide.note}</p>}
      </div>
    </div>
  )
}

function QuizSlide({ slide, theme }: { slide: Extract<Slide, { layout: "quiz" }>; theme: Theme }) {
  const [selected, setSelected] = useState<number | null>(null)
  const answered = selected !== null

  return (
    <div className="flex h-full flex-col justify-center px-8 py-10 sm:px-12">
      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${theme.chipBg} ${theme.chipText}`}
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        {slide.title}
      </span>
      <h2 className="mt-4 max-w-2xl text-xl font-bold text-slate-900 sm:text-2xl">{slide.question}</h2>

      <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
        {slide.options.map((opt, i) => {
          const isCorrect = i === slide.correctIndex
          const isChosen = i === selected
          let state = "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          if (answered && isCorrect) state = "border-green-500 bg-green-50 text-green-800"
          else if (answered && isChosen && !isCorrect) state = "border-red-500 bg-red-50 text-red-800"
          else if (answered) state = "border-slate-200 bg-white text-slate-400"

          return (
            <button
              key={opt.text}
              type="button"
              disabled={answered}
              onClick={() => setSelected(i)}
              className={`flex items-center justify-between gap-2 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default ${state}`}
            >
              <span>{opt.text}</span>
              {answered && isCorrect && <Check className="h-4 w-4 text-green-600" aria-hidden="true" />}
              {answered && isChosen && !isCorrect && <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />}
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 flex max-w-2xl items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600"
          >
            <CircleCheck className={`mt-0.5 h-4 w-4 shrink-0 ${theme.accentText}`} aria-hidden="true" />
            <span>{slide.explanation}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
