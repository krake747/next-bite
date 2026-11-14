import { useEffect, useState } from "react"

import { type Id } from "@api/data.model"
import { env } from "@core/env"
import { usePlaceAtmosphere } from "@core/restaurants"
import { keysForPhotoUrls } from "@pattern/gallery"
import { GoogleAttribution } from "@pattern/google-attribution"
import { LazyImage } from "@pattern/lazy-image"
import { LoadingPlaceholder } from "@pattern/loading"
import { Badge } from "@ui/badge"

export const ABOUT_SUMMARY_URL = "https://support.google.com/local-listings/answer/9851099"

export type AtmospherePhoto = {
    readonly name: string
    readonly widthPx?: number | undefined
    readonly heightPx?: number | undefined
    readonly authorDisplayName?: string | undefined
    readonly authorUri?: string | undefined
    readonly authorPhotoUri?: string | undefined
    readonly flagContentUri?: string | undefined
    readonly googleMapsUri?: string | undefined
}

export type AtmosphereReviewSummary = {
    readonly text?: string | undefined
    readonly disclosureText?: string | undefined
    readonly flagContentUri?: string | undefined
    readonly reviewsUri?: string | undefined
}

export type AtmosphereEditorial = {
    readonly text: string
}

export type AtmosphereFlagValues = {
    readonly servesVegetarianFood?: boolean | undefined
    readonly goodForGroups?: boolean | undefined
    readonly reservable?: boolean | undefined
}

export function googlePhotoMediaUrl(name: string, apiKey: string): string {
    return `https://places.googleapis.com/v1/${name}/media?maxHeightPx=1200&maxWidthPx=1600&key=${apiKey}`
}

function flagLabel(value: boolean | undefined, positive: string): string {
    if (value === true) {
        return positive
    }
    if (value === false) {
        return `No ${positive.toLowerCase()}`
    }
    return `${positive} (not listed)`
}

function PhotoAuthor({ photo }: Readonly<{ photo: AtmospherePhoto }>) {
    if (photo.authorDisplayName === undefined || photo.authorDisplayName === "") {
        return <p className="truncate">Google contributor</p>
    }
    if (photo.authorUri !== undefined && photo.authorUri !== "") {
        return (
            <p className="truncate text-foreground">
                <a
                    href={photo.authorUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                >
                    {photo.authorDisplayName}
                </a>
            </p>
        )
    }
    return <p className="truncate text-foreground">{photo.authorDisplayName}</p>
}

function PhotoLinks({ photo }: Readonly<{ photo: AtmospherePhoto }>) {
    if (
        (photo.googleMapsUri === undefined || photo.googleMapsUri === "") &&
        (photo.flagContentUri === undefined || photo.flagContentUri === "")
    ) {
        return null
    }
    return (
        <p className="flex flex-wrap gap-x-2 gap-y-1">
            {photo.googleMapsUri !== undefined && photo.googleMapsUri !== "" && (
                <a
                    href={photo.googleMapsUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                >
                    Source
                </a>
            )}
            {photo.flagContentUri !== undefined && photo.flagContentUri !== "" && (
                <a
                    href={photo.flagContentUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                >
                    Report
                </a>
            )}
        </p>
    )
}

export function GooglePhotoGallery({
    photos,
    apiKey,
}: Readonly<{ photos: ReadonlyArray<AtmospherePhoto>; apiKey: string }>) {
    if (photos.length === 0) {
        return null
    }
    const urls = photos.map((photo) => googlePhotoMediaUrl(photo.name, apiKey))
    const keys = keysForPhotoUrls(urls)
    return (
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-balance text-foreground">Google photos</h2>
                <GoogleAttribution />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3">
                {photos.map((photo, index) => (
                    <figure key={keys[index] ?? photo.name} className="overflow-hidden rounded-lg border border-border">
                        <div className="aspect-square overflow-hidden">
                            <LazyImage
                                src={urls[index]}
                                alt={photo.authorDisplayName ?? "Google place photo"}
                                ratio={1 / 1}
                            />
                        </div>
                        <figcaption className="space-y-1 p-2 text-xs text-muted-foreground">
                            <PhotoAuthor photo={photo} />
                            <PhotoLinks photo={photo} />
                        </figcaption>
                    </figure>
                ))}
            </div>
        </div>
    )
}

function FlagBadges({ flags }: Readonly<{ flags: AtmosphereFlagValues }>) {
    if (
        flags.servesVegetarianFood === undefined &&
        flags.goodForGroups === undefined &&
        flags.reservable === undefined
    ) {
        return null
    }
    return (
        <div className="flex flex-wrap gap-2 pt-3">
            {flags.servesVegetarianFood !== undefined && (
                <Badge tone={flags.servesVegetarianFood ? "success" : "neutral"}>
                    {flagLabel(flags.servesVegetarianFood, "Vegetarian food")}
                </Badge>
            )}
            {flags.goodForGroups !== undefined && (
                <Badge tone={flags.goodForGroups ? "success" : "neutral"}>
                    {flagLabel(flags.goodForGroups, "Good for groups")}
                </Badge>
            )}
            {flags.reservable !== undefined && (
                <Badge tone={flags.reservable ? "success" : "neutral"}>
                    {flagLabel(flags.reservable, "Reservable")}
                </Badge>
            )}
        </div>
    )
}

function ReviewSummaryLinks({ reviewSummary }: Readonly<{ reviewSummary: AtmosphereReviewSummary }>) {
    return (
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <a
                href={ABOUT_SUMMARY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline"
            >
                About this summary
            </a>
            {reviewSummary.flagContentUri !== undefined && reviewSummary.flagContentUri !== "" && (
                <a
                    href={reviewSummary.flagContentUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                >
                    Report summary
                </a>
            )}
            {reviewSummary.reviewsUri !== undefined && reviewSummary.reviewsUri !== "" && (
                <a
                    href={reviewSummary.reviewsUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                >
                    See reviews
                </a>
            )}
        </p>
    )
}

function ReviewSummaryBlock({ reviewSummary }: Readonly<{ reviewSummary?: AtmosphereReviewSummary | undefined }>) {
    if (reviewSummary === undefined || (reviewSummary.text ?? "") === "") {
        return null
    }
    return (
        <div className="mt-3 border-t border-border pt-3">
            <h3 className="text-sm font-semibold text-foreground">Review summary</h3>
            <p className="text-body mt-1 leading-relaxed text-pretty text-foreground">{reviewSummary.text}</p>
            {reviewSummary.disclosureText !== undefined && reviewSummary.disclosureText !== "" && (
                <p className="mt-2 text-xs text-muted-foreground">{reviewSummary.disclosureText}</p>
            )}
            <ReviewSummaryLinks reviewSummary={reviewSummary} />
        </div>
    )
}

export function AtmosphereFlags({
    flags,
    editorialSummary,
    reviewSummary,
}: Readonly<{
    flags: AtmosphereFlagValues
    editorialSummary?: AtmosphereEditorial | undefined
    reviewSummary?: AtmosphereReviewSummary | undefined
}>) {
    const hasFlags =
        flags.servesVegetarianFood !== undefined || flags.goodForGroups !== undefined || flags.reservable !== undefined
    const hasSummary =
        (editorialSummary?.text ?? "") !== "" ||
        (reviewSummary?.text ?? "") !== "" ||
        (reviewSummary?.disclosureText ?? "") !== ""
    if (!hasFlags && !hasSummary) {
        return null
    }
    return (
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-balance text-foreground">Good to know</h2>
                <GoogleAttribution />
            </div>
            <FlagBadges flags={flags} />
            {editorialSummary !== undefined && editorialSummary.text !== "" && (
                <p className="text-body mt-3 leading-relaxed text-pretty text-foreground">{editorialSummary.text}</p>
            )}
            <ReviewSummaryBlock reviewSummary={reviewSummary} />
        </div>
    )
}

type AtmosphereState =
    | { readonly kind: "idle" }
    | { readonly kind: "loading" }
    | { readonly kind: "ready"; readonly data: AtmosphereDataShape }
    | { readonly kind: "failed" }

type AtmosphereDataShape = {
    readonly photos: ReadonlyArray<AtmospherePhoto>
    readonly editorialSummary?: AtmosphereEditorial | undefined
    readonly reviewSummary?: AtmosphereReviewSummary | undefined
    readonly servesVegetarianFood?: boolean | undefined
    readonly goodForGroups?: boolean | undefined
    readonly reservable?: boolean | undefined
}

export function PlaceAtmosphere({
    placeId,
    googlePlaceId,
}: Readonly<{ placeId: Id<"places">; googlePlaceId: string | undefined }>) {
    const fetchAtmosphere = usePlaceAtmosphere()
    const [state, setState] = useState<AtmosphereState>({ kind: "idle" })

    useEffect(() => {
        if (googlePlaceId === undefined || googlePlaceId === "") {
            return () => {}
        }
        let cancelled = false
        setState({ kind: "loading" })
        fetchAtmosphere
            .mutateAsync({ placeId })
            .then((data) => {
                if (!cancelled) {
                    setState({ kind: "ready", data })
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setState({ kind: "failed" })
                }
            })
        return () => {
            cancelled = true
        }
    }, [fetchAtmosphere, placeId, googlePlaceId])

    if (googlePlaceId === undefined || googlePlaceId === "") {
        return null
    }
    if (state.kind === "idle" || state.kind === "loading") {
        return (
            <div className="rounded-card border border-border bg-surface p-4 shadow-card">
                <LoadingPlaceholder />
            </div>
        )
    }
    if (state.kind === "failed") {
        return null
    }
    const { photos, editorialSummary, reviewSummary, servesVegetarianFood, goodForGroups, reservable } = state.data
    if (
        photos.length === 0 &&
        servesVegetarianFood === undefined &&
        goodForGroups === undefined &&
        reservable === undefined &&
        (editorialSummary?.text ?? "") === "" &&
        (reviewSummary?.text ?? "") === ""
    ) {
        return null
    }
    return (
        <div className="space-y-6">
            <GooglePhotoGallery photos={photos} apiKey={env.VITE_GOOGLE_MAPS_API_KEY} />
            <AtmosphereFlags
                flags={{ servesVegetarianFood, goodForGroups, reservable }}
                editorialSummary={editorialSummary}
                reviewSummary={reviewSummary}
            />
        </div>
    )
}
