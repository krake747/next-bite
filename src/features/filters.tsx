import { For, type JSX } from "solid-js"
import { Badge } from "../ui/badge"
import { Funnel } from "lucide-solid"
import { cx } from "../ui/variants"
import type { Friend } from "../core/hooks"

export function Filters(props: {
    friends: Friend[]
    friendFilter: string | null
    handleFilterChange: (name: string | null) => void
    children: JSX.Element
}) {
    const handleFriendFilter = (f: Friend) => {
        return () => props.handleFilterChange(f.name === props.friendFilter ? null : f.name)
    }

    return (
        <div class="mb-4 flex flex-col-reverse gap-4 sm:flex-row">
            <div class="flex items-center gap-2">
                <Funnel class={cx("mr-1 size-4 text-neutral-500", props.friendFilter && "fill-neutral-500")} />
                <For each={props.friends}>
                    {(friend) => (
                        <Badge
                            as="button"
                            class={cx(
                                "cursor-pointer",
                                props.friendFilter === friend.name && "bg-flame-pea-100 text-flame-pea-800",
                            )}
                            onClick={handleFriendFilter(friend)}
                        >
                            {friend.name}
                        </Badge>
                    )}
                </For>
            </div>
            {props.children}
        </div>
    )
}
