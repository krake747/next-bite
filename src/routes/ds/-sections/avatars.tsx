import { Avatar, AvatarFallback, AvatarImage, AvatarPresence } from "@ui/avatar"

import { Demo } from "./demo-frame"

export const avatarsMeta = {
    id: "avatars",
    group: "Content",
    title: "Avatars",
    body: "One primitive, five sizes, initials fallback, optional presence dot.",
    importPath: "@ui/avatar",
    anatomy: [
        { element: "Image", description: "The photo, cropped to a circle." },
        { element: "Fallback", description: "Required name. Initials show until the photo loads." },
        { element: "Presence", description: "Display-only status dot, hidden from assistive tech." },
    ],
} as const

export function AvatarsDemo() {
    return (
        <Demo className="flex flex-wrap items-end gap-3">
            <Avatar size="xs">
                <AvatarImage alt="Alex" />
                <AvatarFallback name="Alex" />
            </Avatar>
            <Avatar size="sm">
                <AvatarImage alt="Priya" />
                <AvatarFallback name="Priya" />
            </Avatar>
            <Avatar size="md">
                <AvatarImage alt="Jamie" />
                <AvatarFallback name="Jamie" />
            </Avatar>
            <Avatar size="lg">
                <AvatarImage alt="Leo" />
                <AvatarFallback name="Leo" />
                <AvatarPresence />
            </Avatar>
            <Avatar size="xl" ring="surface">
                <AvatarImage alt="Noor" />
                <AvatarFallback name="Noor" />
            </Avatar>
        </Demo>
    )
}
