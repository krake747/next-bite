import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import X from "lucide-react/icons/x"

import { cva, cx, type VariantProps } from "@ui/variants"

export function Dialog({
    show,
    onOpenChange,
    children,
}: Readonly<{ show: boolean; onOpenChange: (open: boolean) => void; children?: React.ReactNode | undefined }>) {
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
    Readonly<{ className?: string | undefined; children?: React.ReactNode | undefined }> &
    Omit<React.ComponentProps<typeof BaseDialog.Backdrop>, "className" | "children" | "render">

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

type DialogPanelProps = VariantProps<typeof panel> &
    Readonly<{ className?: string | undefined; children?: React.ReactNode | undefined }> &
    Omit<React.ComponentProps<typeof BaseDialog.Popup>, "className" | "children" | "render">

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

type DialogTitleProps = VariantProps<typeof title> &
    Readonly<{ className?: string | undefined; children?: React.ReactNode | undefined }> &
    Omit<React.ComponentProps<typeof BaseDialog.Title>, "className" | "children" | "render">

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
}: Readonly<{ className?: string | undefined; children?: React.ReactNode | undefined }> &
    Omit<React.ComponentProps<typeof BaseDialog.Description>, "className" | "children" | "render">) {
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

const closeButton = cva({
    base: "hit-area-2 absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-stone-400 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    variants: {
        tone: {
            default: "",
            soft: "bg-stone-100 hover:bg-stone-200",
        },
    },
    defaultVariants: {
        tone: "default",
    },
})

export function DialogCloseButton({
    onClose,
    tone,
    className,
}: Readonly<{ onClose: () => void } & VariantProps<typeof closeButton> & { className?: string | undefined }>) {
    return (
        <button type="button" onClick={onClose} className={cx(closeButton({ tone }), className)}>
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
        </button>
    )
}

export function DialogAction({ render }: Readonly<{ render: React.ReactElement | undefined }>) {
    return <BaseDialog.Close render={render} />
}
