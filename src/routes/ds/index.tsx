import { ArrowRightIcon } from "@phosphor-icons/react"
import { createFileRoute, Link } from "@tanstack/react-router"

import { Header, HeaderSubtitle, HeaderTitle } from "@pattern/header"
import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

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
                <HeaderSubtitle>The living inventory of every component in the app, rendered for real.</HeaderSubtitle>
            </Header>
            <div className="space-y-10 pt-6 pb-10">
                {sectionGroups.map((group) => (
                    <section key={group} aria-label={group}>
                        <h2 className="font-display text-2xl font-semibold text-balance text-foreground">{group}</h2>
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
                                            className={cx(
                                                focusRing(),
                                                "group block rounded-card border border-border bg-surface p-5 shadow-card transition-colors hover:border-border-strong hover:bg-surface-muted",
                                            )}
                                        >
                                            <p className="flex items-center justify-between gap-2 font-display text-lg font-semibold text-balance text-foreground">
                                                {entry.meta.title}
                                                <ArrowRightIcon
                                                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                                                    aria-hidden="true"
                                                />
                                            </p>
                                            <p className="mt-1 text-sm text-pretty text-muted-foreground">
                                                {entry.meta.body}
                                            </p>
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
