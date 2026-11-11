import { AspectRatioDemo, aspectRatioMeta } from "./aspect-ratio"
import { AvatarDemo, avatarMeta } from "./avatar"
import { BadgeDemo, badgeMeta } from "./badge"
import { ButtonDemo, buttonMeta } from "./button"
import { CardDemo, cardMeta } from "./card"
import { CollapsibleDemo, collapsibleMeta } from "./collapsible"
import { DialogDemo, dialogMeta } from "./dialog"
import { DropdownMenuDemo, dropdownMenuMeta } from "./dropdown-menu"
import { EmptyStateDemo, emptyStateMeta } from "./empty-state"
import { IconButtonDemo, iconButtonMeta } from "./icon-button"
import { InputDemo, inputMeta } from "./input"
import { LoadingDemo, loadingMeta } from "./loading"
import { PaletteDemo, paletteMeta } from "./palette"
import { PopoverDemo, popoverMeta } from "./popover"
import { QueryErrorDemo, queryErrorMeta } from "./query-error"
import { SeparatorDemo, separatorMeta } from "./separator"
import { ShapeDemo, shapeMeta } from "./shape"
import { SheetDemo, sheetMeta } from "./sheet"
import { SidebarDemo, sidebarMeta } from "./sidebar"
import { SkeletonDemo, skeletonMeta } from "./skeleton"
import { SocialMetadataDemo, socialMetadataMeta } from "./social-metadata"
import { TabsDemo, tabsMeta } from "./tabs"
import { TextLinkDemo, textLinkMeta } from "./text-link"
import { TooltipDemo, tooltipMeta } from "./tooltip"
import { TypographyDemo, typographyMeta } from "./typography"

// Add a primitive: section file with meta and Demo, browser spec via section-spec helper,
// registry entry below, nav icon in -layout/nav, SYNC comment in the ui file.

export type SectionGroup = "Tokens" | "Components" | "Patterns"

export type PropRow = {
    readonly name: string
    readonly type: string
    readonly default?: string | undefined
    readonly description: string
}

export type VariantRow = {
    readonly name: string
    readonly description: string
}

export type GuidanceSibling = {
    readonly id: string
    readonly reason: string
}

export type Guidance = {
    readonly whenToUse: string
    readonly whenToAvoid?: string | undefined
    readonly siblings?: ReadonlyArray<GuidanceSibling> | undefined
}

export type SectionMeta = {
    readonly id: string
    readonly group: SectionGroup
    readonly title: string
    readonly body: string
    readonly importPath: string
    readonly anatomy?: ReadonlyArray<{ readonly element: string; readonly description: string }> | undefined
    readonly props?: ReadonlyArray<PropRow> | undefined
    readonly variants?: ReadonlyArray<VariantRow> | undefined
    readonly guidance?: Guidance | undefined
    readonly children?: ReadonlyArray<{ readonly id: string; readonly title: string }> | undefined
}

export type SectionEntry = {
    readonly meta: SectionMeta
    readonly Demo: () => React.JSX.Element
}

export const sectionGroups: ReadonlyArray<SectionGroup> = ["Tokens", "Components", "Patterns"]

export const designSystemSections: Readonly<Record<string, SectionEntry>> = {
    [paletteMeta.id]: { meta: paletteMeta, Demo: PaletteDemo },
    [typographyMeta.id]: { meta: typographyMeta, Demo: TypographyDemo },
    [shapeMeta.id]: { meta: shapeMeta, Demo: ShapeDemo },
    [aspectRatioMeta.id]: { meta: aspectRatioMeta, Demo: AspectRatioDemo },
    [avatarMeta.id]: { meta: avatarMeta, Demo: AvatarDemo },
    [badgeMeta.id]: { meta: badgeMeta, Demo: BadgeDemo },
    [buttonMeta.id]: { meta: buttonMeta, Demo: ButtonDemo },
    [cardMeta.id]: { meta: cardMeta, Demo: CardDemo },
    [collapsibleMeta.id]: { meta: collapsibleMeta, Demo: CollapsibleDemo },
    [dialogMeta.id]: { meta: dialogMeta, Demo: DialogDemo },
    [dropdownMenuMeta.id]: { meta: dropdownMenuMeta, Demo: DropdownMenuDemo },
    [iconButtonMeta.id]: { meta: iconButtonMeta, Demo: IconButtonDemo },
    [inputMeta.id]: { meta: inputMeta, Demo: InputDemo },
    [popoverMeta.id]: { meta: popoverMeta, Demo: PopoverDemo },
    [separatorMeta.id]: { meta: separatorMeta, Demo: SeparatorDemo },
    [sheetMeta.id]: { meta: sheetMeta, Demo: SheetDemo },
    [sidebarMeta.id]: { meta: sidebarMeta, Demo: SidebarDemo },
    [skeletonMeta.id]: { meta: skeletonMeta, Demo: SkeletonDemo },
    [tabsMeta.id]: { meta: tabsMeta, Demo: TabsDemo },
    [textLinkMeta.id]: { meta: textLinkMeta, Demo: TextLinkDemo },
    [tooltipMeta.id]: { meta: tooltipMeta, Demo: TooltipDemo },
    [emptyStateMeta.id]: { meta: emptyStateMeta, Demo: EmptyStateDemo },
    [loadingMeta.id]: { meta: loadingMeta, Demo: LoadingDemo },
    [queryErrorMeta.id]: { meta: queryErrorMeta, Demo: QueryErrorDemo },
    [socialMetadataMeta.id]: { meta: socialMetadataMeta, Demo: SocialMetadataDemo },
}
