// Content-agnostic academic document-to-presentation translation engine.
// Splits script content into 30+ highly structured academic slides.

export type ThemeId = "clinical" | "midnight" | "warm"

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
}

export type Callout = { term: string; def: string }
export type ProcessStep = { step: number; title: string; detail: string }
export type GridItem = { title: string; detail: string }
export type QuizOption = { text: string }

export type Slide =
  | { id: string; layout: "title"; kicker: string; title: string; subtitle: string }
  | { id: string; layout: "toc"; title: string; items: { n: number; label: string; target: number }[] }
  | { id: string; layout: "chapter"; title: string; kicker: string; index: number; subtitle?: string }
  | { id: string; layout: "content"; title: string; paragraphs: string[]; bullets: string[] }
  | { id: string; layout: "split"; title: string; bullets: string[]; callouts: Callout[] }
  | { id: string; layout: "process"; title: string; intro: string; steps: ProcessStep[] }
  | { id: string; layout: "grid"; title: string; intro: string; items: GridItem[] }
  | { id: string; layout: "table"; title: string; intro: string; columns: string[]; rows: string[][] }
  | {
      id: string
      layout: "warning"
      title: string
      level: "warning" | "danger"
      points: string[]
      note: string
    }
  | {
      id: string
      layout: "quiz"
      title: string
      question: string
      options: QuizOption[]
      correctIndex: number
      explanation: string
    }

export type LayoutTag = Slide["layout"]

export const LAYOUT_LABELS: Record<LayoutTag, string> = {
  title: "Title Slide",
  toc: "Table of Contents",
  chapter: "Chapter Divider",
  content: "Reading & Bullet Points",
  split: "Two-Column Matrix",
  process: "Horizontal Process",
  grid: "Data Comparison Grid",
  table: "Tabular Layout",
  warning: "Clinical Warning",
  quiz: "Interactive Assessment",
}

export function getSlideTitle(slide: Slide): string {
  return slide.title
}

/* ----------------------------- Parsing helpers ----------------------------- */

const H1 = /^#\s+(.*)$/
const H2 = /^##\s+(.*)$/
const H3 = /^###\s+(.*)$/
const BULLET = /^[-*•]\s+(.*)$/
const NUMBERED = /^\d+[.)]\s+(.*)$/

type Sub = { title: string; lines: string[] }
type Chapter = { title: string; intro: string[]; subs: Sub[] }

function isWarningTitle(t: string): boolean {
  return /\b(warning|caution|precaution|contraindicat|danger|alert|risk|avoid|safety|ethics?|violations?)\b/i.test(t)
}

function isQuizTitle(t: string): boolean {
  return /\b(assessment|quiz|evaluation|knowledge check|questions?|self-assessment)\b/i.test(t)
}

function isDangerTitle(t: string): boolean {
  return /\b(contraindicat|danger|critical|fatal|severe|plagiarism|fabrication)\b/i.test(t)
}

function splitSentences(lines: string[]): string[] {
  return lines
    .join(" ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function asPair(line: string): Callout | null {
  const idx = line.indexOf(":")
  if (idx < 1) return null
  const term = line.slice(0, idx).trim()
  const def = line.slice(idx + 1).trim()
  if (!term || !def) return null
  if (term.split(/\s+/).length > 4 || term.length > 32) return null
  return { term, def }
}

/* ------------------------------ Document parse ------------------------------ */

function tokenize(raw: string): { docTitle: string; chapters: Chapter[] } {
  const lines = raw.replace(/\r\n/g, "\n").split("\n")
  let docTitle = ""
  const chapters: Chapter[] = []
  let chapter: Chapter | null = null
  let sub: Sub | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const h1 = line.match(H1)
    const h2 = line.match(H2)
    const h3 = line.match(H3)

    if (h3) {
      if (!chapter) {
        chapter = { title: "Overview", intro: [], subs: [] }
        chapters.push(chapter)
      }
      sub = { title: h3[1].trim(), lines: [] }
      chapter.subs.push(sub)
    } else if (h2) {
      chapter = { title: h2[1].trim(), intro: [], subs: [] }
      chapters.push(chapter)
      sub = null
    } else if (h1) {
      if (!docTitle) docTitle = h1[1].trim()
    } else {
      if (sub) sub.lines.push(line)
      else if (chapter) chapter.intro.push(line)
      else if (!docTitle) docTitle = line
    }
  }

  // Fallback: no markdown structure -> synthesize chapters from paragraph groups.
  if (chapters.length === 0) {
    const paras = raw
      .replace(/\r\n/g, "\n")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
    if (!docTitle && paras.length) docTitle = paras[0].split(/[.!?]/)[0].slice(0, 60)
    const groups: string[][] = []
    for (let i = 0; i < paras.length; i += 2) groups.push(paras.slice(i, i + 2))
    groups.forEach((g, i) => {
      chapters.push({
        title: `Section ${i + 1}`,
        intro: g,
        subs: [],
      })
    })
  }

  if (!docTitle) docTitle = "Academic Lecture Series"
  return { docTitle, chapters }
}

/* --------------------------- Block classification --------------------------- */

let counter = 0
const nextId = (p: string) => `${p}-${counter++}`

function classifyBlock(title: string, lines: string[]): Slide | Slide[] | null {
  if (lines.length === 0 && !title) return null

  // Table structures
  const tableHeader = lines.find((l) => l.startsWith("|"))
  if (tableHeader) {
    const columns = tableHeader
      .replace(/^\|/, "")
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean)
    const rows = lines
      .filter((l) => l !== tableHeader && l.includes("|") && !l.includes("---"))
      .map((l) =>
        l
          .replace(/^\|/, "")
          .split("|")
          .map((c) => c.trim())
          .filter((_, i) => i < columns.length)
      )
    return { id: nextId("tbl"), layout: "table", title, intro: "", columns, rows }
  }

  // Warning structures
  if (isWarningTitle(title)) {
    const bullets = lines.map((l) => l.match(BULLET)?.[1]).filter(Boolean) as string[]
    const points = bullets.length ? bullets : splitSentences(lines)
    return {
      id: nextId("warn"),
      layout: "warning",
      title,
      level: isDangerTitle(title) ? "danger" : "warning",
      points,
      note: "Ethics guidelines must be strictly adhered to in academic publication.",
    }
  }

  // Numbered list -> horizontal process steps
  const numbered = lines.map((l) => l.match(NUMBERED)?.[1]).filter(Boolean) as string[]
  if (numbered.length >= 2) {
    const steps: ProcessStep[] = numbered.slice(0, 5).map((n, i) => {
      const idx = n.indexOf(":")
      const hasTitle = idx > 0 && idx < 28
      return {
        step: i + 1,
        title: hasTitle ? n.slice(0, idx).trim() : `Phase ${i + 1}`,
        detail: hasTitle ? n.slice(idx + 1).trim() : n,
      }
    })
    return { id: nextId("proc"), layout: "process", title, intro: "", steps }
  }

  // Bullet and term/definition parsing
  const bullets = lines.map((l) => l.match(BULLET)?.[1]).filter(Boolean) as string[]
  const nonBullet = lines.filter((l) => !BULLET.test(l))
  const pairs = nonBullet.map(asPair).filter(Boolean) as Callout[]
  const paragraphs = nonBullet.filter((l) => !asPair(l))

  // If a slide has too many bullet points, split them to avoid clutter!
  if (bullets.length > 4) {
    const slideChunks: Slide[] = []
    const chunkSize = 3
    for (let i = 0; i < bullets.length; i += chunkSize) {
      const chunk = bullets.slice(i, i + chunkSize)
      const part = Math.floor(i / chunkSize) + 1
      const totalParts = Math.ceil(bullets.length / chunkSize)
      slideChunks.push({
        id: nextId("cnt-chunk"),
        layout: "content",
        title: `${title} (Part ${part}/${totalParts})`,
        paragraphs: i === 0 ? paragraphs : [],
        bullets: chunk,
      })
    }
    return slideChunks
  }

  // Split view (bullets on left, callouts/definitions on right)
  if (paragraphs.length >= 1 && pairs.length >= 2) {
    return {
      id: nextId("split"),
      layout: "split",
      title,
      bullets: paragraphs.length ? splitSentences(paragraphs).slice(0, 5) : bullets,
      callouts: pairs.slice(0, 4),
    }
  }

  // Data Comparison Grid
  if (pairs.length >= 3) {
    return {
      id: nextId("grid"),
      layout: "grid",
      title,
      intro: "",
      items: pairs.slice(0, 6).map((p) => ({ title: p.term, detail: p.def })),
    }
  }

  // Generic Grid from Bullets with terms
  if (bullets.length >= 4) {
    return {
      id: nextId("grid"),
      layout: "grid",
      title,
      intro: "",
      items: bullets.slice(0, 6).map((b) => {
        const idx = b.indexOf(":")
        return idx > 0 && idx < 28
          ? { title: b.slice(0, idx).trim(), detail: b.slice(idx + 1).trim() }
          : { title: b, detail: "" }
      }),
    }
  }

  // Standard content reading slide
  return {
    id: nextId("cnt"),
    layout: "content",
    title,
    paragraphs: paragraphs.length ? paragraphs : splitSentences(lines),
    bullets,
  }
}

function parseQuiz(title: string, lines: string[]): Slide[] {
  const slides: Slide[] = []
  let q: { question: string; options: QuizOption[]; correctIndex: number; explanation: string } | null = null

  const flush = () => {
    if (q && q.options.length >= 2) {
      slides.push({
        id: nextId("quiz"),
        layout: "quiz",
        title,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex < 0 ? 0 : q.correctIndex,
        explanation: q.explanation || "Review the corresponding lecture sections for the full rationale.",
      })
    }
    q = null
  }

  for (const line of lines) {
    if (/^Q:/i.test(line)) {
      flush()
      q = { question: line.replace(/^Q:\s*/i, "").trim(), options: [], correctIndex: -1, explanation: "" }
    } else if (/^A:/i.test(line) && q) {
      q.explanation = line.replace(/^A:\s*/i, "").trim()
    } else if (q) {
      const correct = /^\*\s+/.test(line)
      const opt = line.replace(/^[-*•]\s+/, "").trim()
      if (opt && (correct || /^[-•]\s+/.test(line))) {
        if (correct) q.correctIndex = q.options.length
        q.options.push({ text: opt })
      }
    }
  }
  flush()
  return slides
}

/* ------------------------------ Deck assembly ------------------------------- */

export type ParseResult = {
  slides: Slide[]
  chapterCount: number
}

export function parseDocumentToSlides(raw: string): ParseResult {
  counter = 0
  const source = raw && raw.trim().length > 0 ? raw : SAMPLE_SCRIPT
  const { docTitle, chapters } = tokenize(source)

  const body: Slide[] = []
  const tocItems: { n: number; label: string; target: number }[] = []
  let chapterNo = 0

  for (const chapter of chapters) {
    chapterNo += 1
    const dividerBodyIndex = body.length
    // +2 accounts for Title Slide and TOC Slide
    tocItems.push({ n: chapterNo, label: chapter.title, target: dividerBodyIndex + 2 })

    body.push({
      id: nextId("chap"),
      layout: "chapter",
      title: chapter.title,
      kicker: `Module ${String(chapterNo).padStart(2, "0")}`,
      index: chapterNo,
    })

    if (isQuizTitle(chapter.title)) {
      const quizLines = [...chapter.intro, ...chapter.subs.flatMap((s) => s.lines)]
      const quizSlides = parseQuiz(chapter.title, quizLines)
      body.push(...quizSlides)
      continue
    }

    if (chapter.intro.length) {
      const introSlide = classifyBlock(chapter.title, chapter.intro)
      if (introSlide) {
        if (Array.isArray(introSlide)) body.push(...introSlide)
        else body.push(introSlide)
      }
    }

    for (const sub of chapter.subs) {
      const slide = classifyBlock(sub.title, sub.lines)
      if (slide) {
        if (Array.isArray(slide)) body.push(...slide)
        else body.push(slide)
      }
    }
  }

  const titleSlide: Slide = {
    id: nextId("title"),
    layout: "title",
    kicker: deriveKicker(chapters),
    title: docTitle,
    subtitle: deriveSubtitle(chapters),
  }

  const tocSlide: Slide = {
    id: nextId("toc"),
    layout: "toc",
    title: "Lecture Table of Contents",
    items: tocItems,
  }

  return { slides: [titleSlide, tocSlide, ...body], chapterCount: chapters.length }
}

function deriveKicker(chapters: Chapter[]): string {
  return `${chapters.length} Modules • Structured Curriculum`
}

function deriveSubtitle(chapters: Chapter[]): string {
  const first = chapters[0]?.intro?.[0]
  if (first) return first.length > 160 ? `${first.slice(0, 157)}…` : first
  return "A comprehensive, automatically structured academic presentation generated from your source document."
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
Q: What does a low p-value (p < 0.05) indicate in statistical testing?
- The hypothesis is completely proven correct
- The sample size was too small to detect patterns
* The null hypothesis is rejected with low probability of random chance
- Correlation and causation are mathematically equal
A: A p-value below 0.05 indicates statistical significance, prompting rejection of the null hypothesis.

Q: Which section of a manuscript details the steps to replicate a study?
- Abstract and Overview
- Results and Visualizations
* Methods and Materials
- Literature Review
A: The Methods section must contain detailed descriptions of procedures so others can replicate the study.

Q: What is the main purpose of double-blinding in clinical trials?
- To reduce the cost of participant compensation
* To eliminate researcher and participant bias
- To speed up the manuscript writing process
- To guarantee statistical significance
A: Double-blinding prevents both participants and researchers from introducing cognitive bias into results.

Q: Which qualitative coding phase groups simple labels into conceptual sub-themes?
- Open Coding
* Axial Coding
- Selective Coding
- Descriptive Coding
A: Axial coding links open codes to identify structural relationships and conceptual sub-themes.
`
