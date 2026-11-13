import { ListIcon } from "@phosphor-icons/react"
import { useState } from "react"

import { IconButton } from "@ui/icon-button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@ui/sheet"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@ui/sidebar"
import { TooltipProvider } from "@ui/tooltip"

import { DesignSystemMenuList, DesignSystemSidebar } from "./nav"

function DesignSystemMobileMenu() {
    const [open, setOpen] = useState(false)
    return (
        <Sheet
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
            }}
        >
            <SheetTrigger
                render={
                    <IconButton label="Open design system menu" tone="plain" size="sm" className="md:hidden">
                        <ListIcon className="size-5" aria-hidden="true" />
                    </IconButton>
                }
            />
            <SheetContent side="left">
                <SheetTitle>Design system</SheetTitle>
                <div className="overflow-y-auto px-2 pb-6">
                    <DesignSystemMenuList
                        onNavigate={() => {
                            setOpen(false)
                        }}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}

export function DesignSystemShell({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <SidebarProvider>
            <TooltipProvider>
                <div data-slot="ds-shell" className="flex min-h-svh w-full">
                    <DesignSystemSidebar />
                    <SidebarInset>
                        <header className="flex min-h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:px-4">
                            <DesignSystemMobileMenu />
                            <div className="hidden md:block">
                                <SidebarTrigger />
                            </div>
                            <p className="text-sm font-medium text-foreground">Design system</p>
                        </header>
                        <div className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</div>
                    </SidebarInset>
                </div>
            </TooltipProvider>
        </SidebarProvider>
    )
}
