function pluralize(count: number, singular: string): string {
    return count === 1 ? `1 ${singular}` : `${count} ${singular}s`
}

function wantLineFor(wantCount: number | string | undefined): string | null {
    if (wantCount === undefined || wantCount === 0) {
        return null
    }
    if (typeof wantCount === "string") {
        return `${wantCount} friends want to try`
    }
    return `${pluralize(wantCount, "friend")} want${wantCount === 1 ? "s" : ""} to try`
}

import { cx } from "@ui/cva.config"

export function SocialMetadata({
    ownerName,
    wantCount,
    tone = "default",
}: Readonly<{
    ownerName?: string | undefined
    wantCount?: number | string | undefined
    tone?: "default" | "inverse" | undefined
}>) {
    const ownerLine = ownerName !== undefined && ownerName !== "" ? `Added by ${ownerName}` : null
    const wantLine = wantLineFor(wantCount)
    if (ownerLine === null && wantLine === null) {
        return null
    }
    return (
        <div className="space-y-0.5">
            {ownerLine !== null && (
                <p className={cx("text-sm", tone === "inverse" ? "text-inverse" : "text-muted-foreground")}>
                    {ownerLine}
                </p>
            )}
            {wantLine !== null && (
                <p className={cx("text-sm", tone === "inverse" ? "text-inverse/80" : "text-muted-foreground")}>
                    {wantLine}
                </p>
            )}
        </div>
    )
}
