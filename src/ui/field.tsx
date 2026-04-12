import { splitProps, type JSX, createUniqueId } from "solid-js"
import { type FieldElementProps } from "@formisch/solid"

export function FieldWrapper(props: { errors: unknown; children: JSX.Element }) {
    return (
        <div class="space-y-1.5">
            {props.children}
            <FieldErrors errors={props.errors} />
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

export function Input(props: InputProps) {
    const [, inputProps] = splitProps(props, ["input", "errors", "type", "placeholder", "label", "id"])
    const inputId = props.id || createUniqueId()
    return (
        <div class="space-y-1.5">
            {props.label && (
                <label for={inputId} class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {props.label}
                </label>
            )}
            <input
                {...inputProps}
                id={inputId}
                value={props.input ?? ""}
                type={props.type ?? "text"}
                placeholder={props.placeholder ?? ""}
                class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-flame-pea-500 focus:ring-1 focus:ring-flame-pea-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-flame-pea-400 dark:focus:ring-flame-pea-400"
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

export function Textarea(props: TextareaProps) {
    const [, textareaProps] = splitProps(props, ["input", "errors", "placeholder", "rows", "label", "id"])
    const textareaId = props.id || createUniqueId()
    return (
        <div class="space-y-1.5">
            {props.label && (
                <label for={textareaId} class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {props.label}
                </label>
            )}
            <textarea
                {...textareaProps}
                id={textareaId}
                value={props.input ?? ""}
                placeholder={props.placeholder ?? ""}
                rows={props.rows ?? 3}
                class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:border-flame-pea-500 focus:ring-1 focus:ring-flame-pea-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-flame-pea-400 dark:focus:ring-flame-pea-400"
            />
        </div>
    )
}

type SelectProps = FieldElementProps & {
    children: JSX.Element
    label?: string
    id?: string
    input: string | undefined
    errors: string[] | null
}

export function Select(props: SelectProps) {
    const [, selectProps] = splitProps(props, ["input", "errors", "children", "label", "id"])
    const selectId = props.id || createUniqueId()
    return (
        <div class="space-y-1.5">
            {props.label && (
                <label for={selectId} class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {props.label}
                </label>
            )}
            <select
                {...selectProps}
                id={selectId}
                class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 focus:border-flame-pea-500 focus:ring-1 focus:ring-flame-pea-500 focus:outline-none dark:border-white/20 dark:bg-[#1a1918] dark:text-white dark:focus:border-flame-pea-400 dark:focus:ring-flame-pea-400"
            >
                {props.children}
            </select>
        </div>
    )
}

function FieldErrors(props: { errors: any }) {
    return props.errors ? <div class="text-sm text-red-500">{props.errors[0]}</div> : null
}
