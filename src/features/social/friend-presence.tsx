import { cx } from "@ui/cva.config"

export function FriendPresence({
    active,
    className,
}: Readonly<{ active?: boolean | undefined; className?: string | undefined }>) {
    const isActive = active === true
    return (
        <span className={cx("inline-flex items-center gap-1.5", className)}>
            <span
                aria-hidden="true"
                className={cx("size-2 rounded-full", isActive ? "bg-success" : "bg-border-strong")}
            />
            <span className="sr-only">{isActive ? "Active now" : "Away"}</span>
        </span>
    )
}
