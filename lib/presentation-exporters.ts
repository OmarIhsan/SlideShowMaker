import type { Slide, Theme } from "@/lib/slide-engine"
import {
  buildBodySegments,
  measurePdfBodyHeight,
  renderCenteredPdfBody,
  SLIDE_FRAME,
} from "@/lib/slide-layout"

type ExportDeckArgs = {
  slides: Slide[]
  theme: Theme
  logoBase64: string | null
  lecturerName: string
}

function cleanHex(hex: string): string {
  return hex.replace("#", "")
}

function buildFormattedContent(slide: Slide, primaryHex: string) {
  const bodySegments = buildBodySegments(slide.content)

  return bodySegments.map((segment, index) => {
    return {
      text: segment.cleanText + (index < bodySegments.length - 1 ? "\n" : ""),
      options: {
        bullet: segment.isListItem ? { code: "25CF", color: primaryHex } : undefined,
        color: '334155',
        fontSize: 18,
        fontFace: 'Arial',
        lineSpacing: 24,
      },
    }
  })
}

function addSlideTitle(doc: any, slide: Slide, theme: Theme) {
  if (typeof doc.text === "function") {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(28)
    doc.setTextColor("#115E59")
    doc.text(slide.title, SLIDE_FRAME.bodyX, SLIDE_FRAME.titleY + (SLIDE_FRAME.titleH / 2), {
      align: "left",
      baseline: "middle",
    })
  } else {
    doc.addText(slide.title, {
      x: 0.7,
      y: 0.5,
      w: 8.6,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: '115E59',
      fontFace: 'Arial',
      valign: "middle",
      align: "left",
      margin: 0,
    })
  }
}

function addSlideDecoration(doc: any, theme: Theme) {
  if (typeof doc.rect === "function") {
    doc.setFillColor(theme.hexPrimary)
    doc.rect(SLIDE_FRAME.accentX, SLIDE_FRAME.accentY, SLIDE_FRAME.accentW, SLIDE_FRAME.accentH, "F")
  } else {
    doc.addShape("rect", {
      x: SLIDE_FRAME.accentX,
      y: SLIDE_FRAME.accentY,
      w: SLIDE_FRAME.accentW,
      h: SLIDE_FRAME.accentH,
      fill: { color: cleanHex(theme.hexPrimary) },
      line: { color: cleanHex(theme.hexPrimary), width: 0 }
    })
  }
}

export async function exportSlidesToPowerPoint({ slides, theme, logoBase64, lecturerName }: ExportDeckArgs): Promise<void> {
  const pptxgenModule = await import("pptxgenjs")
  const PptxGen = (pptxgenModule as any).default || pptxgenModule
  const pptx = new PptxGen()

  pptx.layout = "LAYOUT_16x9"

  const primaryHex = cleanHex(theme.hexPrimary)
  const bgHex = cleanHex(theme.hexBg)

  slides.forEach((slide) => {
    const pptxSlide = pptx.addSlide()

    pptxSlide.background = { color: bgHex }

    if (logoBase64) {
      pptxSlide.addImage({
        data: logoBase64,
        x: 2.0,
        y: 1.31,
        w: 6.0,
        h: 3.0,
        transparency: 90,
      })
    }

    addSlideDecoration(pptxSlide, theme)

    if (lecturerName) {
      pptxSlide.addText(`Lecturer: ${lecturerName}`, {
        x: SLIDE_FRAME.bodyX,
        y: SLIDE_FRAME.footerY,
        w: SLIDE_FRAME.bodyW,
        h: 0.3,
        fontSize: 9,
        color: "777777",
        fontFace: "Arial",
        italic: true,
      })
    }

    addSlideTitle(pptxSlide, slide, theme)

    try {
      if (slide.layout === "TABULAR_DATA") {
        const tableRows = slide.content.map((rowText, rowIndex) => {
          const cells = rowText
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => {
              const cellObj: any = { text: cell.trim() }
              if (rowIndex === 0) {
                cellObj.options = {
                  fill: { color: primaryHex },
                  color: "FFFFFF",
                  bold: true,
                  fontSize: 12,
                  align: "left",
                  valign: "middle"
                }
              } else {
                cellObj.options = {
                  fill: { color: rowIndex % 2 === 1 ? "FFFFFF" : "F8FAFC" },
                  color: "444444",
                  fontSize: 10,
                  align: "left",
                  valign: "middle"
                }
              }
              return cellObj
            })
          return cells
        })
        pptxSlide.addTable(tableRows, {
          x: 0.7,
          y: 1.5,
          w: 8.6,
          border: { type: "solid", color: "E2E8F0", width: 1 },
        })
      } else {
        const formattedContent = buildFormattedContent(slide, primaryHex)
        pptxSlide.addText(formattedContent, {
          x: 0.7,
          y: 1.5,
          w: 8.6,
          h: 3.4,
          align: "left",
          valign: "middle",
          fit: "shrink",
          margin: 0,
        })
      }
    } catch (error) {
      console.error("Safeguard applied for slide compile exception:", error)
      pptxSlide.addText(slide.content.join(" "), {
        x: 0.7,
        y: 1.5,
        w: 8.6,
        h: 3.4,
        fontSize: 18,
        fontFace: "Arial",
        color: "334155",
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

function renderPdfTableGrid(doc: any, slide: Slide, theme: Theme, startY: number) {
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
  const tableW = SLIDE_FRAME.bodyW
  const colW = tableW / numCols

  let currentY = startY

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)

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
      doc.setFillColor(theme.hexPrimary)
      doc.rect(tableX, currentY, tableW, rowH, "F")
      doc.setTextColor("#FFFFFF")
      doc.setFont("helvetica", "bold")
    } else {
      doc.setFillColor(rowIndex % 2 === 1 ? "#FFFFFF" : "#F8FAFC")
      doc.rect(tableX, currentY, tableW, rowH, "F")
      doc.setTextColor("#444444")
      doc.setFont("helvetica", "normal")
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

function renderPdfPage(doc: any, slide: Slide, theme: Theme, lecturerName: string, logoBase64: string | null) {
  doc.setFillColor(theme.hexBg)
  doc.rect(0, 0, 10, 5.625, "F")

  if (logoBase64) {
    try {
      doc.saveGraphicsState()
      const gState = new (doc as any).GState({ opacity: 0.1 })
      doc.setGState(gState)
      doc.addImage(logoBase64, "PNG", 2.0, 1.31, 6.0, 3.0)
      doc.restoreGraphicsState()
    } catch (error) {
      console.warn("Failed to apply watermark transparency, fallback to standard image", error)
      doc.addImage(logoBase64, "PNG", 2.0, 1.31, 6.0, 3.0)
    }
  }

  addSlideDecoration(doc, theme)

  if (lecturerName) {
    doc.setFont("helvetica", "italic")
    doc.setFontSize(9)
    doc.setTextColor("#777777")
    doc.text(`Lecturer: ${lecturerName}`, SLIDE_FRAME.bodyX, SLIDE_FRAME.footerY)
  }

  addSlideTitle(doc, slide, theme)

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
    const startY = SLIDE_FRAME.bodyY + Math.max(0, (SLIDE_FRAME.bodyH - totalTableH) / 2)
    renderPdfTableGrid(doc, slide, theme, startY)
  } else {
    const bodySegments = buildBodySegments(slide.content)
    const centeredBodyHeight = measurePdfBodyHeight(doc, bodySegments)
    const startY = SLIDE_FRAME.bodyY + Math.max(0, (SLIDE_FRAME.bodyH - centeredBodyHeight) / 2)
    renderCenteredPdfBody(doc, slide, theme, startY)
  }
}

function renderFallbackPdfPage(doc: any, slide: Slide, theme: Theme) {
  doc.setFillColor(theme.hexBg)
  doc.rect(0, 0, 10, 5.625, "F")
  addSlideDecoration(doc, theme)
  addSlideTitle(doc, slide, theme)
  
  if (slide.layout === "TABULAR_DATA") {
    renderPdfTableGrid(doc, slide, theme, SLIDE_FRAME.bodyY)
  } else {
    renderCenteredPdfBody(doc, slide, theme, SLIDE_FRAME.bodyY)
  }
}

export async function exportSlidesToPDF({ slides, theme, logoBase64, lecturerName }: ExportDeckArgs): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: [10, 5.625],
  })

  slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage([10, 5.625], "landscape")
    }

    try {
      renderPdfPage(doc, slide, theme, lecturerName, logoBase64)
    } catch (error) {
      console.error("Safeguard applied for PDF slide render exception:", error)
      try {
        renderFallbackPdfPage(doc, slide, theme)
      } catch (fallbackError) {
        console.error("Critical fail inside fallback PDF render:", fallbackError)
        // Hard fallback to guarantee downlink never fails
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
        renderFallbackPdfPage(fallbackDoc, slide, args.theme)
      } catch (err) {
        console.error("Critical fail inside fallback PDF render:", err)
        // Hard fallback to guarantee downlink never fails
        fallbackDoc.text(slide.title, 0.7, 1.4)
        fallbackDoc.text(slide.content.join(" "), 0.7, 2.0)
      }
    })

    fallbackDoc.save(`Academic_Lecture_${Date.now()}.pdf`)
  }
}