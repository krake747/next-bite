import { Link, useMatchRoute } from "@tanstack/react-router"

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@ui/sidebar"

import { designSystemSections, sectionGroups } from "../-sections/registry"

export function DesignSystemNav() {
    const matchRoute = useMatchRoute()
    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        isActive={matchRoute({ to: "/ds", fuzzy: false }) !== false}
                        render={<Link to="/ds" />}
                    >
                        <span>Overview</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            {sectionGroups.map((group) => (
                <SidebarGroup key={group}>
                    <SidebarGroupLabel>{group}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {Object.values(designSystemSections)
                                .filter((entry) => entry.meta.group === group)
                                .map((entry) => (
                                    <SidebarMenuItem key={entry.meta.id}>
                                        <SidebarMenuButton
                                            isActive={
                                                matchRoute({
                                                    to: "/ds/$sectionId",
                                                    params: { sectionId: entry.meta.id },
                                                }) !== false
                                            }
                                            render={<Link to="/ds/$sectionId" params={{ sectionId: entry.meta.id }} />}
                                        >
                                            <span>{entry.meta.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    )
}
