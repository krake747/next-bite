import { useState } from "react"

export function useFilterState() {
    const [filter, setFilter] = useState<string | null>(null)
    const [search, setSearch] = useState("")

    return {
        filter,
        setFilter,
        search,
        setSearch,
    }
}
