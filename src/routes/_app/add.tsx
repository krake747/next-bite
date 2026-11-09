import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { useAuth } from "@core/session"
import { suggestCuisine } from "@features/restaurants/cuisine-suggestion"
import { RestaurantForm, useFormDiscard } from "@features/restaurants/restaurant-form"
import { ButtonLink } from "@pattern/button-link"
import { PlacesAutocomplete, type PlaceSelection } from "@pattern/places-autocomplete"
import { BackNav } from "@routes/-layouts/back-nav"
import { PageContainer } from "@routes/-layouts/page-container"
import { Button } from "@ui/button"

export const Route = createFileRoute("/_app/add")({
    head: () => ({ meta: [{ title: "Add Restaurant - Next Bite" }] }),
    component: AddPage,
})

type AddChoice = { kind: "idle" } | { kind: "manual" } | { kind: "place"; selection: PlaceSelection }

function AddPage() {
    const auth = useAuth()
    const navigate = useNavigate()
    const [choice, setChoice] = useState<AddChoice>({ kind: "idle" })
    const { registerDiscard, discard } = useFormDiscard()

    if (!auth.isAuthenticated) {
        return (
            <PageContainer>
                <BackNav backTo="/" label="Back to restaurants" />
                <div className="mx-auto max-w-2xl space-y-4 py-8 text-center">
                    <p className="text-muted-foreground">Please sign in to add restaurants.</p>
                    <ButtonLink to="/login" className="w-full">
                        Sign In
                    </ButtonLink>
                </div>
            </PageContainer>
        )
    }

    const goHome = () => {
        void navigate({ to: "/home" })
    }
    const handleCancel = () => {
        void discard().then(goHome)
    }
    const changeChoice = (next: AddChoice) => {
        // Discard before swapping drafts so staged uploads never strand:
        // idle has no form, so its registered discard is a noop.
        void discard().then(() => {
            setChoice(next)
        })
    }
    const handleSuccess = (restaurantId: string) => {
        void navigate({ to: "/restaurants/$restaurantId", params: { restaurantId } })
    }

    const choiceKey =
        choice.kind === "place" ? (choice.selection.placeId ?? `address:${choice.selection.address}`) : choice.kind

    return (
        <PageContainer>
            <BackNav backTo="/home" label="Back to restaurants" />
            <div className="mx-auto max-w-2xl space-y-6 pt-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground">
                        Add a restaurant
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Find it on Google Maps and confirm the details. Only your notes, rating, and photos are manual.
                    </p>
                </div>

                {choice.kind === "idle" ? (
                    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
                        <PlacesAutocomplete
                            label="Find the restaurant"
                            placeholder="Search name or address…"
                            value=""
                            onChange={(selection) => {
                                changeChoice({ kind: "place", selection })
                            }}
                        />
                        <div className="pt-4 text-center">
                            <Button
                                type="button"
                                tone="secondary"
                                onClick={() => {
                                    changeChoice({ kind: "manual" })
                                }}
                            >
                                Add it manually instead
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
                        {choice.kind === "place" && (
                            <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4">
                                <p className="min-w-0 truncate text-sm text-muted-foreground">
                                    Adding{" "}
                                    <span className="font-semibold text-foreground">
                                        {choice.selection.name ?? choice.selection.address}
                                    </span>
                                </p>
                                <Button
                                    type="button"
                                    tone="ghost"
                                    onClick={() => {
                                        changeChoice({ kind: "idle" })
                                    }}
                                >
                                    Change
                                </Button>
                            </div>
                        )}
                        <RestaurantForm
                            key={choiceKey}
                            mode="add"
                            onSuccess={handleSuccess}
                            onCancel={handleCancel}
                            onDiscardReady={registerDiscard}
                            {...(choice.kind === "place"
                                ? {
                                      initial: {
                                          name: choice.selection.name ?? "",
                                          cuisine: suggestCuisine(choice.selection.primaryType) ?? "",
                                          location: choice.selection.address,
                                          ...(choice.selection.lat !== undefined && choice.selection.lng !== undefined
                                              ? { lat: choice.selection.lat, lng: choice.selection.lng }
                                              : {}),
                                          ...(choice.selection.placeId !== undefined
                                              ? { placeId: choice.selection.placeId }
                                              : {}),
                                      },
                                  }
                                : {})}
                        />
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
