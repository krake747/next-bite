import { type FieldElementProps } from "@formisch/react"
import { useId } from "react"
import * as v from "valibot"

const changeHandlerSchema = v.custom<FieldElementProps["onChange"]>(
    (value) => typeof value === "function",
    "Expected a change handler function",
)

const refCallbackSchema = v.custom<FieldElementProps["ref"]>(
    (value) => typeof value === "function",
    "Expected a ref callback function",
)

export function FieldWrapper({ errors, children }: Readonly<{ errors: unknown; children: React.ReactNode }>) {
    return (
        <div className="space-y-1.5">
            {children}
            <FieldErrors errors={errors} />
        </div>
    )
}

type InputProps = Omit<FieldElementProps, "onChange" | "ref"> & {
    readonly onChange: unknown
    readonly ref: unknown
    readonly type?: string | undefined
    readonly placeholder?: string | undefined
    readonly label?: string | undefined
    readonly id?: string | undefined
    readonly input: string | undefined
    readonly errors: Readonly<[string, ...string[]]> | null
}

export function Input(props: Readonly<InputProps>) {
    const fallbackId = useId()
    const { input, errors: _errors, type, placeholder, label, id, onChange, ref, ...inputProps } = props
    const handleChange = v.parse(changeHandlerSchema, onChange)
    const inputRef = v.parse(refCallbackSchema, ref)
    const inputId = id ?? fallbackId
    return (
        <div className="space-y-1.5">
            {label !== undefined && label !== "" && (
                <label htmlFor={inputId} className="block text-sm font-medium text-stone-700">
                    {label}
                </label>
            )}
            <input
                ref={inputRef}
                onChange={handleChange}
                id={inputId}
                value={input ?? ""}
                type={type ?? "text"}
                placeholder={placeholder ?? ""}
                className="w-full rounded-lg border border-stone-200 bg-surface px-3 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-tomato-500 focus:ring-1 focus:ring-tomato-500 focus:outline-none"
                {...inputProps}
            />
        </div>
    )
}

type TextareaProps = Omit<FieldElementProps, "onChange" | "ref"> & {
    readonly onChange: unknown
    readonly ref: unknown
    readonly placeholder?: string | undefined
    readonly label?: string | undefined
    readonly id?: string | undefined
    readonly rows?: number | undefined
    readonly input: string | undefined
    readonly errors: Readonly<[string, ...string[]]> | null
}

export function Textarea(props: Readonly<TextareaProps>) {
    const fallbackId = useId()
    const { input, errors: _errors, placeholder, rows, label, id, onChange, ref, ...textareaProps } = props
    const handleChange = v.parse(changeHandlerSchema, onChange)
    const textareaRef = v.parse(refCallbackSchema, ref)
    const textareaId = id ?? fallbackId
    return (
        <div className="space-y-1.5">
            {label !== undefined && label !== "" && (
                <label htmlFor={textareaId} className="block text-sm font-medium text-stone-700">
                    {label}
                </label>
            )}
            <textarea
                ref={textareaRef}
                onChange={handleChange}
                id={textareaId}
                value={input ?? ""}
                placeholder={placeholder ?? ""}
                rows={rows ?? 3}
                className="w-full rounded-lg border border-stone-200 bg-surface px-3 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-tomato-500 focus:ring-1 focus:ring-tomato-500 focus:outline-none"
                {...textareaProps}
            />
        </div>
    )
}

type SelectProps = Omit<FieldElementProps, "onChange" | "ref"> & {
    readonly onChange: unknown
    readonly ref: unknown
    readonly children: React.ReactNode
    readonly label?: string | undefined
    readonly id?: string | undefined
    readonly input: string | undefined
    readonly errors: Readonly<[string, ...string[]]> | null
}

export function Select(props: Readonly<SelectProps>) {
    const fallbackId = useId()
    const { input: _input, errors: _errors, children, label, id, onChange, ref, ...selectProps } = props
    const handleChange = v.parse(changeHandlerSchema, onChange)
    const selectRef = v.parse(refCallbackSchema, ref)
    const selectId = id ?? fallbackId
    return (
        <div className="space-y-1.5">
            {label !== undefined && label !== "" && (
                <label htmlFor={selectId} className="block text-sm font-medium text-stone-700">
                    {label}
                </label>
            )}
            <select
                ref={selectRef}
                onChange={handleChange}
                id={selectId}
                className="w-full rounded-lg border border-stone-200 bg-surface px-3 py-2.5 text-stone-900 focus:border-tomato-500 focus:ring-1 focus:ring-tomato-500 focus:outline-none"
                {...selectProps}
            >
                {children}
            </select>
        </div>
    )
}

function FieldErrors({ errors }: Readonly<{ errors: unknown }>) {
    const message = Array.isArray(errors) && typeof errors[0] === "string" ? errors[0] : null
    return message !== null && message !== "" ? <div className="text-sm text-red-500">{message}</div> : null
}
