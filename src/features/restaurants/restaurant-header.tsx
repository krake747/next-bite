import { ArrowSquareOutIcon, ForkKnifeIcon, MapPinIcon } from "@phosphor-icons/react"
import { Link } from "@tanstack/react-router"

import { GoogleAttribution } from "@pattern/google-attribution"
import { SocialMetadata } from "@pattern/social-metadata"
import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

export function RestaurantHeader({
    name,
    link,
    ownerName,
    wantCount,
    location,
    hasLocation,
    detailsHref,
}: Readonly<{
    name: string
    link?: string | undefined
    ownerName?: string | undefined
    wantCount?: number | string | undefined
    location?: string | undefined
    hasLocation: boolean
    detailsHref?: string | undefined
}>) {
    const heading = (
        <h3 className="flex-1 font-display text-xl leading-7 font-semibold tracking-tight text-balance text-foreground">
            {name}
        </h3>
    )
    return (
        <div className="flex flex-col gap-4 p-5 md:gap-3 md:p-4">
            <div className="flex flex-col gap-1">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-3">
                    {detailsHref !== undefined ? (
                        <Link to={detailsHref} className={cx(focusRing(), "flex-1 rounded-control hover:text-primary")}>
                            {heading}
                        </Link>
                    ) : (
                        heading
                    )}
                    {link !== undefined && link !== "" && (
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex shrink-0 items-center gap-1.5 rounded-full bg-tomato-50 px-3 py-1.5 text-xs font-medium text-tomato-700 hover:bg-tomato-100"
                            title="View menu"
                        >
                            <ForkKnifeIcon className="size-3.5" />
                            <span>Menu</span>
                            <ArrowSquareOutIcon className="size-3 opacity-70" />
                        </a>
                    )}
                </div>
                <SocialMetadata ownerName={ownerName} wantCount={wantCount} />
            </div>

            {location !== undefined && location !== "" && (
                <div className="flex flex-col gap-2.5 rounded-xl bg-surface-muted/60 p-3">
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <div className="flex size-6 items-center justify-center rounded-full bg-surface-muted">
                            <MapPinIcon className="size-3.5 text-muted-foreground" />
                        </div>
                        {hasLocation ? (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={location}
                                className="truncate hover:text-primary"
                            >
                                {location}
                            </a>
                        ) : (
                            <span className="truncate" title={location}>
                                {location}
                            </span>
                        )}
                    </div>
                    <div className="flex justify-end border-t border-border/60 pt-2">
                        <GoogleAttribution />
                    </div>
                </div>
            )}
        </div>
    )
}
