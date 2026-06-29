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

function buildFormattedContent(slide: Slide, primaryHex: string, theme: Theme) {
  const bodySegments = buildBodySegments(slide.content)
  const isAvantGarde = theme.id === "contrast_avant_garde"

  const isWarning = (text: string) => {
    const lower = text.toLowerCase();
    return ["warning", "caution", "ethics", "fabrication", "fraud", "violation", "critical"].some(w => lower.includes(w));
  }

  return bodySegments.map((segment, index) => {
    const warning = isWarning(segment.cleanText)
    const fontSize = theme.bodyFontSizePptx || 34

    // Alternating color: odd segments (0,2,4…) → Deep Enamel; even (1,3,5…) → Ceramic Cobalt
    const textColor = warning ? "1E293B" : (index % 2 === 0 ? "1E293B" : "0F4C81")
    const bulletColor = index % 2 === 0 ? "1E293B" : "0F4C81"

    return {
      text: segment.cleanText + (index < bodySegments.length - 1 ? "\n" : ""),
      options: {
        bullet: warning ? undefined : {
          code: "25A0",   // ■ square glyph — mirrors line text color
          color: bulletColor
        },
        color: textColor,
        fontSize: warning ? fontSize + 2 : fontSize,
        fontFace: "Inter",
        lineSpacing: 28,
        fill: warning ? { color: "C5A059", transparency: 90 } : undefined,
        bold: false,
      },
    }
  })
}

function addSlideTitle(doc: any, slide: Slide, theme: Theme) {
  const titleColorClean = "0F4C81"
  
  if (typeof doc.text === "function") {
    // jsPDF
    doc.setFont("Inter", "bold")
    doc.setFontSize(36)
    doc.setTextColor("#0F4C81")
    doc.text(slide.title, SLIDE_FRAME.bodyX, SLIDE_FRAME.titleY + (SLIDE_FRAME.titleH / 2), {
      align: "left",
      baseline: "middle",
    })
    if (theme.id === "academic_artisan") {
      doc.setDrawColor("#0F4C81")
      doc.setLineWidth(0.01)
      doc.line(SLIDE_FRAME.bodyX, SLIDE_FRAME.titleY + SLIDE_FRAME.titleH, SLIDE_FRAME.bodyX + SLIDE_FRAME.bodyW, SLIDE_FRAME.titleY + SLIDE_FRAME.titleH)
    }
  } else {
    // PptxGenJS
    doc.addText(slide.title, {
      x: 0.7,
      y: 0.5,
      w: 8.6,
      h: 0.8,
      fontSize: theme.titleFontSizePptx || 48,
      bold: true,
      color: titleColorClean,
      fontFace: "Inter",
      valign: "middle",
      align: "left",
      margin: 0,
    })
    
    if (theme.id === "academic_artisan") {
      doc.addShape("line", {
        x: 0.7,
        y: 1.3,
        w: 8.6,
        h: 0,
        line: { color: titleColorClean, width: 1 }
      })
    }
  }
}

// addSlideDecoration: renders the solid 24px Dentin Gold (#C5A059) left anchor column
// that stretches top-to-bottom on every standard (non-title, non-divider) slide.
// Zero floating lines or border images – structural block only.
function addSlideDecoration(doc: any, theme: Theme) {
  // Solid left-edge column: 0.25" wide × full 5.625" height – matches PDF & PPTX anchor
  if (typeof doc.rect === "function") {
    // jsPDF path
    doc.setFillColor("#C5A059")
    doc.rect(0, 0, 0.25, 5.625, "F")
  } else {
    // PptxGenJS path
    doc.addShape("rect", {
      x: 0,
      y: 0,
      w: 0.25,
      h: 5.625,
      fill: { color: "C5A059" },
      line: { color: "C5A059", width: 0 }
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

    if (slide.layout === "CHAPTER_DIVIDER") {
      // === CHAPTER DIVIDER: full-bleed #1E293B canvas ===
      // Text area: left 60% | Solid gold block: right 40% (zero images, zero lines)
      pptxSlide.background = { color: "1E293B" }

      // Right-side solid Dentin Gold anchor block
      pptxSlide.addShape("rect", {
        x: 6.0,
        y: 0,
        w: 4.0,
        h: 5.625,
        fill: { color: "C5A059" },
        line: { color: "C5A059", width: 0 }
      })

      // Chapter title rendered over the dark left panel
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 1.8,
        w: 5.2,
        h: 2.0,
        fontSize: 60,
        bold: true,
        color: "F8F9FA",
        fontFace: "Inter",
        valign: "middle",
        align: "left"
      })
      return
    }

    pptxSlide.background = { color: bgHex }

    // Add gold anchor column to ALL slides (including slide 1)
    addSlideDecoration(pptxSlide, theme)

    if (lecturerName) {
      const isAvantGarde = theme.id === "contrast_avant_garde"
      pptxSlide.addText(`Lecturer: ${lecturerName}`, {
        x: isAvantGarde ? 1.4 : SLIDE_FRAME.bodyX,
        y: SLIDE_FRAME.footerY,
        w: isAvantGarde ? 7.6 : SLIDE_FRAME.bodyW,
        h: 0.3,
        fontSize: theme.captionFontSizePptx || 26,
        color: "777777",
        fontFace: "Inter",
        italic: true,
      })
    }

    // No slide title rendered on any slide — uniform titleless layout.
    // Content is rendered through the standard body text box for all slides.

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
          x: theme.id === "contrast_avant_garde" ? 1.4 : 0.7,
          y: 1.6,
          w: theme.id === "contrast_avant_garde" ? 7.6 : 8.6,
          border: { type: "solid", color: "E2E8F0", width: 1 },
        })
      } else {
        // Standard content body — applies to ALL slides including Slide 1
        const formattedContent = buildFormattedContent(slide, primaryHex, theme)

        // === PPTX BOUNDING FRAME (§5): x:1.2, y:1.5, w:7.6, h:3.4
        // valign:middle, zero title header rendered above
        pptxSlide.addText(formattedContent, {
          x: 1.2,
          y: 1.5,
          w: 7.6,
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
        x: theme.id === "contrast_avant_garde" ? 1.4 : 0.7,
        y: 1.5,
        w: theme.id === "contrast_avant_garde" ? 7.6 : 8.6,
        h: 3.4,
        fontSize: theme.bodyFontSizePptx || 30,
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
  const isAvantGarde = theme.id === "contrast_avant_garde"
  const tableX = isAvantGarde ? 1.4 : SLIDE_FRAME.bodyX
  const tableW = customWidth || (isAvantGarde ? 7.6 : SLIDE_FRAME.bodyW)
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

function renderPdfPage(doc: any, slide: Slide, theme: Theme, lecturerName: string, logoBase64: string | null) {
  if (slide.layout === "CHAPTER_DIVIDER") {
    // === CHAPTER DIVIDER (PDF) ===
    // Full-bleed deep navy canvas + solid Dentin Gold right-side block.
    // Zero floating lines, zero background images.
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

  // Gold anchor column on ALL slides (including Slide 1) — uniform titleless layout
  addSlideDecoration(doc, theme)
  // No title is rendered on any slide.

  if (lecturerName) {
    const isAvantGarde = theme.id === "contrast_avant_garde"
    doc.setFont("Inter", "italic")
    doc.setFontSize(22)
    doc.setTextColor("#777777")
    doc.text(`Lecturer: ${lecturerName}`, isAvantGarde ? 1.4 : SLIDE_FRAME.bodyX, SLIDE_FRAME.footerY)
  }

  if (slide.layout === "TABULAR_DATA") {
    const isAvantGarde = theme.id === "contrast_avant_garde"
    const rows = slide.content.map((rowText) => {
      return rowText
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim())
    })
    const numCols = Math.max(...rows.map((r) => r.length))
    const colW = (isAvantGarde ? 7.6 : SLIDE_FRAME.bodyW) / numCols
    const totalTableH = measurePdfTableHeight(doc, rows, colW)
    const startY = Math.max(1.5, (5.625 - totalTableH) / 2)
    renderPdfTableGrid(doc, slide, theme, startY)
  } else {
    // Standard body renderer — ALL slides including Slide 1
    const bodySegments = buildBodySegments(slide.content)
    const centeredBodyHeight = measurePdfBodyHeight(doc, bodySegments, theme)
    const startY = Math.max(0.5, (5.625 - centeredBodyHeight) / 2)
    
    let currentY = startY
    bodySegments.forEach((segment, segmentIndex) => {
      const lower = segment.cleanText.toLowerCase()
      const isWarning = ["warning", "caution", "ethics", "fabrication", "fraud", "violation", "critical"].some(w => lower.includes(w))

      if (isWarning) {
        const lines = doc.splitTextToSize(segment.cleanText, 8.4 - 0.4)
        doc.setFillColor(248, 245, 237)
        doc.rect(0.8, currentY - 0.2, 8.4, (lines.length * 0.28) + 0.2, "F")
        doc.setDrawColor("#C5A059")
        doc.setLineWidth(0.04)
        doc.line(0.8, currentY - 0.2, 0.8, currentY - 0.2 + (lines.length * 0.28) + 0.2)
        doc.setFont("Inter", "bold")
        doc.setTextColor("#1E293B")
        doc.text(lines, 1.0, currentY)
        currentY += (lines.length * 0.28) + 0.3
        doc.setFont("Inter", "normal")
        return
      }

      // Alternating color: odd segments (0,2,4…) → Deep Enamel; even (1,3,5…) → Ceramic Cobalt
      const lineColor = segmentIndex % 2 === 0 ? "#1E293B" : "#0F4C81"
      doc.setFont("Inter", "normal")
      doc.setFontSize(26)
      doc.setTextColor(lineColor)

      if (segment.isListItem) {
        // Square bullet — color mirrors line text color
        doc.setFillColor(lineColor)
        doc.rect(0.85, currentY - 0.09, 0.07, 0.07, "F")
        const lines = doc.splitTextToSize(segment.cleanText, 7.8)
        doc.text(lines, 1.02, currentY)
        currentY += (lines.length * 0.3) + 0.16
        return
      }

      // Non-list paragraph
      const lines = doc.splitTextToSize(segment.cleanText, 8.4)
      doc.text(lines, 0.8, currentY)
      currentY += (lines.length * 0.3) + 0.12
    })
  }
}

function renderFallbackPdfPage(doc: any, slide: Slide, theme: Theme) {
  renderPdfPage(doc, slide, theme, "", null)
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
        fallbackDoc.text(slide.title, 0.7, 1.4)
        fallbackDoc.text(slide.content.join(" "), 0.7, 2.0)
      }
    })

    fallbackDoc.save(`Academic_Lecture_${Date.now()}.pdf`)
  }
}