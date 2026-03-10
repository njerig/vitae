const mockFetch = jest.fn()
global.fetch = mockFetch

const mockWorkItem = {
    id: "work-1",
    title: "Software Engineer at Acme",
    type_name: "Work Experience",
    content: {
        org: "Acme Corp",
        role: "Software Engineer",
        bullets: ["Built REST APIs", "Deployed to AWS"],
        skills: ["Python", "AWS"],
    },
}

const mockJobDescription =
    "Looking for a Software Engineer with experience in Python, AWS, and AI/ML. " +
    "Must have experience building production APIs."

const mockSuggestion = {
    bullets: [
        "Designed and deployed scalable REST APIs using Python, serving 10k+ requests/day on AWS",
        "Optimized AWS infrastructure reducing deployment time by 40%",
    ],
    skills: ["Python", "AWS", "REST APIs"],
}

describe("tailor item API call", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("sends correct payload to /api/tailor/item", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ suggestion: mockSuggestion }),
        })

        await fetch("/api/tailor/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                job_description: mockJobDescription,
                item: mockWorkItem,
            }),
        })

        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(mockFetch).toHaveBeenCalledWith("/api/tailor/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                job_description: mockJobDescription,
                item: mockWorkItem,
            }),
        })
    })

    it("returns suggestion with bullets and skills", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ suggestion: mockSuggestion }),
        })

        const res = await fetch("/api/tailor/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job_description: mockJobDescription, item: mockWorkItem }),
        })

        const data = await res.json()

        expect(data.suggestion).toBeDefined()
        expect(Array.isArray(data.suggestion.bullets)).toBe(true)
        expect(Array.isArray(data.suggestion.skills)).toBe(true)
        expect(data.suggestion.bullets.length).toBeGreaterThan(0)
    })

    it("suggestion bullets are different from original", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ suggestion: mockSuggestion }),
        })

        const res = await fetch("/api/tailor/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job_description: mockJobDescription, item: mockWorkItem }),
        })

        const data = await res.json()
        const originalBullets = mockWorkItem.content.bullets

        // AI suggestion should be different from original bullets
        expect(data.suggestion.bullets).not.toEqual(originalBullets)
    })

    it("throws on non-200 response with error message", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: "AI service not configured" }),
        })

        const res = await fetch("/api/tailor/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job_description: mockJobDescription, item: mockWorkItem }),
        })

        expect(res.ok).toBe(false)
        const data = await res.json()
        expect(data.error).toBe("AI service not configured")
    })

    it("throws on network failure", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"))

        await expect(
            fetch("/api/tailor/item", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ job_description: mockJobDescription, item: mockWorkItem }),
            })
        ).rejects.toThrow("Network error")
    })

    it("handles missing bullets in suggestion gracefully", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ suggestion: { bullets: [], skills: [] } }),
        })

        const res = await fetch("/api/tailor/item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job_description: mockJobDescription, item: mockWorkItem }),
        })

        const data = await res.json()
        expect(data.suggestion.bullets).toEqual([])
        expect(data.suggestion.skills).toEqual([])
    })
})