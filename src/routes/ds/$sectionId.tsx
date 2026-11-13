import { CheckIcon, CopyIcon } from "@phosphor-icons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import { cx } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"
import { focusRing } from "@ui/variants"

import { designSystemSections, type Guidance } from "./-sections/registry"
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

function DesignSystemSectionPage() {
    const { sectionId } = Route.useParams()
    const entry = designSystemSections[sectionId]

    if (entry === undefined) {
        return <SectionNotFound />
    }

    const ids = Object.keys(designSystemSections)
    const currentIndex = ids.indexOf(sectionId)
    // .at(-1) wraps to the last element, so the backward edge still needs its guard. .at() returns
    // undefined past the end, which covers the forward edge on its own.
    const previousId = currentIndex <= 0 ? undefined : ids.at(currentIndex - 1)
    const nextId = ids.at(currentIndex + 1)
    const previousEntry = previousId === undefined ? undefined : designSystemSections[previousId]
    const nextEntry = nextId === undefined ? undefined : designSystemSections[nextId]

    return (
        <div className="mx-auto w-full max-w-3xl pb-10">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground">
                {entry.meta.title}
            </h1>
            <ImportPath importPath={entry.meta.importPath} />
            <section aria-label="Preview" className="pt-6">
                <div className="grid min-h-80 place-items-center overflow-hidden rounded-card border border-border bg-surface px-4 py-10 sm:px-8">
                    <entry.Demo />
                </div>
            </section>
            <section aria-label="Usage" className="pt-8">
                <h2 className="font-display text-xl font-semibold text-balance text-foreground">Usage</h2>
                <p className="mt-1 text-pretty text-muted-foreground">{entry.meta.body}</p>
                <div className="pt-4">
                    <SpecifierCode importPath={entry.meta.importPath} />
                </div>
            </section>
            {entry.meta.anatomy !== undefined && (
                <section aria-label="Anatomy" className="pt-8">
                    <h2 className="font-display text-xl font-semibold text-balance text-foreground">Anatomy</h2>
                    <div className="mt-2 overflow-x-auto rounded-card border border-border px-4 py-2">
                        <AnatomyTable caption={`${entry.meta.title} anatomy`} rows={entry.meta.anatomy} />
                    </div>
                </section>
            )}
            {entry.meta.guidance !== undefined && (
                <section aria-label="Best practices" className="pt-8">
                    <h2 className="font-display text-xl font-semibold text-balance text-foreground">Best practices</h2>
                    <div className="mt-2 overflow-x-auto rounded-card border border-border px-4 py-2">
                        <PracticesTable
                            caption={`${entry.meta.title} best practices`}
                            rows={practiceRows(entry.meta.guidance)}
                        />
                    </div>
                    {entry.meta.guidance.siblings !== undefined && entry.meta.guidance.siblings.length > 0 && (
                        <>
                            <h2 className="pt-4 font-display text-xl font-semibold text-balance text-foreground">
                                Related
                            </h2>
                            <ul className="mt-1 space-y-1 text-muted-foreground">
                                {entry.meta.guidance.siblings.map((sibling) => (
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
            )}
            {entry.meta.variants !== undefined && (
                <section aria-label="Examples" className="pt-8">
                    <h2 className="font-display text-xl font-semibold text-balance text-foreground">Examples</h2>
                    <p className="mt-1 text-pretty text-muted-foreground">
                        Common configurations, variations, and states. Only these variants exist. An unlisted variant is
                        a bug, not an option.
                    </p>
                    <div className="mt-2 overflow-x-auto rounded-card border border-border px-4 py-2">
                        <VariantTable caption={`${entry.meta.title} variants`} rows={entry.meta.variants} />
                    </div>
                </section>
            )}
            {entry.meta.props !== undefined && (
                <section aria-label="Props" className="pt-8">
                    <h2 className="font-display text-xl font-semibold text-balance text-foreground">Props</h2>
                    <div className="mt-2 overflow-x-auto rounded-card border border-border px-4 py-2">
                        <PropsTable caption={`${entry.meta.title} props`} rows={entry.meta.props} />
                    </div>
                </section>
            )}
            {(previousEntry !== undefined || nextEntry !== undefined) && (
                <nav aria-label="Sections" className="flex items-center justify-between gap-4 pt-10">
                    <div className="min-w-0 flex-1">
                        {previousEntry !== undefined && previousId !== undefined && (
                            <Link
                                to="/ds/$sectionId"
                                params={{ sectionId: previousId }}
                                className={cx(
                                    focusRing(),
                                    "block truncate rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
                                )}
                            >
                                ← {previousEntry.meta.title}
                            </Link>
                        )}
                    </div>
                    <div className="min-w-0 flex-1 text-right">
                        {nextEntry !== undefined && nextId !== undefined && (
                            <Link
                                to="/ds/$sectionId"
                                params={{ sectionId: nextId }}
                                className={cx(
                                    focusRing(),
                                    "block truncate rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {nextEntry.meta.title} →
                            </Link>
                        )}
                    </div>
                </nav>
            )}
        </div>
    )
}
