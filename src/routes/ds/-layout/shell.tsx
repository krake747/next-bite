import { SidebarInset } from "@ui/sidebar"

import { DesignSystemNav } from "./nav"

export function DesignSystemShell({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <div data-slot="ds-shell" className="flex min-h-svh w-full">
            <DesignSystemNav />
            <SidebarInset>
                <header className="flex min-h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:px-4">
                    <p className="text-sm font-medium text-foreground">Design system</p>
                </header>
                <div className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</div>
            </SidebarInset>
        </div>
    )
}
