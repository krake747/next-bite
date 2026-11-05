import Bookmark from "lucide-react/icons/bookmark"

import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

export function RestaurantInterestButton({
    wanted,
    wantCount,
    onToggleWant,
}: Readonly<{
    wanted: boolean
    wantCount: number
    onToggleWant: () => void
}>) {
    return (
        <button
            type="button"
            onClick={onToggleWant}
            aria-pressed={wanted}
            className={cx(
                focusRing(),
                "inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                wanted
                    ? "bg-tomato-700 text-white shadow-xs hover:bg-tomato-600"
                    : "bg-tomato-50 text-tomato-700 inset-ring inset-ring-tomato-700/10 hover:bg-tomato-100",
            )}
        >
            <Bookmark className={cx("size-4", wanted && "fill-current")} aria-hidden="true" />
            {wanted ? "Want to try" : "Want to try?"}
            {wantCount > 0 && <span className="text-xs font-medium tabular-nums opacity-80">{wantCount}</span>}
        </button>
    )
}
