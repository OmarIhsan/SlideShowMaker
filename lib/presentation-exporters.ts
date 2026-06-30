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
    return {
      text: segment.cleanText + (index < bodySegments.length - 1 ? "\n" : ""),
      options: {
        bullet: {
          code: "25CF",   // circle glyph
          color: "0F4C81"
        },
        color: "1E293B",
        fontSize: 20,
        fontFace: "Plus Jakarta Sans",
        lineSpacing: 27,
        bold: false,
      },
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

  pptx.layout = "LAYOUT_16x9"

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

      // Solid Dentin Gold (#C5A059) right side visual block
      pptxSlide.addShape("rect", {
        x: 6.0,
        y: 0,
        w: 4.0,
        h: 5.625,
        fill: { color: "C5A059" },
        line: { color: "C5A059", width: 0 }
      })

      // Chapter title text frame
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 1.8,
        w: 5.0,
        h: 2.0,
        fontSize: 48,
        bold: true,
        fontFace: "Inter",
        color: "F8F9FA",
        align: "left",
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
      x: 8.0,
      y: 1.0,
      w: 0.0,
      h: 4.0,
      line: { color: "E2E8F0", width: 1 }
    })

    // Add brand metadata header at top left
    pptxSlide.addText(headerText, {
      x: SLIDE_FRAME.bodyX,
      y: 0.6,
      w: SLIDE_FRAME.bodyW,
      h: 0.4,
      fontSize: 10,
      bold: true,
      color: "C5A059", // Dentin Gold
      fontFace: "Plus Jakarta Sans",
      align: "left",
      valign: "middle"
    })

    // Running Footer Left
    pptxSlide.addText(footerLeftText, {
      x: SLIDE_FRAME.bodyX,
      y: SLIDE_FRAME.footerY,
      w: 3.2,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: "64748B",
      fontFace: "Plus Jakarta Sans",
      align: "left"
    })

    // Running Footer Right
    pptxSlide.addText(footerRightText, {
      x: 4.5,
      y: SLIDE_FRAME.footerY,
      w: 3.5,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: "64748B",
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
          align: "left",
          valign: "middle",
          fit: "shrink",
          margin: 0,
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
    doc.rect(0, 0, 10, 5.625, "F")

    // Solid right-side gold block (mirrors PPTX layout 1:1)
    doc.setFillColor("#C5A059")
    doc.rect(6.0, 0, 4.0, 5.625, "F")

    // Chapter title
    doc.setFont("Inter", "bold")
    doc.setFontSize(48)
    doc.setTextColor("#F8F9FA")
    doc.text(slide.title, 0.5, 2.5)
    return
  }

  doc.setFillColor(theme.hexBg)
  doc.rect(0, 0, 10, 5.625, "F")

  // Left anchor column on ALL slides (including Slide 1) — uniform titleless layout
  addSlideDecoration(doc, theme)

  // Add right limit line
  doc.setDrawColor("#E2E8F0")
  doc.setLineWidth(0.01)
  doc.line(8.0, 1.0, 8.0, 5.0)

  const fontToUse = (typeof doc.getFontList === "function" && doc.getFontList()["Plus Jakarta Sans"]) ? "Plus Jakarta Sans" : "Helvetica";

  const headerText = brandHeader || "DR. CUBE DENTISTRY • ACADEMIC LECTURE SERIES"
  const footerLeftText = brandFooterLeft || "DR. CUBE DENTISTRY"
  const footerRightText = brandFooterRight || "2026 EDITION"

  // Add brand metadata header at top left
  doc.setFont(fontToUse, "bold")
  doc.setFontSize(10)
  doc.setTextColor("#C5A059") // Dentin Gold
  doc.text(headerText, SLIDE_FRAME.bodyX, 0.8)

  // Running Footer Left
  doc.setFont(fontToUse, "bold")
  doc.setFontSize(10)
  doc.setTextColor("#64748B")
  doc.text(footerLeftText, SLIDE_FRAME.bodyX, SLIDE_FRAME.footerY)

  // Running Footer Right
  doc.text(footerRightText, 8.0, SLIDE_FRAME.footerY, { align: "right" })

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
    const pdfLineHeight = (20 / 72) * 1.35

    // Standardize measure method to use the dynamic font scale parameters
    const bodySegments = buildBodySegments(contentToRender)
    doc.setFont(fontToUse, "normal")
    doc.setFontSize(20)

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
        doc.text(lines, SLIDE_FRAME.bodyX + 0.2, currentY)
        currentY += (lines.length * pdfLineHeight) + 0.3
        doc.setFont(fontToUse, "normal")
        doc.setFontSize(20)
        return
      }

      doc.setFont(fontToUse, "normal")
      doc.setFontSize(20)

      if (segment.isListItem) {
        // Circle bullet — color is #0F4C81
        doc.setFillColor("#0F4C81")
        doc.circle(SLIDE_FRAME.bodyX - 0.15, currentY - 0.08, 0.035, "F")
        doc.setTextColor("#1E293B")
        const lines = doc.splitTextToSize(segment.cleanText, SLIDE_FRAME.bodyW - 0.2)
        doc.text(lines, SLIDE_FRAME.bodyX, currentY)
        currentY += (lines.length * pdfLineHeight) + 0.16
        return
      }

      // Non-list paragraph
      doc.setTextColor("#1E293B")
      const lines = doc.splitTextToSize(segment.cleanText, SLIDE_FRAME.bodyW)
      doc.text(lines, SLIDE_FRAME.bodyX, currentY)
      currentY += (lines.length * pdfLineHeight) + 0.12
    })
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
    format: [10, 5.625],
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
      doc.addPage([10, 5.625], "landscape")
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
      format: [10, 5.625],
    })

    args.slides.forEach((slide, index) => {
      if (index > 0) {
        fallbackDoc.addPage([10, 5.625], "landscape")
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