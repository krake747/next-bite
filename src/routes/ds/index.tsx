import { createFileRoute, Link } from "@tanstack/react-router"

import { cx } from "@ui/cva.config"
import { Header, HeaderSubtitle, HeaderTitle } from "@ui/header"

import { designSystemSections, sectionGroups } from "./-sections/registry"

export const Route = createFileRoute("/ds/")({
    head: () => ({ meta: [{ title: "Design System - Next Bite" }] }),
    component: DesignSystemIndex,
})

function DesignSystemIndex() {
    return (
        <>
            <Header>
                <HeaderTitle>Design system</HeaderTitle>
                <HeaderSubtitle>
                    Good food. Great company. The living inventory of every component in the app, rendered for real.
                </HeaderSubtitle>
            </Header>
            <div className="space-y-10 pt-6 pb-10">
                {sectionGroups.map((group) => (
                    <section key={group} aria-label={group}>
                        <h2 className="font-display text-2xl font-semibold text-balance text-stone-900">{group}</h2>
                        <ul className="grid gap-4 pt-4 md:grid-cols-2">
                            {Object.values(designSystemSections)
                                .filter((entry) => entry.meta.group === group)
                                .map((entry, index, entries) => (
                                    <li
                                        key={entry.meta.id}
                                        className={cx(
                                            entries.length % 2 === 1 && index === entries.length - 1 && "md:col-span-2",
                                        )}
                                    >
                                        <Link
                                            to="/ds/$sectionId"
                                            params={{ sectionId: entry.meta.id }}
                                            className="block rounded-card border border-border bg-surface p-5 shadow-card"
                                        >
                                            <p className="font-display text-lg font-semibold text-balance text-stone-900">
                                                {entry.meta.title}
                                            </p>
                                            <p className="mt-1 text-sm text-pretty text-stone-600">{entry.meta.body}</p>
                                        </Link>
                                    </li>
                                ))}
                        </ul>
                    </section>
                ))}
            </div>
        </>
    )
}
