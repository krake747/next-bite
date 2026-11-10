import { Suspense } from "react"

import { type SessionStatus } from "@core/session"
import { LoadingPlaceholder } from "@pattern/loading"

import { SignedOutGate } from "./signed-out-gate"

const defaultFallback = (
    <div className="pt-6">
        <LoadingPlaceholder />
    </div>
)

export function SessionGate({
    status,
    context,
    fallback = defaultFallback,
    children,
}: Readonly<{
    status: SessionStatus
    context: string
    fallback?: React.ReactNode
    children: React.ReactNode
}>): React.ReactNode {
    if (status.kind !== "ready") {
        return <SignedOutGate context={context}>{fallback}</SignedOutGate>
    }
    return <Suspense fallback={fallback}>{children}</Suspense>
}
