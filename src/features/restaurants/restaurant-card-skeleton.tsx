import { AspectRatio } from "@ui/aspect-ratio"
import { Skeleton } from "@ui/skeleton"

export function RestaurantCardSkeleton() {
    return (
        <div data-slot="restaurant-card-skeleton" className="overflow-hidden rounded-card bg-surface shadow-card">
            <AspectRatio ratio={2 / 1} className="w-full">
                <Skeleton className="absolute top-3 left-3 h-6 w-20 rounded-full bg-surface-muted" />
                <Skeleton className="absolute top-3 right-3 size-7 rounded-full bg-surface-muted" />
                <Skeleton className="absolute right-3 bottom-3 h-6 w-20 rounded-full bg-surface-muted" />
                <Skeleton className="absolute bottom-3 left-3 h-4 w-16 rounded-lg bg-surface-muted" />
            </AspectRatio>
            <div className="flex flex-col gap-4 p-5 md:gap-3 md:p-4">
                <div className="flex flex-col gap-2.5 md:gap-2">
                    <div className="flex items-start justify-between gap-3">
                        <Skeleton className="h-6 w-3/4 rounded-lg" />
                        <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <div className="flex justify-center gap-2 py-2">
                    <Skeleton className="size-6 rounded-full" />
                    <Skeleton className="size-6 rounded-full" />
                    <Skeleton className="size-6 rounded-full" />
                    <Skeleton className="size-6 rounded-full" />
                    <Skeleton className="size-6 rounded-full" />
                </div>
            </div>
        </div>
    )
}
