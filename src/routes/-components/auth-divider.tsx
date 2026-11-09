export function AuthDivider({ label = "or" }: Readonly<{ label?: string | undefined }>) {
    return (
        <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
            <div className="h-px flex-1 bg-border" />
        </div>
    )
}
