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
        color: "444444",
        fontSize: 14,
        fontFace: "Arial",
        paraSpaceBefore: 6,
      },
    }
  })
}

function addSlideTitle(doc: any, slide: Slide, theme: Theme) {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(24)
  doc.setTextColor(theme.hexPrimary)
  doc.text(slide.title, SLIDE_FRAME.bodyX, SLIDE_FRAME.titleY + (SLIDE_FRAME.titleH / 2), {
    align: "left",
    baseline: "middle",
  })
}

function addSlideDecoration(doc: any, theme: Theme) {
  doc.setFillColor(theme.hexPrimary)
  doc.rect(SLIDE_FRAME.accentX, SLIDE_FRAME.accentY, SLIDE_FRAME.accentW, SLIDE_FRAME.accentH, "F")
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
      pptxSlide.addText(`Lecturer: ${lecturerName}  |  Academic Lecture Series`, {
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
        const tableRows = slide.content.map((rowText) => [{ text: rowText }])
        pptxSlide.addTable(tableRows, { x: SLIDE_FRAME.bodyX, y: SLIDE_FRAME.bodyY, w: SLIDE_FRAME.bodyW })
      } else {
        const formattedContent = buildFormattedContent(slide, primaryHex)
        pptxSlide.addText(formattedContent, {
          x: SLIDE_FRAME.bodyX,
          y: SLIDE_FRAME.bodyY,
          w: SLIDE_FRAME.bodyW,
          h: SLIDE_FRAME.bodyH,
          align: "left",
          valign: "middle",
          fit: "shrink",
        })
      }
    } catch (error) {
      console.error("Safeguard applied for slide compile exception:", error)
      pptxSlide.addText(slide.content.join(" "), {
        x: SLIDE_FRAME.bodyX,
        y: SLIDE_FRAME.bodyY,
        w: SLIDE_FRAME.bodyW,
        h: SLIDE_FRAME.bodyH,
        fontSize: 12,
        color: "333333",
        valign: "middle",
      })
    }
  })

  await pptx.writeFile({ fileName: `Academic_Lecture_${Date.now()}.pptx` })
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
    doc.text(`Lecturer: ${lecturerName}  |  Academic Lecture Series`, SLIDE_FRAME.bodyX, SLIDE_FRAME.footerY)
  }

  addSlideTitle(doc, slide, theme)

  const bodySegments = buildBodySegments(slide.content)
  const centeredBodyHeight = measurePdfBodyHeight(doc, bodySegments)
  const startY = SLIDE_FRAME.bodyY + Math.max(0, (SLIDE_FRAME.bodyH - centeredBodyHeight) / 2)
  renderCenteredPdfBody(doc, slide, theme, startY)
}

function renderFallbackPdfPage(doc: any, slide: Slide, theme: Theme) {
  doc.setFillColor(theme.hexBg)
  doc.rect(0, 0, 10, 5.625, "F")
  addSlideDecoration(doc, theme)
  addSlideTitle(doc, slide, theme)
  renderCenteredPdfBody(doc, slide, theme, SLIDE_FRAME.bodyY)
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

    renderPdfPage(doc, slide, theme, lecturerName, logoBase64)
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
      renderFallbackPdfPage(fallbackDoc, slide, args.theme)
    })

    fallbackDoc.save(`Academic_Lecture_${Date.now()}.pdf`)
  }
}