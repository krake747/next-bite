function pluralize(count: number, singular: string): string {
    return count === 1 ? `1 ${singular}` : `${count} ${singular}s`
}

export function SocialMetadata({
    ownerName,
    wantCount,
    beenCount,
}: Readonly<{
    ownerName?: string | undefined
    wantCount?: number | undefined
    beenCount?: number | undefined
}>) {
    const ownerLine = ownerName !== undefined && ownerName !== "" ? `Added by ${ownerName}` : null
    const wantLine =
        wantCount !== undefined && wantCount > 0
            ? `${pluralize(wantCount, "friend")} want${wantCount === 1 ? "s" : ""} to try`
            : null
    const beenLine =
        beenCount !== undefined && beenCount > 0
            ? `Visited by ${beenCount === 1 ? "a friend" : `${beenCount} friends`}`
            : null
    if (ownerLine === null && wantLine === null && beenLine === null) {
        return null
    }
    return (
        <div className="space-y-0.5">
            {ownerLine !== null && <p className="text-sm text-muted-foreground">{ownerLine}</p>}
            {wantLine !== null && <p className="text-sm text-muted-foreground">{wantLine}</p>}
            {beenLine !== null && <p className="text-sm text-muted-foreground">{beenLine}</p>}
        </div>
    )
}
