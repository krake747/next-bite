export type Restaurant = {
    _id: string
    name: string
    cuisine: string
    location: string
    notes?: string
    addedBy: string
    visited: boolean
    createdAt: number
}

export type Friend = {
    _id: string
    name: string
}
