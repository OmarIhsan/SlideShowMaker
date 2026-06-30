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

      // Chapter title centered at Y: 1.5, size 44, gold C5A059
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 1.5,
        w: 6.5,
        h: 0.8,
        fontSize: 44,
        bold: true,
        color: "C5A059",
        fontFace: "Inter",
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
        fontFace: "Open Sans",
        align: "center",
        valign: "middle"
      })
      return
    }

    pptxSlide.background = { color: bgHex }

    // Add 1px Cobalt structural anchor line at left margin (x: 0.5)
    pptxSlide.addShape("line", {
      type: "line",
      x: 0.5,
      y: 1.1,
      w: 0.0,
      h: 3.4,
      line: { color: "0F4C81", width: 1 }
    })

    // Add brand metadata header at top left
    pptxSlide.addText(headerText, {
      x: 0.55,
      y: 0.5,
      w: 6.45,
      h: 0.3,
      fontSize: 9,
      bold: true,
      color: "94A3B8", // Slate Gray
      fontFace: "Inter",
      align: "left",
      valign: "middle"
    })

    // Running Footer Left
    pptxSlide.addText(footerLeftText, {
      x: 0.5,
      y: 4.8,
      w: 3.0,
      h: 0.3,
      fontSize: 8,
      bold: true,
      color: "0F4C81", // Ceramic Cobalt
      fontFace: "Inter",
      align: "left"
    })

    // Running Footer Right
    pptxSlide.addText(footerRightText, {
      x: 4.0,
      y: 4.8,
      w: 3.0,
      h: 0.3,
      fontSize: 8,
      bold: true,
      color: "94A3B8", // Slate Gray
      fontFace: "Inter",
      align: "right"
    })

    // No slide title rendered on any slide — uniform titleless layout.
    // Content is rendered through the standard body text box for all slides.

    try {
      if (slide.layout === "EVIDENCE_COMPARATIVE") {
        // Render optional title for context
        pptxSlide.addText(slide.title, {
          x: 0.5,
          y: 0.9,
          w: 6.5,
          h: 0.4,
          fontSize: 18,
          bold: true,
          color: "0F4C81",
          fontFace: "Inter",
          align: "left",
          valign: "middle"
        })

        // Left Media Block
        pptxSlide.addShape("rect", {
          x: 0.5,
          y: 1.5,
          w: 3.1,
          h: 2.5,
          fill: { color: "E2E8F0" },
          line: { color: "CBD5E1", width: 1 }
        })
        pptxSlide.addText("Pre-Op State", {
          x: 0.5, y: 1.5, w: 3.1, h: 2.5,
          fontSize: 12, bold: true, color: "64748B", fontFace: "Inter", align: "center", valign: "middle"
        })
        pptxSlide.addText("Baseline clinical observation prior to intervention.", {
          x: 0.5, y: 4.1, w: 3.1, h: 0.4,
          fontSize: 10, italic: true, color: "64748B", fontFace: "Open Sans", align: "center", valign: "top"
        })

        // Right Media Block
        pptxSlide.addShape("rect", {
          x: 3.9,
          y: 1.5,
          w: 3.1,
          h: 2.5,
          fill: { color: "E2E8F0" },
          line: { color: "CBD5E1", width: 1 }
        })
        pptxSlide.addText("Post-Op Outcome", {
          x: 3.9, y: 1.5, w: 3.1, h: 2.5,
          fontSize: 12, bold: true, color: "64748B", fontFace: "Inter", align: "center", valign: "middle"
        })
        pptxSlide.addText("Final restoration state following targeted procedure.", {
          x: 3.9, y: 4.1, w: 3.1, h: 0.4,
          fontSize: 10, italic: true, color: "64748B", fontFace: "Open Sans", align: "center", valign: "top"
        })
      } else if (slide.layout === "TABULAR_DATA") {
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

        // === PPTX BOUNDING FRAME (Left 40% Column) ===
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

        // === PPTX MEDIA FRAME (Right 60% Column - Unbordered) ===
        pptxSlide.addShape("rect", {
          x: 3.1,
          y: 1.25,
          w: 3.9,
          h: 3.4,
          fill: { color: "E2E8F0" },
          line: { color: "E2E8F0", width: 0 }
        })

        pptxSlide.addText("Intraoral Macro Photo", {
          x: 3.1,
          y: 1.4,
          w: 3.9,
          h: 0.4,
          fontSize: 12,
          bold: true,
          color: "64748B",
          fontFace: "Inter",
          align: "center",
          valign: "middle"
        })

        // Vector Arrow Annotation line
        pptxSlide.addShape("line", {
          type: "line",
          x: 6.0,
          y: 4.3,
          w: 0.5,
          h: 0,
          line: { color: "C5A059", width: 2 }
        })

        pptxSlide.addText("Structural Detail Focus", {
          x: 4.8,
          y: 4.15,
          w: 1.1,
          h: 0.25,
          fontSize: 10,
          bold: true,
          color: "C5A059",
          fontFace: "Inter",
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
    doc.setFontSize(44)
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

  // Add left anchor line (1px Cobalt)
  doc.setDrawColor("#0F4C81")
  doc.setLineWidth(0.01)
  doc.line(0.5, 1.1, 0.5, 4.5)

  const fontToUse = (typeof doc.getFontList === "function" && doc.getFontList()["Open Sans"]) ? "Open Sans" : "Helvetica";

  const headerText = brandHeader || "DR. CUBE DENTISTRY • ACADEMIC LECTURE SERIES"
  const footerLeftText = brandFooterLeft || "DR. CUBE DENTISTRY"
  const footerRightText = brandFooterRight || "2026 EDITION"

  // Add brand metadata header at top left
  doc.setFont("Inter", "bold")
  doc.setFontSize(9)
  doc.setTextColor("#94A3B8") // Slate Gray
  doc.text(headerText, 0.55, 0.7)

  // Running Footer Left
  doc.setFont("Inter", "bold")
  doc.setFontSize(8)
  doc.setTextColor("#0F4C81") // Ceramic Cobalt
  doc.text(footerLeftText, 0.5, 4.95)

  // Running Footer Right
  doc.setFont("Inter", "bold")
  doc.setFontSize(8)
  doc.setTextColor("#94A3B8") // Slate Gray
  doc.text(footerRightText, 7.0, 4.95, { align: "right" })

  if (slide.layout === "EVIDENCE_COMPARATIVE") {
    // Render optional title for context
    doc.setFont("Inter", "bold")
    doc.setFontSize(18)
    doc.setTextColor("#0F4C81")
    doc.text(slide.title, 0.5, 1.1)

    // Left Media Block
    doc.setFillColor(226, 232, 240) // E2E8F0
    doc.setDrawColor(203, 213, 225) // CBD5E1
    doc.rect(0.5, 1.5, 3.1, 2.5, "FD")
    
    doc.setFont("Inter", "bold")
    doc.setFontSize(12)
    doc.setTextColor("#64748B")
    doc.text("Pre-Op State", 2.05, 2.8, { align: "center" })

    doc.setFont("Open Sans", "italic")
    doc.setFontSize(10)
    doc.text("Baseline clinical observation prior to intervention.", 2.05, 4.2, { align: "center" })

    // Right Media Block
    doc.setFillColor(226, 232, 240) // E2E8F0
    doc.setDrawColor(203, 213, 225) // CBD5E1
    doc.rect(3.9, 1.5, 3.1, 2.5, "FD")

    doc.setFont("Inter", "bold")
    doc.setFontSize(12)
    doc.setTextColor("#64748B")
    doc.text("Post-Op Outcome", 5.45, 2.8, { align: "center" })

    doc.setFont("Open Sans", "italic")
    doc.setFontSize(10)
    doc.text("Final restoration state following targeted procedure.", 5.45, 4.2, { align: "center" })

  } else if (slide.layout === "TABULAR_DATA") {
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
    // Standard body renderer (Layout B)
    const contentToRender = slide.content;
    const pdfLineHeight = (14 / 72) * 1.3

    const bodySegments = buildBodySegments(contentToRender)
    doc.setFont(fontToUse, "normal")
    doc.setFontSize(14)

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

    // === PDF MEDIA FRAME (Right 60% Column - Unbordered) ===
    doc.setFillColor(226, 232, 240) // E2E8F0
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0)
    doc.rect(3.1, 1.25, 3.9, 3.4, "FD")

    doc.setFont("Inter", "bold")
    doc.setFontSize(12)
    doc.setTextColor("#64748B")
    doc.text("Intraoral Macro Photo", 5.05, 2.8, { align: "center" })

    // Vector Arrow Annotation
    doc.setFontSize(10)
    doc.setTextColor("#C5A059")
    doc.text("Structural Detail Focus", 6.2, 4.3, { align: "right" })
    doc.setDrawColor("#C5A059")
    doc.setLineWidth(0.02)
    doc.line(6.25, 4.27, 6.75, 4.27)
    doc.line(6.65, 4.17, 6.75, 4.27)
    doc.line(6.65, 4.37, 6.75, 4.27)
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