import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui/tabs"

import { Demo } from "./demo-frame"

export const tabsMeta = {
    id: "tabs",
    group: "Components",
    title: "Tabs",
    body: "Switch between peer views in place. Exactly one panel shows; the tab reports every change.",
    importPath: "src/ui/tabs.tsx",
    anatomy: [
        {
            element: "Tabs",
            description: "Owns the selected value, controlled or with defaultValue.",
        },
        {
            element: "TabsList",
            description: "The segmented row that holds the tabs.",
        },
        {
            element: "TabsTab",
            description: "One choice, named by a stable value.",
        },
        {
            element: "TabsPanel",
            description: "The view for one value. Only the selected panel mounts its content.",
        },
    ],
    props: [
        {
            name: "defaultValue",
            type: "string | number",
            description: "Starts one tab selected in the uncontrolled case.",
        },
        {
            name: "value",
            type: "string | number",
            description: "Controlled selected value on Tabs. Pair with onValueChange.",
        },
        {
            name: "onValueChange",
            type: "(value: string | number) => void",
            description: "Reports every tab change.",
        },
        {
            name: "disabled",
            type: "boolean",
            description: "Disables one tab on TabsTab without removing it.",
        },
    ],
    guidance: {
        whenToUse:
            "Switch between two to four peer views that live at the same level. Exactly one panel shows; name each tab with a stable value.",
        whenToAvoid:
            "Do not use for wizards or sequential steps; those need explicit progress, not tabs. For show-and-hide detail inside one view, use a Collapsible.",
        siblings: [{ id: "collapsible", reason: "Tucked detail uses Collapsible, peer views use Tabs." }],
    },
} as const

export function TabsDemo() {
    return (
        <Demo>
            <Tabs defaultValue="discover">
                <TabsList>
                    <TabsTab value="discover">Discover</TabsTab>
                    <TabsTab value="saved">Saved</TabsTab>
                    <TabsTab value="visited">Visited</TabsTab>
                </TabsList>
                <TabsPanel value="discover">
                    <p className="text-sm text-muted-foreground">New spots your friends keep returning to.</p>
                </TabsPanel>
                <TabsPanel value="saved">
                    <p className="text-sm text-muted-foreground">Every place you marked to try.</p>
                </TabsPanel>
                <TabsPanel value="visited">
                    <p className="text-sm text-muted-foreground">Where you have already been.</p>
                </TabsPanel>
            </Tabs>
        </Demo>
    )
}
