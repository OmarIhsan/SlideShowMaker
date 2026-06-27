// Mock high-capacity document-to-presentation translation engine.
// Simulates parsing a long-form script by chunking it on markdown headers,
// then distributing the content across a comprehensive (25-35 slide) deck.

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
}

export const THEMES: Record<ThemeId, Theme> = {
  clinical: {
    id: "clinical",
    label: "Clinical (Slate / Teal)",
    accentBg: "bg-teal-600",
    accentText: "text-teal-600",
    chipBg: "bg-teal-50",
    chipText: "text-teal-700",
    ring: "ring-teal-500",
    border: "border-teal-500",
  },
  midnight: {
    id: "midnight",
    label: "Midnight (Slate / Indigo)",
    accentBg: "bg-indigo-600",
    accentText: "text-indigo-600",
    chipBg: "bg-indigo-50",
    chipText: "text-indigo-700",
    ring: "ring-indigo-500",
    border: "border-indigo-500",
  },
  warm: {
    id: "warm",
    label: "Warm (Slate / Amber)",
    accentBg: "bg-amber-600",
    accentText: "text-amber-600",
    chipBg: "bg-amber-50",
    chipText: "text-amber-700",
    ring: "ring-amber-500",
    border: "border-amber-500",
  },
}

export type OutputType = "academic" | "clinical" | "corporate"

export const OUTPUT_TYPES: { id: OutputType; label: string }[] = [
  { id: "academic", label: "Academic Lecture" },
  { id: "clinical", label: "Clinical Case Study" },
  { id: "corporate", label: "Corporate Pitch" },
]

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
  title: "Title",
  toc: "Contents",
  chapter: "Chapter Divider",
  content: "Reading",
  split: "Dual Column Matrix",
  process: "Linear Process",
  grid: "Granular Grid",
  table: "Comparison Table",
  warning: "Clinical Warning",
  quiz: "Evaluation",
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
  return /\b(warning|caution|precaution|contraindicat|danger|alert|risk|avoid|safety)\b/i.test(t)
}

function isQuizTitle(t: string): boolean {
  return /\b(assessment|quiz|evaluation|knowledge check|questions?)\b/i.test(t)
}

function isDangerTitle(t: string): boolean {
  return /\b(contraindicat|danger|critical|fatal|severe)\b/i.test(t)
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

  if (!docTitle) docTitle = "Generated Presentation"
  return { docTitle, chapters }
}

/* --------------------------- Block classification --------------------------- */

let counter = 0
const nextId = (p: string) => `${p}-${counter++}`

function classifyBlock(title: string, lines: string[]): Slide | null {
  if (lines.length === 0 && !title) return null

  const tableHeader = lines.find((l) => l.startsWith("|"))
  if (tableHeader) {
    const columns = tableHeader
      .replace(/^\|/, "")
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean)
    const rows = lines
      .filter((l) => l !== tableHeader && l.includes("|"))
      .map((l) =>
        l
          .replace(/^\|/, "")
          .split("|")
          .map((c) => c.trim()),
      )
    return { id: nextId("tbl"), layout: "table", title, intro: "", columns, rows }
  }

  if (isWarningTitle(title)) {
    const bullets = lines.map((l) => l.match(BULLET)?.[1]).filter(Boolean) as string[]
    const points = bullets.length ? bullets : splitSentences(lines)
    return {
      id: nextId("warn"),
      layout: "warning",
      title,
      level: isDangerTitle(title) ? "danger" : "warning",
      points,
      note: "Review these items carefully before proceeding with treatment.",
    }
  }

  const numbered = lines.map((l) => l.match(NUMBERED)?.[1]).filter(Boolean) as string[]
  if (numbered.length >= 2) {
    const steps: ProcessStep[] = numbered.slice(0, 5).map((n, i) => {
      const idx = n.indexOf(":")
      const hasTitle = idx > 0 && idx < 28
      return {
        step: i + 1,
        title: hasTitle ? n.slice(0, idx).trim() : `Step ${i + 1}`,
        detail: hasTitle ? n.slice(idx + 1).trim() : n,
      }
    })
    return { id: nextId("proc"), layout: "process", title, intro: "", steps }
  }

  const bullets = lines.map((l) => l.match(BULLET)?.[1]).filter(Boolean) as string[]
  const nonBullet = lines.filter((l) => !BULLET.test(l))
  const pairs = nonBullet.map(asPair).filter(Boolean) as Callout[]
  const paragraphs = nonBullet.filter((l) => !asPair(l))

  if (paragraphs.length >= 1 && pairs.length >= 2) {
    return {
      id: nextId("split"),
      layout: "split",
      title,
      bullets: paragraphs.length ? splitSentences(paragraphs).slice(0, 5) : bullets,
      callouts: pairs.slice(0, 4),
    }
  }

  if (pairs.length >= 3) {
    return {
      id: nextId("grid"),
      layout: "grid",
      title,
      intro: "",
      items: pairs.slice(0, 6).map((p) => ({ title: p.term, detail: p.def })),
    }
  }

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
        explanation: q.explanation || "Review the related section for the full rationale.",
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
    // +2 accounts for the title slide (0) and TOC slide (1) prepended later.
    tocItems.push({ n: chapterNo, label: chapter.title, target: dividerBodyIndex + 2 })

    body.push({
      id: nextId("chap"),
      layout: "chapter",
      title: chapter.title,
      kicker: `Section ${String(chapterNo).padStart(2, "0")}`,
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
      if (introSlide) body.push(introSlide)
    }

    for (const sub of chapter.subs) {
      const slide = classifyBlock(sub.title, sub.lines)
      if (slide) body.push(slide)
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
    title: "Presentation Outline",
    items: tocItems,
  }

  return { slides: [titleSlide, tocSlide, ...body], chapterCount: chapters.length }
}

function deriveKicker(chapters: Chapter[]): string {
  return `${chapters.length} chapters • Auto-structured deck`
}

function deriveSubtitle(chapters: Chapter[]): string {
  const first = chapters[0]?.intro?.[0]
  if (first) return first.length > 160 ? `${first.slice(0, 157)}…` : first
  return "A comprehensive, automatically structured presentation generated from your source document."
}

/* ------------------------------- Sample script ------------------------------ */

export const SAMPLE_SCRIPT = `# Enamel, Caries & Operative Restoration

## Introduction to Enamel
Enamel is the visible, outermost layer of every tooth and the hardest tissue the human body produces. Understanding its structure is the foundation of all operative dentistry.

### Composition
Enamel is almost entirely mineral, which gives it unmatched hardness and translucency.
Hydroxyapatite: Roughly 96% mineral content by weight
Water: About 3% of the total structure
Organic matrix: The final 1%, made of proteins and lipids

### Physical Properties
- Hardest substance in the human body
- Translucent with a bluish-white hue
- Cannot regenerate once it is destroyed
- Highly resistant to compressive force
- Brittle and prone to fracture under shear stress
- Reaches up to 2.5 mm thick at the cusp tips

## The Caries Process
Dental caries is a multifactorial, biofilm-driven disease that advances along a predictable continuum. Early detection dramatically changes the treatment a patient will need.

### Stages of Decay
1. Plaque bacteria ferment dietary sugars and release acid
2. Demineralization begins as local pH drops below 5.5
3. A white spot lesion forms from subsurface mineral loss
4. The weakened surface cavitates into an irreversible cavity
5. Decay advances into dentin and progresses toward the pulp

### Risk Factors
- Frequent sugar and refined carbohydrate intake
- Poor oral hygiene and heavy plaque accumulation
- Reduced salivary flow, also called xerostomia
- Deep occlusal pits and fissures that trap debris

### Clinical Warning Signs
- Sharp pain triggered by cold or sweet stimuli
- Visible brown or black surface discoloration
- Food consistently impacting between the same teeth
- Persistent bad breath or an altered taste

## Tooth Anatomy
### Structural Layers
| Component | Definition | Clinical Behavior
Enamel | Outer mineralized layer | Brittle, cannot self-repair
Dentin | Living tubular tissue | Sensitive, forms reparative dentin
Pulp | Neurovascular core of the tooth | Inflames as caries nears, source of pain
Cementum | Mineralized covering of the root | Anchors periodontal fibers

### Pulp and Sensitivity
The pulp houses the nerves and blood vessels that keep a tooth vital. When caries approaches the pulp, inflammation produces sharp and lingering pain. Reversible pulpitis can heal once the irritant is removed, but irreversible pulpitis requires root canal therapy.

## Operative Restoration
When a lesion has cavitated, operative intervention removes the infected tissue and rebuilds the tooth's form and function with a durable material.

### Cavity Classification
| Class | Location | Typical Restoration
Class I | Pits and fissures of occlusal surfaces | Composite or amalgam
Class II | Proximal surfaces of posterior teeth | Composite with a matrix band
Class III | Proximal surfaces of anterior teeth | Bonded composite resin
Class V | Cervical third near the gumline | Glass ionomer or composite

### Cavity Preparation Steps
1. Administer local anesthesia and isolate the tooth
2. Access the lesion with a high-speed bur
3. Excavate the infected dentin completely
4. Shape and clean the prepared cavity walls
5. Place, cure, and finish the final restoration

### Material Selection
Composite resin: Tooth-colored, bonds directly, ideal for visible surfaces
Amalgam: Durable silver alloy suited to high-load posterior teeth
Glass ionomer: Releases fluoride and works well in low-stress areas
Ceramic inlay: Lab-fabricated for large, esthetic restorations

### Precautions and Contraindications
- Avoid pulp exposure during deep excavation
- Do not place composite in a contaminated, moist field
- Treatment is contraindicated when isolation cannot be achieved
- Always verify occlusion before dismissing the patient

## Clinical Case Study
The following case demonstrates how the principles in this module apply to a routine single-visit restoration.

### Patient Presentation
A 28-year-old patient reports occlusal sensitivity on the lower left molar when chewing. Clinical examination reveals a shadowed pit on tooth nineteen, and a bitewing radiograph confirms a dentin-level radiolucency.

### Treatment Plan
1. Confirm the diagnosis with a bitewing radiograph
2. Select a conservative Class I composite restoration
3. Prepare and restore the tooth in a single visit
4. Schedule a six-month recall to monitor the result

### Treatment Outcomes
The conservative restoration preserved the maximum amount of healthy tooth structure.
Survival rate: 98% at the five-year mark
Chair time: 12 minutes in a single visit
Patient pain: Fully resolved within 24 hours

## Knowledge Assessment
Q: At which pH does enamel typically begin to demineralize?
- pH 7.0
- pH 6.5
* pH 5.5
- pH 4.0
A: Enamel dissolves around the critical pH of 5.5, when the mouth turns acidic.
Q: Which tooth layer can form reparative tissue in response to caries?
- Enamel
* Dentin
- Cementum
- Pulp stone
A: Dentin is living tissue and can lay down reparative dentin to protect the pulp.
Q: A Class II cavity is located on which surface?
- Occlusal pits and fissures
* Proximal surfaces of posterior teeth
- Cervical area near the gumline
- Proximal surfaces of anterior teeth
A: Class II lesions affect the proximal surfaces of premolars and molars.
Q: What is the first step of cavity preparation?
* Administer anesthesia and isolate the tooth
- Excavate the infected dentin
- Place the final restoration
- Polish and check the occlusion
A: Proper anesthesia and isolation must precede any cutting of the tooth.`
