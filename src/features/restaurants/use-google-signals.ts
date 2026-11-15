import { useEffect, useState } from "react"

import { type Id } from "@api/data.model"
import { useGooglePlaceDetails } from "@core/restaurants"

export type GoogleSignals =
    | { readonly status: "idle" }
    | { readonly status: "loading" }
    | {
          readonly status: "ready"
          readonly openState: "open" | "closed" | "unknown"
          readonly priceLevel?: string | undefined
          readonly businessStatus?: string | undefined
      }
    | { readonly status: "failed" }

export function useGoogleSignals(
    restaurantId: Id<"places">,
    googlePlaceId: string | undefined,
    enabled = true,
): GoogleSignals {
    const fetchDetails = useGooglePlaceDetails()
    const [signals, setSignals] = useState<GoogleSignals>({ status: "idle" })

    useEffect(() => {
        let cancelled = false
        if (!enabled || googlePlaceId === undefined || googlePlaceId === "") {
            return () => {
                cancelled = true
            }
        }
        setSignals({ status: "loading" })
        void Promise.all([
            fetchDetails({ placeId: restaurantId, tier: "enterprise" }),
            fetchDetails({ placeId: restaurantId, tier: "pro" }),
        ])
            .then(([enterpriseResult, proResult]) => {
                if (!cancelled) {
                    setSignals({
                        status: "ready",
                        openState:
                            "openingHours" in enterpriseResult ? enterpriseResult.openingHours.openState : "unknown",
                        ...("priceLevel" in enterpriseResult && enterpriseResult.priceLevel !== undefined
                            ? { priceLevel: enterpriseResult.priceLevel }
                            : {}),
                        ...("businessStatus" in proResult && proResult.businessStatus !== undefined
                            ? { businessStatus: proResult.businessStatus }
                            : {}),
                    })
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSignals({ status: "failed" })
                }
            })
        return () => {
            cancelled = true
        }
        // fetchDetails is the stable mutateAsync function; refetch only when the restaurant changes.
    }, [restaurantId, googlePlaceId, enabled, fetchDetails])

    return signals
}
