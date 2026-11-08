import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip"

import { cx } from "@ui/cva.config"

export function TooltipProvider({ delay = 0, ...props }: BaseTooltip.Provider.Props) {
    return <BaseTooltip.Provider data-slot="tooltip-provider" delay={delay} {...props} />
}

export function Tooltip({ ...props }: BaseTooltip.Root.Props) {
    return <BaseTooltip.Root data-slot="tooltip" {...props} />
}

export function TooltipTrigger({ ...props }: BaseTooltip.Trigger.Props) {
    return <BaseTooltip.Trigger data-slot="tooltip-trigger" {...props} />
}

export function TooltipContent({
    className,
    side = "top",
    sideOffset = 4,
    align = "center",
    alignOffset = 0,
    children,
    ...props
}: BaseTooltip.Popup.Props & Pick<BaseTooltip.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
    return (
        <BaseTooltip.Portal>
            <BaseTooltip.Positioner
                align={align}
                alignOffset={alignOffset}
                side={side}
                sideOffset={sideOffset}
                className="isolate z-50"
            >
                <BaseTooltip.Popup
                    data-slot="tooltip-content"
                    className={cx(
                        "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-card bg-foreground px-3 py-1.5 text-xs text-background transition-[opacity,scale,translate] data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 data-[side=bottom]:data-starting-style:-translate-y-2 data-[side=left]:data-starting-style:translate-x-2 data-[side=right]:data-starting-style:-translate-x-2 data-[side=top]:data-starting-style:translate-y-2",
                        className,
                    )}
                    {...props}
                >
                    {children}
                    <BaseTooltip.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-xs bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
                </BaseTooltip.Popup>
            </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
    )
}
