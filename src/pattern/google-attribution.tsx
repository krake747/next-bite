import { cx } from "@ui/cva.config"

export function GoogleAttribution({ className }: Readonly<{ className?: string | undefined }>) {
    return (
        <p data-slot="google-attribution" translate="no" className={cx("text-xs text-muted-foreground", className)}>
            Powered by Google
        </p>
    )
}
