import { splitProps, type JSX } from "solid-js"
import { type FieldElementProps } from "@formisch/solid"

export function FieldWrapper(props: { errors: any; children: JSX.Element }) {
    return (
        <div>
            {props.children}
            <FieldErrors errors={props.errors} />
        </div>
    )
}

interface InputProps extends FieldElementProps {
    type?: string
    placeholder?: string
    input: string | undefined
    errors: [string, ...string[]] | null
}

export function Input(props: InputProps) {
    const [, inputProps] = splitProps(props, ["input", "errors", "type", "placeholder"])
    return (
        <input
            {...inputProps}
            value={props.input ?? ""}
            type={props.type ?? "text"}
            placeholder={props.placeholder ?? ""}
            class="w-full rounded border border-neutral-200 p-2 dark:border-neutral-600 dark:bg-neutral-700"
        />
    )
}

interface TextareaProps extends FieldElementProps {
    placeholder?: string
    rows?: number
    input: string | undefined
    errors: [string, ...string[]] | null
}

export function Textarea(props: TextareaProps) {
    const [, textareaProps] = splitProps(props, ["input", "errors", "placeholder", "rows"])
    return (
        <textarea
            {...textareaProps}
            value={props.input ?? ""}
            placeholder={props.placeholder ?? ""}
            rows={props.rows ?? 3}
            class="w-full rounded border border-neutral-200 p-2 dark:border-neutral-600 dark:bg-neutral-700"
        />
    )
}

interface SelectProps extends FieldElementProps {
    children: JSX.Element
    input: string | undefined
    errors: [string, ...string[]] | null
}

export function Select(props: SelectProps) {
    const [, selectProps] = splitProps(props, ["input", "errors", "children"])
    return (
        <select
            {...selectProps}
            value={props.input ?? ""}
            class="w-full rounded border border-neutral-200 p-2 dark:border-neutral-600 dark:bg-neutral-700"
        >
            {props.children}
        </select>
    )
}

function FieldErrors(props: { errors: any }) {
    return props.errors ? <div class="text-sm text-red-500">{props.errors[0]}</div> : null
}
