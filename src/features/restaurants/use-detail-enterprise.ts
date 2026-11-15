import { useEffect, useState } from "react"

import { type Id } from "@api/data.model"
import { useGooglePlaceDetails, type Restaurant } from "@core/restaurants"

async function loadGranularDetails(
    fetchDetails: ReturnType<typeof useGooglePlaceDetails>,
    restaurantId: Id<"places">,
): Promise<{ readonly enterprise: EnterpriseDetails; readonly businessStatus: string | undefined } | null> {
    try {
        const [enterpriseResult, proResult] = await Promise.all([
            fetchDetails({ placeId: restaurantId, tier: "enterprise" }),
            fetchDetails({ placeId: restaurantId, tier: "pro" }),
        ])
        return {
            enterprise: "openingHours" in enterpriseResult ? enterpriseResult : {},
            businessStatus: "businessStatus" in proResult ? proResult.businessStatus : undefined,
        }
    } catch {
        return null
    }
}

import { type EnterpriseDetails, formatBusinessStatus } from "./place-details-utils"

type DetailEnterprise = {
    readonly enterpriseDetails: EnterpriseDetails | undefined
    readonly openingHours: EnterpriseDetails["openingHours"]
    readonly enterpriseFailed: boolean
}

export function useDetailEnterprise(restaurant: Restaurant): DetailEnterprise & {
    readonly closedLabel: string | undefined
    readonly showHours: boolean
    readonly setShowHours: (show: boolean) => void
} {
    const fetchDetails = useGooglePlaceDetails()
    const [showHours, setShowHours] = useState(false)
    const [enterprise, setEnterprise] = useState<
        | { readonly status: "loading" }
        | { readonly status: "ready"; readonly details: EnterpriseDetails }
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
        setEnterprise({ status: "loading" })
        setProStatus({ status: "loading" })
        void loadGranularDetails(fetchDetails, restaurant._id).then((outcome) => {
            if (cancelled || outcome === null) {
                if (!cancelled && outcome === null) {
                    setEnterprise({ status: "failed" })
                    setProStatus({ status: "failed" })
                }
                return
            }
            setEnterprise({ status: "ready", details: outcome.enterprise })
            setProStatus({ status: "ready", businessStatus: outcome.businessStatus })
        })
        return () => {
            cancelled = true
        }
        // fetchDetails is the stable mutateAsync function; refetch only when the restaurant changes.
    }, [restaurant._id, googlePlaceId, fetchDetails])

    const enterpriseDetails = enterprise.status === "ready" ? enterprise.details : undefined
    return {
        enterpriseDetails,
        openingHours: enterpriseDetails?.openingHours,
        enterpriseFailed: enterprise.status === "failed",
        closedLabel: proStatus.status === "ready" ? formatBusinessStatus(proStatus.businessStatus) : undefined,
        showHours,
        setShowHours,
    }
}
