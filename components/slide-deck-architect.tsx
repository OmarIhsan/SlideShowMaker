"use client"

import { AnimatePresence, motion } from "framer-motion"
import confetti from "canvas-confetti"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Hash,
  LayoutTemplate,
  ListOrdered,
  Loader2,
  Presentation,
  Settings2,
  Sparkles,
  Tags,
  Upload,
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
  type Slide,
  THEMES,
  type Theme,
  type ThemeId,
  parseDocumentToSlides,
  SAMPLE_SCRIPT,
} from "@/lib/slide-engine"

const GENERATION_STEPS = [
  "Parsing academic script...",
  "Formatting module dividers...",
  "Applying layout templates...",
  "Compiling self-assessment banks...",
  "Configuring branding metadata...",
]

type Phase = "idle" | "generating" | "ready"

export default function SlideDeckArchitect() {
  const [rawText, setRawText] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
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

  const [phase, setPhase] = useState<Phase>("idle")
  const [stepIndex, setStepIndex] = useState(0)
  const [slides, setSlides] = useState<Slide[]>([])
  const [[current, direction], setPage] = useState<[number, number]>([0, 0])
  const [isExporting, setIsExporting] = useState(false)

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

  // ---- File Ingestion ------------------------------------------------------
  const ingestFile = useCallback((file: File) => {
    setFileName(file.name)
    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      const reader = new FileReader()
      reader.onload = () => setRawText(String(reader.result ?? ""))
      reader.readAsText(file)
    } else {
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
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
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
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault()
        goNext()
      } else if (e.key === "ArrowLeft") {
        goPrev()
      } else if (e.key === "Home") {
        paginate(0)
      } else if (e.key === "End") {
        paginate(slides.length - 1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, goNext, goPrev, paginate, slides.length])

  const percent = total > 1 ? Math.round((current / (total - 1)) * 100) : 100

  const outline = useMemo(
    () => slides.map((s, i) => ({ index: i, title: getSlideTitle(s), layout: s.layout })),
    [slides],
  )

  // ---- PowerPoint Compiler -------------------------------------------------
  const exportToPowerPoint = useCallback(async () => {
    if (typeof window === "undefined" || slides.length === 0) return
    setIsExporting(true)
    try {
      const pptxgenModule = await import("pptxgenjs")
      const PptxGen = (pptxgenModule as any).default || pptxgenModule
      const pres = new PptxGen()

      // 16:9 Aspect Ratio
      pres.layout = "LAYOUT_169"

      const cleanHex = (hex: string) => hex.replace("#", "")
      const primaryHex = cleanHex(theme.hexPrimary)
      const bgHex = cleanHex(theme.hexBg)

      slides.forEach((slide) => {
        const pptSlide = pres.addSlide()

        // Apply slide backdrop color
        if (slide.layout === "title") {
          pptSlide.background = { color: "0F172A" } // Dark blue theme for Title Slide
        } else {
          pptSlide.background = { color: bgHex }
        }

        // Embed branding logo
        if (logoBase64) {
          if (slide.layout === "title") {
            pptSlide.addImage({ data: logoBase64, x: 8.2, y: 0.5, w: 1.2, h: 0.6 })
          } else {
            pptSlide.addImage({ data: logoBase64, x: 8.5, y: 0.3, w: 1.0, h: 0.5 })
          }
        }

        // Embed lecturer footer (except for Title slide)
        if (lecturerName && slide.layout !== "title") {
          pptSlide.addText(`Lecturer: ${lecturerName}  |  Academic Lecture Series`, {
            x: 0.8,
            y: 5.2,
            w: 8.4,
            h: 0.3,
            fontSize: 9,
            color: "777777",
            fontFace: "Arial",
            italic: true,
          })
        }

        // Try-Catch Fail-Safe Processing per slide
        try {
          switch (slide.layout) {
            case "title": {
              pptSlide.addText(slide.kicker, {
                x: 0.8,
                y: 1.2,
                w: 8.4,
                h: 0.4,
                fontSize: 12,
                color: primaryHex,
                fontFace: "Arial",
                bold: true,
              })
              pptSlide.addText(slide.title, {
                x: 0.8,
                y: 1.8,
                w: 8.4,
                h: 1.6,
                fontSize: 38,
                color: "FFFFFF",
                fontFace: "Arial",
                bold: true,
              })
              pptSlide.addText(slide.subtitle, {
                x: 0.8,
                y: 3.6,
                w: 8.4,
                h: 0.8,
                fontSize: 16,
                color: "CCCCCC",
                fontFace: "Arial",
              })
              if (lecturerName) {
                pptSlide.addText(`Presented by: ${lecturerName}`, {
                  x: 0.8,
                  y: 4.5,
                  w: 8.4,
                  h: 0.4,
                  fontSize: 12,
                  color: "999999",
                  fontFace: "Arial",
                  bold: true,
                })
              }
              break
            }

            case "toc": {
              // Header
              pptSlide.addText(slide.title, {
                x: 0.8,
                y: 0.5,
                w: 8.4,
                h: 0.6,
                fontSize: 24,
                color: primaryHex,
                fontFace: "Arial",
                bold: true,
              })
              pptSlide.addText("Lecture Outline", {
                x: 0.8,
                y: 1.0,
                w: 8.4,
                h: 0.3,
                fontSize: 12,
                color: "666666",
                fontFace: "Arial",
                bold: true,
              })

              // Outline list
              slide.items.forEach((item, idx) => {
                const colIdx = idx % 2
                const rowIdx = Math.floor(idx / 2)
                const itemX = 0.8 + colIdx * 4.3
                const itemY = 1.6 + rowIdx * 0.55
                
                // Number block
                pptSlide.addText(String(item.n).padStart(2, "0"), {
                  x: itemX,
                  y: itemY,
                  w: 0.4,
                  h: 0.35,
                  fontSize: 11,
                  color: "FFFFFF",
                  fontFace: "Arial",
                  bold: true,
                  fill: { color: primaryHex },
                  align: "center",
                  valign: "middle",
                })
                
                // Text label
                pptSlide.addText(item.label, {
                  x: itemX + 0.5,
                  y: itemY,
                  w: 3.5,
                  h: 0.35,
                  fontSize: 11,
                  color: "333333",
                  fontFace: "Arial",
                  bold: true,
                  valign: "middle",
                })
              })
              break
            }

            case "content": {
              // Header
              pptSlide.addText(slide.title, {
                x: 0.8,
                y: 0.5,
                w: 8.4,
                h: 0.6,
                fontSize: 24,
                color: primaryHex,
                fontFace: "Arial",
                bold: true,
              })

              // Verbatim contents (Template A: Standard vertical layout)
              let verticalOffset = 1.3
              
              if (slide.paragraphs && slide.paragraphs.length > 0) {
                slide.paragraphs.forEach((para) => {
                  pptSlide.addText(para, {
                    x: 0.8,
                    y: verticalOffset,
                    w: 8.4,
                    h: 1.5,
                    fontSize: 15,
                    color: "444444",
                    fontFace: "Arial",
                    lineSpacing: 22,
                  })
                  verticalOffset += 1.6
                })
              }

              if (slide.bullets && slide.bullets.length > 0) {
                slide.bullets.forEach((bullet) => {
                  pptSlide.addText(bullet, {
                    x: 0.8,
                    y: verticalOffset,
                    w: 8.4,
                    h: 0.7,
                    fontSize: 14,
                    color: "444444",
                    fontFace: "Arial",
                    valign: "middle",
                  })
                  verticalOffset += 0.8
                })
              }
              break
            }

            case "table": {
              // Header
              pptSlide.addText(slide.title, {
                x: 0.8,
                y: 0.5,
                w: 8.4,
                h: 0.6,
                fontSize: 24,
                color: primaryHex,
                fontFace: "Arial",
                bold: true,
              })

              // Render comparison grid table (Template B)
              const tableData: any[][] = []

              // Table header row
              tableData.push(
                slide.columns.map((colName) => ({
                  text: colName,
                  options: {
                    fill: { color: primaryHex },
                    color: "FFFFFF",
                    bold: true,
                    align: "left",
                    fontSize: 10,
                    fontFace: "Arial",
                  },
                }))
              )

              // Table data rows
              slide.rows.forEach((row, rIdx) => {
                const bg = rIdx % 2 === 0 ? "FFFFFF" : "F9FAFB"
                tableData.push(
                  row.map((cellText, cIdx) => ({
                    text: cellText,
                    options: {
                      fill: { color: bg },
                      color: cIdx === 0 ? primaryHex : "333333",
                      bold: cIdx === 0,
                      align: "left",
                      fontSize: 9,
                      fontFace: "Arial",
                    },
                  }))
                )
              })

              pptSlide.addTable(tableData, {
                x: 0.8,
                y: 1.4,
                w: 8.4,
                h: 3.2,
              })
              break
            }

            default:
              break
          }
        } catch (slideErr) {
          console.error("Failed to compile slide layout, invoking fail-safe fallback:", slideErr)
          // Fail-Safe Fallback: Title and safe text frame
          try {
            pptSlide.addShape("rect", {
              x: 0.7,
              y: 0.4,
              w: 8.6,
              h: 4.6,
              fill: { color: bgHex },
              line: { color: primaryHex, width: 2 }
            })
            pptSlide.addText(slide.title || "Academic Lecture", {
              x: 0.9,
              y: 0.6,
              w: 8.2,
              h: 0.6,
              fontSize: 24,
              color: primaryHex,
              fontFace: "Arial",
              bold: true,
            })
            
            let fallbackBody = ""
            if (slide.layout === "content") {
              fallbackBody = [...(slide.paragraphs || []), ...(slide.bullets || [])].join("\n\n")
            } else if (slide.layout === "table") {
              fallbackBody = (slide.rows || []).map(r => r.join(" | ")).join("\n")
            } else {
              fallbackBody = "Verbatim academic slide content."
            }

            pptSlide.addText(fallbackBody, {
              x: 0.9,
              y: 1.4,
              w: 8.2,
              h: 3.2,
              fontSize: 13,
              color: "333333",
              fontFace: "Arial",
            })
          } catch (fallbackErr) {
            console.error("Fatal failure in slide compiler fallback:", fallbackErr)
          }
        }
      })

      await pres.writeFile({ fileName: `Academic_Lecture_${Date.now()}.pptx` })
    } catch (err) {
      console.error("Failed to generate PowerPoint deck", err)
      alert("Failed to export PowerPoint: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsExporting(false)
    }
  }, [slides, theme, logoBase64, lecturerName])

  return (
    <div className="flex h-dvh flex-col bg-slate-100 text-slate-900">
      <TopBar total={total} phase={phase} />

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* LEFT PANEL */}
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
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Verbatim Compiler</p>
                </div>
              </div>
            </header>

            {/* Ingestion Canvas */}
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
                  accept=".txt"
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
                    <p className="text-[10px] text-slate-400 mt-0.5">or browse files (.txt)</p>
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
                  {phase === "ready" ? "Regenerate 30+ Slide Lecture" : "Generate 30+ Slide Lecture"}
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
                  onClick={reset}
                  className="mt-3 w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Reset &amp; start over
                </button>
              </>
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
                        onJump={paginate} 
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

/* ----------------------------- Animation variants -------------------------- */

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 64 : dir < 0 ? -64 : 0 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -64 : dir < 0 ? 64 : 0 }),
}

/* ----------------------------- Sub-components ------------------------------ */

function TopBar({ total, phase }: { total: number; phase: Phase }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <LayoutTemplate className="h-4 w-4 text-teal-600" aria-hidden="true" />
        Academic Layout Engine
      </div>
      <div className="flex items-center gap-2">
        {phase === "ready" && (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
            {total} slides generated
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">Academic Lecture</span>
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
        Slide Outline Index
      </SectionLabel>
      <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-1.5">
        <ul className="flex flex-col gap-0.5">
          {outline.map((o) => {
            const active = o.index === current
            return (
              <li key={o.index}>
                <button
                  type="button"
                  onClick={() => onJump(o.index)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors text-slate-600 hover:bg-white"
                  style={active ? { backgroundColor: theme.hexPrimary, color: "#FFFFFF" } : undefined}
                >
                  <span
                    className="flex h-5 w-6 shrink-0 items-center justify-center rounded text-[10px] font-semibold bg-white text-slate-500 border border-slate-200"
                    style={active ? { color: theme.hexPrimary } : undefined}
                  >
                    {o.index + 1}
                  </span>
                  <span className="truncate">{o.title}</span>
                  <span
                    className="ml-auto shrink-0 text-[9px] uppercase tracking-wide opacity-75"
                    style={active ? { color: "#FFFFFF" } : { color: theme.hexSecondary }}
                  >
                    {o.layout === "title" ? "Title" : o.layout === "toc" ? "Outline" : o.layout === "table" ? "Table" : "Text"}
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
        <h2 className="text-lg font-semibold text-slate-100">No lecture loaded</h2>
        <p className="mt-1 text-sm text-slate-400">
          Upload your script or click "Load Academic Sample" to initialize the compiler.
        </p>
      </div>
    </div>
  )
}

function GeneratingState({ stepIndex, theme }: { stepIndex: number; theme: Theme }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <Loader2 className="h-10 w-10 animate-spin" style={{ color: theme.hexPrimary }} aria-hidden="true" />
      <div className="w-full max-w-sm space-y-3">
        {GENERATION_STEPS.map((label, i) => {
          const done = i < stepIndex
          const active = i === stepIndex
          return (
            <div key={label} className="flex items-center gap-3">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs"
                style={
                  done
                    ? { backgroundColor: theme.hexPrimary, color: "white" }
                    : active
                      ? { backgroundColor: "#334155", color: "white" }
                      : { backgroundColor: "#1e293b", color: "#64748b" }
                }
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
  lecturerName,
  onJump,
}: {
  slide: Slide
  theme: Theme
  logoUrl: string | null
  lecturerName: string
  onJump: (i: number) => void
}) {
  return (
    <div className="relative h-full w-full overflow-hidden select-none" style={{ backgroundColor: theme.hexBg }}>
      {/* Global Logo Placement */}
      {logoUrl && slide.layout !== "title" && (
        <div className="absolute right-8 top-6 z-10">
          <img src={logoUrl} alt="Branding Logo" className="h-8 w-auto object-contain" />
        </div>
      )}

      {/* Global Academic Footer */}
      {slide.layout !== "title" && (
        <div className="absolute bottom-4 left-8 right-8 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[10px] text-slate-400">
          <span>Lecturer: <strong>{lecturerName || "Academic Staff"}</strong></span>
          <span>Academic Lecture Series</span>
        </div>
      )}

      {(() => {
        switch (slide.layout) {
          case "title":
            return <TitleSlide slide={slide} theme={theme} logoUrl={logoUrl} lecturerName={lecturerName} />
          case "toc":
            return <TocSlide slide={slide} theme={theme} onJump={onJump} />
          case "content":
            return <ContentSlide slide={slide} theme={theme} />
          case "table":
            return <TableSlide slide={slide} theme={theme} />
          default:
            return null
        }
      })()}
    </div>
  )
}

function TitleSlide({
  slide,
  theme,
  logoUrl,
  lecturerName,
}: {
  slide: Extract<Slide, { layout: "title" }>
  theme: Theme
  logoUrl: string | null
  lecturerName: string
}) {
  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden px-10 py-12 sm:px-16" style={{ backgroundColor: "#0F172A" }}>
      <div className="absolute left-0 top-0 h-full w-2" style={{ backgroundColor: theme.hexPrimary }} aria-hidden="true" />
      <div
        className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: theme.hexPrimary }}
        aria-hidden="true"
      />

      {logoUrl && (
        <div className="absolute right-10 top-10">
          <img src={logoUrl} alt="Presentation logo" className="h-12 w-auto object-contain" />
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: theme.hexPrimary }}>{slide.kicker}</p>
      <h2 className="mt-4 max-w-3xl text-balance text-3xl font-bold leading-tight text-white sm:text-5xl">
        {slide.title}
      </h2>
      <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">{slide.subtitle}</p>

      {lecturerName && (
        <div className="mt-8 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
          Presented by: <strong className="text-white">{lecturerName}</strong>
        </div>
      )}
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
      <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: theme.hexPrimary }}>{slide.title}</h2>
      <p className="mt-1 text-sm text-slate-500 font-medium">Lecture Table of Contents</p>
      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 overflow-y-auto max-h-[60%] pr-2">
        {slide.items.map((item) => (
          <button
            key={item.n}
            type="button"
            onClick={() => onJump(item.target)}
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: theme.hexPrimary }}
            >
              {String(item.n).padStart(2, "0")}
            </span>
            <span className="truncate text-sm font-semibold text-slate-700">{item.label}</span>
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

function ContentSlide({ slide, theme }: { slide: Extract<Slide, { layout: "content" }>; theme: Theme }) {
  return (
    <div className="relative flex h-full flex-col justify-center px-8 py-10 sm:px-14">
      <div className="absolute left-0 top-1/2 h-24 w-1.5 -translate-y-1/2 rounded-r" style={{ backgroundColor: theme.hexPrimary }} aria-hidden="true" />
      <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: theme.hexPrimary }}>{slide.title}</h2>
      <div className="mt-4 max-w-3xl space-y-3 overflow-y-auto max-h-[60%] pr-2">
        {slide.paragraphs.map((p, i) => (
          <p key={i} className="text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
            {p}
          </p>
        ))}
        {slide.bullets.length > 0 && (
          <ul className="space-y-3 pt-1">
            {slide.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 sm:text-base">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: theme.hexPrimary }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function TableSlide({ slide, theme }: { slide: Extract<Slide, { layout: "table" }>; theme: Theme }) {
  return (
    <div className="flex h-full flex-col justify-center px-8 py-10 sm:px-12">
      <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: theme.hexPrimary }}>{slide.title}</h2>
      <div className="mt-4 overflow-y-auto max-h-[60%] border border-slate-200 rounded-xl pr-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-white" style={{ backgroundColor: theme.hexPrimary }}>
              {slide.columns.map((c, i) => (
                <th key={c} className={`px-3 py-2 font-semibold ${i > 1 ? "hidden sm:table-cell" : ""}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slide.rows.map((row, r) => (
              <tr key={r} className={r % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className={`px-3 py-2 ${c === 0 ? "font-semibold" : "text-slate-600"} ${
                      c > 1 ? "hidden sm:table-cell" : ""
                    }`}
                    style={c === 0 ? { color: theme.hexPrimary } : undefined}
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
