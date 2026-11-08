import { AvatarsDemo, avatarsMeta } from "./avatars"
import { ButtonsDemo, buttonsMeta } from "./buttons"
import { CardsDemo, cardsMeta } from "./cards"
import { FieldsDemo, fieldsMeta } from "./fields"
import { OverlaysDemo, overlaysMeta } from "./overlays"
import { PaletteDemo, paletteMeta } from "./palette"
import { ShapeDemo, shapeMeta } from "./shape"
import { TypographyDemo, typographyMeta } from "./typography"

export type SectionGroup = "Tokens" | "Actions" | "Forms" | "Content" | "Overlay"

export type SectionMeta = {
    readonly id: string
    readonly group: SectionGroup
    readonly title: string
    readonly body: string
    readonly importPath: string
    readonly anatomy?: ReadonlyArray<{ readonly element: string; readonly description: string }> | undefined
    readonly children?: ReadonlyArray<{ readonly id: string; readonly title: string }> | undefined
}

export type SectionEntry = {
    readonly meta: SectionMeta
    readonly Demo: () => React.JSX.Element
}

export const sectionGroups: ReadonlyArray<SectionGroup> = ["Tokens", "Actions", "Forms", "Content", "Overlay"]

export const designSystemSections: Readonly<Record<string, SectionEntry>> = {
    [paletteMeta.id]: { meta: paletteMeta, Demo: PaletteDemo },
    [typographyMeta.id]: { meta: typographyMeta, Demo: TypographyDemo },
    [shapeMeta.id]: { meta: shapeMeta, Demo: ShapeDemo },
    [buttonsMeta.id]: { meta: buttonsMeta, Demo: ButtonsDemo },
    [fieldsMeta.id]: { meta: fieldsMeta, Demo: FieldsDemo },
    [cardsMeta.id]: { meta: cardsMeta, Demo: CardsDemo },
    [avatarsMeta.id]: { meta: avatarsMeta, Demo: AvatarsDemo },
    [overlaysMeta.id]: { meta: overlaysMeta, Demo: OverlaysDemo },
}
