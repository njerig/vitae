"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { TailoringAxes } from "@/lib/tailor/options"

type AxisConfig = {
  key: keyof TailoringAxes
  label: string
}

const AXES: AxisConfig[] = [
  { key: "industry", label: "Industry focus" },
  { key: "tone", label: "Tone" },
  { key: "technicalDepth", label: "Technical depth" },
  { key: "length", label: "Length" },
]

type TailorRadarChartProps = {
  axes: TailoringAxes
  onChange: (next: TailoringAxes) => void
  disabled?: boolean
  size?: number
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export function TailorRadarChart({
  axes,
  onChange,
  disabled = false,
  size = 180,
}: TailorRadarChartProps) {
  const center = size / 2
  const maxRadius = size * 0.36
  const angleStep = (Math.PI * 2) / AXES.length
  const startAngle = -Math.PI / 2
  const [dragAxis, setDragAxis] = useState<keyof TailoringAxes | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const axisVectors = useMemo(() => {
    return AXES.map((_, index) => {
      const angle = startAngle + index * angleStep
      return {
        x: Math.cos(angle),
        y: Math.sin(angle),
      }
    })
  }, [angleStep])

  const polygonPoints = useMemo(() => {
    return AXES.map((axis, index) => {
      const value = axes[axis.key]
      const vector = axisVectors[index]
      const radius = maxRadius * value
      return {
        x: center + vector.x * radius,
        y: center + vector.y * radius,
      }
    })
  }, [axes, axisVectors, center, maxRadius])

  useEffect(() => {
    if (!dragAxis || disabled) return

    const axisIndex = AXES.findIndex((axis) => axis.key === dragAxis)
    const vector = axisVectors[axisIndex]

    const onMove = (event: MouseEvent) => {
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const activeRadius = Math.min(rect.width, rect.height) * 0.36
      const dx = event.clientX - centerX
      const dy = event.clientY - centerY
      const projection = (dx * vector.x + dy * vector.y) / activeRadius
      const nextValue = clamp01(projection)
      onChange({
        ...axes,
        [dragAxis]: nextValue,
      })
    }

    const onUp = () => setDragAxis(null)

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [axes, axisVectors, center, disabled, dragAxis, maxRadius, onChange])

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="mx-auto block"
        role="img"
        aria-label="Tailoring axes radar chart"
      >
        {[0.25, 0.5, 0.75, 1].map((factor) => (
          <polygon
            key={factor}
            points={axisVectors
              .map((vector) => `${center + vector.x * maxRadius * factor},${center + vector.y * maxRadius * factor}`)
              .join(" ")}
            fill="none"
            stroke="var(--grid)"
            strokeWidth={1}
          />
        ))}

        {axisVectors.map((vector, index) => (
          <line
            key={AXES[index].key}
            x1={center}
            y1={center}
            x2={center + vector.x * maxRadius}
            y2={center + vector.y * maxRadius}
            stroke="var(--grid)"
            strokeWidth={1}
          />
        ))}

        <polygon
          points={polygonPoints.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="var(--accent)"
          fillOpacity={0.2}
          stroke="var(--accent)"
          strokeWidth={2}
        />

        {polygonPoints.map((point, index) => (
          <circle
            key={AXES[index].key}
            cx={point.x}
            cy={point.y}
            r={6}
            fill="white"
            stroke="var(--accent)"
            strokeWidth={2}
            style={{ cursor: disabled ? "not-allowed" : "grab" }}
            onMouseDown={() => {
              if (disabled) return
              setDragAxis(AXES[index].key)
            }}
          />
        ))}
      </svg>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
        {AXES.map((axis) => (
          <p key={axis.key} className="text-xs" style={{ color: "var(--ink-fade)" }}>
            {axis.label}: {axes[axis.key].toFixed(2)}
          </p>
        ))}
      </div>
    </div>
  )
}
