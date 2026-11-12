import { useRouterState } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { LoadingPlaceholder } from "@pattern/loading"
import { PageContainer } from "@routes/-layouts/page-container"

const ROUTE_PENDING_MS = 400
const ROUTE_PROGRESS_DELAY_MS = 800
export const LOADER_WARM_BUDGET_MS = 300

function RoutePending() {
    return (
        <PageContainer>
            <LoadingPlaceholder />
        </PageContainer>
    )
}

export const pendingOptions = {
    defaultPendingComponent: RoutePending,
    defaultPendingMs: ROUTE_PENDING_MS,
    defaultPendingMinMs: 500,
}

function ProgressBar() {
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(true)
        }, ROUTE_PROGRESS_DELAY_MS)
        return () => {
            clearTimeout(timer)
        }
    }, [])
    if (!visible) {
        return null
    }
    return (
        <div
            role="progressbar"
            aria-label="Loading page"
            data-slot="route-progress"
            className="fixed inset-x-0 top-0 z-50 h-0.5 bg-primary/10"
        >
            <div className="h-full w-full bg-primary motion-safe:animate-pulse" />
        </div>
    )
}

export function RouteProgress() {
    const isLoading = useRouterState({ select: (state) => state.isLoading })
    return isLoading ? <ProgressBar /> : null
}
