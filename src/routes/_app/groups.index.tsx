import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import { groupsListOptions, groupsListWarmups, useCreateGroup } from "@core/groups"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { useSessionStatus, warmAuthenticatedQueries } from "@core/session"
import { EmptyState } from "@pattern/empty-state"
import { Header, HeaderSubtitle, HeaderTitle } from "@pattern/header"
import { QueryErrorState } from "@pattern/query-error"
import { GroupsSkeleton } from "@routes/-components/page-skeletons"
import { LOADER_WARM_BUDGET_MS } from "@routes/-components/route-pending"
import { SessionGate } from "@routes/-components/session-gate"
import { PageContainer } from "@routes/-layouts/page-container"
import { Button } from "@ui/button"
import { cx } from "@ui/cva.config"
import { control, fieldLabel } from "@ui/variants"

export const Route = createFileRoute("/_app/groups/")({
    ssr: false,
    component: GroupsPage,
    errorComponent: GroupsError,
    loader: async ({ context }) => {
        return warmAuthenticatedQueries(context.queryClient, context.auth, groupsListWarmups(), LOADER_WARM_BUDGET_MS)
    },
})

function GroupsError({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <PageContainer>
            <Header>
                <HeaderTitle>Groups</HeaderTitle>
                <HeaderSubtitle>Plan the next table together. Each group is a shared list.</HeaderSubtitle>
            </Header>
            <QueryErrorState reset={reset} />
        </PageContainer>
    )
}

function CreateGroupForm() {
    const createGroup = useCreateGroup()
    const [name, setName] = useState("")
    const [error, setError] = useState<FormError>(clearError)

    const handleCreate = async () => {
        setError(clearError)
        const trimmed = name.trim()
        if (trimmed === "") {
            setError({ kind: "error", message: "Give your group a name" })
            return
        }
        try {
            await createGroup.mutateAsync({ name: trimmed })
            setName("")
        } catch (err) {
            setError(errorFrom(err, "Could not create the group"))
        }
    }

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault()
                void handleCreate()
            }}
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
            <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor="group-name" className={fieldLabel()}>
                    New group
                </label>
                <input
                    id="group-name"
                    value={name}
                    onChange={(event) => {
                        setName(event.target.value)
                    }}
                    placeholder="Sunday dinner group"
                    maxLength={80}
                    aria-invalid={error.kind === "error"}
                    className={cx(control(), error.kind === "error" && "border-destructive")}
                />
                {error.kind === "error" && (
                    <p role="alert" className="text-sm text-destructive">
                        {error.message}
                    </p>
                )}
            </div>
            <Button type="submit" disabled={createGroup.isPending}>
                Create group
            </Button>
        </form>
    )
}

function GroupsView() {
    const { data: groups } = useSuspenseQuery(groupsListOptions())

    return (
        <>
            <CreateGroupForm />
            {groups.length === 0 ? (
                <EmptyState
                    title="No groups yet"
                    body="Create your first group above, then add restaurants to its shared list."
                    className="mt-6"
                />
            ) : (
                <ul className="mt-6 grid gap-4 md:grid-cols-2">
                    {groups.map(({ group, isOwner }) => (
                        <li key={group._id} className="rounded-card border border-border bg-surface p-5 shadow-card">
                            <Link
                                to="/groups/$groupId"
                                params={{ groupId: group._id }}
                                className="font-display text-lg font-semibold text-balance text-foreground hover:text-primary"
                            >
                                {group.name}
                            </Link>
                            <p className="mt-1 text-sm text-muted-foreground">{isOwner ? "Owner" : "Member"}</p>
                        </li>
                    ))}
                </ul>
            )}
        </>
    )
}

function GroupsPage() {
    const status = useSessionStatus()

    return (
        <PageContainer>
            <Header>
                <HeaderTitle>Groups</HeaderTitle>
                <HeaderSubtitle>Plan the next table together. Each group is a shared list.</HeaderSubtitle>
            </Header>
            <SessionGate status={status} context="your groups" fallback={<GroupsSkeleton />}>
                <GroupsView />
            </SessionGate>
        </PageContainer>
    )
}
