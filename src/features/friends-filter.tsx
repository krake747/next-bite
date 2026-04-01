import { For, type JSX } from "solid-js"
import { Badge } from "../ui/badge"
import { Loading } from "../ui/loading"
import Funnel from "lucide-solid/icons/funnel"
import { cx } from "../ui/variants"
import { useFriends } from "../core/hooks"

export function FriendsFilter(props: {
    filter: string | null
    handleFilter: (name: string | null) => void
    children: JSX.Element
}) {
    const friends = useFriends()

    const toggleFilter = (name: string) => () => props.handleFilter(name === props.filter ? null : name)

    return (
        <div class="mb-4 flex flex-col-reverse gap-4 sm:flex-row">
            <div class="flex items-center gap-1.5 sm:gap-2">
                <Funnel class={cx("mr-1 size-4 text-neutral-500", props.filter && "fill-neutral-500")} />
                <For each={friends()} fallback={<Loading message="friends" />}>
                    {(friend) => (
                        <Badge
                            as="button"
                            class={cx(
                                "cursor-pointer",
                                props.filter === friend.name && "bg-flame-pea-100 text-flame-pea-800",
                            )}
                            onClick={toggleFilter(friend.name)}
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
