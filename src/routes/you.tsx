import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import { type Doc } from "@convex/_generated/dataModel"
import { useAuth, useMyProfile, useMyStatuses, useRestaurants, useUpdateProfile, type ImageRecord } from "@core/hooks"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { orderFeedByRecency } from "@core/social"
import { ImageUpload } from "@pattern/image-upload"
import { LazyImage } from "@pattern/lazy-image"
import { SignedOutGate } from "@routes/-components/signed-out-gate"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Button } from "@ui/button"
import { cx } from "@ui/cva.config"
import { Header, HeaderSubtitle, HeaderTitle } from "@ui/header"
import { LoadingPlaceholder } from "@ui/loading"
import { control, fieldLabel } from "@ui/variants"

export const Route = createFileRoute("/you")({
    head: () => ({ meta: [{ title: "You - Next Bite" }] }),
    component: YouPage,
})

type Restaurant = Doc<"restaurants">

function ProfileForm({
    email,
    initialName,
    heading,
    subheading,
}: Readonly<{ email: string; initialName: string; heading: string; subheading: string }>) {
    const updateProfile = useUpdateProfile()
    const [name, setName] = useState(initialName)
    const [error, setError] = useState<FormError>(clearError)
    const [saved, setSaved] = useState(false)

    const handleSave = async () => {
        setError(clearError)
        setSaved(false)
        const trimmed = name.trim()
        if (trimmed === "") {
            setError({ kind: "error", message: "Name cannot be empty" })
            return
        }
        try {
            await updateProfile.mutateAsync({ name: trimmed })
            setSaved(true)
        } catch (err) {
            setError(errorFrom(err, "Could not save your profile"))
        }
    }

    return (
        <section aria-label={heading} className="pt-6">
            <h2 className="font-display text-2xl font-semibold text-balance text-foreground">{heading}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>
            <div className="mt-3 rounded-card border border-border bg-surface p-5 shadow-card">
                <p className="text-sm text-muted-foreground">{email}</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex flex-1 flex-col gap-1.5">
                        <label htmlFor="profile-name" className={fieldLabel()}>
                            Display name
                        </label>
                        <input
                            id="profile-name"
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value)
                            }}
                            maxLength={80}
                            aria-invalid={error.kind === "error"}
                            aria-describedby={error.kind === "error" ? "profile-name-error" : undefined}
                            className={cx(control(), error.kind === "error" && "border-destructive")}
                        />
                        {error.kind === "error" && (
                            <p id="profile-name-error" role="alert" className="text-sm text-destructive">
                                {error.message}
                            </p>
                        )}
                        {saved && <p className="text-sm text-muted-foreground">Saved.</p>}
                    </div>
                    <Button type="button" disabled={updateProfile.isPending} onClick={() => void handleSave()}>
                        Save
                    </Button>
                </div>
            </div>
        </section>
    )
}

function ProfileSection() {
    const auth = useAuth()
    const profile = useMyProfile()

    if (profile === undefined) {
        return (
            <div className="pt-6">
                <LoadingPlaceholder />
            </div>
        )
    }
    if (profile.status === "onboarding") {
        return (
            <ProfileForm
                email={auth.user?.email ?? ""}
                initialName={auth.user?.name ?? ""}
                heading="Complete your profile"
                subheading="Add your name so friends recognize you."
            />
        )
    }
    return (
        <>
            <AvatarSection avatarUrl={profile.profile.avatar?.url ?? undefined} />
            <ProfileForm
                email={profile.profile.email}
                initialName={profile.profile.name}
                heading="Your profile"
                subheading="Only you see this page."
            />
        </>
    )
}

export function AvatarSection({ avatarUrl }: Readonly<{ avatarUrl: string | undefined }>) {
    const updateProfile = useUpdateProfile()
    const [error, setError] = useState<FormError>(clearError)

    const handleAvatar = async (images: ReadonlyArray<ImageRecord>) => {
        const image = images[0]
        if (image === undefined || updateProfile.isPending) {
            return
        }
        setError(clearError)
        try {
            await updateProfile.mutateAsync({ avatar: { url: image.url, storageId: image.storageId } })
        } catch (err) {
            setError(errorFrom(err, "Could not save your photo"))
        }
    }

    return (
        <section aria-label="Profile photo" className="pt-6">
            <div className="mt-3 flex items-center gap-4 rounded-card border border-border bg-surface p-5 shadow-card">
                {avatarUrl !== undefined ? (
                    <LazyImage src={avatarUrl} alt="Your profile photo" className="size-16 rounded-full object-cover" />
                ) : (
                    <div aria-hidden="true" className="size-16 rounded-full bg-surface-muted" />
                )}
                <div className="min-w-0 flex-1">
                    <ImageUpload
                        images={[]}
                        onImagesChange={(updated) => {
                            void handleAvatar(updated)
                        }}
                        maxFiles={1}
                        disabled={updateProfile.isPending}
                    />
                    {error.kind === "error" && (
                        <p role="alert" className="pt-2 text-sm text-destructive">
                            {error.message}
                        </p>
                    )}
                </div>
            </div>
        </section>
    )
}

function PlacesSection({
    title,
    restaurants,
    emptyText,
}: Readonly<{ title: string; restaurants: ReadonlyArray<Restaurant>; emptyText: string }>) {
    return (
        <section aria-label={title} className="pt-8">
            <h2 className="font-display text-2xl font-semibold text-balance text-foreground">
                {title} · {restaurants.length}
            </h2>
            {restaurants.length === 0 ? (
                <p className="pt-2 text-sm text-muted-foreground">{emptyText}</p>
            ) : (
                <ul className="grid gap-3 pt-4 md:grid-cols-2">
                    {restaurants.map((restaurant) => (
                        <li
                            key={restaurant._id}
                            className="rounded-card border border-border bg-surface p-4 shadow-card"
                        >
                            <Link
                                to="/restaurants/$restaurantId"
                                params={{ restaurantId: restaurant._id }}
                                viewTransition
                                className="font-display text-lg font-semibold text-balance text-foreground hover:text-primary"
                            >
                                {restaurant.name}
                            </Link>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {restaurant.cuisine} · {restaurant.address.label}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

function YouContent() {
    const restaurants = useRestaurants()
    const statuses = useMyStatuses()

    if (restaurants === undefined || statuses === undefined) {
        return (
            <div className="pt-4">
                <LoadingPlaceholder />
            </div>
        )
    }
    const saved = orderFeedByRecency(restaurants)
    const byStatus = new Map(statuses.map((s) => [s.restaurantId, s.status]))
    const want = saved.filter((r) => byStatus.get(r._id) === "want")
    const been = saved.filter((r) => byStatus.get(r._id) === "been")

    return (
        <>
            <ProfileSection />
            <PlacesSection
                title="Saved"
                restaurants={saved}
                emptyText="Nothing saved yet. Add your first restaurant from Home."
            />
            <PlacesSection
                title="Want to try"
                restaurants={want}
                emptyText="No wants yet. Tap Want on any restaurant to park it here."
            />
            <PlacesSection
                title="Been"
                restaurants={been}
                emptyText="No visits yet. Mark Been on restaurants you tried."
            />
        </>
    )
}

function YouPage() {
    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>You</HeaderTitle>
                    <HeaderSubtitle>Your profile, saves, wants, and visits.</HeaderSubtitle>
                </Header>
                <SignedOutGate context="your profile">
                    <YouContent />
                </SignedOutGate>
            </PageContainer>
        </PageLayout>
    )
}
