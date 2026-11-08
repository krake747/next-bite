import { type Id } from "@api/data.model"
import { useMyGroups, useRestaurantShares, useShareWithGroup, useShareWithUser, useUnshare } from "@core/groups"
import { useFriends } from "@core/social"
import { Button } from "@ui/button"
import { Dialog, DialogContent, DialogTitle } from "@ui/dialog"

export function ShareToGroupDialog({
    restaurantId,
    restaurantName,
    show,
    onOpenChange,
}: Readonly<{
    restaurantId: Id<"restaurants">
    restaurantName: string
    show: boolean
    onOpenChange: (open: boolean) => void
}>) {
    const groups = useMyGroups()
    const friends = useFriends()
    const shares = useRestaurantShares(restaurantId)
    const shareWithGroup = useShareWithGroup()
    const shareWithUser = useShareWithUser()
    const unshare = useUnshare()

    const sharedGroupIds = new Set(
        (shares ?? []).flatMap((share) => (share.target.kind === "group" ? [share.target.groupId] : [])),
    )
    const sharedUserIds = new Set(
        (shares ?? []).flatMap((share) => (share.target.kind === "user" ? [share.target.userId] : [])),
    )

    return (
        <Dialog open={show} onOpenChange={onOpenChange}>
            <DialogContent size="md" className="max-h-[85vh]">
                <DialogTitle>Share</DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                    Share {restaurantName} with friends and groups. Only people you share with see it.
                </p>
                <h3 className="pt-4 font-display text-base font-semibold text-foreground">Friends</h3>
                <div className="pt-2">
                    {friends === undefined ? (
                        <p className="text-sm text-muted-foreground">Loading friends…</p>
                    ) : friends.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No friends yet. Add some from the Friends tab first.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {friends.map((friend) => {
                                const shared = sharedUserIds.has(friend.authUserId)
                                return (
                                    <li
                                        key={friend.authUserId}
                                        className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-3"
                                    >
                                        <span className="truncate text-sm font-medium text-foreground">
                                            {friend.name}
                                        </span>
                                        {shared ? (
                                            <Button
                                                size="sm"
                                                tone="secondary"
                                                disabled={unshare.isPending}
                                                onClick={() => {
                                                    unshare.mutate({
                                                        restaurantId,
                                                        target: { kind: "user", userId: friend.authUserId },
                                                    })
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                disabled={shareWithUser.isPending}
                                                onClick={() => {
                                                    shareWithUser.mutate({
                                                        restaurantId,
                                                        userId: friend.authUserId,
                                                    })
                                                }}
                                            >
                                                Share
                                            </Button>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
                <h3 className="pt-4 font-display text-base font-semibold text-foreground">Groups</h3>
                <div className="pt-2">
                    {groups === undefined ? (
                        <p className="text-sm text-muted-foreground">Loading groups…</p>
                    ) : groups.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            You are not in any group yet. Create one from the Groups tab first.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {groups.map(({ group }) => {
                                const shared = sharedGroupIds.has(group._id)
                                return (
                                    <li
                                        key={group._id}
                                        className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-3"
                                    >
                                        <span className="truncate text-sm font-medium text-foreground">
                                            {group.name}
                                        </span>
                                        {shared ? (
                                            <Button
                                                size="sm"
                                                tone="secondary"
                                                disabled={unshare.isPending}
                                                onClick={() => {
                                                    unshare.mutate({
                                                        restaurantId,
                                                        target: { kind: "group", groupId: group._id },
                                                    })
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                disabled={shareWithGroup.isPending}
                                                onClick={() => {
                                                    shareWithGroup.mutate({ restaurantId, groupId: group._id })
                                                }}
                                            >
                                                Add to group
                                            </Button>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
