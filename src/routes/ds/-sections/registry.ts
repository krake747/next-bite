import { ActivityDemo, activityMeta } from "./activity"
import { AvatarsDemo, avatarsMeta } from "./avatars"
import { ButtonsDemo, buttonsMeta } from "./buttons"
import { CardsDemo, cardsMeta } from "./cards"
import { EmptyStatesDemo, emptyStatesMeta } from "./empty-states"
import { FieldsDemo, fieldsMeta } from "./fields"
import { OverlaysDemo, overlaysMeta } from "./overlays"
import { PaletteDemo, paletteMeta } from "./palette"
import { RestaurantDemo, restaurantMeta } from "./restaurant"
import { ShapeDemo, shapeMeta } from "./shape"
import { SocialDemo, socialMeta } from "./social"
import { TypographyDemo, typographyMeta } from "./typography"

export type SectionGroup = "Tokens" | "Actions" | "Forms" | "Content" | "Social" | "Compositions" | "Overlay"

export type SectionMeta = {
    readonly id: string
    readonly group: SectionGroup
    readonly title: string
    readonly body: string
}

export type SectionEntry = {
    readonly meta: SectionMeta
    readonly Demo: () => React.JSX.Element
}

export const sectionGroups: ReadonlyArray<SectionGroup> = [
    "Tokens",
    "Actions",
    "Forms",
    "Content",
    "Social",
    "Compositions",
    "Overlay",
]

export const designSystemSections: Readonly<Record<string, SectionEntry>> = {
    [paletteMeta.id]: { meta: paletteMeta, Demo: PaletteDemo },
    [typographyMeta.id]: { meta: typographyMeta, Demo: TypographyDemo },
    [shapeMeta.id]: { meta: shapeMeta, Demo: ShapeDemo },
    [buttonsMeta.id]: { meta: buttonsMeta, Demo: ButtonsDemo },
    [fieldsMeta.id]: { meta: fieldsMeta, Demo: FieldsDemo },
    [cardsMeta.id]: { meta: cardsMeta, Demo: CardsDemo },
    [avatarsMeta.id]: { meta: avatarsMeta, Demo: AvatarsDemo },
    [socialMeta.id]: { meta: socialMeta, Demo: SocialDemo },
    [activityMeta.id]: { meta: activityMeta, Demo: ActivityDemo },
    [restaurantMeta.id]: { meta: restaurantMeta, Demo: RestaurantDemo },
    [overlaysMeta.id]: { meta: overlaysMeta, Demo: OverlaysDemo },
    [emptyStatesMeta.id]: { meta: emptyStatesMeta, Demo: EmptyStatesDemo },
}
