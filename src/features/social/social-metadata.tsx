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
    const lines: string[] = []
    if (ownerName !== undefined && ownerName !== "") {
        lines.push(`Added by ${ownerName}`)
    }
    if (wantCount !== undefined && wantCount > 0) {
        lines.push(`${pluralize(wantCount, "friend")} want${wantCount === 1 ? "s" : ""} to try`)
    }
    if (beenCount !== undefined && beenCount > 0) {
        lines.push(`Visited by ${beenCount === 1 ? "a friend" : `${beenCount} friends`}`)
    }
    if (lines.length === 0) {
        return null
    }
    return (
        <div className="space-y-0.5">
            {lines.map((line) => (
                <p key={line} className="text-sm text-stone-600">
                    {line}
                </p>
            ))}
        </div>
    )
}
