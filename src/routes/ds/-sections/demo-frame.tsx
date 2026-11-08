import { Card } from "@ui/card"
import { cx } from "@ui/cva.config"

export function Demo({ children, className }: Readonly<{ children: React.ReactNode; className?: string | undefined }>) {
    return (
        <Card>
            <div className={cx("w-full p-5", className)}>{children}</div>
        </Card>
    )
}
