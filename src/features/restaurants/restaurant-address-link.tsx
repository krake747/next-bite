import { MapPinIcon } from "@phosphor-icons/react"

import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

export function RestaurantAddressLink({ address, hasLocation }: Readonly<{ address: string; hasLocation: boolean }>) {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                <MapPinIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </div>
            {hasLocation ? (
                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={address}
                    className={cx(focusRing(), "truncate rounded-sm transition-colors duration-150 hover:text-primary")}
                >
                    {address}
                </a>
            ) : (
                <span className="truncate" title={address}>
                    {address}
                </span>
            )}
        </div>
    )
}
