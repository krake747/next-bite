import { createFileRoute, redirect } from "@tanstack/react-router"
import { getSchema } from "cva/tools"
import { useState } from "react"

import { env } from "@core/env"
import { GroupCard } from "@features/groups/group-card"
import { SharedRestaurantList } from "@features/groups/shared-restaurant-list"
import { EmptyRestaurantsState } from "@features/restaurants/empty-restaurants-state"
import { RestaurantHeader } from "@features/restaurants/restaurant-header"
import { RestaurantInterestButton } from "@features/restaurants/restaurant-interest-button"
import { ActivityPost } from "@features/social/activity-post"
import { CommentList } from "@features/social/comment-list"
import { FriendPresence } from "@features/social/friend-presence"
import { PhotoGallery } from "@features/social/photo-gallery"
import { ReactionBar } from "@features/social/reaction-bar"
import { SocialMetadata } from "@features/social/social-metadata"
import { AvatarGroup } from "@pattern/avatar-group"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Avatar } from "@ui/avatar"
import { Badge, badge } from "@ui/badge"
import { Button, button } from "@ui/button"
import { Card } from "@ui/card"
import { Dialog, DialogBackdrop, DialogCloseButton, DialogPanel, DialogTitle } from "@ui/dialog"
import { Input, Textarea, Select } from "@ui/field"
import { Header, HeaderTitle, HeaderSubtitle } from "@ui/header"
import { Popover, PopoverTrigger, PopoverPanel } from "@ui/popover"
import { Skeleton } from "@ui/skeleton"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@ui/tabs"

export const Route = createFileRoute("/design-system")({
    head: () => ({ meta: [{ title: "Design System - Next Bite" }] }),
    beforeLoad: () => {
        if (!env.DEV) {
            // oxlint-disable-next-line typescript/only-throw-error -- TanStack Router redirects via thrown redirect objects by design
            throw redirect({ to: "/" })
        }
    },
    component: DesignSystemPage,
})

function Section({ title, body, children }: Readonly<{ title: string; body: string; children: React.ReactNode }>) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="font-display text-2xl font-semibold text-balance text-stone-900">{title}</h2>
                <p className="mt-1 max-w-2xl text-sm text-pretty text-stone-600">{body}</p>
            </div>
            <Card>
                <div className="flex flex-wrap items-center gap-3 p-5">{children}</div>
            </Card>
        </section>
    )
}

const palette: ReadonlyArray<{ name: string; swatches: ReadonlyArray<{ label: string; className: string }> }> = [
    {
        name: "Tomato",
        swatches: [
            { label: "50", className: "bg-tomato-50" },
            { label: "100", className: "bg-tomato-100" },
            { label: "200", className: "bg-tomato-200" },
            { label: "300", className: "bg-tomato-300" },
            { label: "400", className: "bg-tomato-400" },
            { label: "500", className: "bg-tomato-500" },
            { label: "600", className: "bg-tomato-600" },
            { label: "700", className: "bg-tomato-700" },
            { label: "800", className: "bg-tomato-800" },
            { label: "900", className: "bg-tomato-900" },
        ],
    },
    {
        name: "Stone",
        swatches: [
            { label: "50", className: "bg-stone-50" },
            { label: "100", className: "bg-stone-100" },
            { label: "200", className: "bg-stone-200" },
            { label: "300", className: "bg-stone-300" },
            { label: "400", className: "bg-stone-400" },
            { label: "500", className: "bg-stone-500" },
            { label: "600", className: "bg-stone-600" },
            { label: "700", className: "bg-stone-700" },
            { label: "800", className: "bg-stone-800" },
            { label: "900", className: "bg-stone-900" },
        ],
    },
    {
        name: "Mango",
        swatches: [
            { label: "50", className: "bg-mango-50" },
            { label: "100", className: "bg-mango-100" },
            { label: "200", className: "bg-mango-200" },
            { label: "300", className: "bg-mango-300" },
            { label: "400", className: "bg-mango-400" },
            { label: "500", className: "bg-mango-500" },
            { label: "600", className: "bg-mango-600" },
        ],
    },
    {
        name: "Basil",
        swatches: [
            { label: "50", className: "bg-basil-50" },
            { label: "100", className: "bg-basil-100" },
            { label: "200", className: "bg-basil-200" },
            { label: "300", className: "bg-basil-300" },
            { label: "400", className: "bg-basil-400" },
            { label: "500", className: "bg-basil-500" },
            { label: "600", className: "bg-basil-600" },
        ],
    },
]

function PaletteSection() {
    return (
        <Section
            title="Colour palette"
            body="Tomato and Butter, supported by Basil and Plum on warm Stone neutrals. Components use the semantic tokens; primitives stay reserved for brand graphics."
        >
            <div className="grid w-full gap-4 sm:grid-cols-2">
                {palette.map((family) => (
                    <div key={family.name}>
                        <p className="mb-2 text-sm font-medium text-stone-700">{family.name}</p>
                        <div className="flex overflow-hidden rounded-lg border border-border">
                            {family.swatches.map((swatch) => (
                                <div
                                    key={swatch.label}
                                    title={`${family.name} ${swatch.label}`}
                                    className={`h-10 flex-1 ${swatch.className}`}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                <div>
                    <p className="mb-2 text-sm font-medium text-stone-700">Semantic tokens</p>
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-background px-3 py-1 text-xs ring-1 ring-border">
                            background
                        </span>
                        <span className="rounded-full bg-surface px-3 py-1 text-xs ring-1 ring-border">surface</span>
                        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs">surface-muted</span>
                        <span className="rounded-full bg-surface-accent px-3 py-1 text-xs">surface-accent</span>
                        <span className="rounded-full bg-primary px-3 py-1 text-xs text-white">primary</span>
                        <span className="rounded-full bg-success px-3 py-1 text-xs text-white">success</span>
                        <span className="rounded-full bg-warning px-3 py-1 text-xs text-white">warning</span>
                        <span className="rounded-full bg-destructive px-3 py-1 text-xs text-white">destructive</span>
                        <span className="rounded-full bg-plum px-3 py-1 text-xs text-white">plum accent</span>
                    </div>
                </div>
            </div>
        </Section>
    )
}

function TypographySection() {
    return (
        <Section
            title="Typography"
            body="Bricolage Grotesque for display, DM Sans for interface. Utilities only; no named display styles."
        >
            <div className="w-full space-y-3">
                <p className="font-display text-2xl font-semibold text-balance text-stone-900">
                    What&apos;s the next bite?
                </p>
                <p className="text-body text-stone-700">Good food. Great company.</p>
                <p className="text-sm text-stone-600">Body small for secondary content and metadata.</p>
                <p className="text-xs text-stone-600">Caption for timestamps and counts.</p>
            </div>
        </Section>
    )
}

function ShapeSection() {
    return (
        <Section
            title="Shape and elevation"
            body="Restrained radius per surface, borders over heavy shadows, warm-tinted elevations."
        >
            <div className="flex flex-wrap gap-3">
                <div className="rounded-control border border-border bg-surface px-4 py-2 text-sm">control 10px</div>
                <div className="rounded-panel border border-border bg-surface px-4 py-2 text-sm">panel 14px</div>
                <div className="rounded-card border border-border bg-surface px-4 py-2 text-sm">card 16px</div>
                <div className="rounded-dialog border border-border bg-surface px-4 py-2 text-sm">dialog 20px</div>
                <div className="rounded-card border border-border bg-surface px-4 py-2 text-sm shadow-card">
                    card shadow
                </div>
                <div className="rounded-card border border-border bg-surface px-4 py-2 text-sm shadow-popover">
                    popover shadow
                </div>
                <div className="rounded-card border border-border bg-surface px-4 py-2 text-sm shadow-dialog">
                    dialog shadow
                </div>
            </div>
        </Section>
    )
}

const buttonSchema = getSchema(button)
const badgeSchema = getSchema(badge)

const variantLabels: Record<string, string> = {
    primary: "Primary",
    secondary: "Secondary",
    outline: "Outline",
    ghost: "Ghost",
    destructive: "Destructive",
    neutral: "neutral",
    brand: "Want to try",
    success: "Been there",
    accent: "Pizza Lovers",
}

function ButtonsSection() {
    return (
        <Section
            title="Buttons"
            body="Primary is Tomato and reserved for the main action. Ghost stays chromeless. Every button carries a visible focus ring and an active press."
        >
            {buttonSchema.variant.values.map((variant) => (
                <Button key={variant} variant={variant}>
                    {variantLabels[variant]}
                </Button>
            ))}
            {buttonSchema.size.values.map((size) =>
                size === "icon" ? (
                    <Button key={size} size={size} aria-label="Add">
                        +
                    </Button>
                ) : (
                    <Button key={size} size={size}>
                        {size === "sm" ? "Small" : "Default"}
                    </Button>
                ),
            )}
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
        </Section>
    )
}

function FieldsSection() {
    return (
        <Section
            title="Inputs"
            body="Shared control treatment with error and disabled states. Select is Base UI under the same field API."
        >
            <div className="grid w-full gap-4 sm:grid-cols-2">
                <Input
                    input=""
                    errors={null}
                    label="Name"
                    placeholder="Trattoria Verde"
                    name="demo"
                    autoFocus={false}
                    onFocus={() => {}}
                    onBlur={() => {}}
                    onChange={() => {}}
                    ref={() => {}}
                />
                <Textarea
                    input=""
                    errors={null}
                    label="Notes"
                    placeholder="Why is it worth trying?"
                    name="demo"
                    autoFocus={false}
                    onFocus={() => {}}
                    onBlur={() => {}}
                    onChange={() => {}}
                    ref={() => {}}
                />
                <Select
                    input=""
                    errors={null}
                    label="Cuisine"
                    options={[
                        { value: "", label: "Select cuisine" },
                        { value: "italian", label: "Italian" },
                    ]}
                    name="demo"
                    autoFocus={false}
                    onFocus={() => {}}
                    onBlur={() => {}}
                    onChange={() => {}}
                    ref={() => {}}
                />
                <Input
                    input="Not an email"
                    errors={["Enter a valid email"]}
                    label="Email with error"
                    name="demo"
                    autoFocus={false}
                    onFocus={() => {}}
                    onBlur={() => {}}
                    onChange={() => {}}
                    ref={() => {}}
                />
            </div>
        </Section>
    )
}

function CardsBadgesSection() {
    return (
        <Section
            title="Cards and badges"
            body="Cards stay white on cream with one border and one quiet shadow. Badges are restrained labels: Tomato for want, Basil for been, never colour alone."
        >
            <Card className="max-w-sm">
                <div className="p-4">
                    <p className="font-display text-lg font-semibold text-balance text-stone-900">Card default</p>
                    <p className="mt-1 text-sm text-pretty text-stone-600">White surface, Stone border, card shadow.</p>
                </div>
            </Card>
            <div className="flex flex-wrap gap-2">
                {badgeSchema.variant.values.map((variant) => (
                    <Badge key={variant} variant={variant}>
                        {variantLabels[variant] ?? variant}
                    </Badge>
                ))}
            </div>
            <Skeleton className="h-16 w-48" />
        </Section>
    )
}

function AvatarsSection() {
    const friends = [{ name: "Alex" }, { name: "Priya" }, { name: "Jamie" }, { name: "Leo" }, { name: "Noor" }]
    return (
        <Section
            title="Avatars and presence"
            body="Circular friends with initials fallback. Groups collapse to four plus an overflow count. Presence is display-only."
        >
            <div className="flex items-end gap-3">
                <Avatar name="Alex" size="xs" />
                <Avatar name="Priya" size="sm" />
                <Avatar name="Jamie" size="md" />
                <Avatar name="Leo" size="lg" presence />
                <Avatar name="Noor" size="xl" ring="surface" />
            </div>
            <AvatarGroup members={friends} />
            <span className="inline-flex items-center gap-2 text-sm text-stone-600">
                <FriendPresence active /> Alex is active
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-stone-600">
                <FriendPresence /> Priya is away
            </span>
        </Section>
    )
}

function SocialSection() {
    return (
        <Section
            title="Social primitives"
            body="Human language over database terms. Counts update optimistically in the app; here the callbacks are illustrative."
        >
            <div className="w-full space-y-4">
                <SocialMetadata ownerName="Alex" wantCount={4} beenCount={1} />
                <ReactionBar
                    reactions={{
                        liked: true,
                        likeCount: 3,
                        onToggleLike: () => {},
                        commentCount: 2,
                        onComment: () => {},
                        wanted: true,
                        wantCount: 4,
                        onToggleWant: () => {},
                    }}
                />
                <CommentList
                    comments={[
                        { id: "c1", author: "Alex", text: "The pasta is unreal.", time: "2h ago" },
                        { id: "c2", author: "Priya", text: "Going Friday!", time: "1h ago" },
                    ]}
                    currentUser="Alex"
                    onAdd={() => {}}
                    onDelete={() => {}}
                />
            </div>
        </Section>
    )
}

function ActivitySection() {
    return (
        <Section
            title="Activity and photos"
            body="A feed post reads like a friend's discovery. Galleries attribute every photo and open the shared viewer."
        >
            <div className="w-full max-w-xl space-y-4">
                <ActivityPost
                    author={{ name: "Alex" }}
                    time="2 hours ago"
                    text="You have to try this place."
                    restaurant={{ name: "Trattoria Verde", cuisine: "Italian" }}
                    social={{ ownerName: "Alex", wantCount: 4, interestedNames: ["Priya", "Jamie"] }}
                    reactions={{
                        liked: false,
                        likeCount: 3,
                        onToggleLike: () => {},
                        commentCount: 2,
                        onComment: () => {},
                        wanted: true,
                        wantCount: 4,
                        onToggleWant: () => {},
                    }}
                />
                <PhotoGallery
                    photos={[
                        { url: "https://picsum.photos/seed/nextbite1/400", author: "Alex" },
                        { url: "https://picsum.photos/seed/nextbite2/400", author: "Priya" },
                        { url: "https://picsum.photos/seed/nextbite3/400" },
                    ]}
                />
            </div>
        </Section>
    )
}

function RestaurantSection() {
    return (
        <Section
            title="Restaurant and group compositions"
            body="Domain compositions built from the same primitives. Interest is always labeled, never colour alone."
        >
            <div className="w-full max-w-xl space-y-4">
                <Card>
                    <RestaurantHeader
                        name="Trattoria Verde"
                        link="https://example.com/menu"
                        ownerName="Alex"
                        wantCount={4}
                        location="Luxembourg City"
                        hasLocation={false}
                    />
                    <div className="px-5 pb-4 md:px-4">
                        <RestaurantInterestButton wanted={false} wantCount={4} onToggleWant={() => {}} />
                    </div>
                </Card>
                <GroupCard
                    name="Food Crew"
                    description="Weekend brunch plans"
                    members={[{ name: "Alex" }, { name: "Priya" }, { name: "Jamie" }]}
                    restaurants={[
                        { id: "r1", name: "Trattoria Verde", cuisine: "Italian", ownerName: "Alex" },
                        { id: "r2", name: "Sushi Bar", cuisine: "Japanese", ownerName: "Priya" },
                    ]}
                />
                <div className="w-full">
                    <SharedRestaurantList items={[{ id: "r1", name: "Trattoria Verde", cuisine: "Italian" }]} />
                </div>
            </div>
        </Section>
    )
}

function OverlaysSection() {
    const [showDialog, setShowDialog] = useState(false)
    return (
        <Section
            title="Dialogs, popovers, and tabs"
            body="Light overlays with managed focus. Open the dialog and popover to inspect backdrop, panel, and close behavior."
        >
            <Button
                variant="secondary"
                onClick={() => {
                    setShowDialog(true)
                }}
            >
                Open dialog
            </Button>
            <Dialog show={showDialog} onOpenChange={setShowDialog}>
                <DialogBackdrop>
                    <DialogPanel size="sm">
                        <DialogTitle>Example dialog</DialogTitle>
                        <p className="mt-2 text-sm text-pretty text-stone-600">
                            Backdrop, panel, title, and close button from the shared wrapper.
                        </p>
                        <DialogCloseButton
                            onClick={() => {
                                setShowDialog(false)
                            }}
                        />
                    </DialogPanel>
                </DialogBackdrop>
            </Dialog>
            <Popover>
                <PopoverTrigger tone="tinted" className="size-8">
                    +
                </PopoverTrigger>
                <PopoverPanel className="w-48">
                    <p className="px-3 py-2 text-sm text-stone-700">Account menu content</p>
                </PopoverPanel>
            </Popover>
            <div className="w-full max-w-sm">
                <Tabs defaultValue="discover">
                    <TabsList>
                        <TabsTab value="discover">Discover</TabsTab>
                        <TabsTab value="saved">Saved</TabsTab>
                    </TabsList>
                    <TabsPanel value="discover">Discovery content</TabsPanel>
                    <TabsPanel value="saved">Saved content</TabsPanel>
                </Tabs>
            </div>
        </Section>
    )
}

function EmptyStatesSection() {
    return (
        <Section
            title="Empty states"
            body="Friendly and actionable, never error-like. Each one tells the user what to do next."
        >
            <div className="w-full">
                <EmptyRestaurantsState hasFilter={false} hasSearch={false} onAddClick={() => {}} />
            </div>
        </Section>
    )
}

function DesignSystemPage() {
    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>Design system</HeaderTitle>
                    <HeaderSubtitle>
                        Good food. Great company. The living inventory of every component in the app, rendered for real.
                    </HeaderSubtitle>
                </Header>
                <div className="space-y-10 pt-6 pb-10">
                    <PaletteSection />
                    <TypographySection />
                    <ShapeSection />
                    <ButtonsSection />
                    <FieldsSection />
                    <CardsBadgesSection />
                    <AvatarsSection />
                    <SocialSection />
                    <ActivitySection />
                    <RestaurantSection />
                    <OverlaysSection />
                    <EmptyStatesSection />
                </div>
            </PageContainer>
        </PageLayout>
    )
}
