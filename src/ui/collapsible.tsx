// SYNC: docs page lives in src/routes/ds/-sections/collapsible.tsx; keep the demo aligned with this file.
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible"

export function Collapsible({ children, ...props }: BaseCollapsible.Root.Props) {
    return (
        <BaseCollapsible.Root data-slot="collapsible" {...props}>
            {children}
        </BaseCollapsible.Root>
    )
}

export function CollapsibleTrigger({ children, ...props }: BaseCollapsible.Trigger.Props) {
    return (
        <BaseCollapsible.Trigger data-slot="collapsible-trigger" {...props}>
            {children}
        </BaseCollapsible.Trigger>
    )
}

export function CollapsibleContent({ children, ...props }: BaseCollapsible.Panel.Props) {
    return (
        <BaseCollapsible.Panel data-slot="collapsible-content" {...props}>
            {children}
        </BaseCollapsible.Panel>
    )
}
