import { Link } from "@tanstack/react-router"
import { Suspense } from "react"

import { type SessionStatus } from "@core/session"
import { LoadingPlaceholder } from "@pattern/loading"
import { TextLink } from "@ui/text-link"

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
    if (status.kind === "signed-out") {
        return (
            <p className="pt-6 text-muted-foreground">
                <TextLink render={<Link to="/login" />}>Sign in</TextLink> to see {context}.
            </p>
        )
    }
    if (status.kind !== "ready") {
        return fallback
    }
    return <Suspense fallback={fallback}>{children}</Suspense>
}
