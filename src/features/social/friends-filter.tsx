import { ArrowsDownUpIcon, FunnelIcon } from "@phosphor-icons/react"

import { useFriends } from "@core/social"
import { cx } from "@ui/cva.config"
import { SearchInput } from "@ui/search-input"
import { Skeleton } from "@ui/skeleton"

export function FriendsFilter({
    filter,
    handleFilter,
    search,
    handleSearch,
    sortOrder,
    onSortChange,
    matchingIds,
    children,
}: Readonly<{
    filter: string
    handleFilter: (ownerId: string) => void
    search: string
    handleSearch: (value: string) => void
    sortOrder: "added" | "name"
    onSortChange: (order: "added" | "name") => void
    matchingIds: ReadonlyArray<string>
    children: React.ReactNode
}>) {
    const friends = useFriends()
    const shownFriends = (friends ?? []).filter((friend) => matchingIds.includes(friend.authUserId))

    const toggleFilter = (ownerId: string) => () => {
        handleFilter(ownerId === filter ? "" : ownerId)
    }

    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FunnelIcon
                            className={cx("size-4", filter !== "" && "fill-muted-foreground text-muted-foreground")}
                        />
                        <span className="text-xs font-medium tracking-wide uppercase">Filter</span>
                    </div>
                    {shownFriends.length > 0 && (
                        <>
                            <div className="h-4 w-px bg-border" />
                            {shownFriends.map((friend: Readonly<{ authUserId: string; name: string }>) => (
                                <button
                                    key={friend.authUserId}
                                    type="button"
                                    onClick={toggleFilter(friend.authUserId)}
                                    className={cx(
                                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                                        filter === friend.authUserId
                                            ? "bg-primary text-inverse shadow-sm"
                                            : "bg-surface-muted text-muted-foreground hover:bg-border-strong",
                                    )}
                                >
                                    {friend.name}
                                </button>
                            ))}
                        </>
                    )}
                    {filter !== "" && (
                        <button
                            type="button"
                            onClick={() => {
                                handleFilter("")
                            }}
                            className="text-xs font-medium text-primary underline-offset-2 transition-colors hover:underline"
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
                        <ArrowsDownUpIcon className="size-3.5 text-muted-foreground" />
                        <button
                            type="button"
                            onClick={() => {
                                onSortChange(sortOrder === "added" ? "name" : "added")
                            }}
                            className="text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-primary"
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
                        <Skeleton className="h-3.5 w-3.5 rounded-sm bg-surface-muted" />
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
