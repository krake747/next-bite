import { createFileRoute } from "@tanstack/react-router"

import { BackNav } from "@routes/-layouts/back-nav"

import { designSystemSections } from "./-sections/registry"
import { AnatomyTable } from "./-sections/token-table"

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

    if (entry === undefined) {
        return (
            <>
                <BackNav backTo="/ds" label="Back to design system" />
                <SectionNotFound />
            </>
        )
    }

    return (
        <div className="mx-auto w-full max-w-3xl pb-10">
            <BackNav backTo="/ds" label="Back to design system" />
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground">
                {entry.meta.title}
            </h1>
            <p className="mt-2 font-mono text-xs text-muted-foreground">{entry.meta.importPath}</p>
            <div className="pt-6">
                <entry.Demo />
            </div>
            <h2 className="pt-8 font-display text-xl font-semibold text-balance text-foreground">Usage</h2>
            <p className="mt-1 text-muted-foreground">{entry.meta.body}</p>
            {entry.meta.anatomy !== undefined && (
                <>
                    <h2 className="pt-8 font-display text-xl font-semibold text-balance text-foreground">Anatomy</h2>
                    <div className="pt-2">
                        <AnatomyTable caption={`${entry.meta.title} anatomy`} rows={entry.meta.anatomy} />
                    </div>
                </>
            )}
        </div>
    )
}
