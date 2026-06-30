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
      fontSize: 15,
      fontFace: "Plus Jakarta Sans",
      lineSpacing: 19,
      bold: true,
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

      // Aesthetic Geometric Anchor
      pptxSlide.addShape("rect", {
        x: 1.75,
        y: 2.5,
        w: 4.0,
        h: 3.0,
        fill: { color: "0F4C81" },
        line: { color: "C5A059", width: 4 }
      })

      // Geometric graphic
      pptxSlide.addShape("line", {
        type: "line",
        x: 2.75, y: 3.0, w: 2.0, h: 2.0,
        line: { color: "C5A059", width: 1 }
      })
      pptxSlide.addShape("line", {
        type: "line",
        x: 2.75, y: 5.0, w: 2.0, h: -2.0,
        line: { color: "C5A059", width: 1 }
      })
      return
    }

    pptxSlide.background = { color: bgHex }

    if (logoBase64) {
      try {
        pptxSlide.addImage({
          data: logoBase64,
          x: 1.5,
          y: 1.25,
          w: 4.5,
          h: 3.125,
          sizing: { type: "contain", w: 4.5, h: 3.125 },
          transparency: 90
        })
      } catch (e) {
        console.warn("Failed to render logo in PPTX", e)
      }
    }

    // Add 1px Cobalt structural anchor line at left margin (x: 0.5)
    pptxSlide.addShape("line", {
      type: "line",
      x: 1.5,
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
      x: 3.5,
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
      if (slide.layout === "EVIDENCE_COMPARATIVE") {
        // Render optional title for context
        pptxSlide.addText(slide.title, {
          x: 0.5,
          y: 0.9,
          w: 6.5,
          h: 0.4,
          fontSize: 15,
          bold: true,
          color: "0F4C81",
          fontFace: "Inter",
          align: "left",
          valign: "middle"
        })

        // Left Media Block (Charcoal)
        pptxSlide.addShape("rect", {
          x: 0.5,
          y: 1.5,
          w: 3.1,
          h: 2.5,
          fill: { color: "1E293B" },
          line: { color: "0F4C81", width: 2 }
        })
        pptxSlide.addText("Baseline clinical framework.", {
          x: 0.5, y: 4.1, w: 3.1, h: 0.4,
          fontSize: 10, italic: true, color: "64748B", fontFace: "Open Sans", align: "center", valign: "top"
        })

        // Right Media Block (Cobalt)
        pptxSlide.addShape("rect", {
          x: 3.9,
          y: 1.5,
          w: 3.1,
          h: 2.5,
          fill: { color: "0F4C81" },
          line: { color: "C5A059", width: 2 }
        })
        pptxSlide.addText("Targeted procedural outcome.", {
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

        // === PPTX BOUNDING FRAME (Full Width Column) ===
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

    // Aesthetic Geometric Anchor
    doc.setFillColor("#0F4C81")
    doc.setDrawColor("#C5A059")
    doc.setLineWidth(0.04)
    doc.rect(1.75, 2.5, 4.0, 3.0, "FD")
    
    // Abstract geometric line graphic
    doc.setLineWidth(0.01)
    doc.line(2.75, 3.0, 4.75, 5.0)
    doc.line(2.75, 5.0, 4.75, 3.0)
    return
  }

  doc.setFillColor(theme.hexBg)
  doc.rect(0, 0, 7.5, 5.625, "F")

  if (logoBase64) {
    try {
      doc.saveGraphicsState()
      doc.setGState(new doc.GState({ opacity: 0.1 }))
      doc.addImage(logoBase64, "PNG", 1.5, 1.25, 4.5, 3.125)
      doc.restoreGraphicsState()
    } catch (e) {
      console.warn("Failed to render logo in PDF", e)
    }
  }

  // Add left anchor line (1px Cobalt)
  doc.setDrawColor("#0F4C81")
  doc.setLineWidth(0.01)
  doc.line(1.5, 1.1, 1.5, 4.5)

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
  doc.setFont("Plus Jakarta Sans", "bold")
  doc.setFontSize(8)
  doc.setTextColor("#94A3B8") // Slate Gray
  doc.text(footerRightText, 5.0, 4.95, { align: "right" })

  if (slide.layout === "EVIDENCE_COMPARATIVE") {
    // Render optional title for context
    doc.setFont("Inter", "bold")
    doc.setFontSize(15)
    doc.setTextColor("#0F4C81")
    doc.text(slide.title, 0.5, 1.1)

    // Left Media Block (Charcoal)
    doc.setFillColor("#1E293B")
    doc.setDrawColor("#0F4C81")
    doc.setLineWidth(0.02)
    doc.rect(0.5, 1.5, 3.1, 2.5, "FD")
    
    doc.setFont("Open Sans", "italic")
    doc.setFontSize(10)
    doc.setTextColor("#64748B")
    doc.text("Baseline clinical framework.", 2.05, 4.2, { align: "center" })

    // Right Media Block (Cobalt)
    doc.setFillColor("#0F4C81") 
    doc.setDrawColor("#C5A059") 
    doc.rect(3.9, 1.5, 3.1, 2.5, "FD")

    doc.setFont("Open Sans", "italic")
    doc.setFontSize(10)
    doc.setTextColor("#64748B")
    doc.text("Targeted procedural outcome.", 5.45, 4.2, { align: "center" })

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
    const pdfLineHeight = (15 / 72) * 1.3

    const bodySegments = buildBodySegments(contentToRender)
    doc.setFont("Plus Jakarta Sans", "bold")
    doc.setFontSize(15)

    const centeredBodyHeight = bodySegments.reduce((height, segment) => {
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

      doc.setFont("Plus Jakarta Sans", "bold")
      doc.setFontSize(15)
      doc.setTextColor(theme.hexPrimary)

      if (segment.isListItem) {
        doc.setFillColor("#0F4C81")
        doc.circle(SLIDE_FRAME.bodyX + 0.05, currentY - 0.04, 0.03, "F")
        doc.setFontSize(15)
        doc.setTextColor("#1E293B")
        const lines = doc.splitTextToSize(segment.cleanText, SLIDE_FRAME.bodyW - 0.2)
        doc.text(lines, SLIDE_FRAME.bodyX + 0.18, currentY, { align: "justify", maxWidth: SLIDE_FRAME.bodyW - 0.2 })
        currentY += (lines.length * pdfLineHeight) + 0.16
      } else {
        doc.setFontSize(15)
        doc.setTextColor("#1E293B")
        const lines = doc.splitTextToSize(segment.cleanText, SLIDE_FRAME.bodyW)
        doc.text(lines, SLIDE_FRAME.bodyX, currentY, { align: "justify", maxWidth: SLIDE_FRAME.bodyW })
        currentY += (lines.length * pdfLineHeight) + 0.12
      }
    })
  }
}
function renderFallbackPdfPage(
  doc: any,
  slide: Slide,
  theme: Theme,
  brandHeader?: string,
  brandFooterLeft?: string,
  brandFooterRight?: string
) {
  renderPdfPage(doc, slide, theme, null, brandHeader, brandFooterLeft, brandFooterRight)
}

export async function exportSlidesToPDF({
  slides,
  theme,
  logoBase64,
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

  // Setup custom fonts if logo exists
  if (logoBase64) {
    try {
      // Decode base64 to array buffer
      const binaryStr = atob(BASE64_FONTS.plusJakartaMedium)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }
      
      // Convert to binary string format required by jsPDF VFS
      let binary = ""
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64Font = btoa(binary)
      doc.addFileToVFS("PlusJakartaSans-Medium.ttf", base64Font)
      doc.addFont("PlusJakartaSans-Medium.ttf", "Plus Jakarta Sans", "normal")
      doc.addFont("PlusJakartaSans-Medium.ttf", "Plus Jakarta Sans", "bold")
    } catch (fontError) {
      console.warn("Could not load Plus Jakarta Sans Google Font, falling back to Helvetica/Inter:", fontError)
    }
  }

  slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage([7.5, 5.625], "landscape")
    }

    try {
      renderPdfPage(doc, slide, theme, logoBase64, brandHeader, brandFooterLeft, brandFooterRight)
    } catch (error) {
      console.error("Safeguard applied for PDF slide render exception:", error)
      try {
        renderFallbackPdfPage(doc, slide, theme, brandHeader, brandFooterLeft, brandFooterRight)
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