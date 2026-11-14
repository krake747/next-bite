import { RestaurantCardSkeleton } from "@features/restaurants/restaurant-card-skeleton"
import { SettingsRow } from "@pattern/settings-row"
import { cx } from "@ui/cva.config"
import { Skeleton } from "@ui/skeleton"
import { fieldLabel } from "@ui/variants"

function TextSkeleton({ className, width }: Readonly<{ className?: string | undefined; width: string }>) {
    return (
        <div className={className}>
            <Skeleton className={cx("inline-block h-[0.75em] align-middle", width)} />
        </div>
    )
}

function ButtonSkeleton({ width }: Readonly<{ width: string }>) {
    return <Skeleton className={cx("h-11 shrink-0 md:h-10", width)} />
}

function PageSkeleton({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
    return (
        <div role="status" aria-label={label} data-slot="page-skeleton">
            <div aria-hidden="true">{children}</div>
        </div>
    )
}

function FormSkeleton({
    label,
    buttonWidth,
    className,
}: Readonly<{ label: string; buttonWidth: string; className: string }>) {
    return (
        <div className={cx("flex flex-col gap-3 sm:flex-row sm:items-end", className)}>
            <div className="flex flex-1 flex-col gap-1.5">
                <p className={fieldLabel()}>{label}</p>
                <Skeleton className="h-11.5 w-full" />
            </div>
            <ButtonSkeleton width={buttonWidth} />
        </div>
    )
}

function ListCardSkeleton({ className }: Readonly<{ className: string }>) {
    return (
        <li className={cx("list-none rounded-card border border-border bg-surface shadow-card", className)}>
            <TextSkeleton className="font-display text-lg font-semibold" width="w-2/3" />
            <TextSkeleton className="mt-1 text-sm" width="w-1/3" />
        </li>
    )
}

export function HomeSkeleton() {
    return (
        <PageSkeleton label="Loading your home feed">
            <div className="mx-auto w-full max-w-3xl">
                <div className="pt-8 sm:pt-10">
                    <TextSkeleton
                        className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
                        width="w-3/4"
                    />
                    <TextSkeleton className="mt-2 max-w-xl" width="w-1/2" />
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <ButtonSkeleton width="w-32" />
                        <ButtonSkeleton width="w-36" />
                    </div>
                </div>
                <div className="flex flex-col gap-8 pt-8">
                    <div>
                        <TextSkeleton className="font-display text-2xl font-semibold" width="w-40" />
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <ListCardSkeleton className="p-5" />
                            <ListCardSkeleton className="p-5" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                        <RestaurantCardSkeleton />
                    </div>
                </div>
            </div>
        </PageSkeleton>
    )
}

export function FriendsSkeleton() {
    return (
        <PageSkeleton label="Loading your friends">
            <FormSkeleton label="Invite by email" buttonWidth="w-32" className="mt-4" />
            <div className="pt-8">
                <h2 className="font-display text-2xl font-semibold text-balance text-foreground">Your friends</h2>
                <ul className="grid gap-4 pt-6 md:grid-cols-2">
                    {["first", "second"].map((key) => (
                        <li key={key} className="rounded-card border border-border bg-surface p-5 shadow-card">
                            <div className="flex items-center justify-between gap-3">
                                <TextSkeleton className="flex-1 font-display text-lg font-semibold" width="w-1/2" />
                                <ButtonSkeleton width="w-20" />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </PageSkeleton>
    )
}

export function GroupsSkeleton() {
    return (
        <PageSkeleton label="Loading your groups">
            <FormSkeleton label="New group" buttonWidth="w-32" className="mt-6" />
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
                <ListCardSkeleton className="p-5" />
                <ListCardSkeleton className="p-5" />
            </ul>
        </PageSkeleton>
    )
}

export function RestaurantListsSkeleton() {
    return (
        <PageSkeleton label="Loading your lists">
            <div className="flex flex-col gap-8">
                {["Saved", "Want to try", "Been"].map((title) => (
                    <div key={title}>
                        <h2 className="px-4 font-display text-2xl font-semibold text-balance text-foreground">
                            {title}
                        </h2>
                        <ul className="grid gap-3 pt-4 md:grid-cols-2">
                            <ListCardSkeleton className="p-4" />
                            <ListCardSkeleton className="p-4" />
                        </ul>
                    </div>
                ))}
            </div>
        </PageSkeleton>
    )
}

export function ProfileSkeleton() {
    return (
        <PageSkeleton label="Loading your details">
            <TextSkeleton className="px-4 font-display text-2xl font-semibold" width="w-40" />
            <TextSkeleton className="mt-1 px-4 text-sm" width="w-48" />
            <div className="mt-3 divide-y divide-border rounded-card border border-border bg-surface px-4 shadow-card">
                <div className="flex items-center gap-4 py-4">
                    <Skeleton className="size-16 rounded-full" />
                </div>
                <SettingsRow label="Email">
                    <TextSkeleton className="text-sm" width="w-40" />
                </SettingsRow>
                <SettingsRow label="Display name" description="How friends see you.">
                    <Skeleton className="h-11.5 w-full sm:w-56" />
                </SettingsRow>
            </div>
        </PageSkeleton>
    )
}
