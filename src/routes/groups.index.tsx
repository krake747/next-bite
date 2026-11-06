import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import { useAuth, useCreateGroup, useMyGroups } from "@core/hooks"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Button } from "@ui/button"
import { cx } from "@ui/cva.config"
import { Header, HeaderSubtitle, HeaderTitle } from "@ui/header"
import { LoadingPlaceholder } from "@ui/loading"
import { control, fieldLabel } from "@ui/variants"

export const Route = createFileRoute("/groups/")({
    component: GroupsPage,
})

function CreateGroupForm() {
    const createGroup = useCreateGroup()
    const [name, setName] = useState("")
    const [error, setError] = useState<string | null>(null)

    const handleCreate = async () => {
        setError(null)
        const trimmed = name.trim()
        if (trimmed === "") {
            setError("Give your group a name")
            return
        }
        try {
            await createGroup.mutateAsync({ name: trimmed })
            setName("")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create the group")
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
                    aria-invalid={error !== null}
                    className={cx(control(), error !== null && "border-destructive")}
                />
                {error !== null && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
            </div>
            <Button type="submit" disabled={createGroup.isPending}>
                Create group
            </Button>
        </form>
    )
}

function GroupsPage() {
    const auth = useAuth()
    const groups = useMyGroups()

    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>Groups</HeaderTitle>
                    <HeaderSubtitle>Plan the next table together. Each group is a shared list.</HeaderSubtitle>
                </Header>
                {!auth.isAuthenticated ? (
                    <p className="pt-6 text-stone-600">
                        <Link to="/login" viewTransition className="font-medium text-tomato-700 hover:underline">
                            Sign in
                        </Link>{" "}
                        to see your groups.
                    </p>
                ) : groups === undefined ? (
                    <div className="pt-6">
                        <LoadingPlaceholder />
                    </div>
                ) : (
                    <>
                        <CreateGroupForm />
                        {groups.length === 0 ? (
                            <div className="mt-6 rounded-card border border-border bg-surface p-6 text-center shadow-card">
                                <p className="font-display text-lg font-semibold text-balance text-stone-900">
                                    No groups yet
                                </p>
                                <p className="mx-auto mt-1 max-w-md text-sm text-pretty text-stone-600">
                                    Create your first group above, then add restaurants to its shared list.
                                </p>
                            </div>
                        ) : (
                            <ul className="mt-6 grid gap-4 md:grid-cols-2">
                                {groups.map(({ group, role }) => (
                                    <li
                                        key={group._id}
                                        className="rounded-card border border-border bg-surface p-5 shadow-card"
                                    >
                                        <Link
                                            to="/groups/$groupId"
                                            params={{ groupId: group._id }}
                                            viewTransition
                                            className="font-display text-lg font-semibold text-balance text-stone-900 hover:text-tomato-700"
                                        >
                                            {group.name}
                                        </Link>
                                        <p className="mt-1 text-sm text-stone-600">
                                            {role === "admin" ? "Admin" : "Member"}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </PageContainer>
        </PageLayout>
    )
}
