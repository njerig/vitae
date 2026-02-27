"use client"

import { useState } from "react"
import { formatDateTime } from "@/lib/utils"
import type { Version } from "@/lib/types"

interface VersionTreeProps {
  versions: Version[]
  onDelete: (id: string, name: string) => void
  onRestore: (id: string, name: string) => void
  deleting: string | null
  restoring: string | null
}

interface TreeNode {
  version: Version
  children: TreeNode[]
  row: number
  col: number
}

function buildTree(versions: Version[]): TreeNode[] {
  const sorted = [...versions].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const version of sorted) {
    map.set(version.id, { version, children: [], row: 0, col: 0 })
  }

  for (const version of sorted) {
    const node = map.get(version.id)!
    if (version.parent_version_id && map.has(version.parent_version_id)) {
      map.get(version.parent_version_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  function assignCol(node: TreeNode, col: number) {
    node.col = col
    node.children.forEach(child => assignCol(child, col + 1))
  }

  function assignRows(node: TreeNode, startRow: number): number {
    if (node.children.length === 0) {
      node.row = startRow
      return startRow + 1
    }

    const firstChildRow = startRow
    let nextRow = assignRows(node.children[0], firstChildRow)
    node.row = firstChildRow

    for (let i = 1; i < node.children.length; i++) {
      nextRow = assignRows(node.children[i], nextRow)
    }
    return nextRow
  }

  let currentRow = 0
  for (const root of roots) {
    assignCol(root, 0)
    currentRow = assignRows(root, currentRow)
  }

  return roots
}

function flattenNodes(roots: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = []
  function walk(node: TreeNode) {
    result.push(node)
    node.children.forEach(walk)
  }
  roots.forEach(walk)
  return result
}

const COL_WIDTH = 120
const ROW_HEIGHT = 60
const DOT_R = 8
const PADDING_LEFT = 60
const PADDING_TOP = 20

const BRANCH_COLORS = [
  "var(--accent)",
  "#6366f1",
  "#059669",
  "#d97706",
]

function getBranchColor(row: number) {
  return BRANCH_COLORS[row % BRANCH_COLORS.length]
}

export function VersionTree({ versions, onDelete, onRestore, deleting, restoring }: VersionTreeProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (versions.length === 0) {
    return <p style={{ color: "var(--ink-fade)", fontSize: "0.9rem" }}>No versions in this group.</p>
  }

  const roots = buildTree(versions)
  const nodes = flattenNodes(roots)

  const versionMap = new Map<string, Version>()
  for (const node of nodes) {
    versionMap.set(node.version.id, node.version)
  }

  const maxCol = Math.max(...nodes.map(n => n.col))
  const maxRow = Math.max(...nodes.map(n => n.row))

  const svgWidth = PADDING_LEFT * 2 + (maxCol + 1) * COL_WIDTH
  const svgHeight = PADDING_TOP * 2 + (maxRow + 1) * ROW_HEIGHT

  function nodeX(col: number) { return PADDING_LEFT + col * COL_WIDTH }
  function nodeY(row: number) { return PADDING_TOP + row * ROW_HEIGHT }

  const selectedNode = selectedId ? nodes.find(n => n.version.id === selectedId) : null
  const hoveredNode = hoveredId ? nodes.find(n => n.version.id === hoveredId) : null
  const activeNode = selectedNode || hoveredNode

  return (
    <div>
      <div style={{ overflowX: "auto", padding: "8px 0" }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          style={{ display: "block" }}
        >
          {nodes.map(node =>
            node.children.map(child => {
              const x1 = nodeX(node.col)
              const y1 = nodeY(node.row)
              const x2 = nodeX(child.col)
              const y2 = nodeY(child.row)
              const color = getBranchColor(child.row)
              const path = y1 === y2
                ? `M ${x1} ${y1} L ${x2} ${y2}`
                : `M ${x1} ${y1} C ${x1 + COL_WIDTH * 0.5} ${y1}, ${x2 - COL_WIDTH * 0.5} ${y2}, ${x2} ${y2}`
              return (
                <path
                  key={`${node.version.id}-${child.version.id}`}
                  d={path}
                  stroke={color}
                  strokeWidth={2}
                  fill="none"
                />
              )
            })
          )}

          {nodes.map(node => {
            const x = nodeX(node.col)
            const y = nodeY(node.row)
            const color = getBranchColor(node.row)
            const isActive = hoveredId === node.version.id || selectedId === node.version.id
            const displayName = node.version.name || "Untitled"

            return (
              <g
                key={node.version.id}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredId(node.version.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedId(selectedId === node.version.id ? null : node.version.id)}
              >
                {isActive && <circle cx={x} cy={y} r={DOT_R + 5} fill={color} opacity={0.2} />}
                <circle cx={x} cy={y} r={DOT_R} fill={isActive ? color : "white"} stroke={color} strokeWidth={2.5} />
                <text
                  x={x}
                  y={y + DOT_R + 14}
                  textAnchor="middle"
                  fontSize={11}
                  fill={isActive ? color : "var(--ink-fade)"}
                  fontWeight={isActive ? "600" : "400"}
                  style={{ fontFamily: "var(--font-sans, sans-serif)", userSelect: "none" }}
                >
                  {displayName.length > 19 ? displayName.slice(0, 19) + "..." : displayName}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {activeNode && (() => {
        const displayName = activeNode.version.name || "Untitled"
        const parentVersion = activeNode.version.parent_version_id
          ? versionMap.get(activeNode.version.parent_version_id)
          : null
        const parentName = parentVersion?.name || "Untitled"

        return (
          <div style={{
            marginTop: "8px",
            border: "1px solid var(--grid)",
            borderRadius: "12px",
            padding: "16px",
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}>
            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.95rem" }}>
                {displayName}
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--ink-fade)", marginTop: "2px" }}>
                {formatDateTime(activeNode.version.created_at)}
              </p>
              {parentVersion && (
                <p style={{ fontSize: "0.75rem", color: "var(--ink-light)", marginTop: "4px" }}>
                  ↩ Restored from: {parentName}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => onRestore(activeNode.version.id, displayName)}
                disabled={restoring === activeNode.version.id}
                className="card-action-edit flex-1"
              >
                {restoring === activeNode.version.id ? "Restoring..." : "Restore"}
              </button>
              <button
                onClick={() => onDelete(activeNode.version.id, displayName)}
                disabled={deleting === activeNode.version.id}
                className="card-action-delete flex-1"
              >
                {deleting === activeNode.version.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        )
      })()}

      {!activeNode && (
        <p style={{ fontSize: "0.8rem", color: "var(--ink-light)", textAlign: "center", marginTop: "8px" }}>
          Click or hover a dot to see version details
        </p>
      )}
    </div>
  )
}