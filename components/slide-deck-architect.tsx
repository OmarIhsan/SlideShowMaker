"use client"

import { AnimatePresence, motion } from "framer-motion"
import confetti from "canvas-confetti"
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Hash,
  LayoutTemplate,
  Presentation,
  Settings2,
  Sparkles,
  Tags,
  Upload,
  Loader2,
} from "lucide-react"
import {
  type ChangeEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  LAYOUT_LABELS,
  THEMES,
  type Theme,
  type ThemeId,
} from "@/lib/slide-engine"
import {
  exportSlidesToPDFWithFallback,
  exportSlidesToPowerPoint,
} from "@/lib/presentation-exporters"
import { useSlideDeckGeneration } from "@/hooks/use-slide-deck-generation"
import { SlideRenderer } from "@/components/slide-preview"
import { EmptyState, GeneratingState, NavButton, OutlineDrawer, SectionLabel, TopBar } from "@/components/slide-deck-chrome"

export default function SlideDeckArchitect() {
  // Branding States
  const [lecturerName, setLecturerName] = useState("Dr. Faisal Alhuwaizi")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoBase64, setLogoBase64] = useState<string | null>(null)

  // Theme Engine States
  const [themeId, setThemeId] = useState<ThemeId>("clinical")
  const [useCustomTheme, setUseCustomTheme] = useState(false)
  const [customPrimary, setCustomPrimary] = useState("#0D9488")
  const [customSecondary, setCustomSecondary] = useState("#0F766E")
  const [customBg, setCustomBg] = useState("#F8FAFC")
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const {
    rawText,
    setRawText,
    fileName,
    isDragging,
    setIsDragging,
    phase,
    stepIndex,
    slides,
    current,
    direction,
    canGenerate,
    handleDrop,
    handleFileSelect,
    handleGenerate,
    reset,
    paginate,
    goNext,
    goPrev,
    percent,
    outline,
  } = useSlideDeckGeneration()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const theme = useMemo<Theme>(() => {
    if (useCustomTheme) {
      return {
        id: "clinical",
        label: "Custom Colors",
        accentBg: "",
        accentText: "",
        chipBg: "",
        chipText: "",
        ring: "",
        border: "",
        hexPrimary: customPrimary,
        hexSecondary: customSecondary,
        hexBg: customBg,
      }
    }
    return THEMES[themeId]
  }, [useCustomTheme, themeId, customPrimary, customSecondary, customBg])

  const total = slides.length

  const handleLogoSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoUrl(URL.createObjectURL(file))

      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoBase64(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // ---- Export Compilers ----------------------------------------------------
  const exportToPowerPoint = useCallback(async () => {
    if (typeof window === "undefined" || slides.length === 0) return
    setIsExporting(true)
    try {
      await exportSlidesToPowerPoint({ slides, theme, logoBase64, lecturerName })
    } catch (err) {
      console.error("Failed to generate PowerPoint deck", err)
      alert("Failed to export PowerPoint: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsExporting(false)
    }
  }, [slides, theme, logoBase64, lecturerName])

  const exportToPDF = useCallback(async () => {
    if (typeof window === "undefined" || slides.length === 0) return
    setIsExportingPDF(true)
    try {
      await exportSlidesToPDFWithFallback({ slides, theme, logoBase64, lecturerName })
    } catch (err) {
      console.error("Failed to generate PDF document", err)
      alert("Failed to export PDF: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsExportingPDF(false)
    }
  }, [slides, theme, logoBase64, lecturerName])

  return (
    <div className="flex h-dvh flex-col bg-slate-100 text-slate-900">
      <TopBar total={total} phase={phase} />

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* LEFT PANEL (WORKSPACE DASHBOARD SIDEBAR) */}
        <aside className="flex w-full flex-col overflow-hidden border-b border-slate-200 bg-white lg:w-2/5 lg:border-b-0 lg:border-r">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
            <header>
              <div className="flex items-center gap-2">
                <span 
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: theme.hexPrimary }}
                >
                  <Presentation className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h1 className="text-sm font-bold text-slate-900 leading-tight">AI SlideDeck Architect</h1>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Rigid State Schema</p>
                </div>
              </div>
            </header>

            {/* Ingestion Control Zone */}
            <section aria-labelledby="ingest-heading" className="flex flex-col gap-2.5">
              <SectionLabel id="ingest-heading" icon={Upload}>
                Document Ingestion
              </SectionLabel>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-3 text-center transition-all ${
                  isDragging
                    ? "border-teal-500 bg-teal-50/40"
                    : fileName
                      ? "border-slate-300 bg-slate-50/50 hover:bg-slate-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="*/*"
                  className="hidden"
                  aria-label="Upload academic script"
                />
                <FileText className={`h-6 w-6 ${fileName ? "text-teal-600" : "text-slate-400"}`} aria-hidden="true" />
                {fileName ? (
                  <div className="mt-1.5 max-w-[200px]">
                    <p className="truncate text-xs font-bold text-slate-800">{fileName}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Click to replace</p>
                  </div>
                ) : (
                  <div className="mt-1.5">
                    <p className="text-xs font-bold text-slate-700">Drag outline file here</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">or browse files</p>
                  </div>
                )}
              </div>
            </section>

            {/* Custom Academic Branding */}
            <section aria-labelledby="branding-heading" className="flex flex-col gap-3">
              <SectionLabel id="branding-heading" icon={Settings2}>
                Branding Configuration
              </SectionLabel>

              <div className="grid gap-3 rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="lecturer-name" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Lecturer Name
                  </label>
                  <input
                    id="lecturer-name"
                    type="text"
                    value={lecturerName}
                    onChange={(e) => setLecturerName(e.target.value)}
                    placeholder="Enter academic name"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-300"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Logo</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoSelect}
                      accept="image/*"
                      className="hidden"
                      aria-label="Upload logo image"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Upload className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                      {logoUrl ? "Replace logo" : "Upload image"}
                    </button>
                    {logoUrl && (
                      <div className="flex items-center gap-1">
                        <img src={logoUrl} alt="Logo thumbnail" className="h-6 w-12 object-contain rounded border border-slate-200 p-0.5 bg-slate-50" />
                        <button
                          type="button"
                          onClick={() => { setLogoUrl(null); setLogoBase64(null) }}
                          className="rounded p-0.5 text-slate-400 hover:text-red-500"
                          aria-label="Remove logo"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Academic Themes */}
            <section aria-labelledby="theme-heading" className="flex flex-col gap-3">
              <SectionLabel id="theme-heading" icon={LayoutTemplate}>
                Academic Colors
              </SectionLabel>

              <div className="grid gap-3 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-semibold text-slate-700">Custom Colors</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={useCustomTheme}
                    onClick={() => setUseCustomTheme(!useCustomTheme)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      useCustomTheme ? "bg-slate-800" : "bg-slate-200"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        useCustomTheme ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {!useCustomTheme ? (
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(THEMES) as ThemeId[]).map((key) => {
                      const t = THEMES[key]
                      const active = themeId === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setThemeId(key)}
                          className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all ${
                            active ? "border-slate-800 bg-slate-50 ring-1 ring-slate-800" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-black/5"
                            style={{ backgroundColor: t.hexPrimary }}
                          />
                          <span className="text-[9px] font-bold text-slate-600 truncate max-w-full">{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-slate-400">Primary</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={customPrimary}
                          onChange={(e) => setCustomPrimary(e.target.value)}
                          className="h-8 w-8 cursor-pointer rounded border border-slate-200 p-0"
                        />
                        <span className="text-[9px] text-slate-500 uppercase">{customPrimary}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-slate-400">Secondary</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={customSecondary}
                          onChange={(e) => setCustomSecondary(e.target.value)}
                          className="h-8 w-8 cursor-pointer rounded border border-slate-200 p-0"
                        />
                        <span className="text-[9px] text-slate-500 uppercase">{customSecondary}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-slate-400">Slide BG</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={customBg}
                          onChange={(e) => setCustomBg(e.target.value)}
                          className="h-8 w-8 cursor-pointer rounded border border-slate-200 p-0"
                        />
                        <span className="text-[9px] text-slate-500 uppercase">{customBg}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Scrollable Slide Navigation Tree */}
            {phase === "ready" && total > 0 && (
              <OutlineDrawer outline={outline} current={current} theme={theme} onJump={paginate} />
            )}
          </div>

          {/* Action Footer */}
          <div className="border-t border-slate-200 bg-white/90 p-6 backdrop-blur">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate || phase === "generating"}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: theme.hexPrimary }}
            >
              {phase === "generating" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Generating Slides…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {phase === "ready" ? "Regenerate ~30 Slide Lecture" : "Generate ~30 Slide Lecture"}
                </>
              )}
            </button>
            {phase === "ready" && (
              <>
                <button
                  type="button"
                  onClick={exportToPowerPoint}
                  disabled={isExporting}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-teal-600" aria-hidden="true" />
                      Compiling PowerPoint…
                    </>
                  ) : (
                    <>
                      <Presentation className="h-4 w-4 text-teal-600" aria-hidden="true" />
                      Export to PowerPoint (.pptx)
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={exportToPDF}
                  disabled={isExportingPDF}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExportingPDF ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-teal-600" aria-hidden="true" />
                      Compiling PDF…
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 text-teal-600" aria-hidden="true" />
                      Export to PDF (.pdf)
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-3 w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Reset &amp; start over
                </button>
              </>
            )}
          </div>
        </aside>

        {/* RIGHT PANEL (MAIN SLIDE CANVAS ELEMENT) */}
        <main className="relative flex flex-1 flex-col bg-slate-900">
          {phase === "idle" && <EmptyState />}
          {phase === "generating" && <GeneratingState stepIndex={stepIndex} theme={theme} />}
          {phase === "ready" && total > 0 && (
            <>
              {/* live progress bar */}
              <div className="relative h-1.5 w-full bg-slate-800">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: theme.hexPrimary }}
                  initial={false}
                  animate={{ width: `${percent}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 30 }}
                />
              </div>

              <div className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
                <div className="aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
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
                      <SlideRenderer 
                        slide={slides[current]} 
                        theme={theme} 
                        logoUrl={logoUrl} 
                        lecturerName={lecturerName}
                      />
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

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 64 : dir < 0 ? -64 : 0 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -64 : dir < 0 ? 64 : 0 }),
}

