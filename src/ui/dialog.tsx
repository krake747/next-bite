import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import { XIcon } from "@phosphor-icons/react"

import { cva, cx, type VariantProps } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"

export function Dialog({
    show,
    onOpenChange,
    children,
}: Readonly<{
    show?: boolean | undefined
    onOpenChange: (open: boolean) => void
    children?: React.ReactNode | undefined
}>) {
    return (
        <BaseDialog.Root open={show} onOpenChange={onOpenChange}>
            <BaseDialog.Portal>{children}</BaseDialog.Portal>
        </BaseDialog.Root>
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

type DialogBackdropProps = VariantProps<typeof backdrop> & React.ComponentProps<typeof BaseDialog.Backdrop>

export function DialogBackdrop({ variant, tone, className, children, ...props }: Readonly<DialogBackdropProps>) {
    return (
        <BaseDialog.Backdrop
            data-slot="dialog-backdrop"
            className={cx(backdrop({ variant, tone }), className)}
            {...props}
        >
            {children}
        </BaseDialog.Backdrop>
    )
}

const panel = cva({
    base: "relative w-full overflow-y-auto rounded-dialog border border-border bg-surface shadow-dialog outline-none",
    variants: {
        size: {
            sm: "max-w-sm",
            md: "max-w-lg",
            full: "h-full max-w-none rounded-none border-0 shadow-none",
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

type DialogPanelProps = VariantProps<typeof panel> & React.ComponentProps<typeof BaseDialog.Popup>

export function DialogPanel({ size, padding, className, children, ...props }: Readonly<DialogPanelProps>) {
    return (
        <BaseDialog.Popup data-slot="dialog-panel" className={cx(panel({ size, padding }), className)} {...props}>
            {children}
        </BaseDialog.Popup>
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

export function DialogCloseButton({
    onClick,
    className,
}: Readonly<
    { onClick: () => void } & Omit<React.ComponentProps<"button">, "onClick" | "type" | "children" | "aria-label">
>) {
    return (
        <IconButton
            data-slot="dialog-close"
            label="Close"
            tone="plain"
            onClick={onClick}
            className={cx("hit-area-2 absolute top-4 right-4", className)}
        >
            <XIcon className="size-4" aria-hidden="true" />
        </IconButton>
    )
}

export function DialogAction({
    render,
    children,
}: Readonly<{ render?: React.ReactElement | undefined; children?: React.ReactNode | undefined }>) {
    if (render !== undefined) {
        return <BaseDialog.Close data-slot="dialog-action" render={render} />
    }
    return <BaseDialog.Close data-slot="dialog-action">{children}</BaseDialog.Close>
}
