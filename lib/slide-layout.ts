import type { Slide, Theme } from "@/lib/slide-engine"

export const SLIDE_FRAME = {
  titleY: 0.5,
  titleH: 0.8,
  bodyX: 0.7,
  bodyY: 1.5,
  bodyW: 8.6,
  bodyH: 3.4,
  accentX: 0.3,
  accentY: 1.5,
  accentW: 0.08,
  accentH: 3.4,
  footerY: 5.2,
}

export const BODY_LINE_HEIGHT_IN = 0.28
export const BODY_PARAGRAPH_GAP_IN = 0.12
export const BODY_FONT_SIZE = 18

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

export function measurePdfBodyHeight(doc: { splitTextToSize: (text: string, size: number) => string[] }, segments: BodySegment[]): number {
  return segments.reduce((height, segment) => {
    const wrapWidth = segment.isListItem ? 7.8 : 8.2
    const lineCount = doc.splitTextToSize(segment.cleanText, wrapWidth).length
    return height + (lineCount * BODY_LINE_HEIGHT_IN) + BODY_PARAGRAPH_GAP_IN
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
