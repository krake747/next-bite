import { Menu as BaseMenu } from "@base-ui/react/menu"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cx } from "@ui/cva.config"

export function DropdownMenu({ ...props }: BaseMenu.Root.Props) {
    return <BaseMenu.Root data-slot="dropdown-menu" {...props} />
}

export function DropdownMenuTrigger({ ...props }: BaseMenu.Trigger.Props) {
    return <BaseMenu.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

export function DropdownMenuContent({
    align = "start",
    alignOffset = 0,
    side = "bottom",
    sideOffset = 4,
    className,
    ...props
}: BaseMenu.Popup.Props &
    Pick<BaseMenu.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset"> & {
        readonly children?: React.ReactNode | undefined
    }) {
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
                />
            </BaseMenu.Positioner>
        </BaseMenu.Portal>
    )
}

export function DropdownMenuItem({
    render,
    active = false,
    className,
    inset,
    variant = "default",
    children,
    ...props
}: useRender.ComponentProps<"div"> &
    Omit<React.ComponentProps<"div">, "children"> & {
        readonly active?: boolean
        readonly children?: React.ReactNode | undefined
        readonly inset?: boolean
        readonly variant?: "default" | "destructive"
    }) {
    const comp = useRender({
        defaultTagName: "div",
        props: mergeProps<"div">(
            {
                children,
                className: cx(
                    "group/dropdown-menu-item relative flex cursor-default items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground outline-hidden select-none hover:bg-surface-muted focus:bg-surface-muted focus:text-foreground not-data-[variant=destructive]:focus:**:text-foreground data-inset:pl-9.5 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50 data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground data-active:hover:bg-sidebar-accent data-active:focus:bg-sidebar-accent data-active:focus:text-sidebar-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",
                    className,
                ),
            },
            props,
        ),
        render: <BaseMenu.Item render={render} />,
        state: {
            slot: "dropdown-menu-item",
            active,
            inset,
            variant,
        },
    })
    return comp
}
