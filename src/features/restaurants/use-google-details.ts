import { useEffect, useState } from "react"

import { type Id } from "@api/data.model"
import { useGooglePlaceDetails, type Restaurant } from "@core/restaurants"

import { type GoogleDetails, formatBusinessStatus } from "./google-details-utils"

async function loadGranularDetails(
    fetchDetails: ReturnType<typeof useGooglePlaceDetails>,
    restaurantId: Id<"places">,
): Promise<{ readonly details: GoogleDetails; readonly businessStatus: string | undefined } | null> {
    try {
        const [enterpriseResult, proResult] = await Promise.all([
            fetchDetails({ placeId: restaurantId, tier: "enterprise" }),
            fetchDetails({ placeId: restaurantId, tier: "pro" }),
        ])
        return {
            details: "openingHours" in enterpriseResult ? enterpriseResult : {},
            businessStatus: "businessStatus" in proResult ? proResult.businessStatus : undefined,
        }
    } catch {
        return null
    }
}

type GoogleDetailsState = {
    readonly details: GoogleDetails | undefined
    readonly openingHours: GoogleDetails["openingHours"]
    readonly detailsFailed: boolean
}

export function useGoogleDetails(restaurant: Restaurant): GoogleDetailsState & {
    readonly closedLabel: string | undefined
    readonly showHours: boolean
    readonly setShowHours: (show: boolean) => void
} {
    const fetchDetails = useGooglePlaceDetails()
    const [showHours, setShowHours] = useState(false)
    const [google, setGoogle] = useState<
        | { readonly status: "loading" }
        | { readonly status: "ready"; readonly details: GoogleDetails }
        | { readonly status: "failed" }
    >({ status: "loading" })
    const [proStatus, setProStatus] = useState<
        | { readonly status: "loading" }
        | { readonly status: "ready"; readonly businessStatus: string | undefined }
        | { readonly status: "failed" }
    >({ status: "loading" })

    const googlePlaceId = restaurant.address.google?.placeId

    useEffect(() => {
        let cancelled = false
        if (googlePlaceId === undefined || googlePlaceId === "") {
            return () => {
                cancelled = true
            }
        }
        setGoogle({ status: "loading" })
        setProStatus({ status: "loading" })
        void loadGranularDetails(fetchDetails, restaurant._id).then((outcome) => {
            if (cancelled || outcome === null) {
                if (!cancelled && outcome === null) {
                    setGoogle({ status: "failed" })
                    setProStatus({ status: "failed" })
                }
                return
            }
            setGoogle({ status: "ready", details: outcome.details })
            setProStatus({ status: "ready", businessStatus: outcome.businessStatus })
        })
        return () => {
            cancelled = true
        }
        // fetchDetails is the stable mutateAsync function; refetch only when the restaurant changes.
    }, [restaurant._id, googlePlaceId, fetchDetails])

    const details = google.status === "ready" ? google.details : undefined
    return {
        details,
        openingHours: details?.openingHours,
        detailsFailed: google.status === "failed",
        closedLabel: proStatus.status === "ready" ? formatBusinessStatus(proStatus.businessStatus) : undefined,
        showHours,
        setShowHours,
    }
}
