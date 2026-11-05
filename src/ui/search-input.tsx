import Search from "lucide-react/icons/search"
import X from "lucide-react/icons/x"

import { cx } from "@ui/variants"

type SearchInputProps = {
    value: string
    onChange: (value: string) => void
    placeholder?: string | undefined
    className?: string | undefined
}

export function SearchInput({ value, onChange, placeholder, className, ...rest }: Readonly<SearchInputProps>) {
    const handleChange = (e: Readonly<{ readonly currentTarget: Readonly<{ readonly value: string }> }>) => {
        onChange(e.currentTarget.value)
    }

    const clearSearch = () => {
        onChange("")
    }

    return (
        <div className={cx("relative flex items-center", className)}>
            <Search className="pointer-events-none absolute left-0 size-4 text-stone-400" />
            <input
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder ?? "Search..."}
                className="w-full border-b border-stone-200 bg-transparent py-1.5 pr-6 pl-6 text-sm text-stone-900 transition-colors placeholder:text-stone-400 focus:border-ring focus:outline-none"
                {...rest}
            />
            {value && (
                <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-0 flex size-5 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                    aria-label="Clear search"
                >
                    <X className="size-3.5" />
                </button>
            )}
        </div>
    )
}
