'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Briefcase, BookOpen, Award, 
  PenSquare, Mail, Settings, Plus, Trash2, LogOut, 
  Upload, Download, Eye, ArrowLeft, ArrowRight, 
  AlertCircle, CheckCircle, Edit3, X
} from 'lucide-react';
import { Project, PressItem, SiteConfig } from '@/data';

interface Blog {
  id: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  projectType: string;
  message: string;
  date: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Configuration State
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'story' | 'featured' | 'blogs' | 'inquiries' | 'settings'>('dashboard');
  const [savingConfig, setSavingConfig] = useState(false);
  
  // Project CRUD editing state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);
  const [projectForm, setProjectForm] = useState<Partial<Project>>({
    id: '',
    title: '',
    category: '',
    location: '',
    image: '',
    year: '',
    size: '',
    detailImages: []
  });

  // Blog editing state
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isNewBlog, setIsNewBlog] = useState(false);
  const [blogForm, setBlogForm] = useState<Partial<Blog>>({
    id: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    author: 'Studio Admin',
    excerpt: ''
  });

  // Inquiry focus modal state
  const [viewingInquiry, setViewingInquiry] = useState<Inquiry | null>(null);

  // Uploading state indicator
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  // Global Notification alert state
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Helper to trigger alerts
  const showAlert = useCallback((type: 'success' | 'error' | 'warning', message: string, duration = 8000) => {
    setAlert({ type, message });
    if (type !== 'warning') {
      setTimeout(() => {
        setAlert((prev) => prev?.message === message ? null : prev);
      }, duration);
    }
  }, []);

  // Fetch website dynamic configuration
  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
      
      // Parse blogs from config if present, otherwise set mock defaults
      if (data.blogs) {
        setBlogs(data.blogs);
      } else {
        const defaultBlogs: Blog[] = [
          { id: '1', title: 'The Spatial Purity of Japandi Restraint', date: '2026-06-15', author: 'The AD Efffects', excerpt: 'An editorial exploration of Japanese minimalism combined with Scandinavian functional warmth.' },
          { id: '2', title: 'Tactiletravertine & Traverses of Passive Illumination', date: '2026-05-24', author: 'The AD Efffects', excerpt: 'How we utilize natural daylight paths alongside raw stone textures to construct durative sanctuaries.' }
        ];
        setBlogs(defaultBlogs);
      }
    } catch {
      showAlert('error', 'Failed to load website configuration.');
    }
  }, [showAlert]);

  // Fetch inquiries from inbox API
  const loadInquiries = useCallback(async () => {
    try {
      const res = await fetch('/api/inquiries');
      if (res.ok) {
        const data = await res.json();
        setInquiries(data);
      }
    } catch {
      console.warn('Failed to load inquiries list');
    }
  }, []);

  // Check login auth on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
        if (data.authenticated) {
          loadConfig();
          loadInquiries();
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    checkAuth();
  }, [loadConfig, loadInquiries]);

  // Handle Login submission
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setIsSubmittingLogin(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok) {
        setIsAuthenticated(true);
        loadConfig();
        loadInquiries();
      } else {
        setLoginError(data.error || 'Authentication failed');
      }
    } catch {
      setLoginError('Server error. Please try again.');
    } finally {
      setIsSubmittingLogin(false);
    }
  }

  // Handle Logout
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setConfig(null);
      setEditingProject(null);
      setEditingBlog(null);
    } catch {
      showAlert('error', 'Logout failed');
    }
  }

  // Save current config object to server file system
  async function handleSaveConfig(updatedConfig = config, blogsList = blogs) {
    if (!updatedConfig) return;
    setSavingConfig(true);
    setAlert(null);

    // Merge blogs list into JSON save
    const fullConfig = {
      ...updatedConfig,
      blogs: blogsList
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullConfig)
      });
      const data = await res.json();

      if (res.ok) {
        if (data.persisted) {
          showAlert('success', 'Changes applied and saved to server successfully!');
        } else {
          showAlert('warning', data.warning || 'Saved in-memory only due to hosting constraints.');
        }
        setConfig(fullConfig);
      } else {
        showAlert('error', data.error || 'Failed to save configuration.');
      }
    } catch {
      showAlert('error', 'Network error. Could not connect to API.');
    } finally {
      setSavingConfig(false);
    }
  }

  // Trigger client JSON file download
  function handleDownloadConfig() {
    if (!config) return;
    const fullConfig = { ...config, blogs };
    const blob = new Blob([JSON.stringify(fullConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'siteConfig.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAlert('success', 'siteConfig.json downloaded! Commit this file to src/data/ to save permanently.');
  }

  // File uploading engine
  async function uploadFile(file: File, fieldPath: string): Promise<string | null> {
    setUploadingField(fieldPath);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        return data.url;
      } else {
        showAlert('error', data.error || 'Image upload failed');
        return null;
      }
    } catch {
      showAlert('error', 'Network error during image upload.');
      return null;
    } finally {
      setUploadingField(null);
    }
  }

  // Specific file fields handlers
  async function handleFieldImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'story0' | 'story1' | 'influence' | 'projectCover' | 'projectDetail') {
    const file = e.target.files?.[0];
    if (!file || !config) return;

    if (type === 'story0' || type === 'story1') {
      const url = await uploadFile(file, type);
      if (url) {
        const idx = type === 'story0' ? 0 : 1;
        const newImages = [...config.story.images];
        newImages[idx] = url;
        setConfig({
          ...config,
          story: { ...config.story, images: newImages }
        });
      }
    } else if (type === 'influence') {
      const url = await uploadFile(file, type);
      if (url) {
        setConfig({
          ...config,
          influence: { ...config.influence, image: url }
        });
      }
    } else if (type === 'projectCover') {
      const url = await uploadFile(file, type);
      if (url) {
        setProjectForm(prev => ({ ...prev, image: url }));
      }
    } else if (type === 'projectDetail') {
      const url = await uploadFile(file, type);
      if (url) {
        setProjectForm(prev => ({
          ...prev,
          detailImages: [...(prev.detailImages || []), url]
        }));
      }
    }
  }

  // Project CRUD Actions
  function handleStartAddProject() {
    const nextIdVal = config && config.projects.length > 0
      ? (Math.max(...config.projects.map(p => parseInt(p.id, 10) || 0)) + 1).toString().padStart(2, '0')
      : '01';
    setIsNewProject(true);
    setProjectForm({
      id: nextIdVal,
      title: '',
      category: '',
      location: '',
      image: '',
      year: new Date().getFullYear().toString(),
      size: '',
      detailImages: []
    });
    setEditingProject({ id: nextIdVal } as Project);
  }

  function handleStartEditProject(project: Project) {
    setIsNewProject(false);
    setProjectForm({ ...project });
    setEditingProject(project);
  }

  function handleSaveProjectForm() {
    if (!config) return;
    if (!projectForm.title || !projectForm.category || !projectForm.image) {
      showAlert('error', 'Title, Category, and Cover Image are required.');
      return;
    }

    const updatedProjects = [...config.projects];
    if (isNewProject) {
      updatedProjects.push(projectForm as Project);
    } else {
      const idx = updatedProjects.findIndex(p => p.id === projectForm.id);
      if (idx !== -1) {
        updatedProjects[idx] = projectForm as Project;
      }
    }

    const updatedConfig = { ...config, projects: updatedProjects };
    setConfig(updatedConfig);
    setEditingProject(null);
    handleSaveConfig(updatedConfig);
  }

  function handleDeleteProject(projectId: string) {
    if (!config) return;
    if (!confirm('Are you sure you want to delete this project?')) return;

    const updatedProjects = config.projects.filter(p => p.id !== projectId);
    const updatedConfig = { ...config, projects: updatedProjects };
    setConfig(updatedConfig);
    handleSaveConfig(updatedConfig);
  }

  function handleRemoveDetailImage(idx: number) {
    setProjectForm(prev => ({
      ...prev,
      detailImages: (prev.detailImages || []).filter((_, i) => i !== idx)
    }));
  }

  // Blog CRUD Actions
  function handleStartAddBlog() {
    const nextId = (blogs.length + 1).toString();
    setIsNewBlog(true);
    setBlogForm({
      id: nextId,
      title: '',
      date: new Date().toISOString().split('T')[0],
      author: 'The AD Efffects',
      excerpt: ''
    });
    setEditingBlog({ id: nextId } as Blog);
  }

  function handleStartEditBlog(blog: Blog) {
    setIsNewBlog(false);
    setBlogForm({ ...blog });
    setEditingBlog(blog);
  }

  function handleSaveBlogForm() {
    if (!blogForm.title || !blogForm.excerpt) {
      showAlert('error', 'Title and excerpt content snippet are required.');
      return;
    }

    const updatedBlogs = [...blogs];
    if (isNewBlog) {
      updatedBlogs.push(blogForm as Blog);
    } else {
      const idx = updatedBlogs.findIndex(b => b.id === blogForm.id);
      if (idx !== -1) {
        updatedBlogs[idx] = blogForm as Blog;
      }
    }

    setBlogs(updatedBlogs);
    setEditingBlog(null);
    handleSaveConfig(config, updatedBlogs);
  }

  function handleDeleteBlog(blogId: string) {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    const updatedBlogs = blogs.filter(b => b.id !== blogId);
    setBlogs(updatedBlogs);
    handleSaveConfig(config, updatedBlogs);
  }

  // Press CRUD Actions
  function handleAddPressItem() {
    if (!config) return;
    const nextId = (config.press.length > 0
      ? Math.max(...config.press.map(p => parseInt(p.id, 10) || 0)) + 1
      : 1).toString();
    const updatedPress: PressItem[] = [
      ...config.press,
      { id: nextId, source: 'New Press Publication', year: new Date().getFullYear().toString() }
    ];
    const updatedConfig = { ...config, press: updatedPress };
    setConfig(updatedConfig);
    handleSaveConfig(updatedConfig);
  }

  function handleUpdatePressItem(id: string, field: 'source' | 'year', value: string) {
    if (!config) return;
    const updatedPress = config.press.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setConfig({ ...config, press: updatedPress });
  }

  function handleDeletePressItem(id: string) {
    if (!config) return;
    const updatedPress = config.press.filter(item => item.id !== id);
    const updatedConfig = { ...config, press: updatedPress };
    setConfig(updatedConfig);
    handleSaveConfig(updatedConfig);
  }

  // Inquiry DELETE action
  async function handleDeleteInquiry(id: string) {
    if (!confirm('Are you sure you want to delete this inquiry from the inbox?')) return;
    
    try {
      const res = await fetch(`/api/inquiries?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInquiries(prev => prev.filter(inq => inq.id !== id));
        showAlert('success', 'Inquiry deleted successfully.');
        if (viewingInquiry?.id === id) setViewingInquiry(null);
      } else {
        showAlert('error', 'Failed to delete inquiry.');
      }
    } catch {
      showAlert('error', 'Network error while deleting inquiry.');
    }
  }

  // Tab Breadcrumbs Labels
  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'portfolio': return editingProject ? 'Portfolio / Edit Project' : 'Portfolio Catalog';
      case 'story': return 'Our Story Philosophies';
      case 'featured': return 'Featured Press mentions';
      case 'blogs': return editingBlog ? 'Blog Posts / Edit Post' : 'Editorial Blog Posts';
      case 'inquiries': return 'Inquiries Inbox';
      case 'settings': return 'Studio Settings';
      default: return 'Control Center';
    }
  };

  // Auth Loading
  if (isAuthenticated === null || isLoadingAuth) {
    return (
      <div className="w-full min-h-screen bg-background flex flex-col items-center justify-center transition-colors duration-300">
        <div className="text-center font-cormorant font-light text-2xl tracking-[0.2em] uppercase text-accent animate-pulse">
          Verifying Session...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#121212] text-[#FAF9F7] font-sans antialiased selection:bg-accent selection:text-white flex overflow-hidden">
      
      {/* 1. AUTHENTICATION LOGIN UI */}
      {!isAuthenticated ? (
        <div className="w-full h-full flex flex-col items-center justify-center px-6 py-12 relative bg-[#121212] overflow-y-auto">
          {/* Logo header */}
          <div className="flex flex-col items-center select-none mb-10 text-center">
            <h1 className="font-script text-[64px] text-[#F1EFE8] leading-none">The AD Efffects</h1>
            <div className="w-[180px] h-[1px] bg-[#FAC775]/25 mt-3" />
            <span className="text-[12px] uppercase tracking-[0.3em] text-[#FAC775] font-semibold block mt-4 font-sans">
              <span className="mr-[-0.35em]">Studio Administration</span>
            </span>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            className="w-full max-w-[440px] bg-[#2A2A28] p-10 border border-[#4A4A48]/30 rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-[#F1EFE8]"
          >
            <form onSubmit={handleLogin} className="space-y-6">
              {loginError && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-400 text-sm font-light rounded-[6px] flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-2">
                <label className="font-cormorant italic text-[15px] md:text-[16px] text-[#F1EFE8] block">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] placeholder:italic placeholder:text-[#888780]/40 outline-none transition-all duration-300 font-light"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="font-cormorant italic text-[15px] md:text-[16px] text-[#F1EFE8] block">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] placeholder:italic placeholder:text-[#888780]/40 outline-none transition-all duration-300 font-light"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="w-full bg-[#BA7517] border border-[#BA7517] text-white py-4 text-[13px] md:text-[14px] uppercase tracking-[0.25em] font-semibold rounded-[8px] hover:bg-[#FAC775] hover:border-[#FAC775] transition-all duration-500 cursor-pointer disabled:opacity-50 select-none text-center"
                >
                  {isSubmittingLogin ? 'VERIFYING...' : 'ENTER DASHBOARD'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : (
        
        /* 2. AUTHENTICATED ADMIN DASHBOARD PANEL */
        <>
          {/* Fixed Left Sidebar (320px wide) */}
          <aside className="w-[320px] h-full bg-[#1A1A1A] text-white flex flex-col justify-between flex-shrink-0 select-none z-30 shadow-[4px_0_24px_rgba(0,0,0,0.15)]">
            <div className="flex flex-col">
              {/* Logo / Site Title Header Box (aligns with 88px top header bar) */}
              <div className="h-[88px] w-full border-b border-[#2C2C2C]/60 flex flex-col justify-center items-center bg-[#1A1A1A] select-none px-8">
                <span className="font-script text-[40px] text-[#F1EFE8] leading-none mb-1 hover:opacity-85 transition-opacity">
                  The AD Efffects
                </span>
                <span className="text-[12px] uppercase tracking-[0.3em] text-[#888780] font-sans font-semibold">
                  <span className="mr-[-0.4em]">ADMINISTRATION</span>
                </span>
              </div>

              {/* Navigation list with full-width click targets & viewport scale spacing */}
              <div className="w-full pt-[6vh]">
                <nav className="flex flex-col gap-[2.5vh]">
                  {[
                    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
                    { id: 'portfolio', label: 'PORTFOLIO', icon: Briefcase },
                    { id: 'story', label: 'OUR STORY', icon: BookOpen },
                    { id: 'featured', label: 'FEATURED', icon: Award },
                    { id: 'blogs', label: 'BLOG POSTS', icon: PenSquare },
                    { id: 'inquiries', label: 'INQUIRIES', icon: Mail, badge: inquiries.length }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { 
                          setEditingProject(null); 
                          setEditingBlog(null); 
                          setActiveTab(item.id as typeof activeTab); 
                        }}
                        className={`w-full flex items-center justify-between px-8 py-[2.2vh] text-[15px] font-sans uppercase tracking-[0.25em] font-semibold transition-all duration-300 border-l-[4px] cursor-pointer ${
                          isActive
                            ? 'bg-[#2A2A28] border-[#BA7517] text-[#F1EFE8]'
                            : 'border-transparent text-[#888780] hover:bg-white/5 hover:text-[#F1EFE8] hover:pl-10'
                        }`}
                      >
                        <div className="flex items-center gap-[14px]">
                          <Icon className={`w-[24px] h-[24px] stroke-[1.25] ${isActive ? 'text-[#FAC775]' : 'text-[#888780]'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && item.badge > 0 ? (
                          <span className="bg-[#FAC775]/10 text-[#FAC775] border border-[#FAC775]/20 text-[13px] px-2.5 py-0.5 rounded-full font-mono font-medium">
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Sidebar Footer (Settings and Logout) with viewport scale spacing */}
            <div className="w-full pb-[4vh] pt-6 flex flex-col gap-[1.5vh] border-t border-[#2C2C2C]/60">
              <button
                onClick={() => { 
                  setEditingProject(null); 
                  setEditingBlog(null); 
                  setActiveTab('settings'); 
                }}
                className={`w-full flex items-center gap-[14px] px-8 py-[2.2vh] text-[15px] font-sans uppercase tracking-[0.25em] font-semibold transition-all duration-300 border-l-[4px] cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#2A2A28] border-[#BA7517] text-[#F1EFE8]'
                    : 'border-transparent text-[#888780] hover:bg-white/5 hover:text-[#F1EFE8] hover:pl-10'
                }`}
              >
                <Settings className={`w-[24px] h-[24px] stroke-[1.25] ${activeTab === 'settings' ? 'text-[#FAC775]' : 'text-[#888780]'}`} />
                <span>Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-[14px] px-8 py-[2.2vh] text-[15px] font-sans uppercase tracking-[0.25em] font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 hover:pl-10 border-l-[4px] border-transparent transition-all duration-300 cursor-pointer"
              >
                <LogOut className="w-[24px] h-[24px] stroke-[1.25]" /> 
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* Right Main Content Area Container */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121212]">
            
            {/* Top Header Bar (88px height) */}
            <div className="h-[88px] bg-[#1A1A1A] border-b border-[#2C2C2C]/60 flex justify-between items-center px-10 flex-shrink-0 z-20 select-none">
              <span className="text-[14px] font-sans font-semibold uppercase tracking-[0.25em] text-[#FAF9F7]/90">
                {getTabLabel()}
              </span>

              {/* Profile Block */}
              <div className="flex items-center gap-[14px]">
                <a 
                  href="/" 
                  target="_blank" 
                  className="text-[12px] uppercase tracking-[0.2em] text-[#B4B2A9] hover:text-[#FAC775] font-semibold transition-all flex items-center gap-1.5 mr-4 hover:scale-105"
                >
                  <Eye className="w-3.5 h-3.5 stroke-[1.25]" /> View Live
                </a>
                <span className="text-[15px] text-[#F1EFE8] font-sans">Pratham</span>
                <div className="w-[36px] h-[36px] rounded-full bg-[#FAEEDA] flex items-center justify-center text-[14px] text-[#633806] font-medium select-none text-center">
                  P
                </div>
              </div>
            </div>

            {/* Main content viewport, scrollable independently */}
            <main className="flex-1 overflow-y-auto p-12 md:p-16 space-y-12">
              
              {/* Alert Notification Banners */}
              <AnimatePresence>
                {alert && (
                  <motion.div
                     initial={{ opacity: 0, y: -8 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -8 }}
                     className={`p-4 rounded-[8px] border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm ${
                       alert.type === 'success' 
                         ? 'bg-green-950/20 border-green-800/40 text-green-400' 
                         : alert.type === 'error'
                         ? 'bg-red-950/20 border-red-800/40 text-red-400'
                         : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                     }`}
                  >
                    <div className="flex items-center gap-3">
                      {alert.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="text-[15px] font-sans font-light leading-relaxed">{alert.message}</span>
                    </div>
                    {alert.type === 'warning' && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={handleDownloadConfig}
                          className="bg-[#BA7517] hover:bg-[#FAC775] text-white text-[12px] uppercase tracking-[0.2em] font-semibold px-4 py-2 rounded-[4px] flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Download className="w-3.5 h-3.5" /> Download siteConfig.json
                        </button>
                        <button
                          onClick={() => setAlert(null)}
                          className="border border-[#4A4A48] hover:bg-white/5 text-[#F1EFE8] text-[12px] uppercase tracking-[0.2em] font-semibold px-3 py-2 rounded-[4px] transition-all"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Config Loaded Tabs */}
              {config ? (
                <div className="transition-all">
                  
                  {/* VIEW 1: DASHBOARD TAB */}
                  {activeTab === 'dashboard' && (
                    <div className="space-y-12">
                      {/* Stats widgets */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">
                        {[
                          { label: 'Portfolio items', value: config.projects.length },
                          { label: 'New inquiries', value: inquiries.length },
                          { label: 'Blog drafts', value: blogs.length }
                        ].map((stat, idx) => (
                          <div key={idx} className="bg-[#2E2D2B] border-[0.5px] border-[#4A4A48]/30 rounded-[10px] p-8 text-[#F1EFE8]">
                            <p className="text-[15px] text-[#B4B2A9] m-0 mb-4 font-sans">
                              {stat.label}
                            </p>
                            <p className="text-[32px] font-medium text-[#F1EFE8] m-0 font-sans">
                              {stat.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Recent Inquiries List Widget Card */}
                      <div className="bg-[#2E2D2B] border-[0.5px] border-[#4A4A48]/30 rounded-[10px] p-10 text-[#F1EFE8]">
                        <div className="flex items-center justify-between mb-8">
                          <span className="text-[14px] tracking-[0.5px] text-[#B4B2A9] uppercase font-sans font-medium">
                            RECENT INQUIRIES
                          </span>
                          <button 
                            onClick={() => setActiveTab('inquiries')}
                            className="text-[14px] text-[#F1EFE8] border border-[#4A4A48]/60 px-[14px] py-[6px] rounded-[4px] hover:bg-white/5 transition-all cursor-pointer font-sans"
                          >
                            View all
                          </button>
                        </div>

                        <div className="overflow-x-auto w-full">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="border-b-[0.5px] border-[#4A4A48]/55">
                                <td className="py-3.5 text-[#B4B2A9] text-sm font-sans font-normal uppercase">NAME</td>
                                <td className="py-3.5 text-[#B4B2A9] text-sm font-sans font-normal uppercase">TYPE</td>
                                <td className="py-3.5 text-[#B4B2A9] text-sm font-sans font-normal uppercase">DATE</td>
                                <td className="py-3.5 text-[#B4B2A9] text-sm font-sans font-normal uppercase text-right">ACTION</td>
                              </tr>
                            </thead>
                            <tbody>
                              {inquiries.slice(0, 3).map((inq, idx) => (
                                <tr 
                                  key={inq.id} 
                                  onClick={() => setViewingInquiry(inq)}
                                  className={`cursor-pointer hover:bg-white/5 transition-colors ${
                                    idx < inquiries.slice(0, 3).length - 1 ? 'border-b-[0.5px] border-[#4A4A48]/30' : ''
                                  }`}
                                >
                                  <td className="py-4.5 text-[#F1EFE8] font-sans font-medium">{inq.name}</td>
                                  <td className="py-4.5 text-[#B4B2A9] font-sans">{inq.projectType}</td>
                                  <td className="py-4.5 text-[#B4B2A9] font-sans">
                                    {new Date(inq.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </td>
                                  <td className="py-4.5 text-right">
                                    <div className="inline-flex items-center text-[#B4B2A9] hover:text-[#FAC775] transition-colors">
                                      <ArrowRight className="w-4 h-4" />
                                    </div>
                                  </td>
                                </tr>
                              ))}

                              {inquiries.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-sm text-[#B4B2A9]/50 font-sans font-light">
                                    Inbox is clean. No inquiries submitted yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIEW 2: PORTFOLIO TAB */}
                  {activeTab === 'portfolio' && (
                    <div>
                      {editingProject ? (
                        /* Portfolio Edit/Add Form */
                        <div className="bg-[#2E2D2B] border-[0.5px] border-[#4A4A48]/30 rounded-[10px] p-8 space-y-8 w-full text-[#F1EFE8] min-h-[600px]">
                          <div className="flex items-center justify-between pb-4 border-b border-[#4A4A48]/45">
                            <h3 className="font-serif font-light text-2xl uppercase tracking-wider italic text-[#F1EFE8]">
                              {isNewProject ? 'Add portfolio item' : `Edit project: ${projectForm.title}`}
                            </h3>
                            <button
                              onClick={() => setEditingProject(null)}
                              className="text-[12px] uppercase tracking-[0.25em] text-[#B4B2A9] hover:text-[#FAC775] flex items-center gap-1.5 font-semibold transition-all cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" /> Back to list
                            </button>
                          </div>

                          <div className="space-y-8">
                            {/* Title & Category */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-3">
                                <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Project Title *</label>
                                <input
                                  type="text"
                                  required
                                  value={projectForm.title || ''}
                                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                                  placeholder="Enter project name..."
                                  className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-light"
                                />
                              </div>

                              <div className="space-y-3">
                                <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Category *</label>
                                <input
                                  type="text"
                                  required
                                  value={projectForm.category || ''}
                                  onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                                  placeholder="e.g. Residential Architecture"
                                  className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-light"
                                />
                              </div>
                            </div>

                            {/* Location, Year, Size */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                              <div className="space-y-3">
                                <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Location</label>
                                <input
                                  type="text"
                                  value={projectForm.location || ''}
                                  onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
                                  placeholder="e.g. Bengaluru, India"
                                  className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-light"
                                />
                              </div>

                              <div className="space-y-3">
                                <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Year</label>
                                <input
                                  type="text"
                                  value={projectForm.year || ''}
                                  onChange={(e) => setProjectForm({ ...projectForm, year: e.target.value })}
                                  placeholder="e.g. 2024"
                                  className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-light"
                                />
                              </div>

                              <div className="space-y-3">
                                <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Size</label>
                                <input
                                  type="text"
                                  value={projectForm.size || ''}
                                  onChange={(e) => setProjectForm({ ...projectForm, size: e.target.value })}
                                  placeholder="e.g. 350 m²"
                                  className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-light"
                                />
                              </div>
                            </div>

                            {/* Cover Photo */}
                            <div className="space-y-6 pt-8 border-t border-[#4A4A48]/40">
                              <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Cover Photo Image</label>
                              <div className="flex flex-col sm:flex-row gap-6 items-end">
                                <div className="flex-1 w-full">
                                  <input
                                    type="text"
                                    value={projectForm.image || ''}
                                    onChange={(e) => setProjectForm({ ...projectForm, image: e.target.value })}
                                    placeholder="Paste cover photo URL..."
                                    className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-light"
                                  />
                                </div>
                                <div className="relative w-full sm:w-auto">
                                  <input
                                    type="file"
                                    id="upload-cover"
                                    accept="image/*"
                                    onChange={(e) => handleFieldImageUpload(e, 'projectCover')}
                                    className="hidden"
                                    disabled={uploadingField !== null}
                                  />
                                  <label 
                                    htmlFor="upload-cover"
                                    className="w-full sm:w-auto border border-[#4A4A48] hover:border-[#BA7517] hover:text-[#FAC775] text-[12px] uppercase tracking-[0.2em] font-semibold px-5 py-3.5 rounded-[6px] transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-[#2E2D2B] select-none"
                                  >
                                    <Upload className="w-3.5 h-3.5" /> 
                                    {uploadingField === 'projectCover' ? 'Uploading...' : 'Upload Cover File'}
                                  </label>
                                </div>
                              </div>

                              {projectForm.image && (
                                <div className="w-36 aspect-[3/4] border border-[#4A4A48]/55 rounded-[6px] overflow-hidden bg-black/10 mt-4">
                                  <img src={projectForm.image} className="w-full h-full object-cover" alt="Cover preview" />
                                </div>
                              )}
                            </div>

                            {/* Gallery Details */}
                            <div className="space-y-8 pt-8 border-t border-[#4A4A48]/40">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="text-[13px] uppercase tracking-[0.2em] font-semibold text-[#FAC775] block">Detail Photos (Lightbox Gallery)</h4>
                                  <p className="text-[13px] text-[#B4B2A9]/75 font-light mt-0.5">Upload gallery photos or add links below.</p>
                                </div>
                                <div className="relative">
                                  <input
                                    type="file"
                                    id="upload-detail"
                                    accept="image/*"
                                    onChange={(e) => handleFieldImageUpload(e, 'projectDetail')}
                                    className="hidden"
                                    disabled={uploadingField !== null}
                                  />
                                  <label 
                                    htmlFor="upload-detail"
                                    className="border border-[#4A4A48] hover:border-[#BA7517] hover:text-[#FAC775] text-[12px] uppercase tracking-[0.2em] font-semibold px-4 py-2.5 rounded-[6px] transition-all cursor-pointer inline-flex items-center gap-1.5 bg-[#2E2D2B] select-none"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> 
                                    {uploadingField === 'projectDetail' ? 'Uploading...' : 'Upload File'}
                                  </label>
                                </div>
                              </div>

                              <div className="flex gap-4 items-end bg-[#1A1A1A]/40 p-5 rounded-[8px] border border-[#4A4A48]/30">
                                <input
                                  type="text"
                                  id="manual-detail-url"
                                  placeholder="Or paste external detail image URL link and click add..."
                                  className="flex-1 bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-2 text-[15px] outline-none font-light transition-all text-[#F1EFE8]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById('manual-detail-url') as HTMLInputElement;
                                    if (input && input.value.trim()) {
                                      setProjectForm(prev => ({
                                        ...prev,
                                        detailImages: [...(prev.detailImages || []), input.value.trim()]
                                      }));
                                      input.value = '';
                                    }
                                  }}
                                  className="border border-[#F1EFE8] hover:bg-[#F1EFE8] hover:text-[#1A1A1A] text-[#F1EFE8] text-[12px] uppercase tracking-[0.15em] font-semibold px-4 py-2.5 rounded-[4px] transition-all cursor-pointer"
                                >
                                  Add URL
                                </button>
                              </div>

                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                {(projectForm.detailImages || []).map((img, idx) => (
                                  <div key={idx} className="relative group aspect-[3/4] border border-[#4A4A48]/40 rounded-[6px] overflow-hidden bg-black/20">
                                    <img src={img} className="w-full h-full object-cover" alt="Detail preview" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDetailImage(idx)}
                                        className="p-2 bg-red-650 text-white rounded-full hover:bg-red-750 transition-colors shadow cursor-pointer border-none"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="absolute bottom-2 left-2 bg-black/60 text-[#F1EFE8] text-[11px] tracking-[0.1em] px-1.5 py-0.5 rounded font-mono">
                                      #{idx + 1}
                                    </div>
                                  </div>
                                ))}
                                {(!projectForm.detailImages || projectForm.detailImages.length === 0) && (
                                  <div className="col-span-full border border-dashed border-[#4A4A48]/50 py-12 text-center text-[#B4B2A9]/40 font-sans font-light text-sm rounded">
                                    No gallery images added yet.
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>

                          <div className="flex justify-end gap-6 border-t border-[#4A4A48]/45 pt-8 mt-8">
                            <button
                              type="button"
                              onClick={() => setEditingProject(null)}
                              className="border border-[#4A4A48] hover:border-accent text-[#B4B2A9] hover:text-[#F1EFE8] bg-transparent text-[12px] uppercase tracking-[0.2em] px-6 py-3 rounded-[6px] transition-all cursor-pointer font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveProjectForm}
                              className="bg-[#BA7517] hover:bg-[#FAC775] text-white border border-[#BA7517] hover:border-[#FAC775] text-[12px] uppercase tracking-[0.2em] font-semibold px-6 py-3 rounded-[6px] transition-all duration-300 cursor-pointer"
                            >
                              Save Project
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Portfolio Items List Table */
                        <div className="bg-[#2E2D2B] border-[0.5px] border-[#4A4A48]/30 rounded-[10px] p-8 space-y-8 text-[#F1EFE8] min-h-[600px]">
                          <div className="flex justify-between items-center pb-4 border-b border-[#4A4A48]/40">
                            <span className="text-[13px] tracking-[0.25em] uppercase text-[#FAC775] font-semibold block">
                              Active Portfolio Items ({config.projects.length})
                            </span>
                            <button
                              onClick={handleStartAddProject}
                              className="bg-[#BA7517] hover:bg-[#FAC775] border border-[#BA7517] hover:border-[#FAC775] text-white text-[12px] uppercase tracking-[0.2em] font-semibold px-4 py-2.5 rounded-[6px] transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Project
                            </button>
                          </div>

                          <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr>
                                  <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-left w-20">Cover</th>
                                  <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-left">Project Details</th>
                                  <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-left">Location</th>
                                  <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-center w-24">Year</th>
                                  <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-center w-24">Dimensions</th>
                                  <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-right w-24">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="text-[15px] font-light">
                                {config.projects.map((project) => (
                                  <tr key={project.id} className="border-b-[0.5px] border-[#4A4A48]/30 hover:bg-white/5 transition-colors group">
                                    <td className="py-8">
                                      <div className="w-10 h-14 bg-black/10 border border-[#4A4A48]/45 rounded-[4px] overflow-hidden">
                                        <img src={project.image} className="w-full h-full object-cover" alt="cover" />
                                      </div>
                                    </td>
                                    <td className="py-8 pr-4">
                                      <h4 className="font-serif font-semibold text-[#F1EFE8] text-[17px]">{project.title}</h4>
                                      <span className="text-[12px] uppercase tracking-[0.1em] text-accent font-medium">{project.category}</span>
                                    </td>
                                    <td className="py-8 text-[#B4B2A9]">{project.location}</td>
                                    <td className="py-8 text-center font-mono text-sm text-[#B4B2A9]">{project.year}</td>
                                    <td className="py-8 text-center text-[#B4B2A9]">{project.size || 'N/A'}</td>
                                    <td className="py-8 text-right">
                                      <div className="flex gap-4 justify-end items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => handleStartEditProject(project)}
                                          className="text-[#B4B2A9] hover:text-[#FAC775] transition-colors cursor-pointer"
                                          title="Edit Project"
                                        >
                                          <Edit3 className="w-4 h-4 stroke-[1.5]" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteProject(project.id)}
                                          className="text-[#B4B2A9] hover:text-red-500 transition-colors cursor-pointer"
                                          title="Delete Project"
                                        >
                                          <Trash2 className="w-4 h-4 stroke-[1.5]" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}

                                {config.projects.length === 0 && (
                                  <tr>
                                    <td colSpan={6} className="py-24 text-center text-[#B4B2A9]/40 font-light text-[17px]">
                                      No portfolio items found.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VIEW 3: OUR STORY TAB */}
                  {activeTab === 'story' && (
                    <div className="bg-[#2E2D2B] border-[0.5px] border-[#4A4A48]/30 rounded-[10px] p-8 space-y-8 w-full text-[#F1EFE8] min-h-[600px]">
                      <div className="pb-4 border-b border-[#4A4A48]/40">
                        <span className="text-[13px] tracking-[0.25em] uppercase text-[#FAC775] font-semibold block">
                          Story Philosophy copy
                        </span>
                      </div>

                      <div className="space-y-8">
                        {/* Brand Statement */}
                        <div className="space-y-3">
                          <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Brand Statement (Large intro on homepage)</label>
                          <textarea
                            rows={4}
                            value={config.brandStatement}
                            onChange={(e) => setConfig({ ...config, brandStatement: e.target.value })}
                             className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-light resize-y min-h-[100px]"
                          />
                        </div>

                        {/* Heading */}
                        <div className="space-y-3 pt-6 border-t border-[#4A4A48]/30">
                          <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Philosophy / Story Section Title</label>
                          <input
                            type="text"
                            value={config.story.title}
                            onChange={(e) => setConfig({
                              ...config,
                              story: { ...config.story, title: e.target.value }
                            })}
                            className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[14px] text-[#F1EFE8] outline-none transition-all duration-300 font-light"
                          />
                        </div>

                        {/* Paragraphs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-3">
                            <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Story Paragraph 1</label>
                            <textarea
                              rows={5}
                              value={config.story.paragraphs[0] || ''}
                              onChange={(e) => {
                                const paragraphs = [...config.story.paragraphs];
                                paragraphs[0] = e.target.value;
                                setConfig({ ...config, story: { ...config.story, paragraphs } });
                              }}
                              className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-light resize-y min-h-[120px]"
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Story Paragraph 2</label>
                            <textarea
                              rows={5}
                              value={config.story.paragraphs[1] || ''}
                              onChange={(e) => {
                                const paragraphs = [...config.story.paragraphs];
                                paragraphs[1] = e.target.value;
                                setConfig({ ...config, story: { ...config.story, paragraphs } });
                              }}
                              className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-light resize-y min-h-[120px]"
                            />
                          </div>
                        </div>

                        {/* Story Images */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-[#4A4A48]/30">
                          
                          {/* Image Left */}
                          <div className="space-y-4 bg-[#1A1A1A]/30 p-5 rounded-[8px] border border-[#4A4A48]/35">
                            <span className="text-[12px] uppercase tracking-[0.1em] text-[#FAC775] font-semibold block">Editorial Image Left (Stone Texture)</span>
                            <input
                              type="text"
                              value={config.story.images[0] || ''}
                              onChange={(e) => {
                                const images = [...config.story.images];
                                images[0] = e.target.value;
                                setConfig({ ...config, story: { ...config.story, images } });
                              }}
                              className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-2 text-sm text-[#F1EFE8] outline-none font-light"
                            />
                            <div className="flex justify-between items-center gap-4 pt-1">
                              <div className="relative">
                                <input
                                  type="file"
                                  id="story-img-left"
                                  accept="image/*"
                                  onChange={(e) => handleFieldImageUpload(e, 'story0')}
                                  className="hidden"
                                  disabled={uploadingField !== null}
                                />
                                <label htmlFor="story-img-left" className="border border-[#4A4A48] hover:border-[#BA7517] hover:text-[#FAC775] text-[12px] uppercase tracking-[0.2em] font-semibold px-3.5 py-2.5 rounded-[6px] transition-all cursor-pointer inline-flex items-center gap-1.5 bg-[#2E2D2B] select-none">
                                  <Upload className="w-3.5 h-3.5" /> 
                                  {uploadingField === 'story0' ? 'Uploading...' : 'Upload File'}
                                </label>
                              </div>
                              {config.story.images[0] && (
                                <img src={config.story.images[0]} className="w-12 h-16 object-cover border border-[#4A4A48]/60 rounded-[4px]" alt="left story" />
                              )}
                            </div>
                          </div>

                          {/* Image Right */}
                          <div className="space-y-4 bg-[#1A1A1A]/30 p-5 rounded-[8px] border border-[#4A4A48]/35">
                            <span className="text-[12px] uppercase tracking-[0.1em] text-[#FAC775] font-semibold block">Editorial Image Right (Interior Scene)</span>
                            <input
                              type="text"
                              value={config.story.images[1] || ''}
                              onChange={(e) => {
                                const images = [...config.story.images];
                                images[1] = e.target.value;
                                setConfig({ ...config, story: { ...config.story, images } });
                              }}
                              className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-2 text-sm text-[#F1EFE8] outline-none font-light"
                            />
                            <div className="flex justify-between items-center gap-4 pt-1">
                              <div className="relative">
                                <input
                                  type="file"
                                  id="story-img-right"
                                  accept="image/*"
                                  onChange={(e) => handleFieldImageUpload(e, 'story1')}
                                  className="hidden"
                                  disabled={uploadingField !== null}
                                />
                                <label htmlFor="story-img-right" className="border border-[#4A4A48] hover:border-[#BA7517] hover:text-[#FAC775] text-[12px] uppercase tracking-[0.2em] font-semibold px-3.5 py-2.5 rounded-[6px] transition-all cursor-pointer inline-flex items-center gap-1.5 bg-[#2E2D2B] select-none">
                                  <Upload className="w-3.5 h-3.5" /> 
                                  {uploadingField === 'story1' ? 'Uploading...' : 'Upload File'}
                                </label>
                              </div>
                              {config.story.images[1] && (
                                <img src={config.story.images[1]} className="w-12 h-16 object-cover border border-[#4A4A48]/60 rounded-[4px]" alt="right story" />
                              )}
                            </div>
                          </div>

                        </div>
                      </div>

                      <div className="flex justify-end pt-8 border-t border-[#4A4A48]/40 mt-4">
                        <button
                          onClick={() => handleSaveConfig()}
                          disabled={savingConfig}
                          className="bg-[#BA7517] hover:bg-[#FAC775] text-white border border-[#BA7517] hover:border-[#FAC775] text-[12px] uppercase tracking-[0.2em] font-semibold px-8 py-3.5 rounded-[6px] transition-all duration-300 cursor-pointer disabled:opacity-50"
                        >
                          {savingConfig ? 'Applying changes...' : 'Save Story Section'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VIEW 4: FEATURED TAB */}
                  {activeTab === 'featured' && (
                    <div className="bg-[#2E2D2B] border-[0.5px] border-[#4A4A48]/30 rounded-[10px] p-12 md:p-14 space-y-12 w-full min-h-[600px] flex flex-col justify-between text-[#F1EFE8]">
                      <div className="flex justify-between items-center pb-8 border-b border-[#4A4A48]/40 mb-4">
                        <span className="text-[14px] md:text-[15px] tracking-[0.25em] uppercase text-[#FAC775] font-semibold block">
                          Featured Press entries
                        </span>
                        <button
                          onClick={handleAddPressItem}
                          className="border border-[#4A4A48] hover:border-[#BA7517] hover:text-[#FAC775] text-[13px] uppercase tracking-[0.2em] font-semibold px-6 py-3 rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer bg-[#2E2D2B] select-none text-[#F1EFE8]"
                        >
                          <Plus className="w-4 h-4" /> Add Press
                        </button>
                      </div>

                      <div className="space-y-4 flex-grow">
                        {config.press.map((item) => (
                          <div 
                            key={item.id} 
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 border-b-[0.5px] border-[#4A4A48]/30 gap-6 group"
                          >
                            <input
                              type="text"
                              value={item.source}
                              onChange={(e) => handleUpdatePressItem(item.id, 'source', e.target.value)}
                              placeholder="Press Publication name..."
                              className="flex-1 bg-transparent border-b border-transparent focus:border-[#BA7517] py-3 text-[16px] md:text-[18px] font-serif text-[#F1EFE8] outline-none transition-all font-light"
                            />
                            <div className="flex items-center gap-6 w-full sm:w-auto justify-between">
                              <input
                                type="text"
                                value={item.year}
                                onChange={(e) => handleUpdatePressItem(item.id, 'year', e.target.value)}
                                placeholder="Year"
                                className="w-28 bg-transparent border-b border-transparent focus:border-[#BA7517] py-3 text-[16px] text-[#FAC775] font-mono text-center outline-none transition-all font-light"
                              />
                              <button
                                onClick={() => handleDeletePressItem(item.id)}
                                className="text-[#B4B2A9]/60 hover:text-red-500 transition-colors p-2 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 stroke-[1.5]" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {config.press.length === 0 && (
                          <div className="py-16 text-center text-sm text-[#B4B2A9]/40 font-light">
                            No press entries found. Click Add Press to add.
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-10 border-t border-[#4A4A48]/40 mt-6">
                        <button
                          onClick={() => handleSaveConfig()}
                          disabled={savingConfig}
                          className="bg-[#BA7517] hover:bg-[#FAC775] text-white border border-[#BA7517] hover:border-[#FAC775] text-[12px] uppercase tracking-[0.2em] font-semibold px-8 py-4 rounded-[6px] transition-all cursor-pointer disabled:opacity-50"
                        >
                          {savingConfig ? 'Saving...' : 'Save Press List'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VIEW 5: BLOG POSTS TAB */}
                  {activeTab === 'blogs' && (
                    <div>
                      {editingBlog ? (
                        /* Add/Edit Blog Post Form */
                        <div className="bg-[#2E2D2B] border-[0.5px] border-[#4A4A48]/30 rounded-[10px] p-10 space-y-10 w-full text-[#F1EFE8] min-h-[600px]">
                          <div className="flex items-center justify-between pb-4 border-b border-[#4A4A48]/40">
                            <h3 className="font-serif font-light text-2xl uppercase tracking-wider italic text-[#F1EFE8]">
                              {isNewBlog ? 'New Editorial Article' : `Edit Article: ${blogForm.title}`}
                            </h3>
                            <button
                              onClick={() => setEditingBlog(null)}
                              className="text-[12px] uppercase tracking-[0.25em] text-[#B4B2A9] hover:text-[#FAC775] flex items-center gap-1.5 font-semibold transition-all cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" /> Back to list
                            </button>
                          </div>

                          <div className="space-y-8">
                            <div className="space-y-4">
                              <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Blog Title *</label>
                              <input
                                type="text"
                                required
                                value={blogForm.title || ''}
                                onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                                placeholder="Article title..."
                                className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-light"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                              <div className="space-y-4">
                                <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Publish Date</label>
                                <input
                                  type="date"
                                  value={blogForm.date || ''}
                                  onChange={(e) => setBlogForm({ ...blogForm, date: e.target.value })}
                                  className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-light"
                                />
                              </div>
                              <div className="space-y-4">
                                <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Author</label>
                                <input
                                  type="text"
                                  value={blogForm.author || ''}
                                  onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })}
                                  className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-light"
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Article Excerpt / Content Snippet *</label>
                              <textarea
                                rows={6}
                                value={blogForm.excerpt || ''}
                                onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                                placeholder="Describe article editorial details or content..."
                                className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-light resize-y min-h-[140px]"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-6 border-t border-[#4A4A48]/40 pt-8 mt-8">
                            <button
                              type="button"
                              onClick={() => setEditingBlog(null)}
                              className="border border-[#4A4A48] hover:border-accent text-[#B4B2A9] hover:text-[#F1EFE8] bg-transparent text-[12px] uppercase tracking-[0.2em] px-6 py-3 rounded-[6px] transition-all cursor-pointer font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveBlogForm}
                              className="bg-[#BA7517] hover:bg-[#FAC775] text-white border border-[#BA7517] hover:border-[#FAC775] text-[12px] uppercase tracking-[0.2em] font-semibold px-6 py-3 rounded-[6px] transition-all duration-300 cursor-pointer"
                            >
                              Save Article
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Blogs List Table */
                        <div className="bg-[#2E2D2B] border-[0.5px] border-[#4A4A48]/30 rounded-[10px] p-10 space-y-10 text-[#F1EFE8] min-h-[600px]">
                          <div className="flex justify-between items-center pb-4 border-b border-[#4A4A48]/40">
                            <span className="text-[13px] tracking-[0.25em] uppercase text-[#FAC775] font-semibold block">
                              Editorial Articles ({blogs.length})
                            </span>
                            <button
                              onClick={handleStartAddBlog}
                              className="bg-[#BA7517] hover:bg-[#FAC775] border border-[#BA7517] hover:border-[#FAC775] text-white text-[12px] uppercase tracking-[0.2em] font-semibold px-4 py-2.5 rounded-[6px] transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Write Article
                            </button>
                          </div>

                          <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr>
                                  <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-left">Article Title</th>
                                  <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-left w-36">Author</th>
                                  <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-center w-32">Date</th>
                                  <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-right w-24">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="text-[15px] font-light">
                                {blogs.map((blog) => (
                                  <tr key={blog.id} className="border-b-[0.5px] border-[#4A4A48]/40 hover:bg-white/5 transition-colors group">
                                    <td className="py-8 pr-4">
                                      <h4 className="font-serif font-semibold text-[#F1EFE8] text-[17px]">{blog.title}</h4>
                                      <p className="text-[13px] text-[#B4B2A9]/70 line-clamp-3 mt-1.5 leading-relaxed">{blog.excerpt}</p>
                                    </td>
                                    <td className="py-8 text-[#B4B2A9]">{blog.author}</td>
                                    <td className="py-8 text-center font-mono text-sm text-[#B4B2A9]">{blog.date}</td>
                                    <td className="py-8 text-right">
                                      <div className="flex gap-4 justify-end items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => handleStartEditBlog(blog)}
                                          className="text-[#B4B2A9] hover:text-[#FAC775] transition-colors cursor-pointer"
                                          title="Edit Article"
                                        >
                                          <Edit3 className="w-4 h-4 stroke-[1.5]" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteBlog(blog.id)}
                                          className="text-[#B4B2A9] hover:text-red-500 transition-colors cursor-pointer"
                                          title="Delete Article"
                                        >
                                          <Trash2 className="w-4 h-4 stroke-[1.5]" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                {blogs.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="py-24 text-center text-[#B4B2A9]/40 font-light text-[17px]">
                                      No editorial blog articles found.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VIEW 6: INQUIRIES TAB */}
                  {activeTab === 'inquiries' && (
                    <div className="bg-[#2E2D2B] border-[0.5px] border-[#4A4A48]/30 rounded-[10px] p-10 space-y-10 text-[#F1EFE8] min-h-[600px]">
                      <div className="flex justify-between items-center pb-4 border-b border-[#4A4A48]/40">
                        <span className="text-[13px] tracking-[0.25em] uppercase text-[#FAC775] font-semibold block">
                          Client Inquiries Inbox ({inquiries.length})
                        </span>
                      </div>

                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr>
                              <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-left w-40">Client Name</th>
                              <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-left w-48">Email Address</th>
                              <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-center w-32">Type</th>
                              <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-left">Message Preview</th>
                              <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-center w-28">Submitted</th>
                              <th className="py-5 text-sm font-sans font-normal uppercase tracking-[0.5px] text-[#B4B2A9] border-b-[0.5px] border-[#4A4A48]/55 text-right w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="text-[15px] font-light">
                            {inquiries.map((inq) => (
                              <tr key={inq.id} className="border-b-[0.5px] border-[#4A4A48]/40 hover:bg-white/5 transition-colors group">
                                <td className="py-8 font-semibold text-[#F1EFE8]">{inq.name}</td>
                                <td className="py-8">
                                  <a href={`mailto:${inq.email}`} className="text-[#B4B2A9] hover:text-[#FAC775] transition-colors font-light">
                                    {inq.email}
                                  </a>
                                </td>
                                <td className="py-8 text-center">
                                  <span className="text-[11px] uppercase tracking-[0.1em] bg-[#BA7517]/20 text-[#FAC775] px-2 py-0.5 rounded font-mono font-medium inline-block">
                                    {inq.projectType}
                                  </span>
                                </td>
                                <td 
                                  className="py-8 pr-6 text-[#B4B2A9] max-w-[600px] cursor-pointer hover:underline"
                                  onClick={() => setViewingInquiry(inq)}
                                  title="Click to view details"
                                  style={{ verticalAlign: 'middle' }}
                                >
                                  <div className="line-clamp-3 text-sm leading-relaxed whitespace-pre-wrap">
                                    {inq.message}
                                  </div>
                                </td>
                                <td className="py-8 text-center font-mono text-[12px] text-[#B4B2A9]/60">
                                  {new Date(inq.date).toLocaleDateString()}
                                </td>
                                <td className="py-8 text-right">
                                  <button
                                    onClick={() => handleDeleteInquiry(inq.id)}
                                    className="text-[#B4B2A9]/60 hover:text-red-500 opacity-60 group-hover:opacity-100 transition-all p-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 stroke-[1.5]" />
                                  </button>
                                </td>
                              </tr>
                            ))}

                            {inquiries.length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-24 text-center text-[#B4B2A9]/40 font-light text-[17px]">
                                  Inbox is empty. No inquiries submitted yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* VIEW 7: SETTINGS TAB */}
                  {activeTab === 'settings' && (
                    <div className="bg-[#2E2D2B] border-[0.5px] border-[#4A4A48]/30 rounded-[10px] p-10 space-y-10 w-full text-[#F1EFE8] min-h-[600px]">
                      <div className="pb-4 border-b border-[#4A4A48]/40">
                        <span className="text-[13px] tracking-[0.25em] uppercase text-[#FAC775] font-semibold block">
                          CRM Settings
                        </span>
                      </div>

                      <div className="space-y-10">
                        {/* Credentials */}
                        <div className="space-y-6">
                          <h4 className="text-[13px] uppercase tracking-[0.1em] font-semibold text-[#F1EFE8] block">Administrator Access</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                            <div className="space-y-4">
                              <label className="font-serif italic text-[15px] text-[#B4B2A9] block">Login Username</label>
                              <input
                                type="text"
                                disabled
                                value="AD EFFFECTS"
                                className="w-full bg-transparent border-b border-[#4A4A48]/60 py-3 text-[15px] text-[#B4B2A9]/70 outline-none font-light select-all"
                              />
                            </div>
                            <div className="space-y-4">
                              <label className="font-serif italic text-[15px] text-[#B4B2A9] block">Password Secret</label>
                              <input
                                type="text"
                                disabled
                                value="AD12345"
                                className="w-full bg-transparent border-b border-[#4A4A48]/60 py-3 text-[15px] text-[#B4B2A9]/70 outline-none font-light select-all"
                              />
                            </div>
                          </div>
                          <span className="text-[11px] text-[#B4B2A9]/50 font-light block">
                            * Note: Admin credentials are set dynamically to hardcoded values as per project parameters.
                          </span>
                        </div>

                        {/* Coordinates */}
                        <div className="space-y-6 pt-8 border-t border-[#4A4A48]/30">
                          <h4 className="text-[13px] uppercase tracking-[0.1em] font-semibold text-[#F1EFE8] block">Studio Coordinates</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                            <div className="space-y-4">
                              <label className="font-serif italic text-[15px] text-[#B4B2A9] block">Studio Email</label>
                              <input
                                type="text"
                                disabled
                                value="hello@adefffects.com"
                                className="w-full bg-transparent border-b border-[#4A4A48]/60 py-2.5 text-[15px] text-[#B4B2A9]/70 outline-none font-light"
                              />
                            </div>
                            <div className="space-y-4">
                              <label className="font-serif italic text-[15px] text-[#B4B2A9] block">Contact Phone</label>
                              <input
                                type="text"
                                disabled
                                value="+45 3312 0000"
                                className="w-full bg-transparent border-b border-[#4A4A48]/60 py-2.5 text-[15px] text-[#B4B2A9]/70 outline-none font-light"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-4 pt-4">
                            <label className="font-serif italic text-[15px] text-[#B4B2A9] block">Studio Address</label>
                            <input
                              type="text"
                              disabled
                              value="14 Strandgade, 1401 Copenhagen, Denmark"
                              className="w-full bg-transparent border-b border-[#4A4A48]/60 py-2.5 text-[15px] text-[#B4B2A9]/70 outline-none font-light"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="w-full py-24 text-center font-serif font-light text-2xl text-[#B4B2A9] animate-pulse uppercase tracking-[0.2em]">
                  Loading parameters...
                </div>
              )}
            </main>

          </div>

          {/* Inquiry Detail Reader Modal */}
            {viewingInquiry && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6 backdrop-blur-[1px]">
                <div className="bg-[#2E2D2B] rounded-[10px] shadow-lg border-[0.5px] border-[#4A4A48]/60 max-w-4xl w-full p-10 relative space-y-10 text-[#F1EFE8]">
                  
                  <button
                    onClick={() => setViewingInquiry(null)}
                    className="absolute top-8 right-8 text-[#B4B2A9]/70 hover:text-[#F1EFE8] p-1.5 hover:bg-white/5 rounded-full transition-all cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="space-y-2 pb-4 border-b border-[#4A4A48]/40">
                    <span className="text-[12px] uppercase tracking-[0.2em] text-[#FAC775] font-semibold block">Client Inquiry Details</span>
                    <h3 className="font-serif text-2xl text-[#F1EFE8] font-semibold">{viewingInquiry.name}</h3>
                    <a href={`mailto:${viewingInquiry.email}`} className="text-sm text-accent hover:underline font-light">{viewingInquiry.email}</a>
                  </div>

                  <div className="grid grid-cols-2 gap-8 bg-[#1A1A1A]/40 p-6 rounded-[8px] border border-[#4A4A48]/40 text-xs font-mono">
                    <div>
                      <span className="text-[#B4B2A9]/60 uppercase tracking-[0.1em] text-[11px] block font-sans">Project Type</span>
                      <span className="text-[#F1EFE8] font-semibold mt-1 block font-sans">{viewingInquiry.projectType}</span>
                    </div>
                    <div>
                      <span className="text-[#B4B2A9]/60 uppercase tracking-[0.1em] text-[11px] block font-sans">Received Date</span>
                      <span className="text-[#F1EFE8] font-semibold mt-1 block font-sans">
                        {new Date(viewingInquiry.date).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[14px] font-serif italic text-[#F1EFE8]/80 block">Message:</span>
                    <p className="text-base text-[#F1EFE8] font-light leading-[1.8] bg-[#1A1A1A]/30 p-6 border border-[#4A4A48]/30 rounded-[8px] max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
                      {viewingInquiry.message}
                    </p>
                  </div>

                  <div className="flex gap-6 justify-end pt-6 border-t border-[#4A4A48]/40">
                    <button
                      onClick={() => handleDeleteInquiry(viewingInquiry.id)}
                      className="border border-red-500/20 hover:bg-red-500/5 text-red-400 text-[12px] uppercase tracking-[0.2em] font-semibold px-4 py-2.5 rounded-[6px] transition-all cursor-pointer"
                    >
                      Delete Submission
                    </button>
                    <button
                      onClick={() => setViewingInquiry(null)}
                      className="bg-[#BA7517] hover:bg-[#FAC775] text-white text-[12px] uppercase tracking-[0.2em] font-semibold px-5 py-2.5 rounded-[6px] transition-all cursor-pointer border-none"
                    >
                      Done Reading
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

    </div>
  );
}
