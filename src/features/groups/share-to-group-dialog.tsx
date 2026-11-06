import { type Id } from "@convex/_generated/dataModel"
import { useMyGroups, useRestaurantShares, useShareWithGroup, useUnshare } from "@core/hooks"
import { Button } from "@ui/button"
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@ui/dialog"

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
    const shares = useRestaurantShares(restaurantId)
    const shareWithGroup = useShareWithGroup()
    const unshare = useUnshare()

    const sharedGroupIds = new Set(
        (shares ?? []).flatMap((share) => (share.target.kind === "group" ? [share.target.groupId] : [])),
    )

    return (
        <Dialog show={show} onOpenChange={onOpenChange}>
            <DialogBackdrop>
                <DialogPanel size="md" className="max-h-[85vh]">
                    <DialogTitle>Add to group</DialogTitle>
                    <p className="mt-1 text-sm text-stone-600">
                        Share {restaurantName} with one of your groups. Only members see it.
                    </p>
                    <div className="pt-4">
                        {groups === undefined ? (
                            <p className="text-sm text-stone-600">Loading groups…</p>
                        ) : groups.length === 0 ? (
                            <p className="text-sm text-stone-600">
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
                                            <span className="truncate text-sm font-medium text-stone-900">
                                                {group.name}
                                            </span>
                                            {shared ? (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
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
                </DialogPanel>
            </DialogBackdrop>
        </Dialog>
    )
}
