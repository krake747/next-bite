import { AspectRatio } from "@ui/aspect-ratio"
import { Skeleton } from "@ui/skeleton"

export function RestaurantCardOverlaySkeleton() {
    return (
        <div
            data-slot="restaurant-card-overlay-skeleton"
            className="overflow-hidden rounded-card bg-surface shadow-card"
        >
            <AspectRatio ratio={16 / 10} className="w-full">
                <Skeleton className="absolute top-3 left-3 h-6 w-20 rounded-full bg-surface-muted" />
                <Skeleton className="absolute right-3 bottom-3 h-6 w-24 rounded-full bg-surface-muted" />
                <Skeleton className="absolute inset-x-5 bottom-4 h-7 w-2/3 rounded-lg bg-surface-muted" />
            </AspectRatio>
            <div className="flex flex-col gap-3 p-5 pt-4">
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-full" />
                <Skeleton className="aspect-video w-full rounded-xl" />
            </div>
        </div>
    )
}
