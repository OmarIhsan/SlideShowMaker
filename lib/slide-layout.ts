import type { Slide, Theme } from "@/lib/slide-engine"

export const SLIDE_FRAME = {
  titleY: 0.5,
  titleH: 0.8,
  bodyX: 1.2,
  bodyY: 1.4,
  bodyW: 6.8,
  bodyH: 3.2,
  accentX: 0.6,
  accentY: 1.4,
  accentW: 0.08,
  accentH: 3.2,
  footerY: 5.2,
}

export const BODY_LINE_HEIGHT_IN = 0.48
export const BODY_PARAGRAPH_GAP_IN = 0.2
export const BODY_FONT_SIZE = 24

export type BodySegment = {
  text: string
  cleanText: string
  isListItem: boolean
  isOrdered: boolean
  isUnordered: boolean
}

export function buildBodySegments(content: string[]): BodySegment[] {
  return content.map((text) => {
    const isUnordered = text.startsWith("-") || text.startsWith("*") || text.startsWith("•")
    const isOrdered = /^\d+[.)]/.test(text) || /^[a-zA-Z][.)]/.test(text)
    const isListItem = isUnordered || isOrdered

    let cleanText = text
    if (isUnordered) {
      cleanText = text.replace(/^[-*•]\s*/, "").trim()
    } else if (isOrdered) {
      cleanText = text.replace(/^\d+[.)]\s*/, "").replace(/^[a-zA-Z][.)]\s*/, "").trim()
    }

    return { text, cleanText, isListItem, isOrdered, isUnordered }
  })
}

export function measurePdfBodyHeight(doc: any, segments: BodySegment[], theme?: Theme): number {
  doc.setFont("Inter", "bold")
  doc.setFontSize(14)
  const isAvantGarde = theme?.id === "contrast_avant_garde"

  return segments.reduce((height, segment) => {
    const lower = segment.cleanText.toLowerCase()
    const isWarning = ["warning", "caution", "ethics", "fabrication", "fraud", "violation", "critical"].some(w => lower.includes(w))
    
    if (isWarning) {
      const textWidth = isAvantGarde ? 7.6 : 8.4
      const lines = doc.splitTextToSize(segment.cleanText, textWidth - 0.4).length
      return height + (lines * 0.28) + 0.3
    }

    if (segment.isListItem) {
      const lines = doc.splitTextToSize(segment.cleanText, 7.0).length
      return height + (lines * 0.3) + 0.16
    }

    const lines = doc.splitTextToSize(segment.cleanText, 7.6).length
    return height + (lines * 0.3) + 0.12
  }, 0)
}

export function renderCenteredPdfBody(doc: any, slide: Slide, theme: Theme, startY: number) {
  doc.setFont("helvetica", "normal")
  doc.setFontSize(BODY_FONT_SIZE)
  doc.setTextColor("#334155")

  let currentY = startY
  buildBodySegments(slide.content).forEach((segment) => {
    if (segment.isListItem) {
      doc.setFillColor(theme.hexPrimary)
      doc.circle(0.75, currentY - 0.05, 0.03, "F")

      const lines = doc.splitTextToSize(segment.cleanText, 7.8)
      doc.text(lines, 0.9, currentY)
      currentY += (lines.length * BODY_LINE_HEIGHT_IN) + BODY_PARAGRAPH_GAP_IN
      return
    }

    const lines = doc.splitTextToSize(segment.cleanText, 8.2)
    doc.text(lines, 0.7, currentY)
    currentY += (lines.length * BODY_LINE_HEIGHT_IN) + BODY_PARAGRAPH_GAP_IN
  })
}
