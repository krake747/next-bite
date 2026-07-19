import { useState } from "react"

export function useFilterState(initial: string | null = null) {
    const [filter, setFilter] = useState<string | null>(initial)
    const [search, setSearch] = useState("")

    const searchHasText = search.trim() !== ""
    const hasActive = filter !== null || searchHasText

    const clear = () => {
        setFilter(null)
        setSearch("")
    }

    return {
        filter,
        setFilter,
        search,
        setSearch,
        hasActive,
        clear,
    }
}
