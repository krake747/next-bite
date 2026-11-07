import { Avatar, AvatarFallback, AvatarImage } from "@ui/avatar"
import { cx } from "@ui/cva.config"

export type AvatarMember = {
    readonly name: string
    readonly src?: string | undefined
}

const MAX_VISIBLE = 4

export function AvatarGroup({
    members,
    max,
    className,
}: Readonly<{
    members: ReadonlyArray<AvatarMember>
    max?: number | undefined
    className?: string | undefined
}>) {
    const visibleMax = max ?? MAX_VISIBLE
    const visible = members.slice(0, visibleMax)
    const overflow = members.length - visible.length
    const label =
        members.length === 0
            ? "No friends yet"
            : `${members.map((member) => member.name).join(", ")}${overflow > 0 ? ` and ${overflow} more` : ""}`

    return (
        <div data-slot="avatar-group" className={cx("flex items-center", className)} role="group" aria-label={label}>
            {visible.map((member, index) => (
                <Avatar key={`${member.name}-${index}`} size="sm" ring="surface" className={cx(index > 0 && "-ml-2")}>
                    <AvatarImage src={member.src} alt={member.name} />
                    <AvatarFallback name={member.name} />
                </Avatar>
            ))}
            {overflow > 0 && (
                <span
                    aria-hidden="true"
                    className="-ml-2 flex size-8 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-foreground ring-2 ring-surface"
                >
                    +{overflow}
                </span>
            )}
        </div>
    )
}
