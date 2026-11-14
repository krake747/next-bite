import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@ui/breadcrumb"

import { Demo } from "./demo-frame"

export const breadcrumbMeta = {
    id: "breadcrumb",
    group: "Components",
    title: "Breadcrumb",
    body: "Two levels of where you are. Parent links back, current page names itself and truncates.",
    importPath: "src/ui/breadcrumb.tsx",
    anatomy: [
        {
            element: "BreadcrumbList",
            description: "An ordered list that lays the trail out in one line with separators.",
        },
        {
            element: "BreadcrumbLink",
            description: "A parent crumb. An anchor by default, or any element through render.",
        },
        {
            element: "BreadcrumbPage",
            description: "The current page. Plain text with aria-current, truncated when long.",
        },
    ],
    props: [
        {
            name: "render",
            type: "React.ReactElement",
            description: "Renders a router link with crumb styling instead of an anchor.",
        },
        {
            name: "className",
            type: "string",
            description: "Extra classes merged onto the crumb.",
        },
    ],
    guidance: {
        whenToUse:
            "Show the way back on a detail page with one parent: Restaurants into a restaurant, Groups into a group.",
        whenToAvoid:
            "Do not build three-level trails; the IA stays flat, so two crumbs are enough. Do not use for actions; buttons act, crumbs navigate.",
        siblings: [{ id: "button", reason: "Page actions use Button, the way back uses Breadcrumb." }],
    },
} as const

export function BreadcrumbDemo() {
    return (
        <Demo>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/restaurants">Restaurants</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="min-w-0 flex-1">
                        <BreadcrumbPage>Five Guys</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </Demo>
    )
}
