"use client"
import { useState, useEffect } from "react"

export default function HomeClient({ userName, userId }: { userName: string; userId: string }) {
  // Interface for Canon Items
  interface CanonItem {
    id: string
    company: string
    position: string
    startDate: string
    endDate: string
    description: string
    skills: string[]
  }

  const [canonItems, setCanonItems] = useState<CanonItem[]>([])
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<CanonItem | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    description: "",
    skills: "",
  })

  const isAuthenticated = userId != "fakeuser123"

  // Save canon items to localStorage
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("canonItems", JSON.stringify(canonItems))
    }
  }, [canonItems, isAuthenticated])

  // Canon Items Functions
  const handleAddItem = () => {
    if (editingItem) {
      setCanonItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...editingItem, ...formData, skills: formData.skills.split(",").map((s) => s.trim()) } : item,
        ),
      )
      setEditingItem(null)
    } else {
      const newItem: CanonItem = {
        id: Date.now().toString(),
        company: formData.company,
        position: formData.position,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        skills: formData.skills.split(",").map((s) => s.trim()),
      }
      setCanonItems((prev) => [...prev, newItem])
    }
    setFormData({
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
      skills: "",
    })
    setIsAddingItem(false)
  }

  const handleEditItem = (item: CanonItem) => {
    setEditingItem(item)
    setFormData({
      company: item.company,
      position: item.position,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
      skills: item.skills.join(", "),
    })
    setIsAddingItem(true)
  }

  const handleDeleteItem = (id: string) => {
    if (confirm("Are you sure you want to delete this career item?")) {
      setCanonItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const handleCancelForm = () => {
    setIsAddingItem(false)
    setEditingItem(null)
    setFormData({
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
      skills: "",
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // If user is authenticated, show the Canon Items management
  if (isAuthenticated) {
    return (
      <div className="page-container">
        <div className="page-bg-gradient"></div>
        <div className="page-accent-light"></div>

        <div className="relative z-10 pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-semibold text-gray-900 mb-2">My Career History</h2>
                  <p className="text-lg text-gray-600">Add, edit, and manage your entire career history.</p>
                </div>
                <button
                  onClick={() => setIsAddingItem(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-3xl font-semibold text-gray-900 mb-1">{canonItems.length}</div>
                  <p className="text-gray-600 text-sm">Total Items</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-3xl font-semibold text-gray-900 mb-1">
                    {canonItems.reduce((count, item) => count + item.skills.length, 0)}
                  </div>
                  <p className="text-gray-600 text-sm">Total Skills</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-3xl font-semibold text-gray-900 mb-1">
                    {new Set(canonItems.flatMap((item) => item.skills)).size}
                  </div>
                  <p className="text-gray-600 text-sm">Unique Skills</p>
                </div>
              </div>
            </div>

            {/* Add/Edit Form */}
            {isAddingItem && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                  {editingItem ? "Edit Career Item" : "Add New Career Item"}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Company *</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Google, Microsoft, etc."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Position *</label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Software Engineer, Product Manager, etc."
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Start Date *</label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">End Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe your responsibilities and achievements..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Skills</label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="JavaScript, React, Node.js (comma separated)"
                    />
                    <p className="text-gray-500 text-xs mt-1">Separate skills with commas</p>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleAddItem} className="btn-primary">
                      {editingItem ? "Update Item" : "Add Item"}
                    </button>
                    <button onClick={handleCancelForm} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Canon Items List */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">
                  Career History ({canonItems.length})
                </h3>
              </div>
              
              {canonItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-600 mb-4 text-lg">No career items yet</div>
                  <button
                    onClick={() => setIsAddingItem(true)}
                    className="btn-secondary"
                  >
                    Add your first career item
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {canonItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-gray-900 font-semibold text-xl">{item.position}</h4>
                          <p className="text-blue-600 font-medium">{item.company}</p>
                          <p className="text-gray-600 text-sm mt-1">
                            {item.startDate} → {item.endDate || "Present"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{item.description}</p>
                      {item.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {item.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-sm rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}