import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { SidebarSimpleIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"

import { cva, cx, type VariantProps } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/tooltip"

import { cssVars } from "./css-vars"
import { useIsMobile } from "./hooks/use-media-query"
import {
    SidebarContext,
    SIDEBAR_COOKIE_MAX_AGE,
    SIDEBAR_COOKIE_NAME,
    SIDEBAR_KEYBOARD_SHORTCUT,
    SIDEBAR_WIDTH,
    SIDEBAR_WIDTH_ICON,
    useSidebar,
    type SidebarContextProps,
} from "./sidebar.context"

export function SidebarProvider({
    defaultOpen = true,
    open: openProp,
    onOpenChange: setOpenProp,
    className,
    style,
    children,
    ...props
}: React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
}) {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = useState(false)

    const [_open, _setOpen] = useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
            setOpenProp(openState)
        } else {
            _setOpen(openState)
        }

        cookieStore
            .set({
                name: SIDEBAR_COOKIE_NAME,
                value: String(openState),
                path: "/",
                expires: Date.now() + SIDEBAR_COOKIE_MAX_AGE * 1000,
            })
            .catch(console.error)
    }

    const toggleSidebar = () => {
        if (isMobile) {
            setOpenMobile((open) => !open)
        } else {
            setOpen((open) => !open)
        }
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                toggleSidebar()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
        }
    })

    const state = open ? "expanded" : "collapsed"

    const contextValue: SidebarContextProps = {
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
    }

    return (
        <SidebarContext value={contextValue}>
            <div
                data-slot="sidebar-wrapper"
                style={cssVars({
                    "--sidebar-width": SIDEBAR_WIDTH,
                    "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                    ...style,
                })}
                className={cx("group/sidebar-wrapper flex min-h-svh w-full", className)}
                {...props}
            >
                {children}
            </div>
        </SidebarContext>
    )
}

export function Sidebar({
    side = "left",
    variant = "sidebar",
    collapsible = "offcanvas",
    className,
    children,
    ...props
}: React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
}) {
    const { state } = useSidebar()

    if (collapsible === "none") {
        return (
            <div
                data-slot="sidebar"
                className={cx("flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground", className)}
                {...props}
            >
                {children}
            </div>
        )
    }

    return (
        <div
            className="group peer hidden text-sidebar-foreground md:block"
            data-state={state}
            data-collapsible={state === "collapsed" ? collapsible : ""}
            data-variant={variant}
            data-side={side}
            data-slot="sidebar"
        >
            <div
                data-slot="sidebar-gap"
                className={cx(
                    "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-out-quad",
                    "group-data-[collapsible=offcanvas]:w-0",
                    "group-data-[side=right]:rotate-180",
                    variant === "floating" || variant === "inset"
                        ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
                        : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
                )}
            />
            <div
                data-slot="sidebar-container"
                data-side={side}
                className={cx(
                    "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-out-quad data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:-left-(--sidebar-width) data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:-right-(--sidebar-width) md:flex",
                    variant === "floating" || variant === "inset"
                        ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px] p-2"
                        : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=left]:border-sidebar-border group-data-[side=right]:border-l group-data-[side=right]:border-sidebar-border",
                    className,
                )}
                {...props}
            >
                <div
                    data-sidebar="sidebar"
                    data-slot="sidebar-inner"
                    className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
                >
                    {children}
                </div>
            </div>
        </div>
    )
}

export function SidebarTrigger({
    className,
    onClick,
    ...props
}: Omit<React.ComponentProps<typeof IconButton>, "label" | "children">) {
    const { isMobile, toggleSidebar } = useSidebar()
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <IconButton
                        data-sidebar="trigger"
                        data-slot="sidebar-trigger"
                        label="Toggle sidebar"
                        title=""
                        tone="plain"
                        size="sm"
                        className={className}
                        onClick={(event) => {
                            onClick?.(event)
                            toggleSidebar()
                        }}
                        {...props}
                    >
                        <SidebarSimpleIcon aria-hidden="true" />
                    </IconButton>
                }
            />
            <TooltipContent side="right" align="center" hidden={isMobile}>
                Toggle sidebar
            </TooltipContent>
        </Tooltip>
    )
}

export function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
    const { toggleSidebar } = useSidebar()

    return (
        <button
            type="button"
            data-sidebar="rail"
            data-slot="sidebar-rail"
            aria-label="Toggle sidebar"
            tabIndex={-1}
            onClick={toggleSidebar}
            title="Toggle sidebar"
            className={cx(
                "absolute inset-y-0 z-20 hidden w-4 transition-all ease-out-quad group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-0.5 hover:after:bg-sidebar-border sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2",
                "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
                "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
                "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
                "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
                "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
                className,
            )}
            {...props}
        />
    )
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-header"
            data-sidebar="header"
            className={cx("flex flex-col gap-2 p-2", className)}
            {...props}
        />
    )
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-footer"
            data-sidebar="footer"
            className={cx("flex flex-col gap-2 p-2", className)}
            {...props}
        />
    )
}

export function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sidebar-content"
            data-sidebar="content"
            className={cx(
                "no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2 group-data-[collapsible=icon]:overflow-hidden",
                className,
            )}
            {...props}
        />
    )
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
    return (
        <ul
            data-slot="sidebar-menu"
            data-sidebar="menu"
            className={cx("flex w-full min-w-0 flex-col gap-1", className)}
            {...props}
        />
    )
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
    return (
        <li
            data-slot="sidebar-menu-item"
            data-sidebar="menu-item"
            className={cx("group/menu-item relative", className)}
            {...props}
        />
    )
}

const sidebarMenuButtonVariants = cva({
    base: "peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-control px-3 py-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate",
    variants: {
        variant: {
            default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            outline:
                "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
        },
        size: {
            default: "h-9 text-sm",
            sm: "h-8 text-xs",
            lg: "h-14 px-3 text-sm group-data-[collapsible=icon]:p-0!",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
})

export function SidebarMenuButton({
    render,
    isActive = false,
    variant = "default",
    size = "default",
    tooltip,
    className,
    ...props
}: useRender.ComponentProps<"button"> &
    React.ComponentProps<"button"> & {
        isActive?: boolean
        tooltip?: string | React.ComponentProps<typeof TooltipContent>
    } & VariantProps<typeof sidebarMenuButtonVariants>) {
    const { isMobile, state } = useSidebar()
    const comp = useRender({
        defaultTagName: "button",
        props: mergeProps<"button">(
            {
                className: cx(sidebarMenuButtonVariants({ variant, size }), className),
            },
            props,
        ),
        render: tooltip ? <TooltipTrigger render={render} /> : render,
        state: {
            slot: "sidebar-menu-button",
            sidebar: "menu-button",
            size,
            active: isActive,
        },
    })

    if (!tooltip) {
        return comp
    }

    const tooltipProps = typeof tooltip === "string" ? { children: tooltip } : tooltip

    return (
        <Tooltip>
            {comp}
            <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile} {...tooltipProps} />
        </Tooltip>
    )
}
