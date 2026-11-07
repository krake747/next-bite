export const TEMP_ID_PREFIX = "optimistic-"

export function isTempId(id: string): boolean {
    return id.startsWith(TEMP_ID_PREFIX)
}

export function assertRealId(id: string): void {
    if (isTempId(id)) {
        throw new Error("Restaurant is still syncing; try again in a moment")
    }
}
