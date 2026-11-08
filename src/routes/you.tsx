import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import { hasCachedSession } from "@api/auth.store"
import { useSuspenseConvexQuery } from "@api/convex.context"
import { convexQueryOptions, warmQueries } from "@api/convex.options"
import { type Doc } from "@api/data.model"
import { api } from "@api/endpoints"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { useRestaurants, type ImageRecord } from "@core/restaurants"
import { useAuth, useUpdateProfile, useSessionStatus } from "@core/session"
import { orderFeedByRecency } from "@core/social"
import { ImageUpload } from "@pattern/image-upload"
import { LazyImage } from "@pattern/lazy-image"
import { QueryErrorState } from "@pattern/query-error"
import { SessionGate } from "@routes/-components/session-gate"
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
    errorComponent: YouError,
    loader: ({ context }) => {
        if (!hasCachedSession()) {
            return null
        }
        // Owner restaurants ride a live collection, not this cache, so only the
        // profile and status queries warm here.
        warmQueries(context.queryClient, [
            convexQueryOptions(api.users.getMe),
            convexQueryOptions(api.social.listMyStatuses),
        ])
        return null
    },
})

function YouError({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>You</HeaderTitle>
                    <HeaderSubtitle>Your details, saves, wants, and visits.</HeaderSubtitle>
                </Header>
                <QueryErrorState reset={reset} />
            </PageContainer>
        </PageLayout>
    )
}

type Restaurant = Doc<"restaurants">

function UserDetailsForm({
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
            setError(errorFrom(err, "Could not save your details"))
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
                        <label htmlFor="user-name" className={fieldLabel()}>
                            Display name
                        </label>
                        <input
                            id="user-name"
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value)
                            }}
                            maxLength={80}
                            aria-invalid={error.kind === "error"}
                            aria-describedby={error.kind === "error" ? "user-name-error" : undefined}
                            className={cx(control(), error.kind === "error" && "border-destructive")}
                        />
                        {error.kind === "error" && (
                            <p id="user-name-error" role="alert" className="text-sm text-destructive">
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

function UserDetailsSection() {
    const auth = useAuth()
    const profile = useSuspenseConvexQuery(api.users.getMe)

    if (profile.status === "onboarding") {
        return (
            <UserDetailsForm
                email={auth.user?.email ?? ""}
                initialName={auth.user?.name ?? ""}
                heading="Complete your details"
                subheading="Add your name so friends recognize you."
            />
        )
    }
    return (
        <>
            <AvatarSection avatarUrl={profile.profile.avatar?.url} />
            <UserDetailsForm
                email={profile.profile.email}
                initialName={profile.profile.name}
                heading="Your details"
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
        <section aria-label="Your photo" className="pt-6">
            <div className="mt-3 flex items-center gap-4 rounded-card border border-border bg-surface p-5 shadow-card">
                {avatarUrl !== undefined ? (
                    <LazyImage src={avatarUrl} alt="Your photo" className="size-16 rounded-full object-cover" />
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

function RestaurantsSection({
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
    const statuses = useSuspenseConvexQuery(api.social.listMyStatuses)

    if (restaurants === undefined) {
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
            <UserDetailsSection />
            <RestaurantsSection
                title="Saved"
                restaurants={saved}
                emptyText="Nothing saved yet. Add your first restaurant from Home."
            />
            <RestaurantsSection
                title="Want to try"
                restaurants={want}
                emptyText="No wants yet. Tap Want on any restaurant to park it here."
            />
            <RestaurantsSection
                title="Been"
                restaurants={been}
                emptyText="No visits yet. Mark Been on restaurants you tried."
            />
        </>
    )
}

function YouPage() {
    const status = useSessionStatus()

    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>You</HeaderTitle>
                    <HeaderSubtitle>Your details, saves, wants, and visits.</HeaderSubtitle>
                </Header>
                <SessionGate status={status} context="your details">
                    <YouContent />
                </SessionGate>
            </PageContainer>
        </PageLayout>
    )
}
