import { useState } from "react"

import { type Id } from "@api/data.model"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { useCreatePlan, usePlansForGroup, usePlansForRestaurant, useUpdatePlanStatus } from "@core/plans"
import { useAuth } from "@core/session"
import { Button } from "@ui/button"
import { LoadingPlaceholder } from "@ui/loading"

type PlanRow = {
    readonly _id: Id<"plans">
    readonly title: string
    readonly date: number
    readonly status: "planned" | "done" | "cancelled"
    readonly createdBy: string
    readonly participants: ReadonlyArray<{ readonly userId: string; readonly name: string }>
}

function formatPlanDate(value: number): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return "Unknown date"
    }
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function PlanCard({
    plan,
    canUpdate,
    onUpdateError,
}: Readonly<{
    plan: PlanRow
    canUpdate: boolean
    onUpdateError: (error: unknown) => void
}>) {
    const updateStatus = useUpdatePlanStatus()
    return (
        <li className="rounded-card border border-border bg-surface p-4 shadow-card">
            <p className="font-display text-lg font-semibold text-balance text-foreground">{plan.title}</p>
            <p className="pt-1 text-sm text-muted-foreground">
                {formatPlanDate(plan.date)} · {plan.status}
            </p>
            <p className="pt-1 text-sm text-muted-foreground">
                {plan.participants.length} {plan.participants.length === 1 ? "participant" : "participants"}:{" "}
                {plan.participants.map((p) => p.name).join(", ")}
            </p>
            {canUpdate && plan.status === "planned" && (
                <div className="flex gap-2 pt-3">
                    <Button
                        size="sm"
                        tone="secondary"
                        disabled={updateStatus.isPending}
                        onClick={() => {
                            updateStatus.mutate({ planId: plan._id, status: "done" }, { onError: onUpdateError })
                        }}
                    >
                        Mark done
                    </Button>
                    <Button
                        size="sm"
                        tone="secondary"
                        disabled={updateStatus.isPending}
                        onClick={() => {
                            updateStatus.mutate({ planId: plan._id, status: "cancelled" }, { onError: onUpdateError })
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            )}
        </li>
    )
}

function PlanList({
    plans,
    viewer,
    onUpdateError,
}: Readonly<{
    plans: ReadonlyArray<PlanRow>
    viewer: { readonly kind: "signed-in"; readonly id: string } | { readonly kind: "signed-out" }
    onUpdateError: (error: unknown) => void
}>) {
    if (plans.length === 0) {
        return <p className="pt-3 text-sm text-muted-foreground">No plans yet. Propose the first date above.</p>
    }
    return (
        <ul className="grid gap-3 pt-3 md:grid-cols-2">
            {plans.map((plan) => (
                <PlanCard
                    key={plan._id}
                    plan={plan}
                    canUpdate={viewer.kind === "signed-in" && plan.createdBy === viewer.id}
                    onUpdateError={onUpdateError}
                />
            ))}
        </ul>
    )
}

export function PlanSection({
    groupId,
    restaurantId,
}: Readonly<{ groupId?: Id<"groups"> | undefined; restaurantId?: Id<"restaurants"> | undefined }>) {
    const auth = useAuth()
    const groupPlans = usePlansForGroup(groupId)
    const restaurantPlans = usePlansForRestaurant(groupId === undefined ? restaurantId : undefined)
    const createPlan = useCreatePlan()
    const [title, setTitle] = useState("")
    const [dateInput, setDateInput] = useState("")
    const [error, setError] = useState<FormError>(clearError)

    const plans = (groupId === undefined ? restaurantPlans : groupPlans) as ReadonlyArray<PlanRow> | undefined
    const userId = auth.user?.id
    const viewer: { readonly kind: "signed-in"; readonly id: string } | { readonly kind: "signed-out" } =
        userId !== undefined && userId !== "" ? { kind: "signed-in", id: userId } : { kind: "signed-out" }

    if (!auth.isAuthenticated) {
        return null
    }
    if (plans === undefined) {
        return (
            <section aria-label="Plans" className="pt-8">
                <h2 className="font-display text-2xl font-semibold text-balance text-foreground">Plan an outing</h2>
                <div className="pt-3">
                    <LoadingPlaceholder />
                </div>
            </section>
        )
    }

    const handleCreate = async () => {
        setError(clearError)
        const parsed = dateInput === "" ? Number.NaN : Date.parse(`${dateInput}T12:00:00`)
        if (title.trim() === "" || Number.isNaN(parsed)) {
            setError({ kind: "error", message: "Add a title and a date to propose a plan" })
            return
        }
        try {
            await createPlan.mutateAsync({
                ...(groupId !== undefined ? { groupId } : {}),
                ...(restaurantId !== undefined ? { restaurantId } : {}),
                title: title.trim(),
                date: parsed,
            })
            setTitle("")
            setDateInput("")
        } catch (err) {
            setError(errorFrom(err, "Could not create the plan"))
        }
    }

    return (
        <section aria-label="Plans" className="pt-8">
            <h2 className="font-display text-2xl font-semibold text-balance text-foreground">Plan an outing</h2>
            <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:items-end">
                <label className="flex flex-1 flex-col gap-1 text-sm text-foreground">
                    Title
                    <input
                        value={title}
                        onChange={(event) => {
                            setTitle(event.target.value)
                        }}
                        placeholder="Friday dinner"
                        maxLength={80}
                        className="rounded-card border border-border bg-surface px-3 py-2 text-sm"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm text-foreground">
                    Date
                    <input
                        type="date"
                        value={dateInput}
                        onChange={(event) => {
                            setDateInput(event.target.value)
                        }}
                        className="rounded-card border border-border bg-surface px-3 py-2 text-sm"
                    />
                </label>
                <Button onClick={() => void handleCreate()} disabled={createPlan.isPending}>
                    Propose date
                </Button>
            </div>
            {error.kind === "error" && (
                <p role="alert" className="pt-2 text-sm text-destructive">
                    {error.message}
                </p>
            )}
            <PlanList
                plans={plans}
                viewer={viewer}
                onUpdateError={(error) => {
                    setError(errorFrom(error, "Could not update the plan"))
                }}
            />
        </section>
    )
}
