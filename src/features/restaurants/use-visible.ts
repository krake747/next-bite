import { useEffect, useRef, useState } from "react"

export function useVisible(rootMargin = "400px"): readonly [React.RefObject<HTMLDivElement | null>, boolean] {
    const sentinelRef = useRef<HTMLDivElement | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    useEffect(() => {
        const node = sentinelRef.current
        if (node === null || isVisible) {
            return () => {}
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setIsVisible(true)
                }
            },
            { rootMargin },
        )
        observer.observe(node)
        return () => {
            observer.disconnect()
        }
    }, [isVisible, rootMargin])
    return [sentinelRef, isVisible]
}
