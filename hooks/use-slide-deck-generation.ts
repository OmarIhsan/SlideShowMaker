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

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve()
      return
    }
    const existing = document.querySelector(`script[src="${url}"]`)
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = url
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`))
    document.head.appendChild(script)
  })
}

function cleanDocText(text: string): string {
  const lines = text.split(/[\r\n]+/);
  const cleanLines = lines
    .map((line) => line.trim())
    .filter((line) => {
      if (line.length < 3) return false;
      const lower = line.toLowerCase();

      // MS Word OLE system streams and metadata properties
      if (
        lower.includes("worddocument") ||
        lower.includes("microsoft word") ||
        lower.includes("summaryinformation") ||
        lower.includes("documentsummaryinformation") ||
        lower.includes("normal.dot") ||
        lower.includes("compobj") ||
        lower.includes("objectpool") ||
        lower.includes("msworddoc") ||
        lower.includes("word.document.8") ||
        lower.includes("root entry") ||
        lower.includes("default paragraph font") ||
        lower.includes("table")
      ) {
        return false;
      }

      // Common Font/Style names used in Word styling metadata
      if (
        lower === "normal" ||
        lower === "heading" ||
        lower.startsWith("heading ") ||
        lower === "times new roman" ||
        lower === "arial" ||
        lower === "calibri" ||
        lower === "courier new" ||
        lower === "symbol" ||
        lower === "wingdings" ||
        lower.includes("font") ||
        lower.includes("theme")
      ) {
        return false;
      }

      // Filter out purely repeated symbol rows (headers/footers/binary structures)
      if (/^[\\_/\-\s*.|+=:;?!#@$%^&*(){}[\]]{4,}$/.test(line)) {
        return false;
      }

      // Count alphanumeric characters to filter out binary noise
      const alphaCount = (line.match(/[a-zA-Z0-9\u0080-\uFFFF]/g) || []).length;
      if (alphaCount < line.length * 0.4) {
        return false;
      }

      return true;
    });

  return cleanLines.join("\n");
}

function extractTextFromDoc(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.length;
  let text = "";

  let i = 0;
  while (i < len) {
    // Check for UTF-16LE printable sequence
    let utf16TempBytes: number[] = [];
    let j = i;
    while (j + 1 < len) {
      const b1 = bytes[j];
      const b2 = bytes[j + 1];

      const isPrintableUtf16 =
        (b2 === 0x00 && ((b1 >= 0x20 && b1 <= 0x7E) || b1 === 0x0A || b1 === 0x0D || b1 === 0x09 || b1 >= 0x80)) ||
        (b2 === 0x20 && b1 >= 0x00 && b1 <= 0xFF) ||
        (b2 >= 0x01 && b2 <= 0x04 && b1 >= 0x00 && b1 <= 0xFF);

      if (isPrintableUtf16) {
        utf16TempBytes.push(b1, b2);
        j += 2;
      } else {
        break;
      }
    }

    if (utf16TempBytes.length >= 8) { // 4 chars
      const utf16Buf = new Uint8Array(utf16TempBytes);
      text += new TextDecoder("utf-16le").decode(utf16Buf) + "\n";
      i = j;
      continue;
    }

    // Check for ASCII/ANSI/UTF-8 printable sequence
    let asciiTempBytes: number[] = [];
    let k = i;
    while (k < len) {
      const b = bytes[k];
      const isPrintableByte = (b >= 0x20 && b <= 0x7E) || b === 0x0A || b === 0x0D || b === 0x09 || (b >= 0x80 && b <= 0xFF);
      if (isPrintableByte) {
        asciiTempBytes.push(b);
        k++;
      } else {
        break;
      }
    }

    if (asciiTempBytes.length >= 4) {
      const asciiBuf = new Uint8Array(asciiTempBytes);
      text += new TextDecoder("utf-8").decode(asciiBuf) + "\n";
      i = k;
      continue;
    }

    i++;
  }

  return cleanDocText(text);
}

export function useSlideDeckGeneration() {
  const [rawText, setRawText] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
  const [stepIndex, setStepIndex] = useState(0)
  const [slides, setSlides] = useState<Slide[]>([])
  const [[current, direction], setPage] = useState<[number, number]>([0, 0])

  const canGenerate = rawText.trim().length > 0

  const ingestFile = useCallback(async (file: File) => {
    setFileName(file.name)
    const nameLower = file.name.toLowerCase()

    try {
      if (nameLower.endsWith(".pdf")) {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js")
        const pdfjsLib = (window as any).pdfjsLib
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js"

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
        let fullText = ""

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          
          // Native Text Extraction Filter: Target only structural text. Ignore embedded images/vectors.
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ")

          if (pageText.trim()) {
            fullText += pageText + "\n"
          }
        }

        if (fullText.trim().length > 0) {
          setRawText(fullText)
        } else {
          alert("This PDF does not contain a digital text layer (it may be scanned). Please copy and paste raw text outline instead.")
          setFileName(null)
          setRawText("")
        }
      } else if (nameLower.endsWith(".docx")) {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.11.0/mammoth.browser.min.js")
        const mammoth = (window as any).mammoth

        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        const text = result.value

        if (text.trim().length > 0) {
          setRawText(text)
        } else {
          alert("This document is empty. Please check the file and try again.")
          setFileName(null)
          setRawText("")
        }
      } else if (nameLower.endsWith(".doc")) {
        const arrayBuffer = await file.arrayBuffer()
        const text = extractTextFromDoc(arrayBuffer)

        if (text.trim().length > 0) {
          setRawText(text)
        } else {
          alert("This document does not contain a digital text layer. Please check the file and try again.")
          setFileName(null)
          setRawText("")
        }
      } else {
        const isBinary = nameLower.endsWith(".zip") || 
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
          alert("Unsupported binary file format. Please upload text outlines or copy-paste text instead.")
          setFileName(null)
          setRawText("")
        }
      }
    } catch (error) {
      console.error("Failed to parse document natively", error)
      alert("Failed to parse document: " + (error instanceof Error ? error.message : String(error)))
      setFileName(null)
      setRawText("")
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

    const source = rawText
    const result = parseDocumentToSlides(source, fileName === "Pasted Outline.txt")

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
    setFileName,
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
