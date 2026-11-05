import ArrowUpDown from "lucide-react/icons/arrow-up-down"
import Funnel from "lucide-react/icons/funnel"

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
}: Readonly<{
    filter: string | null
    handleFilter: (name: string | null) => void
    search: string
    handleSearch: (value: string) => void
    sortOrder: "added" | "name"
    onSortChange: (order: "added" | "name") => void
    children: React.ReactNode
}>) {
    const friends = useFriends()

    const toggleFilter = (name: string) => () => {
        handleFilter(name === filter ? null : name)
    }

    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-stone-600">
                        <Funnel
                            className={cx(
                                "size-4",
                                filter !== null && filter !== "" && "fill-stone-500 text-stone-600",
                            )}
                        />
                        <span className="text-xs font-medium tracking-wide uppercase">Filter</span>
                    </div>
                    <div className="h-4 w-px bg-stone-200" />
                    {friends?.map((friend: Readonly<{ name: string }>) => (
                        <button
                            key={friend.name}
                            type="button"
                            onClick={toggleFilter(friend.name)}
                            className={cx(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                                filter === friend.name
                                    ? "bg-tomato-600 text-white shadow-sm"
                                    : "bg-stone-100 text-stone-600 hover:bg-stone-200",
                            )}
                        >
                            {friend.name}
                        </button>
                    ))}
                    {filter !== null && filter !== "" && (
                        <button
                            type="button"
                            onClick={() => {
                                handleFilter(null)
                            }}
                            className="text-xs font-medium text-tomato-600 underline-offset-2 transition-colors hover:text-tomato-700 hover:underline"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <div className="flex max-w-md items-center gap-3">
                    <SearchInput
                        value={search}
                        onChange={handleSearch}
                        placeholder="Search restaurants…"
                        className="w-full"
                    />
                    <div className="flex items-center gap-1.5">
                        <ArrowUpDown className="size-3.5 text-stone-400" />
                        <button
                            type="button"
                            onClick={() => {
                                onSortChange(sortOrder === "added" ? "name" : "added")
                            }}
                            className="text-xs font-medium whitespace-nowrap text-stone-600 transition-colors hover:text-tomato-600"
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
                        <Skeleton className="size-4 rounded-sm" />
                        <Skeleton className="h-3 w-12 rounded-sm" />
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
                        <Skeleton className="h-3.5 w-3.5 rounded-sm bg-stone-300" />
                        <Skeleton className="h-3 w-20 rounded-sm" />
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
