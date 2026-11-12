import { CheckIcon, CopyIcon } from "@phosphor-icons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import { cx } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"
import { focusRing } from "@ui/variants"

import { designSystemSections } from "./-sections/registry"
import { AnatomyTable, PropsTable, VariantTable } from "./-sections/token-table"

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

function ImportPath({ importPath }: Readonly<{ importPath: string }>) {
    const [copied, setCopied] = useState(false)
    return (
        <div className="mt-2 flex items-center gap-2">
            <p className="truncate font-mono text-xs text-muted-foreground">{importPath}</p>
            <IconButton
                label={copied ? "Copied" : `Copy ${importPath}`}
                tone="plain"
                size="sm"
                onClick={() => {
                    void navigator.clipboard
                        .writeText(`import from "@${importPath.replace(/^src\//, "")}"`)
                        .then(() => {
                            setCopied(true)
                        })
                        .catch(() => {
                            setCopied(false)
                        })
                }}
            >
                {copied ? (
                    <CheckIcon className="size-4" aria-hidden="true" />
                ) : (
                    <CopyIcon className="size-4" aria-hidden="true" />
                )}
            </IconButton>
        </div>
    )
}

function DesignSystemSectionPage() {
    const { sectionId } = Route.useParams()
    const entry = designSystemSections[sectionId]

    if (entry === undefined) {
        return <SectionNotFound />
    }

    const ids = Object.keys(designSystemSections)
    const currentIndex = ids.indexOf(sectionId)
    const previousId = currentIndex > 0 ? ids[currentIndex - 1] : undefined
    const nextId = currentIndex >= 0 && currentIndex < ids.length - 1 ? ids[currentIndex + 1] : undefined
    const previousEntry = previousId === undefined ? undefined : designSystemSections[previousId]
    const nextEntry = nextId === undefined ? undefined : designSystemSections[nextId]

    return (
        <div className="mx-auto w-full max-w-3xl pb-10">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground">
                {entry.meta.title}
            </h1>
            <ImportPath importPath={entry.meta.importPath} />
            <p className="mt-3 text-pretty text-muted-foreground">{entry.meta.body}</p>
            {entry.meta.guidance !== undefined && (
                <section aria-label="Guidance" className="pt-6">
                    <h2 className="font-display text-xl font-semibold text-balance text-foreground">When to use</h2>
                    <p className="mt-1 text-pretty text-muted-foreground">{entry.meta.guidance.whenToUse}</p>
                    {entry.meta.guidance.whenToAvoid !== undefined && (
                        <>
                            <h2 className="pt-4 font-display text-xl font-semibold text-balance text-foreground">
                                When not to use
                            </h2>
                            <p className="mt-1 text-pretty text-muted-foreground">{entry.meta.guidance.whenToAvoid}</p>
                        </>
                    )}
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
            <div className="pt-6">
                <entry.Demo />
            </div>
            {entry.meta.props !== undefined && (
                <>
                    <h2 className="pt-8 font-display text-xl font-semibold text-balance text-foreground">Props</h2>
                    <div className="overflow-x-auto pt-2">
                        <PropsTable caption={`${entry.meta.title} props`} rows={entry.meta.props} />
                    </div>
                </>
            )}
            {entry.meta.variants !== undefined && (
                <>
                    <h2 className="pt-8 font-display text-xl font-semibold text-balance text-foreground">Variants</h2>
                    <div className="overflow-x-auto pt-2">
                        <VariantTable caption={`${entry.meta.title} variants`} rows={entry.meta.variants} />
                    </div>
                </>
            )}
            {entry.meta.anatomy !== undefined && (
                <>
                    <h2 className="pt-8 font-display text-xl font-semibold text-balance text-foreground">Anatomy</h2>
                    <div className="overflow-x-auto pt-2">
                        <AnatomyTable caption={`${entry.meta.title} anatomy`} rows={entry.meta.anatomy} />
                    </div>
                </>
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
