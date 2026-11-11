// SYNC: docs page lives in src/routes/ds/-sections/tabs.tsx; keep the demo aligned with this file.
import { Tabs as BaseTabs } from "@base-ui/react/tabs"

import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

type TabsValue = string | number

export function Tabs({
    value,
    defaultValue,
    onValueChange,
    children,
    ...props
}: Readonly<
    Omit<React.ComponentProps<typeof BaseTabs.Root>, "value" | "defaultValue" | "onValueChange"> & {
        readonly value?: TabsValue | undefined
        readonly defaultValue?: TabsValue | undefined
        readonly onValueChange?: ((value: TabsValue) => void) | undefined
    }
>) {
    return (
        <BaseTabs.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} {...props}>
            {children}
        </BaseTabs.Root>
    )
}

export function TabsList({ className, children, ...props }: Readonly<React.ComponentProps<typeof BaseTabs.List>>) {
    return (
        <BaseTabs.List
            data-slot="tabs-list"
            className={cx("inline-flex items-center gap-1 rounded-control bg-stone-100 p-1", className)}
            {...props}
        >
            {children}
        </BaseTabs.List>
    )
}

export function TabsTab({
    value,
    disabled,
    className,
    children,
    ...props
}: Readonly<
    Omit<React.ComponentProps<typeof BaseTabs.Tab>, "value"> & {
        readonly value: TabsValue
    }
>) {
    return (
        <BaseTabs.Tab
            value={value}
            disabled={disabled}
            data-slot="tabs-tab"
            className={cx(
                focusRing(),
                "hit-area-y-2 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors duration-150",
                "hover:text-stone-900",
                "data-active:bg-surface data-active:text-stone-900 data-active:shadow-xs",
                "disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted-foreground",
                className,
            )}
            {...props}
        >
            {children}
        </BaseTabs.Tab>
    )
}

export function TabsPanel({
    value,
    className,
    children,
    ...props
}: Readonly<
    Omit<React.ComponentProps<typeof BaseTabs.Panel>, "value"> & {
        readonly value: TabsValue
    }
>) {
    return (
        <BaseTabs.Panel value={value} data-slot="tabs-panel" className={cx("pt-4 outline-none", className)} {...props}>
            {children}
        </BaseTabs.Panel>
    )
}
