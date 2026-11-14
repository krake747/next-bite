// SYNC: docs page lives in src/routes/ds/-sections/dialog.tsx; keep the demo aligned with this file.
import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import { XIcon } from "@phosphor-icons/react"

import { cva, cx, type VariantProps } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"

export function Dialog({ children, ...props }: Readonly<React.ComponentProps<typeof BaseDialog.Root>>) {
    return (
        <BaseDialog.Root data-slot="dialog" {...props}>
            {children}
        </BaseDialog.Root>
    )
}

export function DialogTrigger({ children, ...props }: Readonly<React.ComponentProps<typeof BaseDialog.Trigger>>) {
    return (
        <BaseDialog.Trigger data-slot="dialog-trigger" {...props}>
            {children}
        </BaseDialog.Trigger>
    )
}

export function DialogPortal({ children, ...props }: Readonly<React.ComponentProps<typeof BaseDialog.Portal>>) {
    return (
        <BaseDialog.Portal data-slot="dialog-portal" {...props}>
            {children}
        </BaseDialog.Portal>
    )
}

export function DialogClose({ children, ...props }: Readonly<React.ComponentProps<typeof BaseDialog.Close>>) {
    return (
        <BaseDialog.Close data-slot="dialog-close" {...props}>
            {children}
        </BaseDialog.Close>
    )
}

const backdrop = cva({
    base: "fixed inset-0 z-50",
    variants: {
        variant: {
            overlay: "flex items-center justify-center p-4",
            fullscreen: "",
        },
        tone: {
            dim: "bg-scrim/50 backdrop-blur-sm transition-opacity duration-150",
            deep: "bg-scrim/80 backdrop-blur-sm transition-opacity duration-150",
            darkest: "bg-scrim transition-opacity duration-150",
        },
    },
    defaultVariants: {
        variant: "overlay",
        tone: "dim",
    },
})

type DialogOverlayProps = VariantProps<typeof backdrop> & React.ComponentProps<typeof BaseDialog.Backdrop>

export function DialogOverlay({ variant, tone, className, ...props }: Readonly<DialogOverlayProps>) {
    return (
        <BaseDialog.Backdrop
            data-slot="dialog-overlay"
            className={cx(backdrop({ variant, tone }), className)}
            {...props}
        />
    )
}

const panel = cva({
    base: "fixed z-50 overflow-y-auto rounded-dialog border border-border bg-surface shadow-dialog transition-[opacity,translate,scale] duration-150 outline-none data-ending-style:opacity-0 data-starting-style:opacity-0",
    variants: {
        size: {
            sm: "top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 data-ending-style:scale-95 data-starting-style:scale-95",
            md: "top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 data-ending-style:scale-95 data-starting-style:scale-95",
            full: "inset-0 h-full max-w-none rounded-none border-0 shadow-none",
        },
        padding: {
            none: "p-0",
            sm: "p-5",
            md: "p-6",
        },
    },
    defaultVariants: {
        size: "md",
        padding: "md",
    },
})

type DialogContentProps = VariantProps<typeof panel> &
    VariantProps<typeof backdrop> &
    React.ComponentProps<typeof BaseDialog.Popup> & {
        readonly showCloseButton?: boolean | undefined
    }

export function DialogContent({
    size,
    padding,
    variant,
    tone,
    showCloseButton = true,
    className,
    children,
    ref,
    ...props
}: Readonly<DialogContentProps>) {
    return (
        <DialogPortal>
            <DialogOverlay variant={variant} tone={tone} />
            <BaseDialog.Popup
                ref={ref}
                data-slot="dialog-content"
                className={cx(panel({ size, padding }), className)}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <BaseDialog.Close
                        data-slot="dialog-close"
                        render={
                            <IconButton label="Close" tone="plain" className="absolute top-4 right-4">
                                <XIcon className="size-4" aria-hidden="true" />
                            </IconButton>
                        }
                    />
                )}
            </BaseDialog.Popup>
        </DialogPortal>
    )
}

export function DialogHeader({ className, ...props }: Readonly<React.ComponentProps<"div">>) {
    return (
        <div
            data-slot="dialog-header"
            className={cx("flex flex-col gap-2 text-center sm:text-left", className)}
            {...props}
        />
    )
}

export function DialogFooter({ className, ...props }: Readonly<React.ComponentProps<"div">>) {
    return (
        <div
            data-slot="dialog-footer"
            className={cx("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
            {...props}
        />
    )
}

const title = cva({
    base: "font-display font-semibold text-balance text-foreground",
    variants: {
        size: {
            md: "text-lg",
            lg: "text-xl",
        },
        tone: {
            default: "",
            inverse: "text-inverse",
        },
    },
    defaultVariants: {
        size: "md",
        tone: "default",
    },
})

type DialogTitleProps = VariantProps<typeof title> & React.ComponentProps<typeof BaseDialog.Title>

export function DialogTitle({ size, tone, className, children, ...props }: Readonly<DialogTitleProps>) {
    return (
        <BaseDialog.Title data-slot="dialog-title" className={cx(title({ size, tone }), className)} {...props}>
            {children}
        </BaseDialog.Title>
    )
}

export function DialogDescription({
    className,
    children,
    ...props
}: Readonly<React.ComponentProps<typeof BaseDialog.Description>>) {
    return (
        <BaseDialog.Description
            data-slot="dialog-description"
            className={cx("mt-2 text-sm text-muted-foreground", className)}
            {...props}
        >
            {children}
        </BaseDialog.Description>
    )
}
