export function SettingsRow({
    label,
    description,
    children,
}: Readonly<{ label: string; description?: string | undefined; children: React.ReactNode }>) {
    return (
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid flex-1 gap-1 text-left">
                <p className="text-sm font-medium text-foreground">{label}</p>
                {description !== undefined && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {children}
        </div>
    )
}
