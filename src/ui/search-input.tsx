import { useRender } from "@base-ui/react/use-render"
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react"
import { useId, useState } from "react"

import { cx } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"

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
    ...props
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

    return useRender({
        defaultTagName: "div",
        state: { slot: "search-input", empty: current === "", disabled: disabled === true },
        props: {
            className: cx("relative flex items-center", className),
            children: (
                <>
                    <MagnifyingGlassIcon
                        className="pointer-events-none absolute left-0 size-4 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <input
                        ref={ref}
                        id={id ?? fallbackId}
                        type="search"
                        value={current}
                        onChange={handleChange}
                        disabled={disabled}
                        placeholder={placeholder ?? "Search restaurants..."}
                        aria-label={placeholder ?? "Search restaurants"}
                        className="w-full border-b border-border bg-transparent py-1.5 pr-10 pl-6 text-base text-foreground transition-colors duration-150 placeholder:text-muted-foreground hover:border-border-strong focus:border-ring focus:outline-none md:text-sm"
                        {...props}
                    />
                    {current !== "" && (
                        <IconButton
                            label="Clear search"
                            tone="plain"
                            onClick={clearSearch}
                            disabled={disabled}
                            className="hit-area-2 absolute right-0"
                        >
                            <XIcon className="size-3.5" aria-hidden="true" />
                        </IconButton>
                    )}
                </>
            ),
        },
    })
}
