import { Avatar, AvatarFallback, AvatarImage, AvatarPresence } from "@ui/avatar"

import { Demo } from "./demo-frame"

export const avatarMeta = {
    id: "avatar",
    group: "Components",
    title: "Avatar",
    body: "A person at a glance. The image fades in over initials, and the presence dot marks who is here now.",
    importPath: "src/ui/avatar.tsx",
    anatomy: [
        {
            element: "Avatar",
            description: "The sized circle. Sizes the fallback text through context.",
        },
        {
            element: "AvatarImage",
            description: "The photo. Mounts only once the image is ready unless keepMounted is set.",
        },
        {
            element: "AvatarFallback",
            description: "Initials from the name, or a placeholder mark when the name is empty.",
        },
        {
            element: "AvatarPresence",
            description: "The online dot, pinned to the edge of the circle.",
        },
    ],
    props: [
        {
            name: "size",
            type: '"xs" | "sm" | "md" | "lg" | "xl"',
            default: '"sm"',
            description: "Circle diameter, shared with the fallback text through context.",
        },
        {
            name: "ring",
            type: '"none" | "surface"',
            default: '"none"',
            description: "A surface-colored ring for avatars stacked on photos.",
        },
        {
            name: "children",
            type: "React.ReactNode",
            description: "Image, fallback, and optional presence dot.",
        },
    ],
    variants: [
        { name: "xs to xl", description: "Five diameters from 24 to 64 pixels." },
        { name: "ring surface", description: "Lifts the avatar off busy media behind it." },
    ],
    guidance: {
        whenToUse:
            "Show who did something or who is present, next to a name or an action. Size from xs to xl with the surrounding text, and add the surface ring only over busy media.",
        whenToAvoid:
            "Do not use for places or groups; those get a photo or an icon without initials. Never restyle the circle; size and ring are the only styling API.",
    },
} as const

export function AvatarDemo() {
    return (
        <Demo>
            <div className="flex flex-wrap items-center gap-4">
                <Avatar size="xl">
                    <AvatarImage src="https://example.com/maya.jpg" alt="Maya" />
                    <AvatarFallback name="Maya Chen" />
                    <AvatarPresence />
                </Avatar>
                <Avatar size="lg">
                    <AvatarFallback name="Priya" />
                </Avatar>
                <Avatar size="md">
                    <AvatarFallback name="Sam Rivera" />
                </Avatar>
                <Avatar size="sm">
                    <AvatarFallback name="Jo" />
                </Avatar>
                <Avatar size="xs">
                    <AvatarFallback name="Alex" />
                </Avatar>
            </div>
        </Demo>
    )
}
