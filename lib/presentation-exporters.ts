import type { Slide, Theme } from "@/lib/slide-engine"
import {
  buildBodySegments,
  measurePdfBodyHeight,
  SLIDE_FRAME,
} from "./slide-layout"

type ExportDeckArgs = {
  slides: Slide[]
  theme: Theme
  logoBase64: string | null
  lecturerName: string
  brandHeader?: string
  brandFooterLeft?: string
  brandFooterRight?: string
}

function cleanHex(hex: string): string {
  return hex.replace("#", "")
}

function buildFormattedContent(slide: Slide, primaryHex: string, theme: Theme) {
  const contentToRender = slide.content;
  const bodySegments = buildBodySegments(contentToRender)

  return bodySegments.map((segment, index) => {
    const textOpts: any = {
      color: "1E293B",
      fontSize: 14,
      fontFace: "Plus Jakarta Sans",
      lineSpacing: 19,
      bold: false,
    };

    if (segment.isListItem) {
      textOpts.bullet = {
        code: "25CF",   // circle glyph
        color: "0F4C81"
      };
    }

    return {
      text: segment.cleanText + (index < bodySegments.length - 1 ? "\n" : ""),
      options: textOpts,
    }
  })
}

function addSlideTitle(doc: any, slide: Slide, theme: Theme) {
  // Titleless canvas layout: slide titles are not printed on the slides.
}

// addSlideDecoration: renders the Cobalt column block
function addSlideDecoration(doc: any, theme: Theme) {
  if (typeof doc.rect === "function") {
    // jsPDF path
    doc.setFillColor("#0F4C81")
    doc.rect(SLIDE_FRAME.accentX, SLIDE_FRAME.accentY, SLIDE_FRAME.accentW, SLIDE_FRAME.accentH, "F")
  } else {
    // pptxgenjs path
    doc.addShape("rect", {
      x: SLIDE_FRAME.accentX,
      y: SLIDE_FRAME.accentY,
      w: SLIDE_FRAME.accentW,
      h: SLIDE_FRAME.accentH,
      fill: { color: "0F4C81" },
      line: { color: "0F4C81", width: 0 }
    })
  }
}

export async function exportSlidesToPowerPoint({
  slides,
  theme,
  logoBase64,
  lecturerName,
  brandHeader,
  brandFooterLeft,
  brandFooterRight,
}: ExportDeckArgs): Promise<void> {
  const pptxgenModule = await import("pptxgenjs")
  const PptxGen = (pptxgenModule as any).default || pptxgenModule
  const pptx = new PptxGen()

  pptx.defineLayout({
    name: "CUSTOM_4_3",
    width: 7.5,
    height: 5.625,
  })
  pptx.layout = "CUSTOM_4_3"

  const primaryHex = cleanHex(theme.hexPrimary)
  const bgHex = cleanHex(theme.hexBg)

  const headerText = brandHeader || "DR. CUBE DENTISTRY • ACADEMIC LECTURE SERIES"
  const footerLeftText = brandFooterLeft || "DR. CUBE DENTISTRY"
  const footerRightText = brandFooterRight || "2026 EDITION"

  slides.forEach((slide) => {
    const pptxSlide = pptx.addSlide()

    if (slide.layout === "CHAPTER_DIVIDER") {
      // === CHAPTER DIVIDER: full-bleed #1E293B canvas ===
      pptxSlide.background = { color: "1E293B" }

      // Chapter title centered at Y: 1.5, size 24, gold C5A059
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 1.5,
        w: 6.5,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: "C5A059",
        fontFace: "Plus Jakarta Sans",
        align: "center",
        valign: "middle"
      })

      // Centered macro Isolation View Media frame (y: 2.5, w: 4.0, h: 3.0)
      pptxSlide.addShape("rect", {
        x: 1.75,
        y: 2.5,
        w: 4.0,
        h: 3.0,
        fill: { color: "111827" },
        line: { color: "374151", width: 1 }
      })

      pptxSlide.addText("Centered Macro Isolation View\n(Borderless Raw Crop)", {
        x: 1.75,
        y: 2.5,
        w: 4.0,
        h: 3.0,
        fontSize: 9,
        color: "C5A059",
        fontFace: "Plus Jakarta Sans",
        align: "center",
        valign: "middle"
      })
      return
    }

    pptxSlide.background = { color: bgHex }

    // Add left anchor column to ALL slides (including slide 1)
    addSlideDecoration(pptxSlide, theme)

    // Add right limit line
    pptxSlide.addShape("line", {
      type: "line",
      x: 2.25,
      y: 1.1,
      w: 0.0,
      h: 3.4,
      line: { color: "E2E8F0", width: 1 }
    })

    // Add brand metadata header at top left
    pptxSlide.addText(headerText, {
      x: 2.52,
      y: 0.5,
      w: 4.45,
      h: 0.3,
      fontSize: 9,
      bold: true,
      color: "94A3B8", // Slate Gray
      fontFace: "Plus Jakarta Sans",
      align: "left",
      valign: "middle"
    })

    // Running Footer Left
    pptxSlide.addText(footerLeftText, {
      x: 2.52,
      y: 4.8,
      w: 2.5,
      h: 0.3,
      fontSize: 8,
      bold: true,
      color: "0F4C81", // Ceramic Cobalt
      fontFace: "Plus Jakarta Sans",
      align: "left"
    })

    // Running Footer Right
    pptxSlide.addText(footerRightText, {
      x: 5.47,
      y: 4.8,
      w: 1.5,
      h: 0.3,
      fontSize: 8,
      bold: true,
      color: "94A3B8", // Slate Gray
      fontFace: "Plus Jakarta Sans",
      align: "right"
    })

    // No slide title rendered on any slide — uniform titleless layout.
    // Content is rendered through the standard body text box for all slides.

    try {
      if (slide.layout === "TABULAR_DATA") {
        const bulletX = 1.22;
        const textX = 1.4;
        const maxTextWidth = 6.4;
        const tableRows = slide.content.map((rowText, rowIndex) => {
          const cells = rowText
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => {
              const cellObj: any = { text: cell.trim() }
              if (rowIndex === 0) {
                cellObj.options = {
                  fill: { color: "0F4C81" },
                  color: "FFFFFF",
                  bold: true,
                  fontSize: 26,
                  align: "left",
                  valign: "middle",
                  fontFace: "Inter"
                }
              } else {
                cellObj.options = {
                  fill: { color: rowIndex % 2 === 1 ? "FFFFFF" : "F8FAFC" },
                  color: "1E293B",
                  fontSize: 24,
                  align: "left",
                  valign: "middle",
                  fontFace: "Inter"
                }
              }
              return cellObj
            })
          return cells
        })
        pptxSlide.addTable(tableRows, {
          x: SLIDE_FRAME.bodyX,
          y: 1.6,
          w: SLIDE_FRAME.bodyW,
          border: { type: "solid", color: "E2E8F0", width: 1 },
        })
      } else {
        // Standard content body — applies to ALL slides including Slide 1
        const formattedContent = buildFormattedContent(slide, primaryHex, theme)

        // === PPTX BOUNDING FRAME ===
        pptxSlide.addText(formattedContent, {
          x: SLIDE_FRAME.bodyX,
          y: SLIDE_FRAME.bodyY,
          w: SLIDE_FRAME.bodyW,
          h: SLIDE_FRAME.bodyH,
          align: "justify",
          valign: "middle",
          fit: "shrink",
          margin: 0,
        })

        // === PPTX MEDIA FRAME ===
        pptxSlide.addShape("rect", {
          x: 4.92,
          y: 1.25,
          w: 2.08,
          h: 3.4,
          fill: { color: "F8FAFC" },
          line: { color: "C5A059", width: 1 }
        })

        pptxSlide.addText("Intraoral Macro Photo", {
          x: 4.92,
          y: 1.4,
          w: 2.08,
          h: 0.4,
          fontSize: 8,
          bold: true,
          color: "C5A059",
          fontFace: "Plus Jakarta Sans",
          align: "center",
          valign: "middle"
        })

        // Vector Arrow Annotation line
        pptxSlide.addShape("line", {
          type: "line",
          x: 6.5,
          y: 4.3,
          w: 0.3,
          h: 0,
          line: { color: "C5A059", width: 2 }
        })

        pptxSlide.addText("Macro Focus", {
          x: 5.8,
          y: 4.15,
          w: 0.7,
          h: 0.25,
          fontSize: 7,
          bold: true,
          color: "C5A059",
          fontFace: "Plus Jakarta Sans",
          align: "right"
        })
      }
    } catch (error) {
      console.error("Safeguard applied for slide compile exception:", error)
      // Fallback text layer
      pptxSlide.addText(slide.content.join("\n"), {
        x: SLIDE_FRAME.bodyX,
        y: SLIDE_FRAME.bodyY,
        w: SLIDE_FRAME.bodyW,
        h: 3.4,
        fontSize: 30,
        fontFace: "Inter",
        color: "1E293B",
        lineSpacing: 24,
        valign: "middle",
        margin: 0,
      })
    }
  })

  await pptx.writeFile({ fileName: `Academic_Lecture_${Date.now()}.pptx` })
}

function measurePdfTableHeight(doc: any, rows: string[][], colW: number): number {
  return rows.reduce((totalH, row) => {
    let maxLines = 1
    row.forEach((cellText) => {
      const lines = doc.splitTextToSize(cellText, colW - 0.1)
      if (lines.length > maxLines) {
        maxLines = lines.length
      }
    })
    return totalH + (maxLines * 0.2 + 0.15)
  }, 0)
}

function renderPdfTableGrid(doc: any, slide: Slide, theme: Theme, startY: number, customWidth?: number) {
  const rows = slide.content.map((rowText) => {
    return rowText
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim())
  })

  if (rows.length === 0) return

  const numCols = Math.max(...rows.map((r) => r.length))
  const tableX = SLIDE_FRAME.bodyX
  const tableW = customWidth || SLIDE_FRAME.bodyW
  const colW = tableW / numCols

  let currentY = startY

  doc.setFont("Inter", "normal")
  doc.setFontSize(22)

  rows.forEach((row, rowIndex) => {
    let maxLines = 1
    row.forEach((cellText) => {
      const lines = doc.splitTextToSize(cellText, colW - 0.1)
      if (lines.length > maxLines) {
        maxLines = lines.length
      }
    })

    const rowH = maxLines * 0.2 + 0.15

    if (rowIndex === 0) {
      doc.setFillColor("#0F4C81")
      doc.rect(tableX, currentY, tableW, rowH, "F")
      doc.setTextColor("#FFFFFF")
      doc.setFont("Inter", "bold")
    } else {
      doc.setFillColor(rowIndex % 2 === 1 ? "#FFFFFF" : "#F8FAFC")
      doc.rect(tableX, currentY, tableW, rowH, "F")
      doc.setTextColor("#1E293B")
      doc.setFont("Inter", "normal")
    }

    row.forEach((cellText, colIndex) => {
      const x = tableX + colIndex * colW + 0.05
      const lines = doc.splitTextToSize(cellText, colW - 0.1)
      const textY = currentY + (rowH / 2) + (lines.length * 0.08) - 0.05
      doc.text(lines, x, textY)
    })

    doc.setDrawColor("#E2E8F0")
    doc.setLineWidth(0.01)
    doc.line(tableX, currentY, tableX + tableW, currentY)
    doc.line(tableX, currentY + rowH, tableX + tableW, currentY + rowH)

    for (let colIndex = 0; colIndex <= numCols; colIndex++) {
      const x = tableX + colIndex * colW
      doc.line(x, currentY, x, currentY + rowH)
    }

    currentY += rowH
  })
}

function renderPdfPage(
  doc: any,
  slide: Slide,
  theme: Theme,
  lecturerName: string,
  logoBase64: string | null,
  brandHeader?: string,
  brandFooterLeft?: string,
  brandFooterRight?: string
) {
  if (slide.layout === "CHAPTER_DIVIDER") {
    // === CHAPTER DIVIDER (PDF) ===
    doc.setFillColor("#1E293B")
    doc.rect(0, 0, 7.5, 5.625, "F")

    // Chapter title
    doc.setFont("Inter", "bold")
    doc.setFontSize(24)
    doc.setTextColor("#C5A059")
    doc.text(slide.title, 3.75, 1.8, { align: "center" })

    // Center macro Isolation View Media frame (y: 2.5, w: 4.0, h: 3.0)
    doc.setFillColor("#111827")
    doc.setDrawColor("#374151")
    doc.setLineWidth(0.015)
    doc.rect(1.75, 2.5, 4.0, 3.0, "FD")

    doc.setFont("Inter", "bold")
    doc.setFontSize(9)
    doc.setTextColor("#C5A059")
    doc.text("Centered Macro Isolation View", 3.75, 3.8, { align: "center" })
    doc.setFontSize(8)
    doc.setTextColor("#94A3B8")
    doc.text("(Borderless Raw Crop)", 3.75, 4.1, { align: "center" })
    return
  }

  doc.setFillColor(theme.hexBg)
  doc.rect(0, 0, 7.5, 5.625, "F")

  // Left anchor column on ALL slides (including Slide 1) — uniform titleless layout
  addSlideDecoration(doc, theme)

  // Add right limit line
  doc.setDrawColor("#E2E8F0")
  doc.setLineWidth(0.01)
  doc.line(1.7, 1.0, 1.7, 4.6)

  const fontToUse = (typeof doc.getFontList === "function" && doc.getFontList()["Plus Jakarta Sans"]) ? "Plus Jakarta Sans" : "Helvetica";

  const headerText = brandHeader || "DR. CUBE DENTISTRY • ACADEMIC LECTURE SERIES"
  const footerLeftText = brandFooterLeft || "DR. CUBE DENTISTRY"
  const footerRightText = brandFooterRight || "2026 EDITION"

  // Add brand metadata header at top left
  doc.setFont(fontToUse, "bold")
  doc.setFontSize(9)
  doc.setTextColor("#94A3B8") // Slate Gray
  doc.text(headerText, SLIDE_FRAME.bodyX, 0.7)

  // Running Footer Left
  doc.setFont(fontToUse, "bold")
  doc.setFontSize(8)
  doc.setTextColor("#0F4C81") // Ceramic Cobalt
  doc.text(footerLeftText, SLIDE_FRAME.bodyX, 4.95)

  // Running Footer Right
  doc.setFont(fontToUse, "bold")
  doc.setFontSize(8)
  doc.setTextColor("#94A3B8") // Slate Gray
  doc.text(footerRightText, 6.97, 4.95, { align: "right" })

  if (slide.layout === "TABULAR_DATA") {
    const rows = slide.content.map((rowText) => {
      return rowText
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim())
    })
    const numCols = Math.max(...rows.map((r) => r.length))
    const colW = SLIDE_FRAME.bodyW / numCols
    const totalTableH = measurePdfTableHeight(doc, rows, colW)
    const startY = Math.max(1.5, (5.625 - totalTableH) / 2)
    renderPdfTableGrid(doc, slide, theme, startY)
  } else {
    // Standard body renderer — ALL slides including Slide 1
    const contentToRender = slide.content;
    const pdfLineHeight = (14 / 72) * 1.3

    // Standardize measure method to use the dynamic font scale parameters
    const bodySegments = buildBodySegments(contentToRender)
    doc.setFont(fontToUse, "normal")
    doc.setFontSize(14)

    // Calculate height accurately with dynamic font scale variables
    const centeredBodyHeight = bodySegments.reduce((height, segment) => {
      const lower = segment.cleanText.toLowerCase()
      const isWarning = ["warning", "caution", "ethics", "fabrication", "fraud", "violation", "critical"].some(w => lower.includes(w))
      if (isWarning) {
        const lines = doc.splitTextToSize(segment.cleanText, SLIDE_FRAME.bodyW - 0.4).length
        return height + (lines * pdfLineHeight) + 0.3
      }
      if (segment.isListItem) {
        const lines = doc.splitTextToSize(segment.cleanText, SLIDE_FRAME.bodyW - 0.2).length
        return height + (lines * pdfLineHeight) + 0.16
      }
      const lines = doc.splitTextToSize(segment.cleanText, SLIDE_FRAME.bodyW).length
      return height + (lines * pdfLineHeight) + 0.12
    }, 0)

    const startY = Math.max(SLIDE_FRAME.bodyY, (5.625 - centeredBodyHeight) / 2)

    let currentY = startY
    bodySegments.forEach((segment, segmentIndex) => {
      const lower = segment.cleanText.toLowerCase()
      const isWarning = ["warning", "caution", "ethics", "fabrication", "fraud", "violation", "critical"].some(w => lower.includes(w))

      if (isWarning) {
        const lines = doc.splitTextToSize(segment.cleanText, SLIDE_FRAME.bodyW - 0.4)
        doc.setFillColor(248, 245, 237)
        doc.rect(SLIDE_FRAME.bodyX, currentY - 0.2, SLIDE_FRAME.bodyW, (lines.length * pdfLineHeight) + 0.2, "F")
        doc.setDrawColor("#C5A059")
        doc.setLineWidth(0.04)
        doc.line(SLIDE_FRAME.bodyX, currentY - 0.2, SLIDE_FRAME.bodyX, currentY - 0.2 + (lines.length * pdfLineHeight) + 0.2)
        doc.setFont(fontToUse, "bold")
        doc.setTextColor("#1E293B")
        doc.text(lines, SLIDE_FRAME.bodyX + 0.2, currentY, { align: "justify", maxWidth: SLIDE_FRAME.bodyW - 0.4 })
        currentY += (lines.length * pdfLineHeight) + 0.3
        doc.setFont(fontToUse, "normal")
        doc.setFontSize(14)
        return
      }

      doc.setFont(fontToUse, "normal")
      doc.setFontSize(14)
      doc.setTextColor(theme.hexPrimary)

      if (segment.isListItem) {
        // Circle bullet — color is #0F4C81
        doc.setFillColor("#0F4C81")
        doc.circle(SLIDE_FRAME.bodyX + 0.05, currentY - 0.04, 0.03, "F")
        doc.setFontSize(14)
        doc.setTextColor("#1E293B")
        const lines = doc.splitTextToSize(segment.cleanText, SLIDE_FRAME.bodyW - 0.2)
        doc.text(lines, SLIDE_FRAME.bodyX + 0.18, currentY, { align: "justify", maxWidth: SLIDE_FRAME.bodyW - 0.2 })
        currentY += (lines.length * pdfLineHeight) + 0.16
      } else {
        doc.setFontSize(14)
        doc.setTextColor("#1E293B")
        const lines = doc.splitTextToSize(segment.cleanText, SLIDE_FRAME.bodyW)
        doc.text(lines, SLIDE_FRAME.bodyX, currentY, { align: "justify", maxWidth: SLIDE_FRAME.bodyW })
        currentY += (lines.length * pdfLineHeight) + 0.12
      }
    })

    // === PDF MEDIA FRAME ===
    doc.setFillColor("#F8FAFC")
    doc.setDrawColor("#C5A059")
    doc.setLineWidth(0.015)
    doc.rect(4.92, 1.25, 2.08, 3.4, "FD")

    doc.setFont(fontToUse, "bold")
    doc.setFontSize(8)
    doc.setTextColor("#C5A059")
    doc.text("Intraoral Macro Photo", 5.96, 1.6, { align: "center" })

    // Center camera icon box
    doc.setFillColor("#E2E8F0")
    doc.rect(5.76, 2.2, 0.4, 0.3, "F")

    // Vector Arrow Annotation
    doc.setFontSize(7)
    doc.text("Macro Focus", 6.5, 4.3, { align: "right" })
    doc.setLineWidth(0.02)
    doc.line(6.55, 4.27, 6.85, 4.27)
    doc.line(6.75, 4.22, 6.85, 4.27)
    doc.line(6.75, 4.32, 6.85, 4.27)
  }
}

function renderFallbackPdfPage(
  doc: any,
  slide: Slide,
  theme: Theme,
  lecturerName: string = "",
  brandHeader?: string,
  brandFooterLeft?: string,
  brandFooterRight?: string
) {
  renderPdfPage(doc, slide, theme, lecturerName, null, brandHeader, brandFooterLeft, brandFooterRight)
}

export async function exportSlidesToPDF({
  slides,
  theme,
  logoBase64,
  lecturerName,
  brandHeader,
  brandFooterLeft,
  brandFooterRight,
}: ExportDeckArgs): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: [7.5, 5.625],
  })

  // Try to load Plus Jakarta Sans Google Font
  try {
    const fontUrl = "https://fonts.gstatic.com/s/plusjakartasans/v8/PlusJakartaSans-Medium.ttf"
    const response = await fetch(fontUrl)
    if (response.ok) {
      const buffer = await response.arrayBuffer()
      let binary = ""
      const bytes = new Uint8Array(buffer)
      const len = bytes.byteLength
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64Font = btoa(binary)
      doc.addFileToVFS("PlusJakartaSans-Medium.ttf", base64Font)
      doc.addFont("PlusJakartaSans-Medium.ttf", "Plus Jakarta Sans", "normal")
      doc.addFont("PlusJakartaSans-Medium.ttf", "Plus Jakarta Sans", "bold")
    }
  } catch (fontError) {
    console.warn("Could not load Plus Jakarta Sans Google Font, falling back to Helvetica/Inter:", fontError)
  }

  slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage([7.5, 5.625], "landscape")
    }

    try {
      renderPdfPage(doc, slide, theme, lecturerName, logoBase64, brandHeader, brandFooterLeft, brandFooterRight)
    } catch (error) {
      console.error("Safeguard applied for PDF slide render exception:", error)
      try {
        renderFallbackPdfPage(doc, slide, theme, lecturerName, brandHeader, brandFooterLeft, brandFooterRight)
      } catch (fallbackError) {
        console.error("Critical fail inside fallback PDF render:", fallbackError)
        doc.text(slide.title, 0.7, 1.4)
        doc.text(slide.content.join(" "), 0.7, 2.0)
      }
    }
  })

  try {
    doc.save(`Academic_Lecture_${Date.now()}.pdf`)
  } catch (error) {
    throw error
  }
}

export async function exportSlidesToPDFWithFallback(args: ExportDeckArgs): Promise<void> {
  try {
    await exportSlidesToPDF(args)
  } catch (error) {
    console.error("Failed to generate PDF document", error)

    const { jsPDF } = await import("jspdf")
    const fallbackDoc = new jsPDF({
      orientation: "landscape",
      unit: "in",
      format: [7.5, 5.625],
    })

    args.slides.forEach((slide, index) => {
      if (index > 0) {
        fallbackDoc.addPage([7.5, 5.625], "landscape")
      }
      try {
        renderFallbackPdfPage(
          fallbackDoc,
          slide,
          args.theme,
          args.lecturerName,
          args.brandHeader,
          args.brandFooterLeft,
          args.brandFooterRight
        )
      } catch (err) {
        console.error("Critical fail inside fallback PDF render:", err)
        fallbackDoc.text(slide.title, 0.7, 1.4)
        fallbackDoc.text(slide.content.join(" "), 0.7, 2.0)
      }
    })

    fallbackDoc.save(`Academic_Lecture_${Date.now()}.pdf`)
  }
}