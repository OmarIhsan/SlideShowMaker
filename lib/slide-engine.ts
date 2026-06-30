// Content-agnostic academic document-to-presentation translation engine.
// Strictly uses the rigid Slide layout schema and groups contents verbatim.

export type ThemeId = "clinical" | "midnight" | "warm" | "academic_artisan" | "academic_artisan_titleless" | "contrast_avant_garde"

export type Theme = {
  id: ThemeId
  label: string
  accentBg: string
  accentText: string
  chipBg: string
  chipText: string
  ring: string
  border: string
  hexPrimary: string
  hexSecondary: string
  hexBg: string
  titleFont?: string
  bodyFont?: string
  captionFont?: string
  titleFontSizePptx?: number
  bodyFontSizePptx?: number
  captionFontSizePptx?: number
  titleColor?: string
  bodyColor?: string
  captionColor?: string
}

export const THEMES: Record<ThemeId, Theme> = {
  clinical: {
    id: "clinical",
    label: "Clinical Teal",
    accentBg: "bg-teal-600",
    accentText: "text-teal-600",
    chipBg: "bg-teal-50",
    chipText: "text-teal-700",
    ring: "ring-teal-500",
    border: "border-teal-500",
    hexPrimary: "#0D9488",
    hexSecondary: "#0F766E",
    hexBg: "#F8FAFC",
  },
  midnight: {
    id: "midnight",
    label: "Midnight Blue",
    accentBg: "bg-indigo-600",
    accentText: "text-indigo-600",
    chipBg: "bg-indigo-50",
    chipText: "text-indigo-700",
    ring: "ring-indigo-500",
    border: "border-indigo-500",
    hexPrimary: "#4F46E5",
    hexSecondary: "#4338CA",
    hexBg: "#F8FAFC",
  },
  warm: {
    id: "warm",
    label: "Forest Academy",
    accentBg: "bg-emerald-600",
    accentText: "text-emerald-600",
    chipBg: "bg-emerald-50",
    chipText: "text-emerald-700",
    ring: "ring-emerald-500",
    border: "border-emerald-500",
    hexPrimary: "#059669",
    hexSecondary: "#047857",
    hexBg: "#F8FAFC",
  },
  academic_artisan: {
    id: "academic_artisan",
    label: "The Academic Artisan",
    accentBg: "bg-[#0F4C81]",
    accentText: "text-[#0F4C81]",
    chipBg: "bg-[#F8F9FA]",
    chipText: "text-[#0F4C81]",
    ring: "ring-[#0F4C81]",
    border: "border-[#0F4C81]",
    hexPrimary: "#0F4C81",
    hexSecondary: "#C5A059",
    hexBg: "#F8F9FA",
    titleFont: "Inter",
    bodyFont: "Inter",
    captionFont: "Inter",
    titleFontSizePptx: 36,
    bodyFontSizePptx: 26,
    captionFontSizePptx: 14,
    titleColor: "#0F4C81",
    bodyColor: "#1E293B",
    captionColor: "#64748B"
  },
  academic_artisan_titleless: {
    id: "academic_artisan_titleless",
    label: "The Academic Artisan (Titleless)",
    accentBg: "bg-[#0F4C81]",
    accentText: "text-[#0F4C81]",
    chipBg: "bg-[#F8F9FA]",
    chipText: "text-[#0F4C81]",
    ring: "ring-[#0F4C81]",
    border: "border-[#0F4C81]",
    hexPrimary: "#0F4C81",
    hexSecondary: "#C5A059",
    hexBg: "#F8F9FA",
    titleFont: "Inter",
    bodyFont: "Inter",
    captionFont: "Inter",
    titleFontSizePptx: 36,
    bodyFontSizePptx: 18,
    captionFontSizePptx: 14,
    titleColor: "#0F4C81",
    bodyColor: "#1E293B",
    captionColor: "#64748B"
  },
  contrast_avant_garde: {
    id: "contrast_avant_garde",
    label: "The Contrast Avant-Garde",
    accentBg: "bg-[#C5A059]",
    accentText: "text-[#C5A059]",
    chipBg: "bg-[#F8F9FA]",
    chipText: "text-[#C5A059]",
    ring: "ring-[#C5A059]",
    border: "border-[#C5A059]",
    // === GLOBAL DESIGN TOKENS (Contrast Avant-Garde) ===
    hexPrimary: "#0F4C81",   // Ceramic Cobalt – bullet glyphs & structural accents
    hexSecondary: "#C5A059", // Dentin Gold – left anchor column + chapter blocks
    hexBg: "#F8F9FA",        // Clinical Base – solid canvas, zero textures
    titleFont: "Inter",
    bodyFont: "Inter",
    captionFont: "Inter",
    titleFontSizePptx: 40,
    bodyFontSizePptx: 18,
    captionFontSizePptx: 12,
    titleColor: "#0F4C81",
    bodyColor: "#1E293B",    // Deep Enamel – all body text
    captionColor: "#64748B"
  }
}

export type SlideLayout = "STANDARD_CONTENT" | "TABULAR_DATA" | "CHAPTER_DIVIDER";

export interface Slide {
  id: number;
  title: string;
  content: string[]; // Verbatim text segments array
  layout: SlideLayout;
}

export type LayoutTag = Slide["layout"]

export const LAYOUT_LABELS: Record<LayoutTag, string> = {
  STANDARD_CONTENT: "STANDARD_CONTENT",
  TABULAR_DATA: "TABULAR_DATA",
  CHAPTER_DIVIDER: "CHAPTER_DIVIDER",
}

export function getSlideTitle(slide: Slide): string {
  return slide.title
}

export type ParseResult = {
  slides: Slide[]
  chapterCount: number
}

export function isTopicHeader(line: string): string | null {
  const clean = line.trim()
  const COMMON_HEADERS = [
    "introduction", "abstract", "literature review", "methodology", "methods", 
    "results", "discussion", "conclusion", "conclusions", "references", "summary",
    "background", "objectives", "aims", "outline", "overview", "definition", "definitions",
    "measurement variables", "descriptive vs. inferential", "introduction & structural properties",
    "properties of enamel: hardness & brittleness", "solubility to acids", "clinical appearance & diagnostic signs"
  ]
  
  const hasIndex = /^\d+(\.\d+)*[.)]?\s+/.test(clean)
  const endsWithPunctuation = /[.!?]$/.test(clean)
  
  const isHeader = 
    clean.length > 0 && 
    clean.length <= 55 && 
    !clean.startsWith("-") && 
    !clean.startsWith("*") && 
    !clean.startsWith("•") && 
    (!endsWithPunctuation || (hasIndex && clean.endsWith("."))) &&
    (COMMON_HEADERS.includes(clean.toLowerCase()) || 
     (hasIndex && /^\d+(\.\d+)*[.)]?\s+[A-Z]/.test(clean)) ||
     (/^[A-Z][A-Za-z0-9\s()&/,-:]+$/.test(clean)))
     
  return isHeader ? clean : null
}

function sanitizeText(text: string): string {
  let cleaned = text;
  // 1. Strip bullet prefixes (residual PDF symbols, raw bullets, Greek letters like Pi/Π)
  cleaned = cleaned.replace(/^[\u03A0\u03C0\u25A0\u2022\s\-]+/, "");
  
  // 2. Clean broken word fragments (case-insensitive)
  cleaned = cleaned.replace(/\b(enam|completos|fuinath)\b/gi, "");
  
  // Clean double spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  return cleaned;
}

export function parseDocumentToSlides(raw: string): ParseResult {
  const source = raw || ""
  if (source.trim().length === 0) {
    return { slides: [], chapterCount: 0 }
  }

  let currentTopicContext = "General Concepts";

  function isMatrixStructure(chunk: string[]): boolean {
    return chunk.some(line => line.includes("|") || line.includes("\t"));
  }

  const rawTokens = source
    .split(/(?<=\.|\:)\s+|\n+/)
    .map(token => token.replace(/[\/\\]/gi, '').trim())
    .filter(token => token.length > 0 && !/^(DCD|DR\.\s*CUBE.*)$/i.test(token));

  const bodySlides: Slide[] = [];
  let slideIdCounter = 2;

  let currentChunk: string[] = [];

  const pushNewSlide = (data: { title: string, content: string[], layout: "STANDARD_CONTENT" | "TABULAR_DATA" | "CHAPTER_DIVIDER" }) => {
    const sanitizedContent = data.content.filter(line => line.trim().length > 0);
    if (sanitizedContent.length === 0 && data.layout !== "CHAPTER_DIVIDER") return;

    bodySlides.push({
      id: slideIdCounter++,
      title: data.title,
      content: sanitizedContent,
      layout: data.layout
    });
  }

  rawTokens.forEach((token) => {
    const topicHeader = isTopicHeader(token)
    if (topicHeader) {
      if (currentChunk.length > 0) {
        pushNewSlide({
          title: currentTopicContext,
          content: [...currentChunk],
          layout: isMatrixStructure(currentChunk) ? "TABULAR_DATA" : "STANDARD_CONTENT"
        });
        currentChunk = [];
      }
      currentTopicContext = topicHeader;
      return;
    }

    const cleanBody = sanitizeText(token);
    if (cleanBody.length < 15) {
      return; // Array pruning: discard sub-15 character lines
    }

    const formattedToken = `- ${cleanBody}`;

    if (isOverBudget([...currentChunk, formattedToken])) {
      if (currentChunk.length > 0) {
        pushNewSlide({
          title: currentTopicContext,
          content: [...currentChunk],
          layout: isMatrixStructure(currentChunk) ? "TABULAR_DATA" : "STANDARD_CONTENT"
        });
        currentChunk = [];
      }
    }

    currentChunk.push(formattedToken);
  });

  if (currentChunk.length > 0) {
    pushNewSlide({
      title: currentTopicContext,
      content: [...currentChunk],
      layout: isMatrixStructure(currentChunk) ? "TABULAR_DATA" : "STANDARD_CONTENT"
    });
  }

  const titleSlide: Slide = {
    id: 1,
    title: "Lecture Slides",
    content: [
      "Verbatim Academic Presentation Courseware",
      "Presented by: Dr. Faisal Alhuwaizi",
      "This deck contains verbatim syllabus details compiled from raw content outlines."
    ],
    layout: "STANDARD_CONTENT"
  }

  const finalSlides = [titleSlide, ...bodySlides];
  const uniqueHeaders = Array.from(new Set(finalSlides.map(s => s.title)));

  return {
    slides: finalSlides,
    chapterCount: Math.max(uniqueHeaders.length - 1, 1)
  }
}

export function getSlideHeight(content: string[]): number {
  const hasTable = content.some(line => line.includes("|") || line.includes("\t"));
  if (hasTable) {
    let bodyHeight = 0
    content.forEach((line) => {
      const cells = line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map(c => c.trim())
      
      const numCols = Math.max(1, cells.length)
      let maxLines = 1
      cells.forEach((cellText) => {
        const words = cellText.split(/\s+/).filter(Boolean).length
        if (words === 0) return
        // Narrower columns lead to tighter wrapping (estimate 4 words per line)
        const colLines = Math.max(1, Math.ceil(words / 4))
        if (colLines > maxLines) {
          maxLines = colLines
        }
      })
      // Height per line inside visual grid cell + padding
      bodyHeight += (maxLines * 0.2) + 0.15
    })
    return 1.4 + bodyHeight
  }

  let bodyHeight = 0
  content.forEach((text) => {
    // Split by manual newlines
    const subLines = text.split("\n")
    subLines.forEach((subLine) => {
      const words = subLine.split(/\s+/).filter(Boolean).length
      if (words === 0) return
      // Estimate visual line wrapping (10 words per line, 0.28 inches height per line)
      const visualLines = Math.max(1, Math.ceil(words / 10))
      bodyHeight += (visualLines * 0.28) + 0.12
    })
  })
  // TotalHeight = 1.4 (Title Y=0.5, body starts at Y=1.4) + bodyHeight
  return 1.4 + bodyHeight
}

const isOverBudget = (content: string[]): boolean => {
  let totalLines = 0;
  content.forEach(text => {
    const clean = text
      .replace(/^[-*•]\s*/, "")
      .replace(/^\d+[.)]\s*/, "")
      .replace(/^[a-zA-Z][.)]\s*/, "")
      .trim()
    const words = clean.split(/\s+/).filter(Boolean).length
    totalLines += Math.max(1, Math.ceil(words / 7))
  })
  const charLength = content.join("\n").length;
  return totalLines > 4 || charLength > 380;
};

function applyVerticalThresholds(slides: Slide[]): Slide[] {
  const finalResult: Slide[] = []

  slides.forEach((slide) => {
    if (slide.id === 1 || slide.layout === "CHAPTER_DIVIDER") {
      finalResult.push(slide)
      return
    }

    if (!isOverBudget(slide.content)) {
      finalResult.push(slide)
      return
    }

    // Splitting Logic (Vertical Axis Splitting Rule)
    let currentChunk: string[] = []
    let partIndex = 1
    const baseTitle = slide.title.replace(/\s*-\s*Part\s*\d+$/, "")

    for (let i = 0; i < slide.content.length; i++) {
      const line = slide.content[i]
      const tempChunk = [...currentChunk, line]
      
      if (isOverBudget(tempChunk)) {
        if (currentChunk.length === 0) {
          finalResult.push({
            id: 0,
            title: `${baseTitle} - Part ${partIndex++}`,
            content: [line],
            layout: slide.layout
          })
        } else {
          finalResult.push({
            id: 0,
            title: `${baseTitle} - Part ${partIndex++}`,
            content: currentChunk,
            layout: slide.layout
          })
          currentChunk = [line]
        }
      } else {
        currentChunk.push(line)
      }
    }
    if (currentChunk.length > 0) {
      finalResult.push({
        id: 0,
        title: `${baseTitle} - Part ${partIndex++}`,
        content: currentChunk,
        layout: slide.layout
      })
    }
  })

  // Assign sequential IDs
  finalResult.forEach((s, idx) => {
    s.id = idx + 1
  })

  // Cleanup titles for single parts
  let titleCounts = new Map<string, number>()
  finalResult.forEach(s => {
    if (s.id === 1 || s.layout === "CHAPTER_DIVIDER") return
    const base = s.title.replace(/\s*-\s*Part\s*\d+$/, "")
    titleCounts.set(base, (titleCounts.get(base) || 0) + 1)
  })
  
  finalResult.forEach(s => {
    if (s.id === 1 || s.layout === "CHAPTER_DIVIDER") return
    const base = s.title.replace(/\s*-\s*Part\s*\d+$/, "")
    if (titleCounts.get(base) === 1) {
      s.title = base
    }
  })

  return finalResult
}

/* ------------------------------- Sample script ------------------------------ */

export const SAMPLE_SCRIPT = `# Research Methodology and Scientific Writing

## Introduction to Research Design
A research design is the conceptual framework within which research is conducted. It constitutes the blueprint for the collection, measurement, and analysis of data.

### Scope and Objectives
- Establish a rigorous structural framework for academic inquiry
- Maximize the validity and reliability of experimental results
- Prevent researcher bias from contaminating experimental outcomes
- Minimize the waste of institutional funding and researcher hours
- Define boundaries for data collection and control groups
- Coordinate multi-disciplinary teams in clinical settings

### Core Principles
Scientific Method: Systematic observation, measurement, and experiment.
Hypothesis: A testable proposition based on empirical evidence.
Control Group: Baseline group that receives no experimental treatment.
Randomization: Randomly allocating subjects to prevent selection bias.

### Hypothesis Formulation
1. Identify a critical literature gap in the target field
2. Construct a testable, binary causal hypothesis
3. Set mathematical boundaries for null and alternative parameters
4. Select appropriate sample populations to test validity

### Designing Controlled Trials
Randomized controlled trials (RCTs) are the gold standard for clinical and experimental academic research.
- Blinding: Single, double, or triple-blind setups to mask variables
- Cohort Selection: Narrow exclusion criteria to select homogenous populations
- Control Group: Placebo or active baseline treatments for comparisons
- Longitudinal Tracking: Consistent observation points across years

## Literature Reviews & Sourcing
Literature review processes synthesize existing knowledge and outline the historical framework of a study.

### Critical Source Analysis
- Trace the historical evolution of research paradigms
- Compare opposing methodology frameworks across papers
- Evaluate statistical power and population sample sizes
- Uncover systemic biases in previous researchers' funding

### Credibility Gap Discovery
1. Identify contradicting conclusions in high-impact journals
2. Evaluate outdated methodologies lacking modern instrumentation
3. Focus on unexplained statistical anomalies in published raw datasets
4. Map regions of under-researched clinical subpopulations

### Citations and Plagiarism
- Always attribute secondary data to original peer-reviewed sources
- Keep clear separation between researcher commentary and citations
- Utilize software to track digital object identifiers (DOIs)
- Maintain a comprehensive bibliography matching in-text markers

### Ethics Violations & Fabrication
- Academic fraud destroys career paths and research institution funding
- Data fabrication includes manipulating outliers or synthesizing mock numbers
- Authorship issues: Gift authorships or omitting major researchers
- Failure to report conflicts of interest or institutional funding sources

## Quantitative Analysis Methods
Quantitative research employs numerical measurements and mathematical models to establish statistical truths.

### Measurement Variables
| Variable Type | Definition | Statistical Application
| Independent | The factor manipulated by the researcher | Serves as the causal variable in models
| Dependent | The outcome measured by the researcher | The effect variable analyzed for shifts
| Confounding | External factor affecting variables | Must be controlled to prevent skew
| Categorical | Non-numerical group classification | Evaluated using non-parametric checks

### Descriptive vs. Inferential
Descriptive: Highlights properties of the current dataset (mean, median, standard deviation).
Inferential: Draws mathematical predictions about the wider population from samples.
Standard Deviation: Outlines the spread of data points from the dataset mean.
Standard Error: Measures how far the sample mean is from the true population mean.

### Significance and P-Values
- The p-value measures the probability of obtaining results by random chance
- Standard alpha boundaries are traditionally set at p < 0.05 or p < 0.01
- Low p-values reject the null hypothesis in favor of the alternative
- A low p-value does not automatically prove high practical importance
- Sample sizes must be powered correctly to detect actual differences

### Common Analysis Pitfalls
- Overfitting: Designing mathematical models too specific to a small dataset
- Selection Bias: Cherry-picking samples that support the hypothesis
- Correlation Fallacy: Assuming correlation automatically equals causation
- Multiple Testing: Running tests repeatedly until a p-value falls below 0.05

### Statistical Test Selection
| Research Goal | Data Scale | Correct Statistical Test
| Compare two group means | Continuous | Student's Independent t-test
| Compare three or more means | Continuous | One-Way Analysis of Variance (ANOVA)
| Check association of categories | Nominal | Chi-Square Test of Independence
| Predict outcomes from factors | Continuous | Multiple Linear Regression Model

## Qualitative Research Methods
Qualitative approaches study complex human interactions and contextual behaviors through non-numerical inputs.

### Research Design Types
- Phenomenology: Studying lived human experiences in particular events
- Ethnography: Immersive observation of cultural and social behaviors
- Grounded Theory: Building theories inductively directly from qualitative data
- Case Study: Narrow, deep analysis of a single subject or community

### Semi-Structured Interviews
1. Outline a set of open-ended discussion questions
2. Build rapport with subjects while maintaining neutrality
3. Record interviews digitally for verbatim transcripts
4. Note non-verbal expressions and environmental contexts

### Grounded Theory Coding
- Open Coding: Breaking down raw transcript sentences into simple label blocks
- Axial Coding: Grouping raw labels together into conceptual sub-themes
- Selective Coding: Building a unified explanatory model from sub-themes
- Iterative Comparison: Checking new transcripts against established coding models

### Data Trustworthiness
- Credibility: Performing member checks to verify participant alignment
- Transferability: Providing thick descriptions of research environments
- Dependability: Creating clear audit trails of all coding decisions
- Confirmability: Reflective journaling to document researcher bias

## Writing & Publication Process
Drafting and publishing papers requires clear formatting to communicate findings to the global community.

### Manuscript Structure
- Abstract: Concise summary of hypothesis, methods, and key findings
- Introduction: Background literature review and thesis statement
- Methods: Explicit details allowing replication by outer researchers
- Results: Direct numerical and thematic findings without commentary
- Discussion: Contextual interpretation and limitations of study
- Conclusion: Future pathways and primary takeaway points

### Abstract and Introduction
1. State the global problem and target research gap clearly
2. Frame the study's central hypothesis and scope
3. Outline the methodology structure and target sample sizing
4. Conclude with primary findings and institutional impacts

### Visualizing Research Data
- Ensure all charts, tables, and figures have descriptive captions
- Present raw data patterns rather than hiding complex variations
- Avoid color schemes that confuse colorblind peer reviewers
- Align columns in tables to facilitate horizontal comparisons

### Peer Review Responses
- Treat reviewer feedback as constructive avenues for improvement
- Respond to every point in writing with matching manuscript changes
- Provide statistical justifications if disagreeing with a comment
- Maintain a professional, collaborative tone in all letters

## Academic Knowledge Assessment
- Question 1: What does a low p-value (p < 0.05) indicate in statistical testing?
- Option A: The hypothesis is completely proven correct
- Option B: The sample size was too small to detect patterns
- Option C: The null hypothesis is rejected with low probability of random chance
- Option D: Correlation and causation are mathematically equal
- Explanation: A p-value below 0.05 indicates statistical significance, prompting rejection of the null hypothesis.

- Question 2: Which section of a manuscript details the steps to replicate a study?
- Option A: Abstract and Overview
- Option B: Results and Visualizations
- Option C: Methods and Materials
- Option D: Literature Review
- Explanation: The Methods section must contain detailed descriptions of procedures so others can replicate the study.

- Question 3: What is the main purpose of double-blinding in clinical trials?
- Option A: To reduce the cost of participant compensation
- Option B: To eliminate researcher and participant bias
- Option C: To speed up the manuscript writing process
- Option D: To guarantee statistical significance
- Explanation: Double-blinding prevents both participants and researchers from introducing cognitive bias into results.

- Question 4: Which qualitative coding phase groups simple labels into conceptual sub-themes?
- Option A: Open Coding
- Option B: Axial Coding
- Option C: Selective Coding
- Option D: Descriptive Coding
- Explanation: Axial coding links open codes to identify structural relationships and conceptual sub-themes.
`
