import { ArrowSquareOutIcon, CurrencyDollarIcon, StarIcon } from "@phosphor-icons/react"

import { GoogleAttribution } from "@pattern/google-attribution"

import {
    formatPriceLevel,
    formatRating,
    formatRatingCount,
    hasEnterpriseContent,
    type EnterpriseDetails,
} from "./place-details-utils"

export function PlaceEnterpriseDetails({ details }: Readonly<{ details: EnterpriseDetails | undefined }>) {
    if (!hasEnterpriseContent(details)) {
        return null
    }
    const rating = formatRating(details?.rating)
    const count = formatRatingCount(details?.ratingCount)
    const price = formatPriceLevel(details?.priceLevel)
    const website = details?.websiteUri !== undefined && details.websiteUri !== "" ? details.websiteUri : undefined

    return (
        <div data-slot="place-enterprise-details" className="flex flex-col gap-2.5 rounded-xl bg-surface-muted/60 p-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {rating !== undefined && (
                    <span className="flex items-center gap-1.5">
                        <StarIcon className="size-4 text-tomato-500" weight="fill" aria-hidden="true" />
                        <span className="font-medium text-foreground">{rating}</span>
                        {count !== undefined && <span className="text-muted-foreground">{count}</span>}
                    </span>
                )}
                {price !== undefined && (
                    <span className="flex items-center gap-1.5">
                        <CurrencyDollarIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                        <span>{price}</span>
                    </span>
                )}
                {website !== undefined && (
                    <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                        <span>Website</span>
                        <ArrowSquareOutIcon className="size-3.5 opacity-70" aria-hidden="true" />
                    </a>
                )}
            </div>
            <div className="flex justify-end border-t border-border/60 pt-2">
                <GoogleAttribution />
            </div>
        </div>
    )
}
