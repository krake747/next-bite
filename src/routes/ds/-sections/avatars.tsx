import { FriendPresence } from "@features/social/friend-presence"
import { AvatarGroup } from "@pattern/avatar-group"
import { Avatar, AvatarFallback, AvatarImage, AvatarPresence } from "@ui/avatar"
import { Card } from "@ui/card"

export const avatarsMeta = {
    id: "avatars",
    group: "Content",
    title: "Avatars and presence",
    body: "Circular friends with initials fallback. Groups collapse to four plus an overflow count. Presence is display-only.",
} as const

export function AvatarsDemo() {
    const friends = [{ name: "Alex" }, { name: "Priya" }, { name: "Jamie" }, { name: "Leo" }, { name: "Noor" }]
    return (
        <Card>
            <div className="flex flex-wrap items-center gap-3 p-5">
                <div className="flex items-end gap-3">
                    <Avatar size="xs">
                        <AvatarImage alt="Alex" />
                        <AvatarFallback name="Alex" />
                    </Avatar>
                    <Avatar size="sm">
                        <AvatarImage alt="Priya" />
                        <AvatarFallback name="Priya" />
                    </Avatar>
                    <Avatar size="md">
                        <AvatarImage alt="Jamie" />
                        <AvatarFallback name="Jamie" />
                    </Avatar>
                    <Avatar size="lg">
                        <AvatarImage alt="Leo" />
                        <AvatarFallback name="Leo" />
                        <AvatarPresence />
                    </Avatar>
                    <Avatar size="xl" ring="surface">
                        <AvatarImage alt="Noor" />
                        <AvatarFallback name="Noor" />
                    </Avatar>
                </div>
                <AvatarGroup members={friends} />
                <span className="inline-flex items-center gap-2 text-sm text-stone-600">
                    <FriendPresence active /> Alex is active
                </span>
                <span className="inline-flex items-center gap-2 text-sm text-stone-600">
                    <FriendPresence /> Priya is away
                </span>
            </div>
        </Card>
    )
}
