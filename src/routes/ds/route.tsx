import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { env } from "@core/env"

import { DesignSystemShell } from "./-layout/shell"

export const Route = createFileRoute("/ds")({
    beforeLoad: () => {
        if (!env.DEV) {
            // oxlint-disable-next-line typescript/only-throw-error -- TanStack Router redirects via thrown redirect objects by design
            throw redirect({ to: "/" })
        }
    },
    component: DesignSystemShellRoute,
})

function DesignSystemShellRoute() {
    return (
        <DesignSystemShell>
            <Outlet />
        </DesignSystemShell>
    )
}
