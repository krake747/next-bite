import { AppInitializing, InlineLoading, LoadingPlaceholder } from "@pattern/loading"
import {
    FriendsSkeleton,
    GroupsSkeleton,
    HomeSkeleton,
    ProfileSkeleton,
    RestaurantListsSkeleton,
} from "@routes/-components/page-skeletons"
import { PendingButton } from "@routes/-components/pending-button"

import { Demo } from "./demo-frame"

export const loadingMeta = {
    id: "loading",
    group: "Patterns",
    title: "Loading",
    body: "Pick the smallest wait that fits. Skeletons stand in for content that is coming; spinners mark short waits with no known shape. Never show either when cached data can render.",
    importPath: "src/pattern/loading.tsx",
    anatomy: [
        {
            element: "AppInitializing",
            description:
                "Only while the app cannot yet choose the public or signed-in experience. Never on route changes.",
        },
        {
            element: "Page skeletons",
            description:
                "First paint of a signed-in page with no cached data. Mirror the page layout so nothing jumps.",
        },
        {
            element: "LoadingPlaceholder",
            description: "A section inside a page waits on data with no predictable shape.",
        },
        {
            element: "InlineLoading",
            description: "A small list or field inside a card or dialog is still fetching.",
        },
        {
            element: "PendingButton",
            description: "A submitted action is running. The form stays mounted and the button is busy.",
        },
    ],
} as const

function Example({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
    return (
        <section aria-label={title} className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-balance text-foreground">{title}</h2>
            {children}
        </section>
    )
}

export function LoadingDemo() {
    return (
        <Demo className="space-y-8">
            <Example title="App initializing">
                <AppInitializing className="min-h-64 rounded-card border border-border" />
            </Example>
            <Example title="Section">
                <LoadingPlaceholder />
            </Example>
            <Example title="Inline">
                <InlineLoading>Loading friends…</InlineLoading>
            </Example>
            <Example title="Pending button">
                <div className="flex flex-wrap gap-3">
                    <PendingButton pending={true}>Saving</PendingButton>
                    <PendingButton pending={false}>Save</PendingButton>
                </div>
            </Example>
            <Example title="Home">
                <HomeSkeleton />
            </Example>
            <Example title="Restaurant lists">
                <RestaurantListsSkeleton />
            </Example>
            <Example title="Friends">
                <FriendsSkeleton />
            </Example>
            <Example title="Groups">
                <GroupsSkeleton />
            </Example>
            <Example title="Profile">
                <ProfileSkeleton />
            </Example>
        </Demo>
    )
}
