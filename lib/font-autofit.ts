export interface FontScale {
  sizeWeb: string;
  sizePptx: number;
  lineHeightMultiplier: number;
  lineSpacingPptx: number;
}

export function getFontScaleForSlide(content: string[]): FontScale {
  const cleanContent = content.filter(line => line.trim().length > 0);
  const lineCount = cleanContent.length;
  const characterCount = cleanContent.join("\n").length;

  if (characterCount <= 250 && lineCount <= 2) {
    return {
      sizeWeb: "text-2xl md:text-3xl font-medium",
      sizePptx: 26,
      lineHeightMultiplier: 1.4,
      lineSpacingPptx: 36,
    };
  }

  if (characterCount <= 450 && lineCount <= 4) {
    return {
      sizeWeb: "text-xl md:text-2xl font-medium",
      sizePptx: 22,
      lineHeightMultiplier: 1.35,
      lineSpacingPptx: 30,
    };
  }

  return {
    sizeWeb: "text-lg md:text-xl font-medium",
    sizePptx: 18,
    lineHeightMultiplier: 1.3,
    lineSpacingPptx: 24,
  };
}
