// SYNC: docs page lives in src/routes/ds/-sections/dropdown-menu.tsx; keep the demo aligned with this file.
import { Menu as BaseMenu } from "@base-ui/react/menu"

import { cva, cx, type VariantProps } from "@ui/cva.config"

export function DropdownMenu({ children, ...props }: Readonly<BaseMenu.Root.Props>) {
    return (
        <BaseMenu.Root data-slot="dropdown-menu" {...props}>
            {children}
        </BaseMenu.Root>
    )
}

export function DropdownMenuTrigger({ render, children, ...props }: Readonly<BaseMenu.Trigger.Props>) {
    if (render !== undefined) {
        return <BaseMenu.Trigger data-slot="dropdown-menu-trigger" render={render} {...props} />
    }
    return (
        <BaseMenu.Trigger data-slot="dropdown-menu-trigger" {...props}>
            {children}
        </BaseMenu.Trigger>
    )
}

export function DropdownMenuContent({
    align = "start",
    alignOffset = 0,
    side = "bottom",
    sideOffset = 4,
    className,
    children,
    ...props
}: BaseMenu.Popup.Props & Pick<BaseMenu.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
    return (
        <BaseMenu.Portal>
            <BaseMenu.Positioner
                className="isolate z-50 outline-none"
                align={align}
                alignOffset={alignOffset}
                side={side}
                sideOffset={sideOffset}
            >
                <BaseMenu.Popup
                    data-slot="dropdown-menu-content"
                    className={cx(
                        "z-50 max-h-(--available-height) w-(--anchor-width) min-w-48 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-panel border border-border bg-surface p-1 text-foreground shadow-popover transition-[opacity,scale,translate] duration-100 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 data-[side=bottom]:data-starting-style:-translate-y-2 data-[side=inline-end]:data-starting-style:-translate-x-2 data-[side=inline-start]:data-starting-style:translate-x-2 data-[side=left]:data-starting-style:translate-x-2 data-[side=right]:data-starting-style:-translate-x-2 data-[side=top]:data-starting-style:translate-y-2",
                        className,
                    )}
                    {...props}
                >
                    {children}
                </BaseMenu.Popup>
            </BaseMenu.Positioner>
        </BaseMenu.Portal>
    )
}

const item = cva({
    base: "group/dropdown-menu-item relative flex cursor-default items-center gap-2 rounded-lg px-3 py-2.5 text-sm outline-hidden select-none data-inset:pl-9.5 data-disabled:pointer-events-none data-disabled:opacity-50 data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground data-active:hover:bg-sidebar-accent data-active:focus:bg-sidebar-accent data-active:focus:text-sidebar-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    variants: {
        variant: {
            default:
                "text-foreground hover:bg-surface-muted focus:bg-surface-muted focus:text-foreground focus:**:text-foreground",
            destructive:
                "text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive focus:**:text-destructive *:[svg]:text-destructive",
        },
    },
    defaultVariants: {
        variant: "default",
    },
})

type DropdownMenuItemProps = VariantProps<typeof item> &
    BaseMenu.Item.Props & {
        readonly active?: boolean
        readonly inset?: boolean
    }

export function DropdownMenuItem({
    active = false,
    variant,
    inset,
    className,
    children,
    ...props
}: DropdownMenuItemProps) {
    return (
        <BaseMenu.Item
            data-slot="dropdown-menu-item"
            data-active={active}
            data-inset={inset}
            className={cx(item({ variant }), className)}
            {...props}
        >
            {children}
        </BaseMenu.Item>
    )
}
