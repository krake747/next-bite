import { Link } from "@tanstack/react-router"
import { Suspense } from "react"

import { type SessionStatus } from "@core/session"
import { LoadingPlaceholder } from "@pattern/loading"

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
            <p className="pt-6 text-stone-600">
                <Link to="/login" className="font-medium text-tomato-700 hover:underline">
                    Sign in
                </Link>{" "}
                to see {context}.
            </p>
        )
    }
    if (status.kind !== "ready") {
        return fallback
    }
    return <Suspense fallback={fallback}>{children}</Suspense>
}
