import { For } from "solid-js"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Funnel, Plus } from "lucide-solid"
import { cx } from "../ui/variants"
import type { Friend } from "../core/types"

export function Filters(props: {
    friends: Friend[]
    friendFilter: string | null
    handleFilterChange: (name: string | null) => void
    handleAddClick: () => void
}) {
    const handleFriendFilter = (f: Friend) => {
        return () => props.handleFilterChange(f.name === props.friendFilter ? null : f.name)
    }

    return (
        <div class="mb-4 flex items-center gap-1.5">
            <Funnel class={cx("mr-1.5 size-4 text-neutral-500", props.friendFilter && "fill-neutral-500")} />
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
            <Button onClick={props.handleAddClick} class="ml-auto bg-flame-pea-600 text-white hover:bg-flame-pea-700">
                <Plus class="size-4" />
                Add Restaurant
            </Button>
        </div>
    )
}
