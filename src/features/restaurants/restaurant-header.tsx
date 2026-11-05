import { Link } from "@tanstack/react-router"
import ExternalLink from "lucide-react/icons/external-link"
import MapPin from "lucide-react/icons/map-pin"
import Utensils from "lucide-react/icons/utensils"

import { type OpeningHours } from "@core/hooks"
import { SocialMetadata } from "@features/social/social-metadata"
import { OpeningHours as OpeningHoursSummary } from "@ui/opening-hours"

export function RestaurantHeader({
    name,
    link,
    addedBy,
    wantCount,
    beenCount,
    location,
    hasLocation,
    openingHours,
    onShowHours,
    detailsHref,
}: Readonly<{
    name: string
    link?: string | undefined
    addedBy?: string | undefined
    wantCount?: number | undefined
    beenCount?: number | undefined
    location?: string | undefined
    hasLocation: boolean
    openingHours?: OpeningHours | undefined
    onShowHours?: (() => void) | undefined
    detailsHref?: string | undefined
}>) {
    const heading = (
        <h3 className="flex-1 font-display text-xl leading-7 font-semibold tracking-tight text-balance text-stone-900">
            {name}
        </h3>
    )
    return (
        <div className="flex flex-col gap-4 p-5 md:gap-3 md:p-4">
            <div className="flex flex-col gap-1">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-3">
                    {detailsHref !== undefined ? (
                        <Link
                            to={detailsHref}
                            viewTransition
                            className="flex-1 rounded-control transition-colors hover:text-tomato-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
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
                            className="flex shrink-0 items-center gap-1.5 rounded-full bg-tomato-50 px-3 py-1.5 text-xs font-medium text-tomato-700 transition-all duration-200 hover:bg-tomato-100"
                            title="View menu"
                        >
                            <Utensils className="size-3.5" />
                            <span>Menu</span>
                            <ExternalLink className="size-3 opacity-70" />
                        </a>
                    )}
                </div>
                <SocialMetadata addedBy={addedBy} wantCount={wantCount} beenCount={beenCount} />
            </div>

            {(location !== undefined || openingHours !== undefined) && (
                <div className="flex flex-col gap-2.5 rounded-xl bg-stone-50/60 p-3">
                    {location !== undefined && location !== "" && (
                        <div className="flex items-center gap-2.5 text-sm text-stone-600">
                            <div className="flex size-6 items-center justify-center rounded-full bg-stone-100">
                                <MapPin className="size-3.5 text-stone-400" />
                            </div>
                            {hasLocation ? (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={location}
                                    className="truncate transition-colors duration-200 hover:text-tomato-600"
                                >
                                    {location}
                                </a>
                            ) : (
                                <span className="truncate" title={location}>
                                    {location}
                                </span>
                            )}
                        </div>
                    )}
                    {openingHours !== undefined && onShowHours !== undefined && (
                        <OpeningHoursSummary openingHours={openingHours} onClick={onShowHours} />
                    )}
                </div>
            )}
        </div>
    )
}
