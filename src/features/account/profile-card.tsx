import { CircleNotchIcon, UploadIcon } from "@phosphor-icons/react"
import { useState } from "react"

import { clearError, errorFrom, type FormError } from "@core/outcome"
import { type ImageRecord } from "@core/restaurants"
import { useMyProfile, useUpdateProfile, useAuth } from "@core/session"
import { ImageUpload } from "@pattern/image-upload"
import { LazyImage } from "@pattern/lazy-image"
import { SettingsRow } from "@pattern/settings-row"
import { Button } from "@ui/button"
import { cx } from "@ui/cva.config"
import { control, focusRing } from "@ui/variants"

function DisplayNameRow({ initialName }: Readonly<{ initialName: string }>) {
    const updateProfile = useUpdateProfile()
    const [baseline, setBaseline] = useState(initialName)
    const [name, setName] = useState(initialName)
    const [error, setError] = useState<FormError>(clearError)

    const handleBlur = async () => {
        const trimmed = name.trim()
        if (trimmed === baseline.trim()) {
            setError(clearError)
            return
        }
        if (trimmed === "") {
            setError({ kind: "error", message: "Name cannot be empty" })
            return
        }
        setError(clearError)
        try {
            await updateProfile.mutateAsync({ name: trimmed })
            setBaseline(trimmed)
        } catch (err) {
            setError(errorFrom(err, "Could not save your details"))
        }
    }

    return (
        <SettingsRow label="Display name" description="How friends see you.">
            <div className="flex w-full flex-col gap-1.5 sm:w-56">
                <input
                    value={name}
                    aria-label="Display name"
                    disabled={updateProfile.isPending}
                    onChange={(event) => {
                        setName(event.target.value)
                    }}
                    onBlur={() => {
                        void handleBlur()
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
            </div>
        </SettingsRow>
    )
}

function ProfileCard({
    email,
    initialName,
    avatarUrl,
    heading,
    subheading,
}: Readonly<{
    email: string
    initialName: string
    avatarUrl: string | undefined
    heading: string
    subheading: string
}>) {
    return (
        <section aria-label={heading}>
            <h2 className="px-4 font-display text-2xl font-semibold text-balance text-foreground">{heading}</h2>
            <p className="mt-1 px-4 text-sm text-muted-foreground">{subheading}</p>
            <div className="mt-3 divide-y divide-border rounded-card border border-border bg-surface px-4 shadow-card">
                <AvatarSection avatarUrl={avatarUrl} name={initialName} />
                <SettingsRow label="Email">
                    <p className="text-sm font-medium text-foreground">{email}</p>
                </SettingsRow>
                <DisplayNameRow initialName={initialName} />
            </div>
        </section>
    )
}

export function UserDetailsSection() {
    const auth = useAuth()
    const profile = useMyProfile()

    if (profile.status === "onboarding") {
        return (
            <ProfileCard
                key="onboarding"
                email={auth.user?.email ?? ""}
                initialName={auth.user?.name ?? ""}
                avatarUrl={undefined}
                heading="Complete your details"
                subheading="Add your name so friends recognize you."
            />
        )
    }
    return (
        <ProfileCard
            key={profile.profile.email}
            email={profile.profile.email}
            initialName={profile.profile.name}
            avatarUrl={profile.profile.avatar?.url}
            heading="Your details"
            subheading="Only you see this page."
        />
    )
}

export function AvatarSection({
    avatarUrl,
    name,
}: Readonly<{ avatarUrl: string | undefined; name?: string | undefined }>) {
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

    const handleRemove = async () => {
        if (updateProfile.isPending) {
            return
        }
        setError(clearError)
        try {
            await updateProfile.mutateAsync({ removeAvatar: true })
        } catch (err) {
            setError(errorFrom(err, "Could not remove your photo"))
        }
    }

    return (
        <div className="flex items-center gap-4 py-4">
            <ImageUpload
                images={[]}
                onImagesChange={(updated) => {
                    void handleAvatar(updated)
                }}
                maxFiles={1}
                // The trigger owns its disabled state so the button stays
                // mounted through the whole upload-then-save flow. Passing the
                // mutation pending state here would unmount the dropzone
                // mid-flow and flash the avatar out and back in.
                disabled={false}
                variant="avatar"
                trigger={({ openPicker, isUploading }) => {
                    const trimmed = name?.trim() ?? ""
                    const initial = trimmed === "" ? undefined : trimmed.charAt(0).toUpperCase()
                    const busy = isUploading || updateProfile.isPending
                    return (
                        <button
                            type="button"
                            onClick={openPicker}
                            disabled={busy}
                            aria-label={avatarUrl === undefined ? "Upload photo" : "Change photo"}
                            className={cx(
                                focusRing(),
                                "group relative size-16 shrink-0 cursor-pointer rounded-full disabled:cursor-wait",
                            )}
                        >
                            {avatarUrl !== undefined ? (
                                <LazyImage
                                    src={avatarUrl}
                                    alt="Your photo"
                                    className="size-16 rounded-full object-cover"
                                />
                            ) : initial === undefined ? (
                                <div aria-hidden="true" className="size-16 rounded-full bg-surface-muted" />
                            ) : (
                                <div
                                    aria-hidden="true"
                                    className="flex size-16 items-center justify-center rounded-full bg-surface-muted font-display text-xl font-semibold text-muted-foreground"
                                >
                                    {initial}
                                </div>
                            )}
                            <span
                                aria-hidden="true"
                                className={cx(
                                    "absolute inset-0 flex items-center justify-center rounded-full bg-scrim/60 transition-opacity",
                                    busy
                                        ? "opacity-100"
                                        : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                                )}
                            >
                                {busy ? (
                                    <CircleNotchIcon className="size-5 animate-spin text-inverse" />
                                ) : (
                                    <UploadIcon className="size-5 text-inverse" />
                                )}
                            </span>
                            <span
                                aria-hidden="true"
                                className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full bg-surface-muted text-muted-foreground ring-2 ring-surface"
                            >
                                <UploadIcon className="size-3" />
                            </span>
                        </button>
                    )
                }}
            />
            <div className="min-w-0 flex-1">
                {avatarUrl !== undefined && (
                    <Button
                        type="button"
                        tone="ghost"
                        size="sm"
                        disabled={updateProfile.isPending}
                        onClick={() => {
                            void handleRemove()
                        }}
                    >
                        Remove photo
                    </Button>
                )}
                {error.kind === "error" && (
                    <p role="alert" className="pt-2 text-sm text-destructive">
                        {error.message}
                    </p>
                )}
            </div>
        </div>
    )
}
