import { createFileRoute, Link } from "@tanstack/react-router"
import { Suspense, useState } from "react"

import { api } from "@convex/_generated/api"
import { useSuspenseConvexQuery } from "@core/convex-client"
import { useCreateGroup, useSessionStatus } from "@core/hooks"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { EmptyState } from "@pattern/empty-state"
import { QueryErrorState } from "@pattern/query-error"
import { SignedOutGate } from "@routes/-components/signed-out-gate"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Button } from "@ui/button"
import { cx } from "@ui/cva.config"
import { Header, HeaderSubtitle, HeaderTitle } from "@ui/header"
import { LoadingPlaceholder } from "@ui/loading"
import { control, fieldLabel } from "@ui/variants"

export const Route = createFileRoute("/groups/")({
    component: GroupsPage,
    errorComponent: GroupsError,
})

function GroupsError({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>Groups</HeaderTitle>
                    <HeaderSubtitle>Plan the next table together. Each group is a shared list.</HeaderSubtitle>
                </Header>
                <QueryErrorState reset={reset} />
            </PageContainer>
        </PageLayout>
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
                    placeholder="Sunday dinner crew"
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
    const groups = useSuspenseConvexQuery(api.groups.listMyGroups)

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
                    {groups.map(({ group, role }) => (
                        <li key={group._id} className="rounded-card border border-border bg-surface p-5 shadow-card">
                            <Link
                                to="/groups/$groupId"
                                params={{ groupId: group._id }}
                                viewTransition
                                className="font-display text-lg font-semibold text-balance text-foreground hover:text-primary"
                            >
                                {group.name}
                            </Link>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {role === "admin" ? "Admin" : "Member"}
                            </p>
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
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>Groups</HeaderTitle>
                    <HeaderSubtitle>Plan the next table together. Each group is a shared list.</HeaderSubtitle>
                </Header>
                {status.kind !== "ready" ? (
                    <SignedOutGate context="your groups">
                        <div className="pt-6">
                            <LoadingPlaceholder />
                        </div>
                    </SignedOutGate>
                ) : (
                    <Suspense
                        fallback={
                            <div className="pt-6">
                                <LoadingPlaceholder />
                            </div>
                        }
                    >
                        <GroupsView />
                    </Suspense>
                )}
            </PageContainer>
        </PageLayout>
    )
}
