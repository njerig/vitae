"use client"

import { useState } from "react"
import type { CanonItem, ItemType } from "@/lib/shared/types"

interface TimelineProps {
  items: CanonItem<unknown>[]
  itemTypes: ItemType[]
}

export function Timeline({ items, itemTypes }: TimelineProps) {
  const [hoveredEntryId, setHoveredEntryId] = useState<string | null>(null)

  const getTimelineLayout = () => {
    const workType = itemTypes.find((t) => t.display_name.toLowerCase().includes("work"))
    const eduType = itemTypes.find((t) => t.display_name.toLowerCase().includes("education"))

    const workItems = workType
      ? items
          .filter((item) => item.item_type_id === workType.id)
          .map((item, idx) => {
            const content = item.content as { start?: string; end?: string; org?: string }
            if (!content.start) return null

            const startDate = new Date(content.start)
            const endDate = content.end ? new Date(content.end) : new Date()
            if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null
            const normalizedStart = startDate <= endDate ? startDate : endDate
            const normalizedEnd = startDate <= endDate ? endDate : startDate

            return {
              id: `${item.id}-work-${idx}`,
              type: "work" as const,
              name: content.org || item.title,
              start: normalizedStart,
              end: normalizedEnd,
            }
          })
          .filter(
            (j): j is { id: string; type: "work"; name: string; start: Date; end: Date } =>
              j !== null
          )
      : []

    const eduItems = eduType
      ? items
          .filter((item) => item.item_type_id === eduType.id)
          .map((item, idx) => {
            const content = item.content as { start?: string; end?: string; institution?: string }
            if (!content.start) return null

            const startDate = new Date(content.start)
            const endDate = content.end ? new Date(content.end) : new Date()
            if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null
            const normalizedStart = startDate <= endDate ? startDate : endDate
            const normalizedEnd = startDate <= endDate ? endDate : startDate

            return {
              id: `${item.id}-education-${idx}`,
              type: "education" as const,
              name: content.institution || item.title,
              start: normalizedStart,
              end: normalizedEnd,
            }
          })
          .filter(
            (j): j is { id: string; type: "education"; name: string; start: Date; end: Date } =>
              j !== null
          )
      : []

    const entries = [...workItems, ...eduItems].sort((a, b) => {
      const byStart = a.start.getTime() - b.start.getTime()
      if (byStart !== 0) return byStart
      return a.end.getTime() - b.end.getTime()
    })

    if (entries.length === 0) return null

    const earliestStart = entries[0].start
    const latestEnd = entries.reduce(
      (latest, current) => (current.end > latest ? current.end : latest),
      entries[0].end
    )
    const timelineMs = Math.max(1, latestEnd.getTime() - earliestStart.getTime())
    const minWidthPct = 0.75

    const assignLanes = <T extends { start: Date; end: Date }>(source: T[]) => {
      const laneEndTimes: number[] = []
      return source.map((entry) => {
        const startMs = entry.start.getTime()
        const endMs = entry.end.getTime()
        let lane = laneEndTimes.findIndex((laneEnd) => laneEnd <= startMs)
        if (lane === -1) {
          lane = laneEndTimes.length
          laneEndTimes.push(endMs)
        } else {
          laneEndTimes[lane] = endMs
        }
        return { ...entry, lane }
      })
    }

    const educationEntries = entries.filter((entry) => entry.type === "education")
    const workEntries = entries.filter((entry) => entry.type === "work")
    const educationPlaced = assignLanes(educationEntries)
    const workPlaced = assignLanes(workEntries)
    const workLaneOffset =
      educationPlaced.reduce((maxLane, entry) => Math.max(maxLane, entry.lane), -1) + 1

    const placed = [...educationPlaced, ...workPlaced]
      .map((entry) => {
        const startMs = entry.start.getTime()
        const endMs = entry.end.getTime()
        const computedLeft = ((startMs - earliestStart.getTime()) / timelineMs) * 100
        const left = Math.min(99.8, Math.max(0, computedLeft))
        const rawWidth = Math.max(minWidthPct, ((endMs - startMs) / timelineMs) * 100)
        const width = Math.min(rawWidth, Math.max(0.2, 100 - left))
        const lane = entry.type === "work" ? entry.lane + workLaneOffset : entry.lane

        return {
          ...entry,
          lane,
          left,
          width,
        }
      })
      .sort((a, b) => {
        if (a.lane !== b.lane) return a.lane - b.lane
        return a.start.getTime() - b.start.getTime()
      })

    const startYear = earliestStart.getFullYear()
    const endYear = latestEnd.getFullYear()
    const timelineStartMs = earliestStart.getTime()
    const timelineEndMs = latestEnd.getTime()

    // Anchor vertical rules to real calendar boundaries so they align with interval positions.
    const yearTicks = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
      .map((year) => {
        if (year <= startYear || year >= endYear) return null
        const tickDate = new Date(year, 0, 1)
        const tickMs = tickDate.getTime()
        if (tickMs <= timelineStartMs || tickMs >= timelineEndMs) return null
        return {
          year,
          left: ((tickMs - timelineStartMs) / timelineMs) * 100,
        }
      })
      .filter((tick): tick is { year: number; left: number } => tick !== null)

    const laneCount = placed.reduce((maxLane, entry) => Math.max(maxLane, entry.lane), -1) + 1

    return { startYear, endYear, yearTicks, entries: placed, laneCount }
  }

  const timeline = getTimelineLayout()

  if (!timeline) return null
  const educationLabels = timeline.entries.filter((entry) => entry.type === "education")
  const workLabels = timeline.entries.filter((entry) => entry.type === "work")

  return (
    <div className="mb-3">
      <p
        className="text-xs mb-2"
        style={{ color: "var(--ink)", opacity: 0.5, letterSpacing: "0.05em" }}
      >
        TIMELINE
      </p>
      <div
        className="relative"
        style={{
          marginLeft: "calc(2.5rem + 0.5rem)",
          borderLeft: "1px solid var(--grid)",
          paddingLeft: "0.75rem",
        }}
      >
        <div
          className="relative"
          style={{
            height: `${timeline.laneCount * 12 + 6}px`,
            overflow: "hidden",
          }}
        >
          {timeline.yearTicks.map((tick) => (
            <div
              key={tick.year}
              className="absolute top-0 bottom-0"
              style={{
                left: `${tick.left}%`,
                borderLeft: "1px solid var(--grid)",
                opacity: 0.6,
              }}
            />
          ))}
          {timeline.entries.map((entry) => {
            const isHovered = hoveredEntryId === entry.id
            return (
              <div
                key={entry.id}
                className="absolute rounded-sm cursor-pointer transition-all"
                style={{
                  left: `${entry.left}%`,
                  width: `${entry.width}%`,
                  top: `${entry.lane * 12}px`,
                  height: "8px",
                  background: entry.type === "work" ? "var(--accent)" : "var(--ink)",
                  opacity: isHovered
                    ? entry.type === "work"
                      ? 0.72
                      : 0.6
                    : entry.type === "work"
                      ? 0.28
                      : 0.2,
                  backgroundImage:
                    entry.type === "education"
                      ? "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px)"
                      : "none",
                }}
                title={`${entry.name} (${entry.type}) ${entry.start.getFullYear()}-${entry.end.getFullYear()}`}
                onMouseEnter={() => setHoveredEntryId(entry.id)}
                onMouseLeave={() => setHoveredEntryId(null)}
              />
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span
          className="text-xs font-medium"
          style={{ color: "var(--ink)", opacity: 0.6, minWidth: "2.5rem" }}
        >
          {timeline.startYear}
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--grid)" }} />
        <span
          className="text-xs font-medium"
          style={{ color: "var(--ink)", opacity: 0.6, minWidth: "2.5rem", textAlign: "right" }}
        >
          {timeline.endYear}
        </span>
      </div>
      <div
        className="mt-2 space-y-1.5"
        style={{ color: "var(--ink)", marginLeft: "calc(2.5rem + 0.5rem)" }}
      >
        {educationLabels.length > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <span style={{ width: "4.25rem", opacity: 0.55 }}>Education</span>
            <div className="flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {educationLabels.map((entry) => {
                const isHovered = hoveredEntryId === entry.id
                return (
                  <span
                    key={entry.id}
                    className="cursor-pointer"
                    style={{
                      fontWeight: isHovered ? 600 : 400,
                      opacity: isHovered ? 1 : 0.6,
                      transition: "all 150ms",
                    }}
                    onMouseEnter={() => setHoveredEntryId(entry.id)}
                    onMouseLeave={() => setHoveredEntryId(null)}
                  >
                    {entry.name}
                  </span>
                )
              })}
            </div>
          </div>
        )}
        {workLabels.length > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <span style={{ width: "4.25rem", opacity: 0.55 }}>Work</span>
            <div className="flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {workLabels.map((entry) => {
                const isHovered = hoveredEntryId === entry.id
                return (
                  <span
                    key={entry.id}
                    className="cursor-pointer"
                    style={{
                      fontWeight: isHovered ? 600 : 400,
                      opacity: isHovered ? 1 : 0.6,
                      transition: "all 150ms",
                    }}
                    onMouseEnter={() => setHoveredEntryId(entry.id)}
                    onMouseLeave={() => setHoveredEntryId(null)}
                  >
                    {entry.name}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
