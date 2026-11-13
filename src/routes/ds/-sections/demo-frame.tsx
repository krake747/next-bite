import { cx } from "@ui/cva.config"

export function Demo({ children, className }: Readonly<{ children: React.ReactNode; className?: string | undefined }>) {
    return <div className={cx("w-full", className)}>{children}</div>
}
