import { render, screen, fireEvent } from '@testing-library/react'
import { VersionTree } from '@/lib/versions/components/tree/VersionTree'
import type { Version } from '@/lib/shared/types'

function makeVersion(id: string, name: string, parentId: string | null): Version {
    return { id, user_id: 'user-1', resume_group_id: 'group-1', parent_version_id: parentId, group_name: 'Test Resume', name, snapshot: { sections: [] }, created_at: `2026-01-0${id.slice(-1)}T00:00:00Z` }
}

const mockVersions = [
    makeVersion('v1', 'initial draft', null),
    makeVersion('v2', 'version 2', 'v1'),
]

const defaultProps = {
    versions: mockVersions,
    onDelete: jest.fn(),
    onRestore: jest.fn(),
    deleting: null,
    restoring: null,
}

describe('VersionTree', () => {
    beforeEach(() => jest.clearAllMocks())

    it('renders an SVG tree graph', () => {
        const { container } = render(<VersionTree {...defaultProps} />)
        expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('shows empty state when no versions provided', () => {
        render(<VersionTree {...defaultProps} versions={[]} />)
        expect(screen.getByText('No versions in this group.')).toBeInTheDocument()
    })

    it('shows version detail card when a dot is clicked', () => {
        render(<VersionTree {...defaultProps} />)
        fireEvent.click(document.querySelectorAll('svg g')[0])
        expect(screen.getByText('Restore')).toBeInTheDocument()
        expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('shows parent name in detail card for child versions', () => {
        render(<VersionTree {...defaultProps} />)
        fireEvent.click(document.querySelectorAll('svg g')[1])
        expect(screen.getByText('↩ Restored from: initial draft')).toBeInTheDocument()
    })

    it('calls onDelete with correct id when Delete is clicked', () => {
        render(<VersionTree {...defaultProps} />)
        fireEvent.click(document.querySelectorAll('svg g')[0])
        fireEvent.click(screen.getByText('Delete'))
        expect(defaultProps.onDelete).toHaveBeenCalledWith('v1', 'initial draft')
    })
})