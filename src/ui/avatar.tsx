// SYNC: docs page lives in src/routes/ds/-sections/avatar.tsx; keep the demo aligned with this file.
import { Avatar as BaseAvatar } from "@base-ui/react/avatar"
import { createContext, use } from "react"

import { cx, type VariantProps } from "@ui/cva.config"

import { avatar, fallbackText } from "./avatar.variants"

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
    React.ComponentProps<typeof BaseAvatar.Root> & {
        readonly children: React.ReactNode
    }

export function Avatar({ size, ring, className, children, ...props }: Readonly<AvatarProps>) {
    const resolvedSize = size ?? "sm"
    return (
        <AvatarSizeContext value={resolvedSize}>
            <BaseAvatar.Root
                data-slot="avatar"
                className={cx(avatar({ size: resolvedSize, ring }), className)}
                {...props}
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
            data-slot="avatar-image"
            src={src}
            alt={alt}
            className={cx("size-full rounded-full object-cover", className)}
            {...props}
        />
    )
}

export function AvatarFallback({
    name,
    className,
    ...props
}: Readonly<
    Omit<React.ComponentProps<typeof BaseAvatar.Fallback>, "children"> & {
        readonly name: string
    }
>) {
    const size = use(AvatarSizeContext)
    return (
        <BaseAvatar.Fallback
            data-slot="avatar-fallback"
            aria-label={name}
            className={cx(
                "flex size-full items-center justify-center rounded-full bg-tomato-100 text-tomato-700",
                fallbackText({ size }),
                className,
            )}
            {...props}
        >
            {initials(name)}
        </BaseAvatar.Fallback>
    )
}

export function AvatarPresence({ className, ...props }: Readonly<React.ComponentProps<"span">>) {
    return (
        <span
            data-slot="avatar-presence"
            aria-hidden="true"
            className={cx(
                "absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-success ring-2 ring-surface",
                className,
            )}
            {...props}
        />
    )
}
