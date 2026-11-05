import { Tabs as BaseTabs } from "@base-ui/react/tabs"

import { cx } from "@ui/variants"

type TabsValue = string | number

export function Tabs({
    value,
    defaultValue,
    onValueChange,
    children,
}: Readonly<{
    value?: TabsValue | undefined
    defaultValue?: TabsValue | undefined
    onValueChange?: ((value: TabsValue) => void) | undefined
    children?: React.ReactNode | undefined
}>) {
    return (
        <BaseTabs.Root value={value} defaultValue={defaultValue ?? undefined} onValueChange={onValueChange}>
            {children}
        </BaseTabs.Root>
    )
}

export function TabsList({
    className,
    children,
}: Readonly<{ className?: string | undefined; children?: React.ReactNode | undefined }>) {
    return (
        <BaseTabs.List
            data-slot="tabs-list"
            className={cx("inline-flex items-center gap-1 rounded-control bg-stone-100 p-1", className)}
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
}: Readonly<{
    value: TabsValue
    disabled?: boolean | undefined
    className?: string | undefined
    children?: React.ReactNode | undefined
}>) {
    return (
        <BaseTabs.Tab
            value={value}
            disabled={disabled}
            data-slot="tabs-tab"
            className={cx(
                "hit-area-y-2 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors duration-150",
                "hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                "data-active:bg-surface data-active:text-stone-900 data-active:shadow-xs",
                "disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted-foreground",
                className,
            )}
        >
            {children}
        </BaseTabs.Tab>
    )
}

export function TabsPanel({
    value,
    className,
    children,
}: Readonly<{
    value: TabsValue
    className?: string | undefined
    children?: React.ReactNode | undefined
}>) {
    return (
        <BaseTabs.Panel value={value} data-slot="tabs-panel" className={cx("pt-4 outline-none", className)}>
            {children}
        </BaseTabs.Panel>
    )
}
