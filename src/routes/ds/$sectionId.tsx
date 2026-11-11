import { createFileRoute } from "@tanstack/react-router"

import { useSessionStatus } from "@core/session"
import { SessionGate } from "@routes/-components/session-gate"

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
        </div>
    )
}

function DesignSystemSectionPage() {
    const { sectionId } = Route.useParams()
    const entry = designSystemSections[sectionId]
    const status = useSessionStatus()

    if (entry === undefined) {
        return <SectionNotFound />
    }

    return (
        <div className="mx-auto w-full max-w-3xl pb-10">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground">
                {entry.meta.title}
            </h1>
            <p className="mt-2 font-mono text-xs text-muted-foreground">{entry.meta.importPath}</p>
            {entry.meta.guidance !== undefined && (
                <section aria-label="Guidance" className="pt-6">
                    <h2 className="font-display text-xl font-semibold text-balance text-foreground">When to use</h2>
                    <p className="mt-1 text-muted-foreground">{entry.meta.guidance.whenToUse}</p>
                    {entry.meta.guidance.whenToAvoid !== undefined && (
                        <>
                            <h2 className="pt-4 font-display text-xl font-semibold text-balance text-foreground">
                                When not to use
                            </h2>
                            <p className="mt-1 text-muted-foreground">{entry.meta.guidance.whenToAvoid}</p>
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
                                        <span className="font-mono text-xs text-foreground">{sibling.id}</span>
                                        <span> {sibling.reason}</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </section>
            )}
            <SessionGate status={status} context="the design system">
                <div className="pt-6">
                    <entry.Demo />
                </div>
            </SessionGate>
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
                    <div className="pt-2">
                        <VariantTable caption={`${entry.meta.title} variants`} rows={entry.meta.variants} />
                    </div>
                </>
            )}
            {entry.meta.anatomy !== undefined && (
                <>
                    <h2 className="pt-8 font-display text-xl font-semibold text-balance text-foreground">Anatomy</h2>
                    <div className="pt-2">
                        <AnatomyTable caption={`${entry.meta.title} anatomy`} rows={entry.meta.anatomy} />
                    </div>
                </>
            )}
            <h2 className="pt-8 font-display text-xl font-semibold text-balance text-foreground">Usage</h2>
            <p className="mt-1 text-muted-foreground">{entry.meta.body}</p>
        </div>
    )
}
