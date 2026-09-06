"use client"

import * as React from "react"
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react"
import { useUi } from "@/lib/landing/uiStore"
import { useForge } from "@/lib/landing/store"
import { useForge as useForgeStudio } from "@/lib/forge/store"

/**
 * Error boundaries for the Sites module (the LandingForge port).
 *
 * The old Page Builder always had a per-section boundary; Sites shipped
 * without any, so a single throwing section (malformed config, schema drift
 * from an older save) unmounted the whole React tree and dumped the user back
 * on the dashboard. These two boundaries make that failure mode recoverable:
 *
 *  - SectionErrorBoundary → inline error card inside the canvas, studio stays alive
 *  - SitesViewBoundary    → full-view net with a "Reload studio" soft reset
 */

// ─────────────────────────────────────────────────────────────────────────────
// Per-section boundary — one bad section renders a card, not a crash
// ─────────────────────────────────────────────────────────────────────────────

interface SectionBoundaryProps {
  sectionId: string
  sectionKind: string
  children: React.ReactNode
}

interface SectionBoundaryState {
  hasError: boolean
  errorKey: number
}

export class SectionErrorBoundary extends React.Component<SectionBoundaryProps, SectionBoundaryState> {
  constructor(props: SectionBoundaryProps) {
    super(props)
    this.state = { hasError: false, errorKey: 0 }
  }

  static getDerivedStateFromError(): Partial<SectionBoundaryState> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[sites] section "${this.props.sectionKind}" (${this.props.sectionId}) failed to render:`,
      error,
      info.componentStack
    )
  }

  handleRetry = () => {
    // new key → children remount from scratch (stale hooks state discarded)
    this.setState((prev) => ({ hasError: false, errorKey: prev.errorKey + 1 }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 border-2 border-dashed border-amber-400/60 bg-amber-50/80 p-8 text-center dark:bg-amber-500/5">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              This section couldn&rsquo;t render
            </p>
            <p className="mt-1 max-w-sm text-xs text-amber-700 dark:text-amber-300/80">
              The &ldquo;{this.props.sectionKind}&rdquo; section hit an error — its config may be
              corrupted. Everything else keeps working; try again, or delete/replace this section
              from the list on the left.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-amber-300 bg-white/70 px-3 text-xs font-semibold text-amber-800 transition-colors hover:bg-white dark:border-amber-500/40 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-500/10"
          >
            <RotateCcw className="h-3 w-3" /> Try again
          </button>
        </div>
      )
    }
    return <React.Fragment key={this.state.errorKey}>{this.props.children}</React.Fragment>
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Whole-view boundary — soft-resets the studio instead of kicking the user out
// ─────────────────────────────────────────────────────────────────────────────

interface ViewBoundaryState {
  errorKey: number
}

export class SitesViewBoundary extends React.Component<{ children: React.ReactNode }, ViewBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { errorKey: 0 }
  }

  static getDerivedStateFromError(): Partial<ViewBoundaryState> {
    return { errorKey: Date.now() }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[sites] view crashed — offering soft recovery:", error, info.componentStack)
  }

  handleSoftReset = () => {
    // collapse transient UI state that could be the crash source, keep the config
    useUi.setState({ view: "studio", dialog: null, commandOpen: false, previewLocale: null })
    const forge = useForge.getState()
    forge.setPreviewMode(false)
    forge.setAbPreviewVariant(null)
    forge.selectSection(null)
    this.setState((prev) => ({ errorKey: prev.errorKey + 1 }))
  }

  handleBackToDashboard = () => {
    useForgeStudio.getState().setView("dashboard")
  }

  render() {
    // remount-keyed children: normal renders AND the recovery card live under
    // the same key so a retry gives the subtree a clean slate.
    return (
      <React.Fragment key={this.state.errorKey}>
        {this.state.errorKey === 0 ? (
          this.props.children
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-500/10 text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-zinc-100">The studio hit a snag</p>
              <p className="mt-1 max-w-md text-[11px] leading-relaxed text-zinc-400">
                Something in this view failed to render. Your project and its latest autosave are
                safe — reload the studio, or step back to the Forge Studio dashboard and reopen
                it from Projects.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={this.handleSoftReset}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-violet-500 px-4 text-[11px] font-semibold text-white shadow-md shadow-violet-500/25 transition-colors hover:bg-violet-400"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reload studio
              </button>
              <button
                type="button"
                onClick={this.handleBackToDashboard}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-zinc-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Forge Studio
              </button>
            </div>
          </div>
        )}
      </React.Fragment>
    )
  }
}
