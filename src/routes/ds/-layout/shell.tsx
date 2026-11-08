import { ForkKnifeIcon } from "@phosphor-icons/react"
import { Link } from "@tanstack/react-router"

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
} from "@ui/sidebar"
import { TooltipProvider } from "@ui/tooltip"

import { DesignSystemNav } from "./nav"

export function DesignSystemShell({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <TooltipProvider>
            <SidebarProvider>
                <Sidebar collapsible="offcanvas">
                    <SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton size="lg" render={<Link to="/ds" />}>
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-tomato-100 text-tomato-600">
                                        <ForkKnifeIcon className="size-4" aria-hidden="true" />
                                    </span>
                                    <span className="truncate text-base font-semibold">Design system</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>
                    <SidebarContent>
                        <DesignSystemNav />
                    </SidebarContent>
                    <SidebarRail />
                </Sidebar>
                <SidebarInset>
                    <header className="flex min-h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:px-4">
                        <SidebarTrigger className="shrink-0 max-md:hidden" />
                        <p className="text-sm font-medium text-foreground">Design system</p>
                    </header>
                    <div className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    )
}
