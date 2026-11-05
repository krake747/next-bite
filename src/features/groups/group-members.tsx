import { AvatarGroup, type AvatarMember } from "@features/social/avatar-group"

export function GroupMembers({
    members,
    className,
}: Readonly<{
    members: ReadonlyArray<AvatarMember>
    className?: string | undefined
}>) {
    if (members.length === 0) {
        return <p className="text-sm text-stone-600">No members yet. Invite your friends.</p>
    }
    return (
        <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
            <AvatarGroup members={members} />
            <p className="text-sm text-stone-600 tabular-nums">
                {members.length === 1 ? "1 member" : `${members.length} members`}
            </p>
        </div>
    )
}
