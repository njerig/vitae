"use client"

import { useState } from "react"
import type { CanonItem, ItemType } from "@/lib/types"

interface TimelineProps {
  items: CanonItem<unknown>[]
  itemTypes: ItemType[]
}

export function Timeline({ items, itemTypes }: TimelineProps) {
  const [hoveredSegmentIdx, setHoveredSegmentIdx] = useState<number | null>(null)

  // Calculate timeline segments from work and education items
  const getTimelineSegments = () => {
    const workType = itemTypes.find((t) => t.display_name.toLowerCase().includes("work"))
    const eduType = itemTypes.find((t) => t.display_name.toLowerCase().includes("education"))

    // Collect all work items
    const workItems = workType
      ? items
          .filter((item) => item.item_type_id === workType.id)
          .map((item) => {
            const content = item.content as { start?: string; end?: string; org?: string }
            if (!content.start) return null

            const startDate = new Date(content.start)
            const endDate = content.end ? new Date(content.end) : new Date()

            return {
              type: "work" as const,
              name: content.org || item.title,
              start: startDate,
              end: endDate,
              startYear: startDate.getFullYear(),
              endYear: endDate.getFullYear(),
            }
          })
          .filter((j) => j !== null)
      : []

    // Collect all education items
    const eduItems = eduType
      ? items
          .filter((item) => item.item_type_id === eduType.id)
          .map((item) => {
            const content = item.content as { start?: string; end?: string; institution?: string }
            if (!content.start) return null

            const startDate = new Date(content.start)
            const endDate = content.end ? new Date(content.end) : new Date()

            return {
              type: "education" as const,
              name: content.institution || item.title,
              start: startDate,
              end: endDate,
              startYear: startDate.getFullYear(),
              endYear: endDate.getFullYear(),
            }
          })
          .filter((j) => j !== null)
      : []

    // Combine and sort chronologically
    const allItems = [...workItems, ...eduItems].sort((a, b) => a.start.getTime() - b.start.getTime())

    if (allItems.length === 0) return null

    // Insert gap segments between items
    const allSegments: Array<
      | { type: "work" | "education"; name: string; start: Date; end: Date; startYear: number; endYear: number }
      | { type: "gap"; name: string; start: Date; end: Date; startYear: number; endYear: number }
    > = []

    for (let i = 0; i < allItems.length; i++) {
      allSegments.push(allItems[i])

      // Check for gap before next item
      if (i < allItems.length - 1) {
        const currentEnd = allItems[i].end
        const nextStart = allItems[i + 1].start

        // If there's a gap of more than 30 days, insert a gap segment
        const gapDays = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24)
        if (gapDays > 30) {
          allSegments.push({
            type: "gap",
            name: "Gap",
            start: currentEnd,
            end: nextStart,
            startYear: currentEnd.getFullYear(),
            endYear: nextStart.getFullYear(),
          })
        }
      }
    }

    // Calculate total span
    const earliestStart = allSegments[0].start
    const latestEnd = allSegments[allSegments.length - 1].end
    const totalDays = (latestEnd.getTime() - earliestStart.getTime()) / (1000 * 60 * 60 * 24)

    // Calculate proportions for each segment
    const segments = allSegments.map((segment) => {
      const duration = (segment.end.getTime() - segment.start.getTime()) / (1000 * 60 * 60 * 24)
      const percentage = (duration / totalDays) * 100

      return {
        ...segment,
        percentage,
      }
    })

    // Adjust last segment to fill any rounding gap
    if (segments.length > 0) {
      const totalPercentage = segments.reduce((sum, s) => sum + s.percentage, 0)
      segments[segments.length - 1].percentage += 100 - totalPercentage
    }

    return {
      startYear: allSegments[0].startYear,
      endYear: allSegments[allSegments.length - 1].endYear,
      segments,
    }
  }

  const timeline = getTimelineSegments()

  if (!timeline) return null

  return (
    <div className="mb-3">
      <p className="text-xs mb-2" style={{ color: "var(--ink)", opacity: 0.5, letterSpacing: "0.05em" }}>
        TIMELINE
      </p>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium" style={{ color: "var(--ink)", opacity: 0.6, minWidth: "2.5rem" }}>
          {timeline.startYear}
        </span>
        <div className="flex-1 flex h-6" style={{ borderRadius: "var(--radius-soft)", overflow: "hidden", border: "1px solid var(--grid)", background: "var(--paper)" }}>
          {timeline.segments.map((segment, idx) => {
            const isHovered = hoveredSegmentIdx === idx

            if (segment.type === "gap") {
              return (
                <div
                  key={idx}
                  className="relative flex-shrink-0 transition-all cursor-pointer"
                  style={{
                    width: `${segment.percentage}%`,
                    background: isHovered ? "repeating-linear-gradient(90deg, transparent, transparent 4px, var(--grid) 4px, var(--grid) 8px)" : "transparent",
                    borderRight: idx < timeline.segments.length - 1 ? "1px solid var(--grid)" : "none",
                  }}
                  title={`Career gap (${segment.startYear}–${segment.endYear})`}
                  onMouseEnter={() => setHoveredSegmentIdx(idx)}
                  onMouseLeave={() => setHoveredSegmentIdx(null)}
                />
              )
            }

            return (
              <div
                key={idx}
                className="relative flex-shrink-0 transition-opacity cursor-pointer"
                style={{
                  width: `${segment.percentage}%`,
                  background: segment.type === "work" ? "var(--accent)" : "var(--ink)",
                  opacity: isHovered ? (segment.type === "work" ? 0.6 : 0.5) : segment.type === "work" ? 0.25 : 0.15,
                  borderRight: idx < timeline.segments.length - 1 ? "1px solid var(--grid)" : "none",
                  backgroundImage: segment.type === "education" ? "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px)" : "none",
                }}
                title={`${segment.name} (${segment.type}) (${segment.startYear}–${segment.endYear})`}
                onMouseEnter={() => setHoveredSegmentIdx(idx)}
                onMouseLeave={() => setHoveredSegmentIdx(null)}
              />
            )
          })}
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--ink)", opacity: 0.6, minWidth: "2.5rem", textAlign: "right" }}>
          {timeline.endYear}
        </span>
      </div>
      <div className="text-xs flex flex-wrap items-center gap-x-2" style={{ color: "var(--ink)", opacity: 0.6, marginLeft: "calc(2.5rem + 0.5rem)" }}>
        {timeline.segments.map((segment, segIdx) => {
          const isHovered = hoveredSegmentIdx === segIdx

          if (segment.type === "gap") {
            // Find the gap's position in the non-gap segments to know which arrow to highlight
            const prevNonGapIdx = timeline.segments.slice(0, segIdx).filter((s) => s.type !== "gap").length - 1
            const nextNonGapIdx = prevNonGapIdx + 1
            const hasNextItem = nextNonGapIdx < timeline.segments.filter((s) => s.type !== "gap").length

            return hasNextItem ? (
              <span
                key={segIdx}
                style={{
                  fontWeight: isHovered ? 600 : 400,
                  opacity: isHovered ? 1 : 0.6,
                  transition: "all 150ms",
                }}
              >
                →
              </span>
            ) : null
          }

          return (
            <span
              key={segIdx}
              style={{
                fontWeight: isHovered ? 600 : 400,
                opacity: isHovered ? 1 : 0.6,
                transition: "all 150ms",
              }}
            >
              {segment.name}
            </span>
          )
        })}
      </div>
    </div>
  )
}
