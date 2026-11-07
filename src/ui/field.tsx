import { Select as BaseSelect } from "@base-ui/react/select"
import { type FieldElementProps } from "@formisch/react"
import { CaretDownIcon, CheckIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useEffect, useId, useRef } from "react"
import * as v from "valibot"

import { cx } from "@ui/cva.config"
import { control, fieldLabel } from "@ui/variants"

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
        <div className="flex flex-col gap-1.5">
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

function hasErrors(errors: Readonly<[string, ...string[]]> | null): boolean {
    return errors !== null
}

export function Input(props: Readonly<InputProps>) {
    const fallbackId = useId()
    const errorId = useId()
    const { input, errors, type, placeholder, label, id, onChange, ref, ...inputProps } = props
    const handleChange = v.parse(changeHandlerSchema, onChange)
    const inputRef = v.parse(refCallbackSchema, ref)
    const inputId = id ?? fallbackId
    const invalid = hasErrors(errors)
    return (
        <div className="flex flex-col gap-1.5">
            {label !== undefined && label !== "" && (
                <label htmlFor={inputId} className={fieldLabel()}>
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
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
                className={cx(
                    control(),
                    invalid && "border-destructive focus:border-destructive focus:ring-destructive",
                )}
                {...inputProps}
            />
            <FieldErrors errors={errors} id={errorId} />
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
    const errorId = useId()
    const { input, errors, placeholder, rows, label, id, onChange, ref, ...textareaProps } = props
    const handleChange = v.parse(changeHandlerSchema, onChange)
    const textareaRef = v.parse(refCallbackSchema, ref)
    const textareaId = id ?? fallbackId
    const invalid = hasErrors(errors)
    return (
        <div className="flex flex-col gap-1.5">
            {label !== undefined && label !== "" && (
                <label htmlFor={textareaId} className={fieldLabel()}>
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
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
                className={cx(
                    control(),
                    invalid && "border-destructive focus:border-destructive focus:ring-destructive",
                )}
                {...textareaProps}
            />
            <FieldErrors errors={errors} id={errorId} />
        </div>
    )
}

type SelectOption = {
    readonly value: string
    readonly label: string
}

type SelectProps = Omit<FieldElementProps, "onChange" | "ref"> & {
    readonly onChange: unknown
    readonly ref: unknown
    readonly options: ReadonlyArray<SelectOption>
    readonly label?: string | undefined
    readonly id?: string | undefined
    readonly input: string | undefined
    readonly errors: Readonly<[string, ...string[]]> | null
}

export function Select(props: Readonly<SelectProps>) {
    const fallbackId = useId()
    const labelId = useId()
    const errorId = useId()
    const { input, errors, options, label, id, onChange, ref, ...selectProps } = props
    const handleChange = v.parse(changeHandlerSchema, onChange)
    const selectRef = v.parse(refCallbackSchema, ref)
    const selectId = id ?? fallbackId
    const hiddenRef = useRef<HTMLSelectElement | null>(null)
    const value = input ?? ""
    const invalid = hasErrors(errors)
    const selectedLabel = options.find((item) => item.value === value)?.label ?? ""

    useEffect(() => {
        const element = hiddenRef.current
        if (element !== null && element.value !== value) {
            element.value = value
        }
    }, [value])

    return (
        <div className="flex flex-col gap-1.5">
            {label !== undefined && label !== "" && (
                <label id={labelId} htmlFor={selectId} className={fieldLabel()}>
                    {label}
                </label>
            )}
            <BaseSelect.Root
                value={value}
                onValueChange={(next) => {
                    const element = hiddenRef.current
                    if (element !== null) {
                        element.value = next ?? ""
                        element.dispatchEvent(new Event("change", { bubbles: true }))
                    }
                }}
            >
                <BaseSelect.Trigger
                    id={selectId}
                    aria-labelledby={label !== undefined && label !== "" ? labelId : undefined}
                    aria-invalid={invalid}
                    aria-describedby={invalid ? errorId : undefined}
                    className={cx(
                        control(),
                        "flex items-center justify-between gap-2 text-left",
                        value === "" && "text-muted-foreground",
                        invalid && "border-destructive focus:border-destructive focus:ring-destructive",
                    )}
                >
                    <BaseSelect.Value>{() => selectedLabel}</BaseSelect.Value>
                    <BaseSelect.Icon>
                        <CaretDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </BaseSelect.Icon>
                </BaseSelect.Trigger>
                <BaseSelect.Portal>
                    <BaseSelect.Positioner sideOffset={4}>
                        <BaseSelect.Popup className="z-50 max-h-64 overflow-y-auto rounded-panel border border-border bg-surface py-1 shadow-popover outline-none">
                            <BaseSelect.List>
                                {options.map((item) => (
                                    <BaseSelect.Item
                                        key={item.value === "" ? "__empty" : item.value}
                                        value={item.value}
                                        className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm text-foreground outline-none data-highlighted:bg-surface-muted"
                                    >
                                        <BaseSelect.ItemText>{item.label}</BaseSelect.ItemText>
                                        <BaseSelect.ItemIndicator>
                                            <CheckIcon className="size-4 text-tomato-600" aria-hidden="true" />
                                        </BaseSelect.ItemIndicator>
                                    </BaseSelect.Item>
                                ))}
                            </BaseSelect.List>
                        </BaseSelect.Popup>
                    </BaseSelect.Positioner>
                </BaseSelect.Portal>
                <select
                    ref={(element) => {
                        hiddenRef.current = element
                        selectRef(element)
                    }}
                    onChange={handleChange}
                    defaultValue={value}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="hidden"
                    {...selectProps}
                >
                    {options.map((item) => (
                        <option key={item.value === "" ? "__empty" : item.value} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </BaseSelect.Root>
            <FieldErrors errors={errors} id={errorId} />
        </div>
    )
}

function FieldErrors({ errors, id }: Readonly<{ errors: unknown; id?: string | undefined }>) {
    const message = Array.isArray(errors) && typeof errors[0] === "string" ? errors[0] : null
    return message !== null && message !== "" ? (
        <div id={id} role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
            <WarningCircleIcon className="size-4 shrink-0" aria-hidden="true" />
            <span>{message}</span>
        </div>
    ) : null
}
