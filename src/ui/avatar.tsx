import { Avatar as BaseAvatar } from "@base-ui/react/avatar"

import { cva, cx, type VariantProps } from "@ui/variants"

const avatar = cva({
    base: "relative inline-flex shrink-0 items-center justify-center overflow-visible rounded-full",
    variants: {
        size: {
            xs: "size-6",
            sm: "size-8",
            md: "size-10",
            lg: "size-12",
            xl: "size-16",
        },
        ring: {
            none: "",
            surface: "ring-2 ring-surface",
        },
    },
    defaultVariants: {
        size: "sm",
        ring: "none",
    },
})

const fallbackText = cva({
    base: "font-semibold",
    variants: {
        size: {
            xs: "text-[10px]",
            sm: "text-xs",
            md: "text-sm",
            lg: "text-base",
            xl: "text-lg",
        },
    },
    defaultVariants: {
        size: "sm",
    },
})

function initials(name: string): string {
    const parts = name.trim().split(/\s+/)
    const first = parts[0]?.[0] ?? ""
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : ""
    const result = `${first}${last}`.toUpperCase()
    return result === "" ? "?" : result
}

type AvatarProps = VariantProps<typeof avatar> &
    Readonly<{
        src?: string | undefined
        name: string
        presence?: boolean | undefined
        className?: string | undefined
    }>

export function Avatar({ src, name, size, ring, presence, className }: AvatarProps) {
    return (
        <BaseAvatar.Root data-slot="avatar" className={cx(avatar({ size, ring }), className)}>
            <BaseAvatar.Image src={src} alt={name} className="size-full rounded-full object-cover" />
            <BaseAvatar.Fallback
                aria-label={name}
                className={cx(
                    "flex size-full items-center justify-center rounded-full bg-tomato-100 text-tomato-700",
                    fallbackText({ size }),
                )}
            >
                {initials(name)}
            </BaseAvatar.Fallback>
            {presence === true && (
                <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-success ring-2 ring-surface"
                />
            )}
        </BaseAvatar.Root>
    )
}
