import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Hash,
  LayoutTemplate,
  ListOrdered,
  Loader2,
  Presentation,
  Settings2,
  Sparkles,
  Upload,
} from "lucide-react"
import type { ReactNode } from "react"

import type { Slide, Theme } from "@/lib/slide-engine"

export type Phase = "idle" | "generating" | "ready"

export const GENERATION_STEPS = [
  "Parsing academic script...",
  "Formatting module dividers...",
  "Applying layout templates...",
  "Compiling self-assessment banks...",
  "Configuring branding metadata...",
]

export function TopBar({ total, phase }: { total: number; phase: Phase }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <LayoutTemplate className="h-4 w-4 text-teal-600" aria-hidden="true" />
        Academic Layout Engine
      </div>
      <div className="flex items-center gap-2">
        {phase === "ready" && (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
            {total} slides generated
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">Academic Lecture</span>
      </div>
    </div>
  )
}

export function OutlineDrawer({
  outline,
  current,
  theme,
  onJump,
}: {
  outline: { index: number; title: string; layout: Slide["layout"] }[]
  current: number
  theme: Theme
  onJump: (i: number) => void
}) {
  return (
    <section aria-labelledby="outline-heading" className="flex flex-col gap-3">
      <SectionLabel id="outline-heading" icon={ListOrdered}>
        Slide Outline Index
      </SectionLabel>
      <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-1.5">
        <ul className="flex flex-col gap-0.5">
          {outline.map((o) => {
            const active = o.index === current
            return (
              <li key={o.index}>
                <button
                  type="button"
                  onClick={() => onJump(o.index)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors text-slate-600 hover:bg-white"
                  style={active ? { backgroundColor: theme.hexPrimary, color: "#FFFFFF" } : undefined}
                >
                  <span
                    className="flex h-5 w-6 shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-[10px] font-semibold text-slate-500"
                    style={active ? { color: theme.hexPrimary } : undefined}
                  >
                    {o.index + 1}
                  </span>
                  <span className="truncate">{o.title}</span>
                  <span
                    className="ml-auto shrink-0 text-[9px] font-bold uppercase tracking-wide opacity-75"
                    style={active ? { color: "#FFFFFF" } : { color: theme.hexSecondary }}
                  >
                    {o.layout}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export function SectionLabel({
  id,
  icon: Icon,
  children,
}: {
  id: string
  icon: typeof Upload
  children: ReactNode
}) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </h2>
  )
}

export function NavButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
        <Presentation className="h-9 w-9 text-slate-400" aria-hidden="true" />
      </div>
      <div className="max-w-sm">
        <h2 className="text-lg font-semibold text-slate-100">No lecture loaded</h2>
        <p className="mt-1 text-sm text-slate-400">
          Upload your script or click "Load Academic Sample" to initialize the compiler.
        </p>
      </div>
    </div>
  )
}

export function GeneratingState({ stepIndex, theme }: { stepIndex: number; theme: Theme }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <Loader2 className="h-10 w-10 animate-spin" style={{ color: theme.hexPrimary }} aria-hidden="true" />
      <div className="w-full max-w-sm space-y-3">
        {GENERATION_STEPS.map((label, i) => {
          const done = i < stepIndex
          const active = i === stepIndex
          return (
            <div key={label} className="flex items-center gap-3">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs"
                style={
                  done
                    ? { backgroundColor: theme.hexPrimary, color: "white" }
                    : active
                      ? { backgroundColor: "#334155", color: "white" }
                      : { backgroundColor: "#1e293b", color: "#64748b" }
                }
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span className={`text-sm ${done ? "text-slate-300" : active ? "text-slate-100" : "text-slate-500"}`}>
                {label}
              </span>
              {active && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-slate-400" aria-hidden="true" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
