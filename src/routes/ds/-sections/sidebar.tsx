import { HouseIcon, MapPinIcon, UsersIcon } from "@phosphor-icons/react"

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from "@ui/sidebar"

import { Demo } from "./demo-frame"

export const sidebarMeta = {
    id: "sidebar",
    group: "Components",
    title: "Sidebar",
    body: "App navigation with a collapsible rail. Menu buttons carry icons, labels, and tooltips when collapsed.",
    importPath: "src/ui/sidebar.tsx",
    anatomy: [
        {
            element: "SidebarProvider",
            description: "Owns the expanded state and shares it through context. Wraps the shell.",
        },
        {
            element: "Sidebar",
            description: "The navigation panel. Collapses to icons or off canvas on small screens.",
        },
        {
            element: "SidebarHeader",
            description: "Brand and trigger at the top of the panel.",
        },
        {
            element: "SidebarContent",
            description: "The scrollable middle that holds the menus.",
        },
        {
            element: "SidebarMenu",
            description: "A list of navigation items with consistent spacing.",
        },
        {
            element: "SidebarMenuButton",
            description: "One destination. Marks the current page with isActive and explains itself with tooltip.",
        },
    ],
    props: [
        {
            name: "defaultOpen",
            type: "boolean",
            default: "true",
            description: "Starts the panel expanded on the SidebarProvider.",
        },
        {
            name: "collapsible",
            type: '"offcanvas" | "icon" | "none"',
            default: '"offcanvas"',
            description: "How the Sidebar hides on small screens.",
        },
        {
            name: "isActive",
            type: "boolean",
            default: "false",
            description: "Marks the current destination on SidebarMenuButton.",
        },
        {
            name: "tooltip",
            type: "string",
            description: "Names the destination when the rail is collapsed.",
        },
    ],
    variants: [
        { name: "offcanvas", description: "Slides away entirely on small screens." },
        { name: "icon", description: "Shrinks to an icon rail with tooltips." },
        { name: "none", description: "A static panel that never collapses." },
    ],
    guidance: {
        whenToUse:
            "Navigate between top-level areas of the app from a persistent shell. Mark the current destination with isActive and name every destination with a tooltip for the collapsed rail.",
        whenToAvoid:
            "Do not use inside pages or dialogs; navigation lives in the shell only. For in-page peer views, use Tabs; for overflow actions, use a DropdownMenu.",
    },
} as const

export function SidebarDemo() {
    return (
        <Demo>
            <SidebarProvider defaultOpen={true}>
                <Sidebar collapsible="none">
                    <SidebarHeader>
                        <p className="px-3 py-2 font-display text-lg font-semibold text-foreground">Next Bite</p>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton isActive={true} tooltip="Home">
                                    <HouseIcon aria-hidden="true" />
                                    <span>Home</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Places">
                                    <MapPinIcon aria-hidden="true" />
                                    <span>Places</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Friends">
                                    <UsersIcon aria-hidden="true" />
                                    <span>Friends</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>
                </Sidebar>
            </SidebarProvider>
        </Demo>
    )
}
