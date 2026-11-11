import { useState } from "react"

import { type Id, toId } from "@api/data.model"
import { useGroupPlaces } from "@core/groups"
import { isViewer, useViewer } from "@core/identity"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { useCancelPlan, useCreatePlan, usePlansForGroup } from "@core/plans"
import { useAuth } from "@core/session"
import { LoadingPlaceholder } from "@pattern/loading"
import { Button } from "@ui/button"

type PlanRow = NonNullable<ReturnType<typeof usePlansForGroup>>[number]

function formatPlanDate(value: number): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return "Unknown date"
    }
    return date.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })
}

function PlanCard({
    plan,
    canCancel,
    onCancelError,
}: Readonly<{
    plan: PlanRow
    canCancel: boolean
    onCancelError: (error: unknown) => void
}>) {
    const cancelPlan = useCancelPlan()
    return (
        <li className="rounded-card border border-border bg-surface p-4 shadow-card">
            <p className="font-display text-lg font-semibold text-balance text-foreground">{plan.placeName}</p>
            <p className="pt-1 text-sm text-muted-foreground">
                {formatPlanDate(plan.startsAt)} · {plan.status}
            </p>
            <p className="pt-1 text-sm text-muted-foreground">Organized by {plan.organizerName}</p>
            {canCancel && plan.status === "planned" && (
                <div className="pt-3">
                    <Button
                        size="sm"
                        tone="secondary"
                        disabled={cancelPlan.isPending}
                        onClick={() => {
                            cancelPlan.mutate({ planId: plan._id }, { onError: onCancelError })
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
    isGroupOwner,
    onCancelError,
}: Readonly<{
    plans: ReadonlyArray<PlanRow>
    viewer: { readonly kind: "signed-in"; readonly id: string } | { readonly kind: "signed-out" }
    isGroupOwner: boolean
    onCancelError: (error: unknown) => void
}>) {
    if (plans.length === 0) {
        return <p className="pt-3 text-sm text-muted-foreground">No plans yet. Pick a place and a date above.</p>
    }
    return (
        <ul className="grid gap-3 pt-3 md:grid-cols-2">
            {plans.map((plan) => (
                <PlanCard
                    key={plan._id}
                    plan={plan}
                    canCancel={isViewer(viewer, plan.createdBy) || isGroupOwner}
                    onCancelError={onCancelError}
                />
            ))}
        </ul>
    )
}

export function PlanSection({ groupId, isGroupOwner }: Readonly<{ groupId: Id<"groups">; isGroupOwner: boolean }>) {
    const auth = useAuth()
    const plans = usePlansForGroup(groupId)
    const groupPlaces = useGroupPlaces(groupId)
    const createPlan = useCreatePlan()
    const [placeId, setPlaceId] = useState("")
    const [dateInput, setDateInput] = useState("")
    const [error, setError] = useState<FormError>(clearError)
    const viewer = useViewer()

    if (!auth.isAuthenticated) {
        return null
    }
    if (plans === undefined || groupPlaces === undefined) {
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
        if (placeId === "" || Number.isNaN(parsed)) {
            setError({ kind: "error", message: "Pick a place and a date to propose a plan" })
            return
        }
        try {
            await createPlan.mutateAsync({
                groupId,
                placeId: toId<"places">(placeId),
                startsAt: parsed,
            })
            setPlaceId("")
            setDateInput("")
        } catch (err) {
            setError(errorFrom(err, "Could not create the plan"))
        }
    }

    return (
        <section aria-label="Plans" className="pt-8">
            <h2 className="font-display text-2xl font-semibold text-balance text-foreground">Plan an outing</h2>
            {groupPlaces.length === 0 ? (
                <p className="pt-3 text-sm text-muted-foreground">
                    Add a restaurant to the shared list first, then plan the outing.
                </p>
            ) : (
                <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:items-end">
                    <label className="flex flex-1 flex-col gap-1 text-sm text-foreground">
                        Place
                        <select
                            value={placeId}
                            onChange={(event) => {
                                setPlaceId(event.target.value)
                            }}
                            className="rounded-card border border-border bg-surface px-3 py-2 text-sm"
                        >
                            <option value="">Choose a place</option>
                            {groupPlaces.map((card) => (
                                <option key={card._id} value={card._id}>
                                    {card.name}
                                </option>
                            ))}
                        </select>
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
                        Propose outing
                    </Button>
                </div>
            )}
            {error.kind === "error" && (
                <p role="alert" className="pt-2 text-sm text-destructive">
                    {error.message}
                </p>
            )}
            <PlanList
                plans={plans}
                viewer={viewer}
                isGroupOwner={isGroupOwner}
                onCancelError={(error) => {
                    setError(errorFrom(error, "Could not cancel the plan"))
                }}
            />
        </section>
    )
}
