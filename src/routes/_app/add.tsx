import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { useAuth } from "@core/session"
import { suggestCuisine } from "@features/restaurants/cuisine-suggestion"
import { RestaurantForm, useFormDiscard } from "@features/restaurants/restaurant-form"
import { ButtonLink } from "@pattern/button-link"
import { GoogleAttribution } from "@pattern/google-attribution"
import { Header, HeaderSubtitle, HeaderTitle } from "@pattern/header"
import { PlacesAutocomplete, type PlaceSelection } from "@pattern/places-autocomplete"
import { BackNav } from "@routes/-layouts/back-nav"
import { PageContainer } from "@routes/-layouts/page-container"
import { Button } from "@ui/button"

export const Route = createFileRoute("/_app/add")({
    head: () => ({ meta: [{ title: "Add Restaurant - Next Bite" }] }),
    component: AddPage,
})

type AddChoice = { kind: "idle" } | { kind: "manual" } | { kind: "place"; selection: PlaceSelection }

type ActiveChoice = Exclude<AddChoice, { kind: "idle" }>

function initialFor(choice: ActiveChoice) {
    return choice.kind === "place"
        ? {
              name: choice.selection.name ?? "",
              cuisine: suggestCuisine(choice.selection.primaryType) ?? "",
              location: choice.selection.address,
              ...(choice.selection.placeId !== undefined ? { placeId: choice.selection.placeId } : {}),
          }
        : undefined
}

function PlacePickerCard({
    onSelect,
    onManual,
}: Readonly<{ onSelect: (selection: PlaceSelection) => void; onManual: () => void }>) {
    return (
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <PlacesAutocomplete
                label="Find the restaurant"
                placeholder="Search name or address…"
                value=""
                onChange={onSelect}
            />
            <div className="pt-4 text-center">
                <Button type="button" tone="secondary" onClick={onManual}>
                    Add it manually instead
                </Button>
            </div>
        </div>
    )
}

function PlaceBanner({ selection, onResetChoice }: Readonly<{ selection: PlaceSelection; onResetChoice: () => void }>) {
    return (
        <div className="mb-5 border-b border-border pb-4">
            <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm text-muted-foreground">
                    Adding <span className="font-semibold text-foreground">{selection.name ?? selection.address}</span>
                </p>
                <Button type="button" tone="ghost" onClick={onResetChoice}>
                    Change
                </Button>
            </div>
            <div className="flex justify-end pt-2">
                <GoogleAttribution />
            </div>
        </div>
    )
}

function AddRestaurantFormCard({
    choice,
    onSuccess,
    onCancel,
    onDiscardReady,
    onResetChoice,
}: Readonly<{
    choice: ActiveChoice
    onSuccess: (restaurantId: string) => void
    onCancel: () => void
    onDiscardReady: (discard: () => Promise<void>) => void
    onResetChoice: () => void
}>) {
    const initial = initialFor(choice)
    const choiceKey =
        choice.kind === "place" ? (choice.selection.placeId ?? `address:${choice.selection.address}`) : choice.kind
    return (
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            {choice.kind === "place" && <PlaceBanner selection={choice.selection} onResetChoice={onResetChoice} />}
            <RestaurantForm
                key={choiceKey}
                onSuccess={onSuccess}
                onCancel={onCancel}
                onDiscardReady={onDiscardReady}
                {...(initial !== undefined ? { initial } : {})}
            />
        </div>
    )
}

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
        void discard().then(() => {
            setChoice(next)
        })
    }
    const handleSuccess = (restaurantId: string) => {
        void navigate({ to: "/restaurants/$restaurantId", params: { restaurantId } })
    }
    const handleSelectPlace = (selection: PlaceSelection): void => {
        changeChoice({ kind: "place", selection })
    }
    const handleManual = (): void => {
        changeChoice({ kind: "manual" })
    }
    const handleResetChoice = (): void => {
        changeChoice({ kind: "idle" })
    }

    return (
        <PageContainer>
            <BackNav backTo="/home" label="Back to restaurants" />
            <Header>
                <HeaderTitle>Add a restaurant</HeaderTitle>
                <HeaderSubtitle>
                    Find it on Google Maps and confirm the details. Only your notes and photos are manual.
                </HeaderSubtitle>
            </Header>
            <div className="mx-auto max-w-2xl space-y-6 pt-4">
                {choice.kind === "idle" ? (
                    <PlacePickerCard onSelect={handleSelectPlace} onManual={handleManual} />
                ) : (
                    <AddRestaurantFormCard
                        choice={choice}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                        onDiscardReady={registerDiscard}
                        onResetChoice={handleResetChoice}
                    />
                )}
            </div>
        </PageContainer>
    )
}
