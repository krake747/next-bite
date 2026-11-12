import { createFileRoute, Outlet } from "@tanstack/react-router"

import { DesignSystemShell } from "./-layout/shell"

export const Route = createFileRoute("/ds")({
    component: DesignSystemShellRoute,
})

function DesignSystemShellRoute() {
    return (
        <DesignSystemShell>
            <Outlet />
        </DesignSystemShell>
    )
}
