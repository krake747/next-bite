import { useEffect, useState } from "react"

import { type Id } from "@api/data.model"
import { usePlaceAtmosphere } from "@core/restaurants"
import { GoogleAttribution } from "@pattern/google-attribution"
import { LoadingPlaceholder } from "@pattern/loading"
import { Badge } from "@ui/badge"

const ABOUT_SUMMARY_URL = "https://support.google.com/local-listings/answer/9851099"

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

function flagLabel(value: boolean, positive: string): string {
    if (value) {
        return positive
    }
    return `No ${positive.toLowerCase()}`
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
    | { readonly kind: "loading" }
    | { readonly kind: "ready"; readonly data: AtmosphereDataShape }
    | { readonly kind: "failed" }

type AtmosphereDataShape = {
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
    const [state, setState] = useState<AtmosphereState>({ kind: "loading" })

    useEffect(() => {
        if (googlePlaceId === undefined || googlePlaceId === "") {
            // No-op cleanup keeps both effect paths returning a function.
            return () => {}
        }
        let cancelled = false
        setState({ kind: "loading" })
        fetchAtmosphere({ placeId })
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
    if (state.kind === "loading") {
        return (
            <div className="rounded-card border border-border bg-surface p-4 shadow-card">
                <LoadingPlaceholder />
            </div>
        )
    }
    if (state.kind === "failed") {
        return null
    }
    const { editorialSummary, reviewSummary, servesVegetarianFood, goodForGroups, reservable } = state.data
    if (
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
            <AtmosphereFlags
                flags={{ servesVegetarianFood, goodForGroups, reservable }}
                editorialSummary={editorialSummary}
                reviewSummary={reviewSummary}
            />
        </div>
    )
}
