import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import X from "lucide-react/icons/x"

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
            dim: "bg-stone-900/50 backdrop-blur-sm transition-opacity duration-150",
            deep: "bg-stone-900/80 backdrop-blur-sm transition-opacity duration-150",
            dark: "bg-stone-900/90 transition-opacity duration-150",
        },
    },
    defaultVariants: {
        variant: "overlay",
        tone: "dim",
    },
})

type DialogBackdropProps = VariantProps<typeof backdrop> &
    Omit<React.ComponentProps<typeof BaseDialog.Backdrop>, "render">

export function DialogBackdrop({ variant, tone, className, children, ...rest }: DialogBackdropProps) {
    return (
        <BaseDialog.Backdrop
            data-slot="dialog-backdrop"
            className={cx(backdrop({ variant, tone }), className)}
            {...rest}
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
        tone: {
            default: "",
        },
    },
    defaultVariants: {
        size: "md",
        padding: "md",
        tone: "default",
    },
})

type DialogPanelProps = VariantProps<typeof panel> & Omit<React.ComponentProps<typeof BaseDialog.Popup>, "render">

export function DialogPanel({ size, padding, tone, className, children, ...rest }: DialogPanelProps) {
    return (
        <BaseDialog.Popup data-slot="dialog-panel" className={cx(panel({ size, padding, tone }), className)} {...rest}>
            {children}
        </BaseDialog.Popup>
    )
}

const title = cva({
    base: "font-display font-semibold text-balance text-stone-900",
    variants: {
        size: {
            md: "text-lg",
            lg: "text-xl",
        },
        tone: {
            default: "",
            inverse: "text-white",
        },
    },
    defaultVariants: {
        size: "md",
        tone: "default",
    },
})

type DialogTitleProps = VariantProps<typeof title> & Omit<React.ComponentProps<typeof BaseDialog.Title>, "render">

export function DialogTitle({ size, tone, className, children, ...rest }: DialogTitleProps) {
    return (
        <BaseDialog.Title data-slot="dialog-title" className={cx(title({ size, tone }), className)} {...rest}>
            {children}
        </BaseDialog.Title>
    )
}

export function DialogDescription({
    className,
    children,
    ...rest
}: Readonly<Omit<React.ComponentProps<typeof BaseDialog.Description>, "render">>) {
    return (
        <BaseDialog.Description
            data-slot="dialog-description"
            className={cx("mt-2 text-sm text-stone-600", className)}
            {...rest}
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
            label="Close"
            tone="plain"
            onClick={onClick}
            className={cx("hit-area-2 absolute top-4 right-4", className)}
        >
            <X className="size-4" />
        </IconButton>
    )
}

export function DialogAction({
    render,
    children,
}: Readonly<{ render?: React.ReactElement | undefined; children?: React.ReactNode | undefined }>) {
    if (render !== undefined) {
        return <BaseDialog.Close render={render} />
    }
    return <BaseDialog.Close>{children}</BaseDialog.Close>
}
