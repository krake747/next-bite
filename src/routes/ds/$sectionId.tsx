import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, CopyIcon } from "@phosphor-icons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { createContext, use, useState } from "react"

import { cx } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"
import { focusRing } from "@ui/variants"

import { designSystemSections, type Guidance, type SectionEntry } from "./-sections/registry"
import { AnatomyTable, PracticesTable, PropsTable, VariantTable, type PracticeRow } from "./-sections/token-table"

export const Route = createFileRoute("/ds/$sectionId")({
    head: () => ({ meta: [{ title: "Design System - Next Bite" }] }),
    component: DesignSystemSectionPage,
})

function SectionNotFound() {
    return (
        <div className="py-16 text-center">
            <p className="font-display text-2xl font-semibold text-balance text-foreground">No such section</p>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                That showcase does not exist. Pick one from the index instead.
            </p>
            <Link
                to="/ds"
                className={cx(
                    focusRing(),
                    "mt-6 inline-block rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted",
                )}
            >
                Back to overview
            </Link>
        </div>
    )
}

function DesignSystemSectionPage() {
    const { sectionId } = Route.useParams()
    const entry = designSystemSections[sectionId]

    if (!entry) {
        return <SectionNotFound />
    }

    return (
        <div className="mx-auto w-full max-w-3xl pb-10">
            <SectionEntryContext value={entry}>
                <SectionHeader />
                <PreviewSection />
                <UsageSection />
                <AnatomySection />
                <BestPracticesSection />
                <ExamplesSection />
                <PropsSection />
                <SectionPager />
            </SectionEntryContext>
        </div>
    )
}

export function toImportSpecifier(importPath: string): string {
    const match = /^src\/(ui|pattern|core|api|features|routes)\/(.+)\.tsx?$/.exec(importPath)
    if (match?.[1] === undefined || match?.[2] === undefined) {
        return importPath
    }
    return `@${match[1]}/${match[2]}`
}

function useCopyFeedback(text: string): { readonly copied: boolean; readonly handleCopy: () => void } {
    const [copied, setCopied] = useState(false)

    function handleCopy(): void {
        void navigator.clipboard
            .writeText(text)
            .then(() => {
                setCopied(true)
            })
            .catch(() => {
                setCopied(false)
            })
    }

    return { copied, handleCopy }
}

function ImportPath({ importPath }: Readonly<{ importPath: string }>) {
    const specifier = toImportSpecifier(importPath)
    const { copied, handleCopy } = useCopyFeedback(specifier)
    return (
        <div className="mt-2 flex items-center gap-2">
            <p title={importPath} className="truncate font-mono text-xs text-muted-foreground">
                {specifier}
            </p>
            <IconButton label={copied ? "Copied" : `Copy ${specifier}`} tone="plain" size="sm" onClick={handleCopy}>
                {copied ? (
                    <CheckIcon className="size-4" aria-hidden="true" />
                ) : (
                    <CopyIcon className="size-4" aria-hidden="true" />
                )}
            </IconButton>
        </div>
    )
}

function SpecifierCode({ importPath }: Readonly<{ importPath: string }>) {
    const specifier = toImportSpecifier(importPath)
    const snippet = `"${specifier}";`
    const { copied, handleCopy } = useCopyFeedback(snippet)
    const caption =
        specifier === importPath
            ? "Stylesheet path for these tokens."
            : "Module specifier for the from clause of an import."
    return (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-1.5">
                <p className="font-mono text-xs text-muted-foreground">ts</p>
                <IconButton
                    label={copied ? "Copied" : "Copy import snippet"}
                    tone="plain"
                    size="sm"
                    onClick={handleCopy}
                >
                    {copied ? (
                        <CheckIcon className="size-4" aria-hidden="true" />
                    ) : (
                        <CopyIcon className="size-4" aria-hidden="true" />
                    )}
                </IconButton>
            </div>
            <pre className="overflow-x-auto px-4 py-3 font-mono text-sm text-foreground tabular-nums">{snippet}</pre>
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">{caption}</p>
        </div>
    )
}

function practiceRows(guidance: Guidance): ReadonlyArray<PracticeRow> {
    return [
        { kind: "do" as const, text: guidance.whenToUse },
        ...(guidance.whenToAvoid === undefined ? [] : [{ kind: "dont" as const, text: guidance.whenToAvoid }]),
    ]
}

const SectionEntryContext = createContext<SectionEntry | null>(null)

function useSectionEntry(): SectionEntry {
    const entry = use(SectionEntryContext)
    if (!entry) {
        throw new Error("Section components must render inside a section entry provider")
    }
    return entry
}

function SectionHeader() {
    const { meta } = useSectionEntry()
    const title = meta.title
    const importPath = meta.importPath
    return (
        <>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground">{title}</h1>
            <ImportPath importPath={importPath} />
        </>
    )
}

function PagerLink({
    sectionId,
    children,
    className,
}: Readonly<{ sectionId: string; children: React.ReactNode; className?: string | undefined }>) {
    return (
        <Link
            to="/ds/$sectionId"
            params={{ sectionId }}
            className={cx(
                focusRing(),
                "flex items-center gap-2 rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
                className,
            )}
        >
            {children}
        </Link>
    )
}

function PreviousPagerLink({ sectionId, title }: Readonly<{ sectionId: string; title: string }>) {
    return (
        <PagerLink sectionId={sectionId}>
            <ArrowLeftIcon className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{title}</span>
        </PagerLink>
    )
}

function NextPagerLink({ sectionId, title }: Readonly<{ sectionId: string; title: string }>) {
    return (
        <PagerLink sectionId={sectionId} className="justify-end">
            <span className="min-w-0 flex-1 truncate">{title}</span>
            <ArrowRightIcon className="size-4 shrink-0" aria-hidden="true" />
        </PagerLink>
    )
}

function SectionPager() {
    const { meta } = useSectionEntry()
    const id = meta.id
    const entries = Object.values(designSystemSections)
    const currentIndex = entries.findIndex((candidate) => candidate.meta.id === id)
    if (currentIndex < 0) {
        return null
    }
    const [previousEntry] = entries.slice(Math.max(0, currentIndex - 1), currentIndex)
    const [nextEntry] = entries.slice(currentIndex + 1, currentIndex + 2)
    if (previousEntry === undefined && nextEntry === undefined) {
        return null
    }
    return (
        <nav aria-label="Sections" className="flex items-center justify-between gap-4 pt-10">
            <div className="min-w-0 flex-1">
                {previousEntry !== undefined && (
                    <PreviousPagerLink sectionId={previousEntry.meta.id} title={previousEntry.meta.title} />
                )}
            </div>
            <div className="min-w-0 flex-1 text-right">
                {nextEntry !== undefined && (
                    <NextPagerLink sectionId={nextEntry.meta.id} title={nextEntry.meta.title} />
                )}
            </div>
        </nav>
    )
}

function PreviewSection() {
    const { Demo } = useSectionEntry()
    return (
        <section aria-label="Preview" className="pt-6">
            <div className="grid min-h-80 place-items-center overflow-hidden rounded-card border border-border bg-surface px-4 py-10 sm:px-8">
                <Demo />
            </div>
        </section>
    )
}

function UsageSection() {
    const { meta } = useSectionEntry()
    const body = meta.body
    const importPath = meta.importPath
    return (
        <section aria-label="Usage" className="pt-8">
            <h2 className="font-display text-xl font-semibold text-balance text-foreground">Usage</h2>
            <p className="mt-1 text-pretty text-muted-foreground">{body}</p>
            <div className="pt-4">
                <SpecifierCode importPath={importPath} />
            </div>
        </section>
    )
}

function AnatomySection() {
    const { meta } = useSectionEntry()
    const anatomy = meta.anatomy
    const title = meta.title
    if (!anatomy) {
        return null
    }
    return (
        <section aria-label="Anatomy" className="pt-8">
            <h2 className="font-display text-xl font-semibold text-balance text-foreground">Anatomy</h2>
            <div className="mt-2 overflow-x-auto rounded-card border border-border px-4 py-2">
                <AnatomyTable caption={`${title} anatomy`} rows={anatomy} />
            </div>
        </section>
    )
}

function BestPracticesSection() {
    const { meta } = useSectionEntry()
    const guidance = meta.guidance
    const title = meta.title
    if (!guidance) {
        return null
    }
    const siblings = guidance.siblings ?? []
    return (
        <section aria-label="Best practices" className="pt-8">
            <h2 className="font-display text-xl font-semibold text-balance text-foreground">Best practices</h2>
            <div className="mt-2 overflow-x-auto rounded-card border border-border px-4 py-2">
                <PracticesTable caption={`${title} best practices`} rows={practiceRows(guidance)} />
            </div>
            {siblings.length > 0 && (
                <>
                    <h2 className="pt-4 font-display text-xl font-semibold text-balance text-foreground">Related</h2>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                        {siblings.map((sibling) => (
                            <li key={sibling.id}>
                                <Link
                                    to="/ds/$sectionId"
                                    params={{ sectionId: sibling.id }}
                                    className={cx(
                                        focusRing(),
                                        "rounded-sm font-mono text-xs text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground",
                                    )}
                                >
                                    {sibling.id}
                                </Link>
                                <span> {sibling.reason}</span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    )
}

function ExamplesSection() {
    const { meta } = useSectionEntry()
    const title = meta.title
    const variants = meta.variants
    if (!variants) {
        return null
    }
    return (
        <section aria-label="Examples" className="pt-8">
            <h2 className="font-display text-xl font-semibold text-balance text-foreground">Examples</h2>
            <p className="mt-1 text-pretty text-muted-foreground">
                Common configurations, variations, and states. Only these variants exist. An unlisted variant is a bug,
                not an option.
            </p>
            <div className="mt-2 overflow-x-auto rounded-card border border-border px-4 py-2">
                <VariantTable caption={`${title} variants`} rows={variants} />
            </div>
        </section>
    )
}

function PropsSection() {
    const { meta } = useSectionEntry()
    const props = meta.props
    const title = meta.title
    if (!props) {
        return null
    }
    return (
        <section aria-label="Props" className="pt-8">
            <h2 className="font-display text-xl font-semibold text-balance text-foreground">Props</h2>
            <div className="mt-2 overflow-x-auto rounded-card border border-border px-4 py-2">
                <PropsTable caption={`${title} props`} rows={props} />
            </div>
        </section>
    )
}
