import ArrowUpDown from "lucide-react/icons/arrow-up-down"
import Funnel from "lucide-react/icons/funnel"
import type { ReactNode } from "react"

import { useFriends } from "@core/hooks"
import { SearchInput } from "@ui/search-input"
import { Skeleton } from "@ui/skeleton"
import { cx } from "@ui/variants"

export function FriendsFilter({
    filter,
    handleFilter,
    search,
    handleSearch,
    sortOrder,
    onSortChange,
    children,
}: {
    filter: string | null
    handleFilter: (name: string | null) => void
    search: string
    handleSearch: (value: string) => void
    sortOrder: "added" | "name"
    onSortChange: (order: "added" | "name") => void
    children: ReactNode
}) {
    const friends = useFriends()

    const toggleFilter = (name: string) => () => handleFilter(name === filter ? null : name)

    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-neutral-500">
                        <Funnel
                            className={cx(
                                "size-4",
                                filter &&
                                    "fill-neutral-500 text-neutral-600 dark:fill-neutral-400 dark:text-neutral-300",
                            )}
                        />
                        <span className="text-xs font-medium tracking-wide uppercase">Filter</span>
                    </div>
                    <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
                    {friends?.map((friend) => (
                        <button
                            key={friend.name}
                            type="button"
                            onClick={toggleFilter(friend.name)}
                            className={cx(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                                filter === friend.name
                                    ? "bg-flame-pea-600 text-white shadow-sm dark:bg-flame-pea-500"
                                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700",
                            )}
                        >
                            {friend.name}
                        </button>
                    ))}
                    {filter && (
                        <button
                            type="button"
                            onClick={() => handleFilter(null)}
                            className="text-xs font-medium text-flame-pea-600 underline-offset-2 transition-colors hover:text-flame-pea-700 hover:underline dark:text-flame-pea-400"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <div className="flex max-w-md items-center gap-3">
                    <SearchInput
                        value={search}
                        onChange={handleSearch}
                        placeholder="Search restaurants..."
                        className="w-full"
                    />
                    <div className="flex items-center gap-1.5">
                        <ArrowUpDown className="size-3.5 text-neutral-400" />
                        <button
                            type="button"
                            onClick={() => onSortChange(sortOrder === "added" ? "name" : "added")}
                            className="text-xs font-medium whitespace-nowrap text-neutral-600 transition-colors hover:text-flame-pea-600 dark:text-neutral-400 dark:hover:text-flame-pea-400"
                        >
                            {sortOrder === "added" ? "Recently added" : "Name (A-Z)"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">{children}</div>
        </div>
    )
}

export function FriendsFilterSkeleton() {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <Skeleton className="size-4 rounded" />
                        <Skeleton className="h-3 w-12 rounded" />
                    </div>
                    <Skeleton className="h-4 w-px" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                </div>
                <div className="flex max-w-md items-center gap-3">
                    <Skeleton className="h-10 w-full max-w-xs rounded-lg" />
                    <div className="flex items-center gap-1.5">
                        <Skeleton className="h-3.5 w-3.5 rounded bg-neutral-300 dark:bg-neutral-600" />
                        <Skeleton className="h-3 w-20 rounded" />
                    </div>
                </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Skeleton className="h-10 w-36 rounded-lg" />
                <Skeleton className="h-10 w-36 rounded-lg" />
            </div>
        </div>
    )
}
