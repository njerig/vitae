import type { Version } from "@/lib/types"

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
        if (node.children.length === 0) { node.row = startRow; return startRow + 1 }
        const firstChildRow = startRow
        let nextRow = assignRows(node.children[0], firstChildRow)
        node.row = firstChildRow
        for (let i = 1; i < node.children.length; i++) {
            nextRow = assignRows(node.children[i], nextRow)
        }
        return nextRow
    }
    let currentRow = 0
    for (const root of roots) { assignCol(root, 0); currentRow = assignRows(root, currentRow) }
    return roots
}

function flattenNodes(roots: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = []
    function walk(node: TreeNode) { result.push(node); node.children.forEach(walk) }
    roots.forEach(walk)
    return result
}

function makeVersion(id: string, parentId: string | null, createdAt: string): Version {
    return { id, user_id: "user-1", resume_group_id: "group-1", parent_version_id: parentId, group_name: "Test Resume", name: id, snapshot: { sections: [] }, created_at: createdAt }
}

describe("buildTree", () => {
    it("builds a linear chain with correct column positions", () => {
        const versions = [
            makeVersion("v1", null, "2026-01-01T00:00:00Z"),
            makeVersion("v2", "v1", "2026-01-02T00:00:00Z"),
            makeVersion("v3", "v2", "2026-01-03T00:00:00Z"),
        ]
        const nodes = flattenNodes(buildTree(versions))
        expect(nodes.find(n => n.version.id === "v1")!.col).toBe(0)
        expect(nodes.find(n => n.version.id === "v2")!.col).toBe(1)
        expect(nodes.find(n => n.version.id === "v3")!.col).toBe(2)
    })

    it("places branched child on a different row from the main chain", () => {
        const versions = [
            makeVersion("v1", null, "2026-01-01T00:00:00Z"),
            makeVersion("v2", "v1", "2026-01-02T00:00:00Z"),
            makeVersion("v3", "v1", "2026-01-03T00:00:00Z"),
        ]
        const nodes = flattenNodes(buildTree(versions))
        expect(nodes.find(n => n.version.id === "v2")!.row).not.toBe(
            nodes.find(n => n.version.id === "v3")!.row
        )
    })

    it("treats a version with an unknown parent as a root", () => {
        const roots = buildTree([makeVersion("v2", "nonexistent", "2026-01-02T00:00:00Z")])
        expect(roots).toHaveLength(1)
        expect(roots[0].version.id).toBe("v2")
    })
})