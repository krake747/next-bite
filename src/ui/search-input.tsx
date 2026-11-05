import Search from "lucide-react/icons/search"
import X from "lucide-react/icons/x"
import { useId, useState } from "react"

import { cx } from "@ui/variants"

type SearchInputProps = {
    value?: string | undefined
    defaultValue?: string | undefined
    onChange?: ((value: string) => void) | undefined
    placeholder?: string | undefined
    className?: string | undefined
    disabled?: boolean | undefined
    id?: string | undefined
    name?: string | undefined
    ref?: React.Ref<HTMLInputElement> | undefined
}

export function SearchInput({
    value,
    defaultValue,
    onChange,
    placeholder,
    className,
    disabled,
    id,
    ref,
    ...rest
}: Readonly<
    SearchInputProps & Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "ref">
>) {
    const fallbackId = useId()
    const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "")
    const isControlled = value !== undefined
    const current = isControlled ? value : uncontrolled

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) {
            setUncontrolled(event.currentTarget.value)
        }
        onChange?.(event.currentTarget.value)
    }

    const clearSearch = () => {
        if (!isControlled) {
            setUncontrolled("")
        }
        onChange?.("")
    }

    return (
        <div className={cx("relative flex items-center", className)}>
            <Search className="pointer-events-none absolute left-0 size-4 text-stone-400" aria-hidden="true" />
            <input
                ref={ref}
                id={id ?? fallbackId}
                type="search"
                value={current}
                onChange={handleChange}
                disabled={disabled}
                placeholder={placeholder ?? "Search…"}
                className="w-full border-b border-border bg-transparent py-1.5 pr-10 pl-6 text-base text-stone-900 transition-colors duration-150 placeholder:text-stone-600 hover:border-border-strong focus:border-ring focus:outline-none md:text-sm"
                {...rest}
            />
            {current !== "" && (
                <button
                    type="button"
                    onClick={clearSearch}
                    disabled={disabled}
                    className="hit-area-2 absolute right-0 flex size-8 items-center justify-center rounded-full text-stone-400 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    aria-label="Clear search"
                >
                    <X className="size-3.5" aria-hidden="true" />
                </button>
            )}
        </div>
    )
}
