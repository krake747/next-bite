import { For, type JSX } from "solid-js"
import { Loading } from "../ui/loading"
import { SearchInput } from "../ui/search-input"
import Funnel from "lucide-solid/icons/funnel"
import { cx } from "../ui/variants"
import { useFriends } from "../core/hooks"

export function FriendsFilter(props: {
    filter: string | null
    handleFilter: (name: string | null) => void
    search: string
    handleSearch: (value: string) => void
    children: JSX.Element
}) {
    const friends = useFriends()

    const toggleFilter = (name: string) => () => props.handleFilter(name === props.filter ? null : name)

    return (
        <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div class="flex flex-1 flex-col gap-3">
                <div class="flex flex-wrap items-center gap-2">
                    <div class="flex items-center gap-1.5 text-neutral-500">
                        <Funnel
                            class={cx(
                                "size-4",
                                props.filter &&
                                    "fill-neutral-500 text-neutral-600 dark:fill-neutral-400 dark:text-neutral-300",
                            )}
                        />
                        <span class="text-xs font-medium tracking-wide uppercase">Filter</span>
                    </div>
                    <div class="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
                    <For each={friends()} fallback={<Loading message="friends" />}>
                        {(friend) => (
                            <button
                                type="button"
                                onClick={toggleFilter(friend.name)}
                                class={cx(
                                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                                    props.filter === friend.name
                                        ? "bg-flame-pea-600 text-white shadow-sm dark:bg-flame-pea-500"
                                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700",
                                )}
                            >
                                {friend.name}
                            </button>
                        )}
                    </For>
                    {props.filter && (
                        <button
                            type="button"
                            onClick={() => props.handleFilter(null)}
                            class="text-xs font-medium text-flame-pea-600 underline-offset-2 transition-colors hover:text-flame-pea-700 hover:underline dark:text-flame-pea-400"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <div class="flex max-w-md items-center">
                    <SearchInput
                        value={props.search}
                        onChange={props.handleSearch}
                        placeholder="Search restaurants..."
                        class="w-full"
                    />
                </div>
            </div>

            <div class="flex shrink-0 flex-col gap-2 sm:flex-row">{props.children}</div>
        </div>
    )
}
