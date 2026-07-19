import { type FieldElementProps } from "@formisch/react"
import { type ReactNode, useId } from "react"

export function FieldWrapper({ errors, children }: { errors: unknown; children: ReactNode }) {
    return (
        <div className="space-y-1.5">
            {children}
            <FieldErrors errors={errors} />
        </div>
    )
}

type InputProps = FieldElementProps & {
    type?: string
    placeholder?: string
    label?: string
    id?: string
    input: string | undefined
    errors: string[] | null
}

export function Input({ input, errors: _errors, type, placeholder, label, id, ...inputProps }: InputProps) {
    const fallbackId = useId()
    const inputId = id ?? fallbackId
    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {label}
                </label>
            )}
            <input
                {...inputProps}
                id={inputId}
                value={input ?? ""}
                type={type ?? "text"}
                placeholder={placeholder ?? ""}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-flame-pea-500 focus:ring-1 focus:ring-flame-pea-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-flame-pea-400 dark:focus:ring-flame-pea-400"
            />
        </div>
    )
}

type TextareaProps = FieldElementProps & {
    placeholder?: string
    label?: string
    id?: string
    rows?: number
    input: string | undefined
    errors: string[] | null
}

export function Textarea({ input, errors: _errors, placeholder, rows, label, id, ...textareaProps }: TextareaProps) {
    const fallbackId = useId()
    const textareaId = id ?? fallbackId
    return (
        <div className="space-y-1.5">
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                    {label}
                </label>
            )}
            <textarea
                {...textareaProps}
                id={textareaId}
                value={input ?? ""}
                placeholder={placeholder ?? ""}
                rows={rows ?? 3}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-flame-pea-500 focus:ring-1 focus:ring-flame-pea-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-flame-pea-400 dark:focus:ring-flame-pea-400"
            />
        </div>
    )
}

type SelectProps = FieldElementProps & {
    children: ReactNode
    label?: string
    id?: string
    input: string | undefined
    errors: string[] | null
}

export function Select({ input: _input, errors: _errors, children, label, id, ...selectProps }: SelectProps) {
    const fallbackId = useId()
    const selectId = id ?? fallbackId
    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={selectId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {label}
                </label>
            )}
            <select
                {...selectProps}
                id={selectId}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 focus:border-flame-pea-500 focus:ring-1 focus:ring-flame-pea-500 focus:outline-none dark:border-white/20 dark:bg-[#1a1918] dark:text-white dark:focus:border-flame-pea-400 dark:focus:ring-flame-pea-400"
            >
                {children}
            </select>
        </div>
    )
}

function FieldErrors({ errors }: { errors: any }) {
    return errors ? <div className="text-sm text-red-500">{errors[0]}</div> : null
}
