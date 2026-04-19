import { createMemo } from "solid-js"
import { useWheel } from "./wheel-context"
import { WHEEL_CONFIG_CONSTANTS } from "./wheel-store"
import { type Restaurant } from "../../core/hooks"

const MAX_LABEL_LENGTH = 18

const WHEEL_COLORS = [
    "#b53920",
    "#c45a3d",
    "#d47a5e",
    "#8b4513",
    "#a0522d",
    "#cd853f",
    "#e07850",
    "#943d2a",
    "#bf5b40",
    "#d46a4a",
    "#a65030",
    "#c85a38",
] as const

function getRestaurantColorId(id: string, idx: number, total: number): number {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash
    }
    let colorIdx = Math.abs(hash) % WHEEL_COLORS.length

    if (total <= 1) return colorIdx

    const step = Math.floor(WHEEL_COLORS.length / total) || 1
    colorIdx = (idx * step + colorIdx) % WHEEL_COLORS.length

    return colorIdx
}

function getContrastColor(bgColor: string): string {
    const hex = bgColor.replace("#", "")
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? "#000000" : "#ffffff"
}

export function WheelSegment(props: { restaurant: Restaurant; idx: number }) {
    const wheel = useWheel()
    const { radius, center } = WHEEL_CONFIG_CONSTANTS

    const segment = createMemo(() => {
        const point = (angle: number, factor = 1) => [
            center + radius * factor * Math.cos(angle),
            center + radius * factor * Math.sin(angle),
        ]

        const segmentCount = wheel.segments().length
        const segmentAngle = segmentCount > 0 ? 360 / segmentCount : 0
        const start = (props.idx * segmentAngle * Math.PI) / 180
        const end = ((props.idx + 1) * segmentAngle * Math.PI) / 180
        const arc = segmentAngle > 180 ? 1 : 0
        const [x1, y1] = point(start)
        const [x2, y2] = point(end)
        const labelAngle = start + (end - start) / 2

        const [x, y] = point(labelAngle, 0.62)

        const rotationDeg = ((labelAngle * 180) / Math.PI + 360) % 360
        const rotation = rotationDeg > 180 ? rotationDeg - 180 : rotationDeg

        return {
            path: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${arc} 1 ${x2} ${y2} Z`,
            x,
            y,
            rotation,
        }
    })

    const colorIndex = createMemo(() => getRestaurantColorId(props.restaurant._id, props.idx, wheel.segments().length))
    const bgColor = createMemo(() => WHEEL_COLORS[colorIndex()] ?? WHEEL_COLORS[0])
    const contrastColor = createMemo(() => getContrastColor(bgColor()))
    const displayName =
        props.restaurant.name.length > MAX_LABEL_LENGTH
            ? props.restaurant.name.slice(0, MAX_LABEL_LENGTH - 3) + "..."
            : props.restaurant.name

    return (
        <g>
            <path d={segment().path} fill={bgColor()} />
            <text
                x={segment().x}
                y={segment().y}
                fill={contrastColor()}
                text-anchor="middle"
                dominant-baseline="middle"
                transform={`rotate(${segment().rotation}, ${segment().x}, ${segment().y})`}
                style={{
                    "font-family": "var(--font-body)",
                    "font-size": "13px",
                    "font-weight": "500",
                }}
            >
                {displayName}
            </text>
        </g>
    )
}
