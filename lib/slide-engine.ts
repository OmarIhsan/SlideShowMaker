// Content-agnostic academic document-to-presentation translation engine.
// Strictly uses the rigid Slide layout schema and groups contents verbatim.

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

export type SlideLayout = "STANDARD_CONTENT" | "TABULAR_DATA";

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
}

export function getSlideTitle(slide: Slide): string {
  return slide.title
}

export type ParseResult = {
  slides: Slide[]
  chapterCount: number
}

export function parseDocumentToSlides(raw: string): ParseResult {
  const source = raw && raw.trim().length > 0 ? raw : SAMPLE_SCRIPT
  const lines = source.replace(/\r\n/g, "\n").split("\n").map(l => l.trim())

  let docTitle = "Academic Lecture Series"
  let currentHeader = "General Concepts"
  const bodySlides: Slide[] = []

  let slideIdCounter = 3
  let currentGroup: string[] = []

  const flushGroup = () => {
    if (currentGroup.length > 0) {
      bodySlides.push({
        id: slideIdCounter++,
        title: currentHeader,
        content: [...currentGroup],
        layout: "STANDARD_CONTENT"
      })
      currentGroup = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) {
      continue
    }

    if (line.startsWith("# ")) {
      flushGroup()
      docTitle = line.replace("# ", "").trim()
      continue
    }
    if (line.startsWith("## ")) {
      flushGroup()
      currentHeader = line.replace("## ", "").trim()
      continue
    }
    if (line.startsWith("### ")) {
      flushGroup()
      currentHeader = line.replace("### ", "").trim()
      continue
    }

    // Keep all text lines verbatim (including markdown table lines like |) as standard content text segments
    currentGroup.push(line)

    if (currentGroup.length >= 4) {
      flushGroup()
    }
  }

  flushGroup()

  // Build Outline list dynamically
  const uniqueHeaders = Array.from(new Set(bodySlides.map(s => s.title)))
  const tocItems = uniqueHeaders.slice(0, 10).map((h, index) => {
    return `${index + 1}. ${h}`
  })

  const titleSlide: Slide = {
    id: 1,
    title: docTitle,
    content: [
      "Verbatim Academic Presentation Courseware",
      "Presented by: Dr. Faisal Alhuwaizi",
      "This deck contains verbatim syllabus details compiled from raw content outlines."
    ],
    layout: "STANDARD_CONTENT"
  }

  const tocSlide: Slide = {
    id: 2,
    title: "Lecture Outline",
    content: tocItems,
    layout: "STANDARD_CONTENT"
  }

  const rawSlides = [titleSlide, tocSlide, ...bodySlides]
  const finalSlides = splitLongSlides(rawSlides)

  return {
    slides: finalSlides,
    chapterCount: uniqueHeaders.length
  }
}

function getEstimatedVisualLines(content: string[]): number {
  let totalLines = 0
  content.forEach((text) => {
    // Split by manual newlines
    const subLines = text.split("\n")
    subLines.forEach((subLine) => {
      const words = subLine.split(/\s+/).filter(Boolean).length
      if (words === 0) return
      // Estimate that about 10 words fit in a single visual line in the slide canvas at 14pt
      const visualLines = Math.max(1, Math.ceil(words / 10))
      totalLines += visualLines
    })
  })
  return totalLines
}

function splitLongSlides(slides: Slide[]): Slide[] {
  const result: Slide[] = []
  let slideIdCounter = 1

  slides.forEach((slide) => {
    // Keep Title slide (ID 1) and TOC slide (ID 2) intact
    if (slide.id === 1 || slide.id === 2) {
      slide.id = slideIdCounter++
      result.push(slide)
      return
    }

    const wordCount = slide.content.join(" ").split(/\s+/).filter(Boolean).length
    const estLines = getEstimatedVisualLines(slide.content)
    
    // Split if there are more than 3 lines, more than 80 words, or estimated visual lines exceed 3
    if (slide.content.length > 3 || wordCount > 80 || estLines > 3) {
      if (slide.content.length > 1) {
        const half = Math.ceil(slide.content.length / 2)
        const firstHalf = slide.content.slice(0, half)
        const secondHalf = slide.content.slice(half)

        const baseTitle = slide.title.replace(/\s*\(Part\s*\d+\/\d+\)\s*$/, "")

        const part1 = {
          id: slideIdCounter++,
          title: `${baseTitle} (Part 1/2)`,
          content: firstHalf,
          layout: slide.layout
        }
        const part2 = {
          id: slideIdCounter++,
          title: `${baseTitle} (Part 2/2)`,
          content: secondHalf,
          layout: slide.layout
        }

        // Recursively split the halves if they are still too long
        const splitResult = splitLongSlides([part1, part2])
        splitResult.forEach((s) => {
          s.id = slideIdCounter++
          result.push(s)
        })
      } else {
        // If there is only 1 line but it exceeds 45 words or 4 estimated lines, split it by sentence boundary
        const singleLine = slide.content[0]
        const sentences = singleLine.split(/(?<=\.)\s+/).filter(Boolean)

        if (sentences.length > 1) {
          const half = Math.ceil(sentences.length / 2)
          const firstHalf = [sentences.slice(0, half).join(" ")]
          const secondHalf = [sentences.slice(half).join(" ")]

          const baseTitle = slide.title.replace(/\s*\(Part\s*\d+\/\d+\)\s*$/, "")

          const part1 = {
            id: slideIdCounter++,
            title: `${baseTitle} (Part 1/2)`,
            content: firstHalf,
            layout: slide.layout
          }
          const part2 = {
            id: slideIdCounter++,
            title: `${baseTitle} (Part 2/2)`,
            content: secondHalf,
            layout: slide.layout
          }

          const splitResult = splitLongSlides([part1, part2])
          splitResult.forEach((s) => {
            s.id = slideIdCounter++
            result.push(s)
          })
        } else {
          // If it has only one sentence and cannot be split further, keep it to prevent infinite loop
          slide.id = slideIdCounter++
          result.push(slide)
        }
      }
    } else {
      slide.id = slideIdCounter++
      result.push(slide)
    }
  })

  // Group split slides by their base title and update part labels dynamically (e.g. Part 1/3)
  const finalResult: Slide[] = []
  let currentBaseTitle = ""
  let matchingSlides: Slide[] = []

  const flushMatching = () => {
    if (matchingSlides.length > 0) {
      if (matchingSlides.length === 1) {
        const s = matchingSlides[0]
        s.title = s.title.replace(/\s*\(Part\s*\d+\/\d+\)\s*$/, "")
        finalResult.push(s)
      } else {
        matchingSlides.forEach((s, idx) => {
          const base = s.title.replace(/\s*\(Part\s*\d+\/\d+\)\s*$/, "")
          s.title = `${base} (Part ${idx + 1}/${matchingSlides.length})`
          finalResult.push(s)
        })
      }
      matchingSlides = []
    }
  }

  result.forEach((s) => {
    if (s.id === 1 || s.id === 2) {
      flushMatching()
      finalResult.push(s)
      return
    }

    const base = s.title.replace(/\s*\(Part\s*\d+\/\d+\)\s*$/, "")
    if (base !== currentBaseTitle) {
      flushMatching()
      currentBaseTitle = base
    }
    matchingSlides.push(s)
  })
  flushMatching()

  // Re-assign consecutive IDs from 1 to N
  finalResult.forEach((s, idx) => {
    s.id = idx + 1
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
