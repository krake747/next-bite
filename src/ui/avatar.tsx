import { Avatar as BaseAvatar } from "@base-ui/react/avatar"
import { createContext, use } from "react"

import { cva, cx, type VariantProps } from "@ui/cva.config"

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
            xs: "text-xs",
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

type AvatarSize = NonNullable<VariantProps<typeof avatar>["size"]>

const AvatarSizeContext = createContext<AvatarSize>("sm")

function initials(name: string | undefined): string {
    const parts = (name ?? "").trim().split(/\s+/)
    const first = parts[0]?.[0] ?? ""
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : ""
    const result = `${first}${last}`.toUpperCase()
    return result === "" ? "?" : result
}

type AvatarProps = VariantProps<typeof avatar> &
    Omit<React.ComponentProps<typeof BaseAvatar.Root>, "children"> & {
        readonly children: React.ReactNode
    }

export function Avatar({ size, ring, className, children, ...rest }: Readonly<AvatarProps>) {
    const resolvedSize = size ?? "sm"
    return (
        <AvatarSizeContext value={resolvedSize}>
            <BaseAvatar.Root
                data-slot="avatar"
                className={cx(avatar({ size: resolvedSize, ring }), className)}
                {...rest}
            >
                {children}
            </BaseAvatar.Root>
        </AvatarSizeContext>
    )
}

export function AvatarImage({
    src,
    alt,
    className,
    ...props
}: Readonly<
    Omit<React.ComponentProps<typeof BaseAvatar.Image>, "children"> & {
        readonly alt: string
    }
>) {
    return (
        <BaseAvatar.Image
            src={src}
            alt={alt}
            className={cx("size-full rounded-full object-cover", className)}
            {...props}
        />
    )
}

export function AvatarFallback({ name, className }: Readonly<{ name: string; className?: string | undefined }>) {
    const size = use(AvatarSizeContext)
    return (
        <BaseAvatar.Fallback
            aria-label={name}
            className={cx(
                "flex size-full items-center justify-center rounded-full bg-tomato-100 text-tomato-700",
                fallbackText({ size }),
                className,
            )}
        >
            {initials(name)}
        </BaseAvatar.Fallback>
    )
}

export function AvatarPresence({ className }: Readonly<{ className?: string | undefined }>) {
    return (
        <span
            aria-hidden="true"
            className={cx(
                "absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-success ring-2 ring-surface",
                className,
            )}
        />
    )
}
