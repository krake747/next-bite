import { Suspense } from "react"

import { type SessionStatus } from "@core/session"
import { LoadingPlaceholder } from "@ui/loading"

import { SignedOutGate } from "./signed-out-gate"

export function SessionGate({
    status,
    context,
    children,
}: Readonly<{ status: SessionStatus; context: string; children: React.ReactNode }>): React.ReactNode {
    if (status.kind !== "ready") {
        return (
            <SignedOutGate context={context}>
                <div className="pt-6">
                    <LoadingPlaceholder />
                </div>
            </SignedOutGate>
        )
    }
    return (
        <Suspense
            fallback={
                <div className="pt-6">
                    <LoadingPlaceholder />
                </div>
            }
        >
            {children}
        </Suspense>
    )
}
