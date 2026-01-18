import { For, type JSX } from "solid-js"
import { Badge } from "../ui/badge"
import { Funnel } from "lucide-solid"
import { cx } from "../ui/variants"
import { useFriends, type Friend } from "../core/hooks"

export function FriendsFilter(props: {
    filter: string | null
    handleFilter: (name: string | null) => void
    children: JSX.Element
}) {
    const friends = useFriends()

    const handleFriendFilter = (f: Friend) => {
        return () => props.handleFilter(f.name === props.filter ? null : f.name)
    }

    return (
        <div class="mb-4 flex flex-col-reverse gap-4 sm:flex-row">
            <div class="flex items-center gap-2">
                <Funnel class={cx("mr-1 size-5 text-neutral-500", props.filter && "fill-neutral-500")} />
                <For each={friends()} fallback={<span>Loading friends...</span>}>
                    {(friend) => (
                        <Badge
                            as="button"
                            class={cx(
                                "cursor-pointer",
                                props.filter === friend.name && "bg-flame-pea-100 text-flame-pea-800",
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
