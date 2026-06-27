import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react"

import { getSlideTitle, parseDocumentToSlides, SAMPLE_SCRIPT, type Slide } from "@/lib/slide-engine"

const GENERATION_STEPS = [
  "Parsing academic script...",
  "Formatting module dividers...",
  "Applying layout templates...",
  "Compiling self-assessment banks...",
  "Configuring branding metadata...",
]

type Phase = "idle" | "generating" | "ready"

export function useSlideDeckGeneration() {
  const [rawText, setRawText] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
  const [stepIndex, setStepIndex] = useState(0)
  const [slides, setSlides] = useState<Slide[]>([])
  const [[current, direction], setPage] = useState<[number, number]>([0, 0])

  const canGenerate = rawText.trim().length > 0 || fileName !== null

  const ingestFile = useCallback((file: File) => {
    setFileName(file.name)
    const nameLower = file.name.toLowerCase()
    const isBinary = nameLower.endsWith(".pdf") || 
                     nameLower.endsWith(".docx") || 
                     nameLower.endsWith(".pptx") || 
                     nameLower.endsWith(".zip") || 
                     nameLower.endsWith(".png") || 
                     nameLower.endsWith(".jpg") || 
                     nameLower.endsWith(".jpeg") || 
                     nameLower.endsWith(".gif") ||
                     nameLower.endsWith(".xlsx") ||
                     file.type.startsWith("image/") ||
                     file.type.startsWith("video/") ||
                     file.type.startsWith("audio/")

    if (!isBinary) {
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

  const percent = slides.length > 1 ? Math.round((current / (slides.length - 1)) * 100) : 100

  const outline = useMemo(
    () => slides.map((slide, index) => ({ index, title: getSlideTitle(slide), layout: slide.layout })),
    [slides],
  )

  return {
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
  }
}
