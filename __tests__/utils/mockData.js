// __tests__/utils/mockData.js
// Mock data matching the actual Vitae project types

export const mockUser = {
  id: 'user_2mAbCdEfGhIjKl',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
}

// Mock WorkContent matching lib/types.ts
export const mockWorkContent1 = {
  org: 'Tech Corp',
  role: 'Software Engineer',
  start: '2022-01-15',
  end: '2024-01-30',
  bullets: [
    'Developed full-stack applications using React and Node.js',
    'Implemented authentication system',
    'Collaborated with team'
  ],
  skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Next.js']
}

export const mockWorkContent2 = {
  org: 'Startup Inc',
  role: 'Junior Developer',
  start: '2020-06-01',
  end: '2021-12-31',
  bullets: [
    'Built responsive web interfaces',
    'Worked with REST APIs'
  ],
  skills: ['JavaScript', 'HTML', 'CSS', 'Git']
}

export const mockWorkContent3 = {
  org: 'Freelance',
  role: 'Web Developer',
  start: '2023-03-01',
  end: null, // Currently working
  bullets: [
    'Created custom websites for clients',
    'Maintained and updated existing projects'
  ],
  skills: ['React', 'TailwindCSS', 'Firebase']
}

// Mock CanonItem<WorkContent> matching lib/types.ts
export const mockWorkItem1 = {
  id: 'canon_work_1abc',
  user_id: 'user_2mAbCdEfGhIjKl',
  item_type: 'work',
  title: 'Software Engineer at Tech Corp',
  position: 0,
  content: mockWorkContent1,
  created_at: '2024-01-20T10:00:00Z',
  updated_at: '2024-01-20T10:00:00Z'
}

export const mockWorkItem2 = {
  id: 'canon_work_2def',
  user_id: 'user_2mAbCdEfGhIjKl',
  item_type: 'work',
  title: 'Junior Developer at Startup Inc',
  position: 1,
  content: mockWorkContent2,
  created_at: '2024-01-18T14:30:00Z',
  updated_at: '2024-01-18T14:30:00Z'
}

export const mockWorkItem3 = {
  id: 'canon_work_3ghi',
  user_id: 'user_2mAbCdEfGhIjKl',
  item_type: 'work',
  title: 'Freelance Web Developer',
  position: 2,
  content: mockWorkContent3,
  created_at: '2024-01-15T09:00:00Z',
  updated_at: '2024-01-15T09:00:00Z'
}

// Array of work items for testing
export const mockWorkItems = [mockWorkItem1, mockWorkItem2, mockWorkItem3]

// Mock stats matching useCanonWork return type
export const mockStats = {
  total: 3,
  totalSkills: 12, // Total count of all skills (including duplicates)
  uniqueSkills: 10  // Unique skills count
}

// Mock for createWork input
export const mockCreateWorkInput = {
  title: 'New Position',
  position: 3,
  content: {
    org: 'New Company',
    role: 'Senior Engineer',
    start: '2024-02-01',
    end: null,
    bullets: ['First bullet point', 'Second bullet point'],
    skills: ['React', 'TypeScript', 'AWS']
  }
}

// Mock for patchWork input
export const mockPatchWorkInput = {
  title: 'Updated Title',
  position: 0,
  content: {
    org: 'Updated Company',
    role: 'Updated Role',
    start: '2024-01-01',
    end: '2024-12-31',
    bullets: ['Updated bullet'],
    skills: ['Updated', 'Skills']
  }
}

// Mock API responses
export const mockApiResponses = {
  success: {
    status: 200,
    data: mockWorkItems
  },
  created: {
    status: 201,
    data: mockWorkItem1
  },
  error: {
    status: 500,
    error: 'Internal server error'
  },
  unauthorized: {
    status: 401,
    error: 'Unauthorized'
  }
}
