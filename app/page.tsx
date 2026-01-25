'use client'

import { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Interface for Canon Items 
interface CanonItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  skills: string[];
}

export default function Home() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{name: string; email: string} | null>(null);
  
  // Canon Items State
  const [canonItems, setCanonItems] = useState<CanonItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<CanonItem | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: '',
    skills: ''
  });

  // Session Persistence: Check if user was logged in
  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUser = localStorage.getItem('user');
    
    if (savedAuth === 'true' && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
    
    // Load canon items from localStorage
    const savedItems = localStorage.getItem('canonItems');
    if (savedItems) {
      setCanonItems(JSON.parse(savedItems));
    }
  }, []);

  // Save canon items to localStorage
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('canonItems', JSON.stringify(canonItems));
    }
  }, [canonItems, isAuthenticated]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    // Simulate Google OAuth flow
    setTimeout(() => {
      console.log('Signing in with Google...');
      setGoogleLoading(false);
      // Simulate successful Google authentication
      setIsAuthenticated(true);
      const userData = {
        name: 'Google User',
        email: 'google.user@example.com'
      };
      setUser(userData);
      
      // Session Persistence: Save to localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(userData));
    }, 1500);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    // Session Persistence: Clear from localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  // Canon Items Functions
  const handleAddItem = () => {
    if (editingItem) {
      // Update existing item
      setCanonItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...editingItem, ...formData, skills: formData.skills.split(',').map(s => s.trim()) }
          : item
      ));
      setEditingItem(null);
    } else {
      // Add new item
      const newItem: CanonItem = {
        id: Date.now().toString(),
        company: formData.company,
        position: formData.position,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        skills: formData.skills.split(',').map(s => s.trim())
      };
      setCanonItems(prev => [...prev, newItem]);
    }
    
    // Reset form
    setFormData({
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      skills: ''
    });
    setIsAddingItem(false);
  };

  const handleEditItem = (item: CanonItem) => {
    setEditingItem(item);
    setFormData({
      company: item.company,
      position: item.position,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
      skills: item.skills.join(', ')
    });
    setIsAddingItem(true);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this career item?')) {
      setCanonItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleCancelForm = () => {
    setIsAddingItem(false);
    setEditingItem(null);
    setFormData({
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      skills: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // If user is authenticated, show the Canon Items management
  if (isAuthenticated) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex flex-col items-center justify-start p-4 md:p-8 ${inter.className} relative overflow-hidden`}>
        {/* Simplified Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-purple-950/20"></div>
        
        {/* Header */}
        <div className="relative z-10 w-full max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Vitae
              </h1>
              <span className="text-zinc-300 hidden md:inline">| Career History</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0) || 'G'}
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-gray-700/50 text-sm"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Main Content - Canon Items Management */}
          <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/30 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">My Career History</h2>
                  <p className="text-gray-300">Add, edit, and manage your entire career history. </p>
                </div>
                <button
                  onClick={() => setIsAddingItem(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Career Item
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-800/30 rounded-xl">
                  <div className="text-2xl font-bold text-white mb-1">{canonItems.length}</div>
                  <p className="text-gray-400 text-sm">Total Items</p>
                </div>
                <div className="p-4 bg-gray-800/30 rounded-xl">
                  <div className="text-2xl font-bold text-white mb-1">
                    {canonItems.reduce((count, item) => count + item.skills.length, 0)}
                  </div>
                  <p className="text-gray-400 text-sm">Total Skills</p>
                </div>
                <div className="p-4 bg-gray-800/30 rounded-xl">
                  <div className="text-2xl font-bold text-white mb-1">
                    {new Set(canonItems.flatMap(item => item.skills)).size}
                  </div>
                  <p className="text-gray-400 text-sm">Unique Skills</p>
                </div>
              </div>
            </div>

            {/* Add/Edit Form */}
            {isAddingItem && (
              <div className="bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/30 p-6">
                <h3 className="text-xl font-bold text-white mb-6">
                  {editingItem ? 'Edit Career Item' : 'Add New Career Item'}
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Company *</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                        placeholder="Google, Microsoft, etc."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Position *</label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                        placeholder="Software Engineer, Product Manager, etc."
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                        placeholder="Present if current"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      placeholder="Describe your responsibilities and achievements..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Skills</label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      placeholder="JavaScript, React, Node.js (comma separated)"
                    />
                    <p className="text-gray-500 text-xs mt-1">Separate skills with commas</p>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleAddItem}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium rounded-lg transition-all duration-200"
                    >
                      {editingItem ? 'Update Item' : 'Add Item'}
                    </button>
                    <button
                      onClick={handleCancelForm}
                      className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-gray-700/50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Canon Items List */}
            <div className="bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/30 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Career History ({canonItems.length})</h3>
                {canonItems.length > 0 && (
                  <p className="text-gray-400 text-sm">
                    {canonItems.length} item{canonItems.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              
              {canonItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">No career items yet</div>
                  <button
                    onClick={() => setIsAddingItem(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 hover:from-blue-600/30 hover:to-cyan-500/30 text-blue-400 rounded-lg border border-blue-500/20 transition-all duration-200"
                  >
                    Add your first career item
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {canonItems.map((item) => (
                    <div key={item.id} className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-white font-medium text-lg">{item.position}</h4>
                          <p className="text-blue-300">{item.company}</p>
                          <p className="text-gray-400 text-sm mt-1">
                            {item.startDate} → {item.endDate || 'Present'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-3">{item.description}</p>
                      
                      {item.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {item.skills.map((skill, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded"
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
    );
  }

  // Login Page
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4 ${inter.className} relative overflow-hidden`}>
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-transparent to-purple-950/30"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-30 animate-pulse"></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#2d3748_1px,transparent_1px),linear-gradient(180deg,#2d3748_1px,transparent_1px)] bg-[size:24px_24px] opacity-5"></div>
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl opacity-20 animate-[float_25s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl opacity-20 animate-[float_30s_ease-in-out_infinite_reverse]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 w-full max-w-lg">
        {/* Logo/Brand*/}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-8">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-30"></div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent relative">
                Vitae
              </h1>
            </div>
          </div>
          <p className="text-zinc-100 text-2xl font-medium tracking-wide">
            Resume Version Control
          </p>
          <p className="text-gray-300 text-xl mt-4">Track and manage your entire career history</p>
        </div>

        {/* Auth Card - Bigger */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-transparent to-purple-500/30 rounded-3xl blur-xl opacity-30"></div>
          
          <div className="relative bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/30 p-12">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Sign in to Vitae
                </h2>
                <p className="text-zinc-200 text-xl">
                  Use your Google account to get started
                </p>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition duration-500"></div>
                
                <div className="relative flex items-center justify-center gap-4 w-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 backdrop-blur-sm border border-blue-500/30 text-white font-semibold py-5 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl active:scale-[0.99]">
                  {googleLoading ? (
                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <GoogleIcon />
                      <span className="text-xl">Sign in with Google</span>
                    </>
                  )}
                </div>
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* Add float animation keyframes to global styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(30px, -30px);
          }
          66% {
            transform: translate(-20px, 20px);
          }
        }
      `}</style>
    </div>
  );
}