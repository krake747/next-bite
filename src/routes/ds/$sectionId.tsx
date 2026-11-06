import { createFileRoute } from "@tanstack/react-router"

import { BackNav } from "@routes/-layouts/back-nav"
import { Header, HeaderSubtitle, HeaderTitle } from "@ui/header"

import { designSystemSections } from "./-sections/registry"

export const Route = createFileRoute("/ds/$sectionId")({
    head: () => ({ meta: [{ title: "Design System - Next Bite" }] }),
    component: DesignSystemSectionPage,
})

function SectionNotFound() {
    return (
        <div className="py-16 text-center">
            <p className="font-display text-2xl font-semibold text-balance text-stone-900">No such section</p>
            <p className="mx-auto mt-2 max-w-md text-stone-600">
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
        <>
            <BackNav backTo="/ds" label="Back to design system" />
            <Header>
                <HeaderTitle>{entry.meta.title}</HeaderTitle>
                <HeaderSubtitle>{entry.meta.body}</HeaderSubtitle>
            </Header>
            <div className="pt-6 pb-10">
                <entry.Demo />
            </div>
        </>
    )
}
