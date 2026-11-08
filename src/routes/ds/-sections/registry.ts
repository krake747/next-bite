import { PaletteDemo, paletteMeta } from "./palette"
import { ShapeDemo, shapeMeta } from "./shape"
import { TypographyDemo, typographyMeta } from "./typography"

export type SectionGroup = "Tokens"

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

export const sectionGroups: ReadonlyArray<SectionGroup> = ["Tokens"]

export const designSystemSections: Readonly<Record<string, SectionEntry>> = {
    [paletteMeta.id]: { meta: paletteMeta, Demo: PaletteDemo },
    [typographyMeta.id]: { meta: typographyMeta, Demo: TypographyDemo },
    [shapeMeta.id]: { meta: shapeMeta, Demo: ShapeDemo },
}
