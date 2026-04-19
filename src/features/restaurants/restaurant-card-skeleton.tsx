import { Skeleton } from "@ui/skeleton"

export function RestaurantCardSkeleton() {
    return (
        <div class="animate-pulse overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.03),0_8px_16px_rgba(0,0,0,0.02)] dark:bg-[#262523] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            <div class="relative aspect-2/1 w-full">
                <Skeleton class="absolute top-3 left-3 h-6 w-20 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                <Skeleton class="absolute top-3 right-3 size-7 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                <Skeleton class="absolute right-3 bottom-3 h-6 w-20 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                <Skeleton class="absolute bottom-3 left-3 h-4 w-16 rounded-lg bg-neutral-300 dark:bg-neutral-600" />
            </div>
            <div class="flex flex-col gap-4 p-5 md:gap-3 md:p-4">
                <div class="flex flex-col gap-2.5 md:gap-2">
                    <div class="flex items-start justify-between gap-3">
                        <Skeleton class="h-6 w-3/4 rounded-lg" />
                        <Skeleton class="h-6 w-16 shrink-0 rounded-full" />
                    </div>
                    <Skeleton class="h-4 w-1/2 rounded-lg" />
                </div>
                <Skeleton class="h-4 w-3/4 rounded-lg" />
                <div class="flex justify-center gap-2 py-2">
                    <Skeleton class="size-6 rounded-full" />
                    <Skeleton class="size-6 rounded-full" />
                    <Skeleton class="size-6 rounded-full" />
                    <Skeleton class="size-6 rounded-full" />
                    <Skeleton class="size-6 rounded-full" />
                </div>
            </div>
        </div>
    )
}
