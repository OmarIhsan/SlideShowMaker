"use client"

import { AnimatePresence, motion } from "framer-motion"
import confetti from "canvas-confetti"
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
        id: "clinical", // fallback id
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
        
        // Trigger high-fidelity celebration
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
      const secondaryHex = cleanHex(theme.hexSecondary)
      const bgHex = cleanHex(theme.hexBg)

      slides.forEach((slide) => {
        const pptSlide = pres.addSlide()

        // Apply slide backdrop color
        if (slide.layout === "title" || slide.layout === "chapter") {
          pptSlide.background = { color: primaryHex }
        } else {
          pptSlide.background = { color: bgHex }
        }

        // Embed branding logo
        if (logoBase64) {
          if (slide.layout === "title") {
            pptSlide.addImage({ data: logoBase64, x: 8.2, y: 0.5, w: 1.2, h: 0.6 })
          } else if (slide.layout !== "chapter") {
            pptSlide.addImage({ data: logoBase64, x: 8.5, y: 0.3, w: 1.0, h: 0.5 })
          }
        }

        // Embed lecturer footer (except for title and module divider slides)
        if (lecturerName && slide.layout !== "title" && slide.layout !== "chapter") {
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

        // Layout translations
        switch (slide.layout) {
          case "title": {
            pptSlide.addText(slide.kicker, {
              x: 0.8,
              y: 1.2,
              w: 8.4,
              h: 0.4,
              fontSize: 12,
              color: "CCCCCC",
              fontFace: "Arial",
              bold: true,
              tracking: 2,
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
              verticalAlign: "top",
            })
            pptSlide.addText(slide.subtitle, {
              x: 0.8,
              y: 3.5,
              w: 8.4,
              h: 1.0,
              fontSize: 14,
              color: "DDDDDD",
              fontFace: "Arial",
            })
            if (lecturerName) {
              pptSlide.addText(`Presented by: ${lecturerName}`, {
                x: 0.8,
                y: 4.6,
                w: 8.4,
                h: 0.4,
                fontSize: 12,
                color: "FFFFFF",
                fontFace: "Arial",
                italic: true,
              })
            }
            break
          }

          case "toc": {
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
            slide.items.forEach((item, idx) => {
              const col = idx % 2
              const row = Math.floor(idx / 2)
              const x = 0.8 + col * 4.3
              const y = 1.3 + row * 0.7

              pptSlide.addText(String(item.n).padStart(2, "0"), {
                x,
                y,
                w: 0.4,
                h: 0.4,
                fontSize: 12,
                color: "FFFFFF",
                fontFace: "Arial",
                bold: true,
                align: "center",
                valign: "middle",
                fill: { color: primaryHex },
              })

              pptSlide.addText(item.label, {
                x: x + 0.5,
                y,
                w: 3.6,
                h: 0.4,
                fontSize: 12,
                color: "333333",
                fontFace: "Arial",
                bold: true,
                valign: "middle",
              })
            })
            break
          }

          case "chapter": {
            pptSlide.addText(String(slide.index).padStart(2, "0"), {
              x: 0.8,
              y: 1.4,
              w: 8.4,
              h: 1.0,
              fontSize: 72,
              color: "FFFFFF",
              fontFace: "Arial",
              bold: true,
              opacity: 0.3,
            })
            pptSlide.addText(slide.kicker, {
              x: 0.8,
              y: 2.5,
              w: 8.4,
              h: 0.4,
              fontSize: 14,
              color: "EEEEEE",
              fontFace: "Arial",
              bold: true,
              tracking: 2,
            })
            pptSlide.addText(slide.title, {
              x: 0.8,
              y: 3.0,
              w: 8.4,
              h: 1.5,
              fontSize: 32,
              color: "FFFFFF",
              fontFace: "Arial",
              bold: true,
            })
            break
          }

          case "content": {
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
            let contentY = 1.3
            if (slide.paragraphs.length > 0) {
              const fullText = slide.paragraphs.join("\n\n")
              pptSlide.addText(fullText, {
                x: 0.8,
                y: contentY,
                w: 8.4,
                h: 1.5,
                fontSize: 13,
                color: "333333",
                fontFace: "Arial",
              })
              contentY += 1.6
            }
            if (slide.bullets.length > 0) {
              const bulletObjs = slide.bullets.map((b) => ({ text: b, options: { bullet: true } }))
              pptSlide.addText(bulletObjs, {
                x: 0.8,
                y: contentY,
                w: 8.4,
                h: 2.2,
                fontSize: 13,
                color: "444444",
                fontFace: "Arial",
              })
            }
            break
          }

          case "split": {
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
            if (slide.bullets.length > 0) {
              const bulletObjs = slide.bullets.map((b) => ({ text: b, options: { bullet: true } }))
              pptSlide.addText(bulletObjs, {
                x: 0.8,
                y: 1.4,
                w: 4.0,
                h: 3.5,
                fontSize: 13,
                color: "333333",
                fontFace: "Arial",
              })
            }
            slide.callouts.forEach((c, idx) => {
              const cardY = 1.4 + idx * 1.1
              pptSlide.addShape("rect", {
                x: 5.2,
                y: cardY,
                w: 4.0,
                h: 0.95,
                fill: { color: "F3F4F6" },
                line: { color: "E5E7EB", width: 1 },
              })
              pptSlide.addText(c.term, {
                x: 5.35,
                y: cardY + 0.1,
                w: 3.7,
                h: 0.25,
                fontSize: 11,
                color: primaryHex,
                fontFace: "Arial",
                bold: true,
              })
              pptSlide.addText(c.def, {
                x: 5.35,
                y: cardY + 0.35,
                w: 3.7,
                h: 0.5,
                fontSize: 9.5,
                color: "555555",
                fontFace: "Arial",
              })
            })
            break
          }

          case "process": {
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
            const stepCount = slide.steps.length
            const totalW = 8.4
            const gap = 0.25
            const stepW = (totalW - gap * (stepCount - 1)) / stepCount

            slide.steps.forEach((step, idx) => {
              const stepX = 0.8 + idx * (stepW + gap)
              pptSlide.addShape("rect", {
                x: stepX,
                y: 1.6,
                w: stepW,
                h: 3.1,
                fill: { color: "FFFFFF" },
                line: { color: "E5E7EB", width: 1.5 },
              })
              pptSlide.addText(String(step.step), {
                x: stepX + 0.15,
                y: 1.75,
                w: 0.35,
                h: 0.35,
                fontSize: 11,
                color: "FFFFFF",
                fontFace: "Arial",
                bold: true,
                align: "center",
                valign: "middle",
                fill: { color: primaryHex },
              })
              pptSlide.addText(step.title, {
                x: stepX + 0.15,
                y: 2.3,
                w: stepW - 0.3,
                h: 0.5,
                fontSize: 11,
                color: "111111",
                fontFace: "Arial",
                bold: true,
              })
              pptSlide.addText(step.detail, {
                x: stepX + 0.15,
                y: 2.9,
                w: stepW - 0.3,
                h: 1.6,
                fontSize: 9.5,
                color: "555555",
                fontFace: "Arial",
              })
            })
            break
          }

          case "grid": {
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
            const cols = slide.items.length <= 4 ? 2 : 3
            const rows = Math.ceil(slide.items.length / cols)
            const gap = 0.25
            const totalW = 8.4
            const cardW = (totalW - gap * (cols - 1)) / cols
            const cardH = rows === 1 ? 3.0 : 1.4

            slide.items.forEach((item, idx) => {
              const colIdx = idx % cols
              const rowIdx = Math.floor(idx / cols)
              const cardX = 0.8 + colIdx * (cardW + gap)
              const cardY = 1.5 + rowIdx * (cardH + gap)

              pptSlide.addShape("rect", {
                x: cardX,
                y: cardY,
                w: cardW,
                h: cardH,
                fill: { color: "FFFFFF" },
                line: { color: "E5E7EB", width: 1 },
              })

              pptSlide.addText(item.title, {
                x: cardX + 0.15,
                y: cardY + 0.12,
                w: cardW - 0.3,
                h: 0.35,
                fontSize: 11,
                color: primaryHex,
                fontFace: "Arial",
                bold: true,
              })

              if (item.detail) {
                pptSlide.addText(item.detail, {
                  x: cardX + 0.15,
                  y: cardY + 0.5,
                  w: cardW - 0.3,
                  h: cardH - 0.6,
                  fontSize: 9.5,
                  color: "555555",
                  fontFace: "Arial",
                })
              }
            })
            break
          }

          case "table": {
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
            const tableData: any[] = []

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

          case "warning": {
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

            const isDanger = slide.level === "danger"
            const borderCol = isDanger ? "FCA5A5" : "FCD34D"
            const fillCol = isDanger ? "FEF2F2" : "FFFBEB"
            const textCol = isDanger ? "991B1B" : "92400E"

            pptSlide.addShape("rect", {
              x: 0.8,
              y: 1.3,
              w: 8.4,
              h: 3.4,
              fill: { color: fillCol },
              line: { color: borderCol, width: 2 },
            })

            pptSlide.addText(isDanger ? "CRITICAL ETHICAL WARNING" : "ACADEMIC PRECAUTION", {
              x: 1.1,
              y: 1.5,
              w: 7.8,
              h: 0.35,
              fontSize: 11,
              color: textCol,
              fontFace: "Arial",
              bold: true,
            })

            const bulletObjs = slide.points.map((p) => ({ text: p, options: { bullet: true } }))
            pptSlide.addText(bulletObjs, {
              x: 1.1,
              y: 1.9,
              w: 7.8,
              h: 2.2,
              fontSize: 12,
              color: "333333",
              fontFace: "Arial",
            })

            if (slide.note) {
              pptSlide.addText(`Note: ${slide.note}`, {
                x: 1.1,
                y: 4.2,
                w: 7.8,
                h: 0.3,
                fontSize: 9,
                color: "666666",
                fontFace: "Arial",
                italic: true,
              })
            }
            break
          }

          case "quiz": {
            pptSlide.addText(`Review Question:`, {
              x: 0.8,
              y: 0.6,
              w: 8.4,
              h: 0.3,
              fontSize: 11,
              color: secondaryHex,
              fontFace: "Arial",
              bold: true,
            })

            pptSlide.addText(slide.question, {
              x: 0.8,
              y: 0.9,
              w: 8.4,
              h: 1.0,
              fontSize: 18,
              color: "111111",
              fontFace: "Arial",
              bold: true,
            })

            slide.options.forEach((opt, idx) => {
              const col = idx % 2
              const row = Math.floor(idx / 2)
              const cardX = 0.8 + col * 4.3
              const cardY = 2.0 + row * 1.1

              pptSlide.addShape("rect", {
                x: cardX,
                y: cardY,
                w: 4.0,
                h: 0.9,
                fill: { color: "FFFFFF" },
                line: { color: "D1D5DB", width: 1.5 },
              })

              pptSlide.addText(`${String.fromCharCode(65 + idx)})  ${opt.text}`, {
                x: cardX + 0.15,
                y: cardY + 0.1,
                w: 3.7,
                h: 0.7,
                fontSize: 11,
                color: "333333",
                fontFace: "Arial",
                valign: "middle",
              })
            })

            pptSlide.addText(`Correct Answer Indicator: Option ${String.fromCharCode(65 + slide.correctIndex)}  |  Explanation: ${slide.explanation}`, {
              x: 0.8,
              y: 4.4,
              w: 8.4,
              h: 0.5,
              fontSize: 9.5,
              color: "666666",
              fontFace: "Arial",
              italic: true,
            })
            break
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
                  <h1 className="text-lg font-semibold leading-tight text-slate-900">AI SlideDeck Architect</h1>
                  <p className="text-xs text-slate-500">Academic Lecture Presentation Builder.</p>
                </div>
              </div>
            </header>

            {/* Outline list (only once a deck exists) */}
            {phase === "ready" && (
              <OutlineDrawer outline={outline} current={current} theme={theme} onJump={paginate} />
            )}

            {/* File Ingestion */}
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
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                style={isDragging ? { borderColor: theme.hexPrimary, backgroundColor: theme.hexBg } : undefined}
              >
                <span 
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.hexSecondary + "1A", color: theme.hexSecondary }}
                >
                  <Upload className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-slate-700">
                  Drag &amp; drop a document, or <span style={{ color: theme.hexPrimary }}>browse</span>
                </p>
                <p className="text-xs text-slate-400">Supports PDF, DOCX, and TXT — structured outlines welcome</p>
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
                    <FileText className="h-4 w-4 shrink-0" style={{ color: theme.hexPrimary }} aria-hidden="true" />
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
                  rows={5}
                  placeholder="…or paste your raw structured notes here. Headers (##/###) and lists will be parsed into sequential slides."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_SCRIPT)}
                  className="absolute bottom-3 right-3 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  Load Academic Sample
                </button>
              </div>
            </section>

            {/* Branding Ingestion */}
            <section aria-labelledby="brand-heading" className="flex flex-col gap-4 border-t border-slate-100 pt-4">
              <SectionLabel id="brand-heading" icon={ImageIcon}>
                Branding &amp; Lecturer
              </SectionLabel>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500">Lecturer Name</label>
                <input
                  type="text"
                  value={lecturerName}
                  onChange={(e) => setLecturerName(e.target.value)}
                  placeholder="e.g. Dr. Faisal Alhuwaizi"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-slate-400 focus:outline-none"
                  aria-label="Upload custom logo"
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Custom logo preview" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
                <div className="text-sm">
                  <p className="font-medium text-slate-700">Upload Custom Logo</p>
                  <p className="text-xs text-slate-400">Embeds on title slide &amp; PPTX master layer</p>
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
              </div>
            </section>

            {/* Theme Customization Engine */}
            <section aria-labelledby="options-heading" className="flex flex-col gap-4 border-t border-slate-100 pt-4">
              <SectionLabel id="options-heading" icon={Settings2}>
                Academic Theme Engine
              </SectionLabel>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Palette Options</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomTheme}
                      onChange={(e) => setUseCustomTheme(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    Custom Colors
                  </label>
                </div>

                {!useCustomTheme ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-500">Theme Profile</label>
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
                    {LAYOUT_LABELS[o.layout]}
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
      {logoUrl && slide.layout !== "title" && slide.layout !== "chapter" && (
        <div className="absolute right-8 top-6 z-10">
          <img src={logoUrl} alt="Branding Logo" className="h-8 w-auto object-contain" />
        </div>
      )}

      {/* Global Academic Footer */}
      {slide.layout !== "title" && slide.layout !== "chapter" && (
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
    <div className="relative flex h-full flex-col justify-center overflow-hidden px-10 py-12 sm:px-16" style={{ backgroundColor: theme.hexPrimary }}>
      <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      {logoUrl && (
        <div className="absolute right-10 top-10">
          <img src={logoUrl} alt="Presentation logo" className="h-10 w-auto object-contain opacity-90" />
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
      <div className="absolute left-0 top-1/2 h-24 w-1.5 -translate-y-1/2 rounded-r" style={{ backgroundColor: theme.hexPrimary }} aria-hidden="true" />
      <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: theme.hexPrimary }}>{slide.title}</h2>
      <div className="mt-4 max-w-3xl space-y-3 overflow-y-auto max-h-[60%] pr-2">
        {slide.paragraphs.map((p, i) => (
          <p key={i} className="text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
            {p}
          </p>
        ))}
        {slide.bullets.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {slide.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 sm:text-base">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.hexPrimary }} aria-hidden="true" />
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
      <div className="flex flex-col justify-center gap-4 px-8 py-10 sm:px-12">
        <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: theme.hexPrimary }}>{slide.title}</h2>
        <ul className="space-y-2.5 overflow-y-auto max-h-[70%]">
          {slide.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: theme.hexPrimary }} aria-hidden="true" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center bg-slate-50/50 px-8 py-10 sm:px-12 border-l border-slate-100">
        <div className="grid w-full gap-2.5 overflow-y-auto max-h-[80%]">
          {slide.callouts.map((c) => (
            <div key={c.term} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-sm font-bold" style={{ color: theme.hexPrimary }}>{c.term}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{c.def}</p>
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
      <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: theme.hexPrimary }}>{slide.title}</h2>
      {slide.intro && <p className="mt-1 max-w-2xl text-xs text-slate-500 sm:text-sm">{slide.intro}</p>}
      <div className="mt-6 flex flex-col gap-2.5 lg:flex-row lg:items-stretch overflow-x-auto pr-2">
        {slide.steps.map((step, i) => (
          <div key={step.step} className="flex flex-1 items-center gap-2 lg:flex-col lg:items-stretch">
            <div className="relative flex flex-1 flex-col rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: theme.hexPrimary }}
              >
                {step.step}
              </span>
              <p className="mt-2 text-xs font-bold text-slate-900">{step.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{step.detail}</p>
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
        <LayoutGrid className="h-5 w-5" style={{ color: theme.hexPrimary }} aria-hidden="true" />
        <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: theme.hexPrimary }}>{slide.title}</h2>
      </div>
      <div className={`mt-5 grid grid-cols-1 gap-2.5 overflow-y-auto max-h-[60%] pr-2 ${cols}`}>
        {slide.items.map((item) => (
          <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-bold text-slate-900">{item.title}</p>
            {item.detail && <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{item.detail}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function TableSlide({ slide, theme }: { slide: Extract<Slide, { layout: "table" }>; theme: Theme }) {
  return (
    <div className="flex h-full flex-col justify-center px-8 py-10 sm:px-12">
      <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: theme.hexPrimary }}>{slide.title}</h2>
      {slide.intro && <p className="mt-1 text-xs text-slate-500 sm:text-sm">{slide.intro}</p>}
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

function WarningSlide({ slide }: { slide: Extract<Slide, { layout: "warning" }> }) {
  const danger = slide.level === "danger"
  const palette = danger
    ? { border: "border-red-300", bg: "bg-red-50", icon: "text-red-600", chipBg: "bg-red-100", chipText: "text-red-700", dot: "text-red-500" }
    : { border: "border-amber-300", bg: "bg-amber-50", icon: "text-amber-600", chipBg: "bg-amber-100", chipText: "text-amber-700", dot: "text-amber-500" }

  return (
    <div className="flex h-full flex-col justify-center px-8 py-10 sm:px-12">
      <div className={`rounded-2xl border-2 ${palette.border} ${palette.bg} p-6 sm:p-8 overflow-y-auto max-h-[85%]`}>
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${palette.chipBg} ${palette.icon}`}>
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${palette.chipText}`}>
              {danger ? "Critical • Ethical Warning" : "Academic Precaution"}
            </span>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{slide.title}</h2>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {slide.points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
              <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${palette.dot}`} aria-hidden="true" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        {slide.note && <p className="mt-4 text-[10px] italic text-slate-500">Note: {slide.note}</p>}
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
        className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
        style={{ backgroundColor: theme.hexSecondary + "1A", color: theme.hexSecondary }}
      >
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        {slide.title}
      </span>
      <h2 className="mt-3 max-w-2xl text-lg font-bold text-slate-900 sm:text-xl">{slide.question}</h2>

      <div className="mt-4 grid max-w-2xl gap-2.5 sm:grid-cols-2">
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
              className={`flex items-center justify-between gap-2 rounded-xl border-2 px-3.5 py-2.5 text-left text-xs font-semibold transition-colors disabled:cursor-default ${state}`}
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
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex max-w-2xl items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600"
          >
            <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: theme.hexPrimary }} aria-hidden="true" />
            <span>{slide.explanation}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
