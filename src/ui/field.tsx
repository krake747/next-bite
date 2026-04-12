import { splitProps, type JSX } from "solid-js"
import { type FieldElementProps } from "@formisch/solid"

export function FieldWrapper(props: { errors: any; children: JSX.Element }) {
    return (
        <div class="space-y-1.5">
            {props.children}
            <FieldErrors errors={props.errors} />
        </div>
    )
}

interface InputProps extends FieldElementProps {
    type?: string
    placeholder?: string
    label?: string
    input: string | undefined
    errors: string[] | null
}

export function Input(props: InputProps) {
    const [, inputProps] = splitProps(props, ["input", "errors", "type", "placeholder", "label"])
    return (
        <div class="space-y-1.5">
            {props.label && (
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{props.label}</label>
            )}
            <input
                {...inputProps}
                value={props.input ?? ""}
                type={props.type ?? "text"}
                placeholder={props.placeholder ?? ""}
                class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-flame-pea-500 focus:ring-1 focus:ring-flame-pea-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-flame-pea-400 dark:focus:ring-flame-pea-400"
            />
        </div>
    )
}

interface TextareaProps extends FieldElementProps {
    placeholder?: string
    label?: string
    rows?: number
    input: string | undefined
    errors: string[] | null
}

export function Textarea(props: TextareaProps) {
    const [, textareaProps] = splitProps(props, ["input", "errors", "placeholder", "rows", "label"])
    return (
        <div class="space-y-1.5">
            {props.label && (
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{props.label}</label>
            )}
            <textarea
                {...textareaProps}
                value={props.input ?? ""}
                placeholder={props.placeholder ?? ""}
                rows={props.rows ?? 3}
                class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-flame-pea-500 focus:ring-1 focus:ring-flame-pea-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-flame-pea-400 dark:focus:ring-flame-pea-400"
            />
        </div>
    )
}

interface SelectProps extends FieldElementProps {
    children: JSX.Element
    label?: string
    input: string | undefined
    errors: string[] | null
}

export function Select(props: SelectProps) {
    const [, selectProps] = splitProps(props, ["input", "errors", "children", "label"])
    return (
        <div class="space-y-1.5">
            {props.label && (
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{props.label}</label>
            )}
            <select
                {...selectProps}
                class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 focus:border-flame-pea-500 focus:ring-1 focus:ring-flame-pea-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-flame-pea-400 dark:focus:ring-flame-pea-400"
            >
                {props.children}
            </select>
        </div>
    )
}

function FieldErrors(props: { errors: any }) {
    return props.errors ? <div class="text-sm text-red-500">{props.errors[0]}</div> : null
}
