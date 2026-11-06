import { type RestaurantDoc } from "./restaurants"

export function mockBackend(
    initial: ReadonlyArray<RestaurantDoc> = [],
    hooks?: Readonly<{ query?: () => Promise<unknown> }>,
) {
    let state = [...initial]
    const receivers = new Set<(result: ReadonlyArray<RestaurantDoc>) => void>()
    return {
        syncClient: {
            onUpdate: (_query: unknown, _args: unknown, receive: (result: unknown) => void) => {
                const push = (rows: ReadonlyArray<RestaurantDoc>) => {
                    receive([...rows])
                }
                receivers.add(push)
                push(state)
                const unsub: () => void = () => {
                    receivers.delete(push)
                }
                return Object.assign(unsub, {
                    unsubscribe: () => {
                        receivers.delete(push)
                    },
                    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- mock models a backend holding current rows for the generic subscription surface
                    getCurrentValue: () => [...state] as unknown as never,
                })
            },
            query: async (): Promise<unknown> => {
                if (hooks?.query !== undefined) {
                    return hooks.query()
                }
                await Promise.resolve()
                return []
            },
            mutation: async (): Promise<unknown> => {
                await Promise.resolve()
                return null
            },
        },
        pushState: (rows: ReadonlyArray<RestaurantDoc>) => {
            state = [...rows]
            for (const push of receivers) {
                push(state)
            }
        },
        subscriberCount: (): number => receivers.size,
    }
}
