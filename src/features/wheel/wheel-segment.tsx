import { createMemo } from "solid-js"
import { useWheel } from "./wheel-context"
import { WHEEL_CONFIG_CONSTANTS } from "./wheel-store"
import { type Restaurant } from "../../core/hooks"

// Warm color palette for restaurants
const WHEEL_COLORS = [
    { bg: "#b53920", name: "flame-red" }, // flame-pea-700
    { bg: "#8b4513", name: "saddle-brown" }, // warm brown
    { bg: "#c45a3d", name: "terra-cotta" }, // flame-pea-600
    { bg: "#a0522d", name: "sienna" }, // earthy brown
    { bg: "#d47a5e", name: "coral" }, // flame-pea-500
    { bg: "#cd853f", name: "peru" }, // tan
] as const

// Simple hash function to get consistent color for a restaurant
function getRestaurantColorId(id: string): number {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash) % WHEEL_COLORS.length
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

    // Color based on restaurant ID (consistent regardless of wheel position)
    const colorIndex = getRestaurantColorId(props.restaurant._id)
    const color = WHEEL_COLORS[colorIndex]!

    return (
        <g>
            <path d={segment().path} fill={color.bg} />
            <text
                x={segment().x}
                y={segment().y}
                fill="white"
                text-anchor="middle"
                dominant-baseline="middle"
                transform={`rotate(${segment().rotation}, ${segment().x}, ${segment().y})`}
                style={{
                    "font-family": "var(--font-body)",
                    "font-size": "13px",
                    "font-weight": "500",
                }}
            >
                {/* Truncate long names */}
                {props.restaurant.name.length > 18 ? props.restaurant.name.slice(0, 16) + "..." : props.restaurant.name}
            </text>
        </g>
    )
}
