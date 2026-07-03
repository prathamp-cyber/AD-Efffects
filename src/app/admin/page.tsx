'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Briefcase, BookOpen, Award, 
  PenSquare, Mail, Plus, Trash2, LogOut, 
  Upload, Download, Eye, EyeOff, ArrowLeft, ArrowRight, 
  AlertCircle, CheckCircle, Edit3, X, Sparkles
} from 'lucide-react';
import type { BlogPost, Project, PressItem, SiteConfig } from '@/data';
import { getGoogleDriveUrl } from '@/lib/firebase';

interface Blog extends BlogPost {
  author?: string;
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
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(false);
  
  // Real-time greeting and clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('Welcome');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      const hrs = now.getHours();
      if (hrs < 12) setGreeting('Good Morning');
      else if (hrs < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);





  // Configuration State
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'story' | 'influence' | 'featured' | 'blogs' | 'inquiries'>('dashboard');
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
    excerpt: '',
    content: '',
    image: ''
  });

  // Inquiry focus modal state
  const [viewingInquiry, setViewingInquiry] = useState<Inquiry | null>(null);

  // Search & Filter state extensions
  const [projectSearch, setProjectSearch] = useState('');
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryTypeFilter, setInquiryTypeFilter] = useState('all');

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
          { id: '1', title: 'The Spatial Purity of Japandi Restraint', date: '2026-06-15', author: 'The AD Efffects', excerpt: 'An editorial exploration of Japanese minimalism combined with Scandinavian functional warmth.', content: 'An editorial exploration of Japanese minimalism combined with Scandinavian functional warmth.', image: '' },
          { id: '2', title: 'Tactiletravertine & Traverses of Passive Illumination', date: '2026-05-24', author: 'The AD Efffects', excerpt: 'How we utilize natural daylight paths alongside raw stone textures to construct durative sanctuaries.', content: 'How we utilize natural daylight paths alongside raw stone textures to construct durative sanctuaries.', image: '' }
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

  // Force login/inspection on every single mount in the background
  useEffect(() => {
    async function clearSessionAndRequireAuth() {
      try {
        // Clear any active session cookie on the server in the background
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignore logout errors
      }
    }
    clearSessionAndRequireAuth();
  }, []);





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
        router.refresh();
        window.dispatchEvent(new Event('site-config-updated'));
        window.localStorage.setItem('site-config-updated-at', Date.now().toString());
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('site-config-updates');
          channel.postMessage({ updatedAt: Date.now() });
          channel.close();
        }
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

  // Compress and convert file to Base64 data URL
  function compressAndConvertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress as JPEG at 0.75 quality to ensure small payload size for database storage
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(e.target?.result as string); // Fallback to raw Base64 if image load fails
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  // File uploading engine
  async function uploadFile(file: File, fieldPath: string): Promise<string | null> {
    setUploadingField(fieldPath);

    try {
      // Instantly compress and convert the image to Base64 in the browser
      const base64Data = await compressAndConvertToBase64(file);
      
      // Convert base64 to Blob
      const byteString = atob(base64Data.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: 'image/jpeg' });
      
      const formData = new FormData();
      // Clean name and replace extension with .jpg
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^/.]+$/, "") + ".jpg";
      formData.append('file', blob, cleanName);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.status === 403) {
        showAlert('warning', 'Server is read-only. Optimizing and saving image directly to the database.');
        return base64Data;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showAlert('error', errorData.error || 'Failed to upload file.');
        return null;
      }

      const data = await res.json();
      return data.url;
    } catch (err) {
      console.error('Image compression or upload failed:', err);
      showAlert('error', 'Failed to process image file.');
      return null;
    } finally {
      setUploadingField(null);
    }
  }

  // Specific file fields handlers
  async function handleFieldImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'story0' | 'story1' | 'influence' | 'projectCover' | 'projectDetail' | 'blogImage') {
    const files = e.target.files;
    if (!files || files.length === 0 || !config) return;

    if (type === 'projectDetail') {
      // Loop through all selected files and upload them
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadFile(file, type);
        if (url) {
          setProjectForm(prev => ({
            ...prev,
            detailImages: [...(prev.detailImages || []), url]
          }));
        }
      }
    } else {
      // Single file fields
      const file = files[0];
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
      } else if (type === 'blogImage') {
        const url = await uploadFile(file, type);
        if (url) {
          setBlogForm(prev => ({ ...prev, image: url }));
        }
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
      description: '',
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
    setProjectForm({ ...project, description: project.description || '' });
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
      excerpt: '',
      content: '',
      image: ''
    });
    setEditingBlog({ id: nextId } as Blog);
  }

  function handleStartEditBlog(blog: Blog) {
    setIsNewBlog(false);
    setBlogForm({ ...blog });
    setEditingBlog(blog);
  }

  function handleSaveBlogForm() {
    if (!blogForm.title || !blogForm.excerpt || !blogForm.content) {
      showAlert('error', 'Title, summary excerpt, and full article body are required.');
      return;
    }

    const updatedBlogs = [...blogs];
    if (isNewBlog) {
      updatedBlogs.push({
        ...(blogForm as Blog),
        content: blogForm.content || blogForm.excerpt || '',
        image: blogForm.image || ''
      });
    } else {
      const idx = updatedBlogs.findIndex(b => b.id === blogForm.id);
      if (idx !== -1) {
        updatedBlogs[idx] = {
          ...updatedBlogs[idx],
          ...(blogForm as Blog),
          content: blogForm.content || blogForm.excerpt || '',
          image: blogForm.image || updatedBlogs[idx].image || ''
        };
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
      { 
        id: nextId, 
        title: 'New Press Title', 
        subtitle: 'Subheading/Project', 
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        link: 'https://instagram.com/' 
      }
    ];
    const updatedConfig = { ...config, press: updatedPress };
    setConfig(updatedConfig);
    handleSaveConfig(updatedConfig);
  }

  function handleUpdatePressItem(id: string, field: 'title' | 'subtitle' | 'image' | 'link', value: string) {
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
      const res = await fetch(`/api/inquiries?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
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
      default: return 'Control Center';
    }
  };

  // Auth Loading
  if (isAuthenticated === null) {
    return (
      <div className="w-full min-h-screen bg-background flex flex-col items-center justify-center transition-colors duration-300">
        <div className="text-center font-cormorant font-light text-2xl tracking-[0.2em] uppercase text-accent animate-pulse">
          Verifying Session...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell w-full h-screen bg-[#121212] text-[#FAF9F7] font-sans antialiased selection:bg-accent selection:text-white flex gap-[12px] pr-[12px] overflow-hidden">
      
      {/* 1. AUTHENTICATION LOGIN UI */}
      {!isAuthenticated ? (
        <div className="admin-login-screen w-full h-full flex flex-col items-center justify-center px-6 py-12 relative bg-[#0f0e0c] overflow-y-auto">
          {/* Ambient Background Lights */}
          <div className="absolute top-[20%] left-[30%] w-[350px] h-[350px] rounded-full bg-[#BA7517] opacity-[0.06] filter blur-[80px] pointer-events-none animate-pulse-slow" />
          <div className="absolute bottom-[20%] right-[30%] w-[400px] h-[400px] rounded-full bg-[#FAC775] opacity-[0.04] filter blur-[100px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

          {/* Centralized Login Block */}
          <div className="admin-login-stack flex flex-col items-center gap-7 z-10 w-full max-w-[500px] flex-shrink-0">
            {/* Logo header */}
            <div className="flex flex-col items-center select-none text-center">
              <h1 className="font-serif text-[42px] sm:text-[52px] md:text-[60px] font-light tracking-wide text-[#F1EFE8] leading-none">AD-Efffects</h1>
              <div className="w-[100px] h-[1px] bg-gradient-to-r from-transparent via-[#FAC775]/50 to-transparent mt-3.5" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.4em] text-[#FAC775] font-semibold block mt-3.5 font-sans">
                <span className="mr-[-0.4em]">STUDIO ADMINISTRATION</span>
              </span>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="admin-login-card w-full glass-panel p-10 sm:p-12 border border-[#BA7517]/25 rounded-[12px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-[#F1EFE8] gold-border-glow"
            >
              <form onSubmit={handleLogin} className="flex flex-col gap-6 w-full">
                  {loginError && (
                    <div className="p-4 bg-red-950/20 border border-red-800/40 text-red-400 text-xs sm:text-sm font-light rounded-[6px] flex items-center justify-center gap-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                      <span className="font-sans text-center">{loginError}</span>
                    </div>
                  )}

                  {/* Username Input */}
                  <div className="flex flex-col gap-2 relative group">
                    <label className="font-serif italic text-[14px] sm:text-[15px] text-[#B4B2A9] group-focus-within:text-[#FAC775] block text-center transition-colors duration-300">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#FAC775] py-2.5 text-[15px] sm:text-[16px] text-[#F1EFE8] placeholder:italic placeholder:text-[#888780]/30 text-center outline-none transition-all duration-300 font-sans font-light"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="flex flex-col gap-2 relative group">
                    <label className="font-serif italic text-[14px] sm:text-[15px] text-[#B4B2A9] group-focus-within:text-[#FAC775] block text-center transition-colors duration-300">
                      Password
                    </label>
                    <div className="relative w-full">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#FAC775] py-2.5 pr-10 text-[15px] sm:text-[16px] text-[#F1EFE8] placeholder:italic placeholder:text-[#888780]/30 text-center outline-none transition-all duration-300 font-sans font-light"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#888780] hover:text-[#FAC775] transition-colors duration-300 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 stroke-[1.5]" /> : <Eye className="w-4 h-4 stroke-[1.5]" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmittingLogin}
                      className="w-full bg-[#BA7517] text-white py-4.5 text-[13px] sm:text-[14px] uppercase tracking-[0.25em] font-sans font-semibold rounded-[6px] hover:bg-[#FAC775] hover:text-[#1a1a1a] shadow-[0_4px_20px_rgba(186,117,23,0.15)] hover:shadow-[0_4px_25px_rgba(250,199,117,0.3)] transition-all duration-500 cursor-pointer disabled:opacity-50 select-none text-center block"
                    >
                      {isSubmittingLogin ? 'VERIFYING...' : 'ENTER DASHBOARD'}
                    </button>
                  </div>
                </form>
            </motion.div>
          </div>
        </div>
      ) : (
        <>
          {/* 2. AUTHENTICATED ADMIN DASHBOARD PANEL */}
          {/* Fixed Left Sidebar (280px wide for layout balance) */}
          <aside className="w-[280px] h-full bg-[#181715] text-white flex flex-col justify-between flex-shrink-0 select-none z-30 border-r border-[#BA7517]/15 shadow-[10px_0_40px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
              {/* Logo / Site Title Header Box */}
              <div className="h-[88px] w-full border-b border-[#BA7517]/15 flex flex-col justify-center items-center bg-[#181715] select-none px-6">
                <span className="font-serif text-[24px] font-light text-[#F1EFE8] tracking-wider leading-none mb-1.5 hover:text-[#FAC775] transition-colors duration-300 cursor-pointer">
                  AD-Efffects
                </span>
                <span className="text-[9px] uppercase tracking-[0.35em] text-[#888780] font-sans font-bold">
                  <span className="mr-[-0.35em]">ADMINISTRATION</span>
                </span>
              </div>

              {/* Navigation list with animated slide highlights */}
              <div className="w-full pt-8 flex-1">
                <nav className="flex flex-col gap-[14px]">
                  {[
                    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
                    { id: 'portfolio', label: 'PORTFOLIO', icon: Briefcase },
                    { id: 'story', label: 'OUR STORY', icon: BookOpen },
                    { id: 'influence', label: 'OUR INFLUENCE', icon: Sparkles, toggleKey: 'hideOurInfluence' as const },
                    { id: 'featured', label: 'FEATURED', icon: Award },
                    { id: 'blogs', label: 'BLOG POSTS', icon: PenSquare, toggleKey: 'hideBlog' as const },
                    { id: 'inquiries', label: 'INQUIRIES', icon: Mail, badge: inquiries.length }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const hasToggle = 'toggleKey' in item && item.toggleKey && config;
                    const isHidden = hasToggle ? config[item.toggleKey] : false;
                    const ToggleIcon = isHidden ? EyeOff : Eye;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { 
                          setEditingProject(null); 
                          setEditingBlog(null); 
                          setActiveTab(item.id as typeof activeTab); 
                        }}
                        className="relative w-full flex items-center justify-between px-6 py-4 text-[14px] font-sans uppercase tracking-[0.2em] font-semibold transition-all duration-300 cursor-pointer group animate-none select-none"
                      >
                        {/* Active background slide indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeTabIndicator"
                            className="absolute inset-0 bg-[#262522] border-l-2 border-[#FAC775] z-0"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        
                        <div className="flex items-center gap-[16px] z-10">
                          <Icon className={`w-[20px] h-[20px] stroke-[1.5] transition-colors duration-300 ${isActive ? 'text-[#FAC775]' : 'text-[#888780] group-hover:text-[#F1EFE8]'}`} />
                          <span className={`transition-colors duration-300 ${isActive ? 'text-[#F1EFE8]' : 'text-[#888780] group-hover:text-[#F1EFE8]'}`}>{item.label}</span>
                        </div>
                        
                        {item.badge && item.badge > 0 ? (
                          <span className="z-10 bg-[#FAC775]/10 text-[#FAC775] border border-[#FAC775]/20 text-[11px] px-2 py-0.5 rounded font-sans font-bold transition-all group-hover:bg-[#FAC775]/25">
                            {item.badge}
                          </span>
                        ) : null}

                        {hasToggle && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!config || !item.toggleKey) return;
                              const newConfig = {
                                ...config,
                                [item.toggleKey]: !config[item.toggleKey]
                              };
                              setConfig(newConfig);
                              await handleSaveConfig(newConfig);
                            }}
                            className={`z-10 p-1.5 rounded hover:bg-[#32302C] transition-all cursor-pointer border-none ${isHidden ? 'text-[#888780] hover:text-[#FAC775]' : 'text-[#FAC775] hover:text-[#FAC775]/70'}`}
                            title={isHidden ? 'Hidden on website. Click to make visible.' : 'Visible on website. Click to hide.'}
                          >
                            <ToggleIcon className="w-4 h-4 stroke-[1.75]" />
                          </button>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar Footer (Settings and Logout) */}
              <div className="w-full py-6 flex flex-col gap-[14px] border-t border-[#BA7517]/15 bg-[#141311]">


                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-[16px] px-6 py-4 text-[14px] font-sans uppercase tracking-[0.2em] font-semibold text-red-400/80 hover:text-red-400 hover:bg-red-950/15 border-l-2 border-transparent transition-all duration-300 cursor-pointer"
                >
                  <LogOut className="w-[20px] h-[20px] stroke-[1.5]" /> 
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Right Main Content Area Container */}
          <div className="admin-workspace flex-1 flex flex-col h-full overflow-hidden bg-[#0f0e0c]">
            
            {/* Top Header Bar (88px height) */}
            <div className="h-[88px] bg-[#141311] border-b border-[#BA7517]/15 flex justify-between items-center px-10 flex-shrink-0 z-20 select-none">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[12px] font-sans font-bold uppercase tracking-[0.2em] text-[#FAC775]">
                  {getTabLabel()}
                </span>
                <span className="text-[11px] font-sans text-[#888780] font-light">
                  {greeting}, Admin &bull; <span className="font-mono text-[#F1EFE8]/70">{currentTime}</span>
                </span>
              </div>

              {/* Profile Block */}
              <div className="flex items-center gap-6">
                <a 
                  href="/" 
                  target="_blank" 
                  className="text-[11px] uppercase tracking-[0.2em] text-[#B4B2A9] hover:text-[#FAC775] font-semibold transition-all flex items-center gap-1.5 hover:scale-105 bg-[#1e1c19] border border-[#BA7517]/15 px-3 py-1.5 rounded-[4px]"
                >
                  <Eye className="w-3.5 h-3.5 stroke-[1.5]" /> View Live
                </a>
                <div className="flex items-center gap-3 border-l border-[#BA7517]/15 pl-6">
                  <span className="text-[13px] text-[#F1EFE8]/90 font-sans font-medium tracking-wide">Admin</span>
                  <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-[#FAC775] to-[#BA7517] flex items-center justify-center text-[13px] text-[#141311] font-bold select-none text-center shadow-[0_0_12px_rgba(250,199,117,0.2)]">
                    A
                  </div>
                </div>
              </div>
            </div>

            {/* Main content viewport, scrollable independently */}
            <main className="flex-1 overflow-y-auto p-8 md:p-12 xl:p-14 space-y-12">
              
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
                <div className="admin-content transition-all">
                  
                  {/* VIEW 1: DASHBOARD TAB */}
                  {activeTab === 'dashboard' && (
                    <div className="flex flex-col gap-10">
                      {/* Premium greeting hero block */}
                      <div className="glass-panel p-8 rounded-[12px] border border-[#BA7517]/25 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.4)] mb-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#BA7517]/5 via-transparent to-transparent pointer-events-none" />
                        <div className="space-y-2 z-10">
                          <h2 className="font-serif text-3xl font-light tracking-wide text-[#F1EFE8]">
                            Control Center Portal
                          </h2>
                          <p className="text-[13px] text-[#B4B2A9] font-sans font-light max-w-xl leading-relaxed">
                            Welcome back, administrator. Here is a summary of the site metrics and recent activity. You have <span className="text-[#FAC775] font-semibold">{inquiries.length} client inquiries</span> pending evaluation in the inbox.
                          </p>
                        </div>
                        <div className="flex gap-4 z-10">
                          <button 
                            onClick={() => setActiveTab('inquiries')}
                            className="bg-[#BA7517] hover:bg-[#FAC775] text-white hover:text-[#141311] text-[11px] uppercase tracking-[0.2em] font-sans font-bold px-5 py-3.5 rounded-[4px] shadow-[0_4px_12px_rgba(186,117,23,0.15)] hover:shadow-[0_4px_15px_rgba(250,199,117,0.35)] transition-all duration-300 cursor-pointer"
                          >
                            Manage Inbox
                          </button>
                        </div>
                      </div>

                      {/* Stats widgets */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {[
                          { label: 'Active Projects', value: config.projects.length, sub: 'Portfolio items catalogued', icon: Briefcase, color: '#FAC775' },
                          { label: 'Total Inquiries', value: inquiries.length, sub: 'Pending response inbox', icon: Mail, color: '#BA7517', highlight: inquiries.length > 0 },
                          { label: 'Blog Articles', value: blogs.length, sub: 'Editorial publications', icon: BookOpen, color: '#FAC775' }
                        ].map((stat, idx) => {
                          const Icon = stat.icon;
                          return (
                            <div 
                              key={idx} 
                              className={`glass-panel glass-panel-hover p-8 rounded-[12px] text-[#F1EFE8] flex items-center justify-between border ${stat.highlight ? 'border-[#FAC775]/45 shadow-[0_0_20px_rgba(250,199,117,0.15)]' : 'border-[#BA7517]/15'}`}
                            >
                              <div className="space-y-2">
                                <p className="text-[12px] text-[#888780] tracking-[0.1em] font-sans font-bold uppercase m-0">
                                  {stat.label}
                                </p>
                                <p className="text-[36px] font-light text-[#F1EFE8] leading-none m-0 font-serif">
                                  {stat.value}
                                </p>
                                <p className="text-[11px] text-[#888780] font-sans font-light m-0">
                                  {stat.sub}
                                </p>
                              </div>
                              <div className="w-12 h-12 rounded-full bg-[#1e1c19] border border-[#BA7517]/15 flex items-center justify-center text-center shadow-[0_0_15px_rgba(186,117,23,0.05)]">
                                <Icon className="w-5 h-5 stroke-[1.5]" style={{ color: stat.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Interactive Activity Chart */}
                      <div className="glass-panel p-8 rounded-[12px] border border-[#BA7517]/15 shadow-[0_15px_30px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#BA7517]/15">
                          <div className="flex flex-col gap-1">
                            <span className="text-[12px] uppercase tracking-[0.25em] text-[#FAC775] font-bold">STUDIO ENGAGEMENT</span>
                            <span className="text-[11px] text-[#888780] font-light">Client interactions and inquiries over the last 6 months</span>
                          </div>
                          <div className="flex items-center gap-2 bg-[#1e1c19] border border-[#BA7517]/15 p-1 rounded select-none">
                            <span className="text-[10px] uppercase tracking-[0.15em] font-sans px-3 py-1.5 text-[#FAC775] bg-[#262522] rounded font-bold">Inquiries</span>
                            <span className="text-[10px] uppercase tracking-[0.15em] font-sans px-3 py-1.5 text-[#888780] font-bold">Views</span>
                          </div>
                        </div>

                        {/* SVG Line Chart */}
                        <div className="h-[220px] w-full relative pt-2">
                          <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                            <defs>
                              {/* Fill Gradient */}
                              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FAC775" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#FAC775" stopOpacity="0" />
                              </linearGradient>
                              {/* Stroke Gradient */}
                              <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#BA7517" />
                                <stop offset="50%" stopColor="#FAC775" />
                                <stop offset="100%" stopColor="#BA7517" />
                              </linearGradient>
                            </defs>
                            
                            {/* Gridlines */}
                            <line x1="0" y1="40" x2="600" y2="40" stroke="#262522" strokeWidth="1" strokeDasharray="3,3" />
                            <line x1="0" y1="100" x2="600" y2="100" stroke="#262522" strokeWidth="1" strokeDasharray="3,3" />
                            <line x1="0" y1="160" x2="600" y2="160" stroke="#262522" strokeWidth="1" strokeDasharray="3,3" />
                            
                            {/* Curved Chart Path */}
                            <path
                              d="M 20 170 Q 78 150 136 130 T 252 150 T 368 80 T 484 100 T 580 45"
                              fill="none"
                              stroke="url(#strokeGradient)"
                              strokeWidth="3"
                              className="chart-path-glow"
                            />
                            
                            {/* Gradient Fill under Path */}
                            <path
                              d="M 20 170 Q 78 150 136 130 T 252 150 T 368 80 T 484 100 T 580 45 L 580 200 L 20 200 Z"
                              fill="url(#chartGradient)"
                            />
                            
                            {/* Data points */}
                            <circle cx="20" cy="170" r="5" fill="#141311" stroke="#BA7517" strokeWidth="2.5" />
                            <circle cx="136" cy="130" r="5" fill="#141311" stroke="#FAC775" strokeWidth="2.5" />
                            <circle cx="252" cy="150" r="5" fill="#141311" stroke="#FAC775" strokeWidth="2.5" />
                            <circle cx="368" cy="80" r="5" fill="#141311" stroke="#FAC775" strokeWidth="2.5" />
                            <circle cx="484" cy="100" r="5" fill="#141311" stroke="#FAC775" strokeWidth="2.5" />
                            <circle cx="580" cy="45" r="5" fill="#141311" stroke="#BA7517" strokeWidth="2.5" />
                          </svg>
                        </div>
                        
                        {/* Months labels */}
                        <div className="flex justify-between text-[10px] text-[#888780] font-sans font-bold px-4 mt-4 select-none">
                          <span>JAN</span>
                          <span>FEB</span>
                          <span>MAR</span>
                          <span>APR</span>
                          <span>MAY</span>
                          <span>JUN</span>
                        </div>
                      </div>

                      {/* Recent Inquiries List Widget Card */}
                      <div className="glass-panel p-8 rounded-[12px] border border-[#BA7517]/15 text-[#F1EFE8] shadow-[0_15px_30px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#BA7517]/15">
                          <div className="flex flex-col gap-1">
                            <span className="text-[12px] tracking-[0.25em] text-[#FAC775] uppercase font-sans font-bold">
                              LATEST INCOMING INQUIRIES
                            </span>
                            <span className="text-[11px] text-[#888780] font-light">Action required for incoming client briefs</span>
                          </div>
                          <button 
                            onClick={() => setActiveTab('inquiries')}
                            className="text-[11px] uppercase tracking-[0.15em] text-[#FAC775] border border-[#BA7517]/35 px-4 py-2 rounded-[4px] hover:bg-[#FAC775] hover:text-[#141311] transition-all duration-300 font-sans font-bold cursor-pointer"
                          >
                            View all
                          </button>
                        </div>

                        <div className="overflow-x-auto w-full">
                          <table className="w-full text-sm border-collapse text-left">
                            <thead>
                              <tr className="border-b border-[#BA7517]/10">
                                <th className="pb-3 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] w-[35%]">NAME</th>
                                <th className="pb-3 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] w-[25%]">PROJECT TYPE</th>
                                <th className="pb-3 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] w-[25%]">DATE</th>
                                <th className="pb-3 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-right w-[15%]">ACTION</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#BA7517]/5 font-light">
                              {inquiries.slice(0, 3).map((inq) => (
                                <tr 
                                  key={inq.id} 
                                  onClick={() => setViewingInquiry(inq)}
                                  className="cursor-pointer hover:bg-[#1e1c19]/40 transition-colors group"
                                >
                                  <td className="py-4 text-[#F1EFE8] font-sans font-medium">{inq.name}</td>
                                  <td className="py-4">
                                    <span className="text-[10px] uppercase tracking-[0.1em] bg-[#BA7517]/10 text-[#FAC775] border border-[#BA7517]/20 px-2 py-0.5 rounded font-sans font-semibold">
                                      {inq.projectType}
                                    </span>
                                  </td>
                                  <td className="py-4 text-[#B4B2A9] font-sans text-xs">
                                    {new Date(inq.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </td>
                                  <td className="py-4 text-right">
                                    <div className="inline-flex items-center text-[#B4B2A9] group-hover:text-[#FAC775] transition-colors duration-300">
                                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                                    </div>
                                  </td>
                                </tr>
                              ))}

                              {inquiries.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="py-12 text-center text-xs text-[#888780]/70 font-sans font-light">
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
                        <div className="admin-edit-panel bg-[#2E2D2B] border-[0.5px] border-[#4A4A48]/30 rounded-[10px] p-8 space-y-8 w-full text-[#F1EFE8] min-h-[600px]">
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

                          <div className="space-y-12">
                            {/* Title & Category */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-4">
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

                              <div className="space-y-4">
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

                            {/* Description */}
                            <div className="space-y-4">
                              <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Project Description</label>
                              <textarea
                                rows={3}
                                value={projectForm.description || ''}
                                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                                placeholder="Enter project description..."
                                className="w-full bg-[#1e1c19]/30 border border-[#4A4A48] focus:border-[#BA7517] p-4 rounded-[6px] text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-light resize-y min-h-[80px]"
                              />
                            </div>

                            {/* Location, Year, Size */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                              <div className="space-y-4">
                                <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Location</label>
                                <input
                                  type="text"
                                  value={projectForm.location || ''}
                                  onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
                                  placeholder="e.g. Bengaluru, India"
                                  className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-light"
                                />
                              </div>

                              <div className="space-y-4">
                                <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Year</label>
                                <input
                                  type="text"
                                  value={projectForm.year || ''}
                                  onChange={(e) => setProjectForm({ ...projectForm, year: e.target.value })}
                                  placeholder="e.g. 2024"
                                  className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-light"
                                />
                              </div>

                              <div className="space-y-4">
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
                            <div className="space-y-8 pt-10 border-t border-[#4A4A48]/40">
                              <label className="font-serif italic text-[15px] md:text-[16px] text-[#F1EFE8] block">Cover Photo Image</label>
                              <div className="flex flex-col xl:flex-row gap-6 xl:items-end">
                                <div className="flex-1 w-full">
                                  <input
                                    type="text"
                                    value={projectForm.image || ''}
                                    onChange={(e) => setProjectForm({ ...projectForm, image: e.target.value })}
                                    placeholder="Paste cover photo URL..."
                                    className="w-full bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-light"
                                  />
                                </div>
                                <div className="relative w-full xl:w-auto">
                                  <input
                                    type="file"
                                    id="upload-cover"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={(e) => handleFieldImageUpload(e, 'projectCover')}
                                    className="hidden"
                                    disabled={uploadingField !== null}
                                  />
                                  <label 
                                    htmlFor="upload-cover"
                                    className="w-full xl:w-auto min-h-[52px] border border-[#4A4A48] hover:border-[#BA7517] hover:text-[#FAC775] text-[12px] uppercase tracking-[0.2em] font-semibold px-6 py-4 rounded-[6px] transition-all cursor-pointer flex items-center justify-center gap-2 bg-[#2E2D2B] select-none whitespace-nowrap"
                                  >
                                    <Upload className="w-3.5 h-3.5" /> 
                                    {uploadingField === 'projectCover' ? 'Uploading...' : 'Upload Cover File'}
                                  </label>
                                </div>
                              </div>

                              {projectForm.image && (
                                <div className="w-36 aspect-[3/4] border border-[#4A4A48]/55 rounded-[6px] overflow-hidden bg-black/10 mt-4">
                                  <img src={getGoogleDriveUrl(projectForm.image)} className="w-full h-full object-cover" alt="Cover preview" />
                                </div>
                              )}
                            </div>

                            {/* Gallery Details */}
                            <div className="space-y-10 pt-10 border-t border-[#4A4A48]/40">
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-5 sm:items-center">
                                <div>
                                  <h4 className="text-[13px] uppercase tracking-[0.2em] font-semibold text-[#FAC775] block">Detail Photos (Lightbox Gallery)</h4>
                                  <p className="text-[13px] text-[#B4B2A9]/75 font-light mt-0.5">Upload gallery photos or add links below.</p>
                                </div>
                                <div className="relative">
                                  <input
                                    type="file"
                                    id="upload-detail"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={(e) => handleFieldImageUpload(e, 'projectDetail')}
                                    className="hidden"
                                    multiple
                                    disabled={uploadingField !== null}
                                  />
                                  <label 
                                    htmlFor="upload-detail"
                                    className="min-h-[48px] border border-[#4A4A48] hover:border-[#BA7517] hover:text-[#FAC775] text-[12px] uppercase tracking-[0.2em] font-semibold px-6 py-3.5 rounded-[6px] transition-all cursor-pointer inline-flex items-center justify-center gap-2 bg-[#2E2D2B] select-none whitespace-nowrap"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> 
                                    {uploadingField === 'projectDetail' ? 'Uploading...' : 'Upload Files'}
                                  </label>
                                </div>
                              </div>

                              <div className="flex flex-col lg:flex-row gap-5 lg:items-end bg-[#1A1A1A]/40 p-5 rounded-[8px] border border-[#4A4A48]/30">
                                <input
                                  type="text"
                                  id="manual-detail-url"
                                  placeholder="Paste links/Drive URLs (separate multiple with commas or newlines)..."
                                  className="flex-1 bg-transparent border-b border-[#4A4A48] focus:border-[#BA7517] py-2 text-[15px] outline-none font-light transition-all text-[#F1EFE8]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById('manual-detail-url') as HTMLInputElement;
                                    if (input && input.value.trim()) {
                                      // Split by commas or newlines and trim each item
                                      const items = input.value.split(/,|\n/).map(item => item.trim()).filter(Boolean);
                                      // Resolve Google Drive sharing links to direct images
                                      const resolvedUrls = items.map(item => getGoogleDriveUrl(item));
                                      
                                      setProjectForm(prev => ({
                                        ...prev,
                                        detailImages: [...(prev.detailImages || []), ...resolvedUrls]
                                      }));
                                      input.value = '';
                                    }
                                  }}
                                  className="min-h-[48px] border border-[#F1EFE8] hover:bg-[#F1EFE8] hover:text-[#1A1A1A] text-[#F1EFE8] text-[12px] uppercase tracking-[0.15em] font-semibold px-6 py-3.5 rounded-[6px] transition-all cursor-pointer whitespace-nowrap"
                                >
                                  Add URL
                                </button>
                              </div>

                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                {(projectForm.detailImages || []).map((img, idx) => (
                                  <div key={idx} className="relative group aspect-[3/4] border border-[#4A4A48]/40 rounded-[6px] overflow-hidden bg-black/20">
                                    <img src={getGoogleDriveUrl(img)} className="w-full h-full object-cover" alt="Detail preview" />
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

                          <div className="flex flex-col sm:flex-row sm:justify-end gap-4 sm:gap-6 border-t border-[#4A4A48]/45 pt-10 mt-12">
                            <button
                              type="button"
                              onClick={() => setEditingProject(null)}
                              className="min-h-[52px] border border-[#4A4A48] hover:border-accent text-[#B4B2A9] hover:text-[#F1EFE8] bg-transparent text-[12px] uppercase tracking-[0.2em] px-8 py-4 rounded-[6px] transition-all cursor-pointer font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveProjectForm}
                              className="min-h-[52px] bg-[#BA7517] hover:bg-[#FAC775] text-white border border-[#BA7517] hover:border-[#FAC775] text-[12px] uppercase tracking-[0.2em] font-semibold px-9 py-4 rounded-[6px] transition-all duration-300 cursor-pointer"
                            >
                              Save Project
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Portfolio Items List Table */
                        <div className="glass-panel p-8 rounded-[12px] border border-[#BA7517]/15 space-y-6 text-[#F1EFE8] min-h-[600px] shadow-[0_15px_30px_rgba(0,0,0,0.3)]">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#BA7517]/15">
                            <div className="space-y-1">
                              <span className="text-[12px] tracking-[0.25em] uppercase text-[#FAC775] font-bold block">
                                ACTIVE PORTFOLIO ITEMS
                              </span>
                              <span className="text-[11px] text-[#888780] font-light font-sans">
                                Currently displaying {config.projects.filter(p => p.title.toLowerCase().includes(projectSearch.toLowerCase()) || p.category.toLowerCase().includes(projectSearch.toLowerCase()) || p.location.toLowerCase().includes(projectSearch.toLowerCase())).length} of {config.projects.length} catalog items
                              </span>
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                              {/* Search Input */}
                              <input
                                type="text"
                                placeholder="Search catalog..."
                                value={projectSearch}
                                onChange={(e) => setProjectSearch(e.target.value)}
                                className="bg-[#1e1c19] border border-[#BA7517]/25 text-[#F1EFE8] placeholder:italic placeholder:text-[#888780]/40 text-xs px-4 py-2.5 rounded-[4px] outline-none focus:border-[#FAC775] transition-colors w-full sm:w-[220px]"
                              />
                              <button
                                onClick={handleStartAddProject}
                                className="bg-[#BA7517] hover:bg-[#FAC775] text-white hover:text-[#141311] text-[11px] uppercase tracking-[0.2em] font-sans font-bold px-4 py-2.5 rounded-[4px] transition-all flex-shrink-0 flex items-center gap-1.5 shadow-[0_4px_12px_rgba(186,117,23,0.15)] cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Project
                              </button>
                            </div>
                          </div>

                          <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-[#BA7517]/10">
                                  <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] w-20">Cover</th>
                                  <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-left">Project Details</th>
                                  <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-left">Location</th>
                                  <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-center w-24">Year</th>
                                  <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-center w-28">Dimensions</th>
                                  <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-right w-24">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#BA7517]/5 font-light">
                                {config.projects
                                  .filter(p => 
                                    p.title.toLowerCase().includes(projectSearch.toLowerCase()) || 
                                    p.category.toLowerCase().includes(projectSearch.toLowerCase()) ||
                                    p.location.toLowerCase().includes(projectSearch.toLowerCase())
                                  )
                                  .map((project) => (
                                    <tr key={project.id} className="hover:bg-[#1e1c19]/40 transition-colors group">
                                      <td className="py-6">
                                        <div className="w-10 h-14 bg-black/25 border border-[#BA7517]/15 rounded-[4px] overflow-hidden relative shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                                          <img 
                                            src={getGoogleDriveUrl(project.image)} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                            alt="cover" 
                                          />
                                        </div>
                                      </td>
                                      <td className="py-6 pr-4">
                                        <h4 className="font-serif font-medium text-[#F1EFE8] text-[17px] tracking-wide m-0">{project.title}</h4>
                                        <span className="text-[10px] uppercase tracking-[0.15em] text-[#FAC775] font-sans font-bold mt-1 block">{project.category}</span>
                                      </td>
                                      <td className="py-6 text-[#B4B2A9] font-sans text-sm">{project.location}</td>
                                      <td className="py-6 text-center font-mono text-xs text-[#B4B2A9]">{project.year}</td>
                                      <td className="py-6 text-center text-[#B4B2A9] font-sans text-sm">{project.size || 'N/A'}</td>
                                      <td className="py-6 text-right">
                                        <div className="flex gap-4 justify-end items-center opacity-65 group-hover:opacity-100 transition-opacity duration-300">
                                          <button
                                            onClick={() => handleStartEditProject(project)}
                                            className="text-[#B4B2A9] hover:text-[#FAC775] hover:scale-110 transition-all cursor-pointer p-1"
                                            title="Edit Project"
                                          >
                                            <Edit3 className="w-4 h-4 stroke-[1.5]" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteProject(project.id)}
                                            className="text-[#B4B2A9] hover:text-red-400 hover:scale-110 transition-all cursor-pointer p-1"
                                            title="Delete Project"
                                          >
                                            <Trash2 className="w-4 h-4 stroke-[1.5]" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}

                                {config.projects.filter(p => 
                                  p.title.toLowerCase().includes(projectSearch.toLowerCase()) || 
                                  p.category.toLowerCase().includes(projectSearch.toLowerCase()) ||
                                  p.location.toLowerCase().includes(projectSearch.toLowerCase())
                                ).length === 0 && (
                                  <tr>
                                    <td colSpan={6} className="py-24 text-center text-[#B4B2A9]/40 font-light text-[17px] font-sans">
                                      No portfolio items found matching your search.
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
                    <div className="glass-panel p-8 rounded-[12px] border border-[#BA7517]/15 space-y-8 w-full text-[#F1EFE8] min-h-[600px] shadow-[0_15px_30px_rgba(0,0,0,0.3)] animate-fadeIn">
                      <div className="pb-4 border-b border-[#BA7517]/15">
                        <span className="text-[12px] tracking-[0.25em] uppercase text-[#FAC775] font-bold block">
                          STORY PHILOSOPHY COPY
                        </span>
                      </div>

                      <div className="space-y-8">
                        {/* Brand Statement */}
                        <div className="space-y-3">
                          <label className="font-serif italic text-[15px] md:text-[16px] text-[#FAC775] block">Brand Statement (Large intro on homepage)</label>
                          <textarea
                            rows={4}
                            value={config.brandStatement}
                            onChange={(e) => setConfig({ ...config, brandStatement: e.target.value })}
                            className="w-full bg-[#1e1c19]/50 border border-[#BA7517]/15 focus:border-[#FAC775] p-4 rounded-[6px] text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-sans font-light resize-y min-h-[100px] leading-relaxed"
                          />
                        </div>

                        {/* Heading */}
                        <div className="space-y-3 pt-6 border-t border-[#BA7517]/10">
                          <label className="font-serif italic text-[15px] md:text-[16px] text-[#FAC775] block">Philosophy / Story Section Title</label>
                          <input
                            type="text"
                            value={config.story.title}
                            onChange={(e) => setConfig({
                              ...config,
                              story: { ...config.story, title: e.target.value }
                            })}
                            className="w-full bg-transparent border-b border-[#BA7517]/25 focus:border-[#FAC775] py-3 text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-sans font-light"
                          />
                        </div>

                        {/* Paragraphs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-3">
                            <label className="font-serif italic text-[15px] md:text-[16px] text-[#FAC775] block">Story Paragraph 1</label>
                            <textarea
                              rows={5}
                              value={config.story.paragraphs[0] || ''}
                              onChange={(e) => {
                                const paragraphs = [...config.story.paragraphs];
                                paragraphs[0] = e.target.value;
                                setConfig({ ...config, story: { ...config.story, paragraphs } });
                              }}
                              className="w-full bg-[#1e1c19]/50 border border-[#BA7517]/15 focus:border-[#FAC775] p-4 rounded-[6px] text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-sans font-light resize-y min-h-[120px] leading-relaxed"
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="font-serif italic text-[15px] md:text-[16px] text-[#FAC775] block">Story Paragraph 2</label>
                            <textarea
                              rows={5}
                              value={config.story.paragraphs[1] || ''}
                              onChange={(e) => {
                                const paragraphs = [...config.story.paragraphs];
                                paragraphs[1] = e.target.value;
                                setConfig({ ...config, story: { ...config.story, paragraphs } });
                              }}
                              className="w-full bg-[#1e1c19]/50 border border-[#BA7517]/15 focus:border-[#FAC775] p-4 rounded-[6px] text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-sans font-light resize-y min-h-[120px] leading-relaxed"
                            />
                          </div>
                        </div>

                        {/* Story Images */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-[#BA7517]/10">
                          
                          {/* Image Left */}
                          <div className="space-y-4 bg-[#1e1c19]/30 p-6 rounded-[8px] border border-[#BA7517]/15">
                            <span className="text-[12px] uppercase tracking-[0.1em] text-[#FAC775] font-bold block">Editorial Image Left (Stone Texture)</span>
                            <input
                              type="text"
                              value={config.story.images[0] || ''}
                              onChange={(e) => {
                                const images = [...config.story.images];
                                images[0] = e.target.value;
                                setConfig({ ...config, story: { ...config.story, images } });
                              }}
                              className="w-full bg-transparent border-b border-[#BA7517]/25 focus:border-[#FAC775] py-2.5 text-sm text-[#F1EFE8] outline-none font-sans font-light"
                            />
                            <div className="flex justify-between items-center gap-4 pt-1">
                              <div className="relative">
                                <input
                                  type="file"
                                  id="story-img-left"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  onChange={(e) => handleFieldImageUpload(e, 'story0')}
                                  className="hidden"
                                  disabled={uploadingField !== null}
                                />
                                <label htmlFor="story-img-left" className="border border-[#BA7517]/25 hover:border-[#FAC775] hover:text-[#141311] hover:bg-[#FAC775] text-[11px] uppercase tracking-[0.15em] font-sans font-bold px-4 py-2.5 rounded-[4px] transition-all cursor-pointer inline-flex items-center gap-1.5 bg-[#262522] select-none">
                                  <Upload className="w-3.5 h-3.5" /> 
                                  {uploadingField === 'story0' ? 'Uploading...' : 'Upload File'}
                                </label>
                              </div>
                              {config.story.images[0] && (
                                <img src={getGoogleDriveUrl(config.story.images[0])} className="w-12 h-16 object-cover border border-[#BA7517]/25 rounded-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.3)]" alt="left story" />
                              )}
                            </div>
                          </div>

                          {/* Image Right */}
                          <div className="space-y-4 bg-[#1e1c19]/30 p-6 rounded-[8px] border border-[#BA7517]/15">
                            <span className="text-[12px] uppercase tracking-[0.1em] text-[#FAC775] font-bold block">Editorial Image Right (Interior Scene)</span>
                            <input
                              type="text"
                              value={config.story.images[1] || ''}
                              onChange={(e) => {
                                const images = [...config.story.images];
                                images[1] = e.target.value;
                                setConfig({ ...config, story: { ...config.story, images } });
                              }}
                              className="w-full bg-transparent border-b border-[#BA7517]/25 focus:border-[#FAC775] py-2.5 text-sm text-[#F1EFE8] outline-none font-sans font-light"
                            />
                            <div className="flex justify-between items-center gap-4 pt-1">
                              <div className="relative">
                                <input
                                  type="file"
                                  id="story-img-right"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  onChange={(e) => handleFieldImageUpload(e, 'story1')}
                                  className="hidden"
                                  disabled={uploadingField !== null}
                                />
                                <label htmlFor="story-img-right" className="border border-[#BA7517]/25 hover:border-[#FAC775] hover:text-[#141311] hover:bg-[#FAC775] text-[11px] uppercase tracking-[0.15em] font-sans font-bold px-4 py-2.5 rounded-[4px] transition-all cursor-pointer inline-flex items-center gap-1.5 bg-[#262522] select-none">
                                  <Upload className="w-3.5 h-3.5" /> 
                                  {uploadingField === 'story1' ? 'Uploading...' : 'Upload File'}
                                </label>
                              </div>
                              {config.story.images[1] && (
                                <img src={getGoogleDriveUrl(config.story.images[1])} className="w-12 h-16 object-cover border border-[#BA7517]/25 rounded-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.3)]" alt="right story" />
                              )}
                            </div>
                          </div>

                        </div>
                      </div>

                      <div className="flex justify-end pt-8 pr-20 lg:pr-24 border-t border-[#BA7517]/15 mt-6">
                        <button
                          onClick={() => handleSaveConfig()}
                          disabled={savingConfig}
                          className="min-h-[52px] bg-[#BA7517] hover:bg-[#FAC775] text-white hover:text-[#141311] border border-[#BA7517] hover:border-[#FAC775] text-[11px] uppercase tracking-[0.2em] font-sans font-bold px-9 py-4 rounded-[6px] transition-all duration-300 cursor-pointer disabled:opacity-50 shadow-[0_4px_12px_rgba(186,117,23,0.15)] whitespace-nowrap"
                        >
                          {savingConfig ? 'Applying changes...' : 'Save Story Section'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VIEW 3.5: OUR INFLUENCE TAB */}
                  {activeTab === 'influence' && config && (
                    <div className="glass-panel p-8 rounded-[12px] border border-[#BA7517]/15 space-y-8 w-full text-[#F1EFE8] min-h-[600px] shadow-[0_15px_30px_rgba(0,0,0,0.3)] animate-fadeIn">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#BA7517]/15">
                        <div>
                          <span className="text-[12px] tracking-[0.25em] uppercase text-[#FAC775] font-bold block">
                            OUR INFLUENCE SECTION CONFIGURATION
                          </span>
                          <span className="text-xs text-[#888780] font-sans font-light mt-1 block">
                            Manage the inspiration, title, description, and editorial image of the Influence page.
                          </span>
                        </div>
                        
                        {/* Interactive Page Visibility Toggle in Header */}
                        <div className="flex items-center gap-3 bg-[#1e1c19]/40 px-4 py-2.5 rounded-[6px] border border-[#BA7517]/15 select-none">
                          <span className="text-[12px] font-sans tracking-[0.1em] text-[#B4B2A9]">Visibility Status:</span>
                          <button
                            type="button"
                            onClick={async () => {
                              const newConfig = {
                                ...config,
                                hideOurInfluence: !config.hideOurInfluence
                              };
                              setConfig(newConfig);
                              await handleSaveConfig(newConfig);
                            }}
                            className={`min-h-[32px] px-3.5 py-1.5 rounded-[4px] text-[11px] uppercase tracking-[0.15em] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                              config.hideOurInfluence 
                                ? 'bg-red-950/15 border-red-500/30 text-red-400 hover:bg-red-950/30' 
                                : 'bg-[#BA7517]/10 border-[#BA7517]/30 text-[#FAC775] hover:bg-[#BA7517]/25'
                            }`}
                          >
                            {config.hideOurInfluence ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                Hidden
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                Visible
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-8">
                        {/* Section Title */}
                        <div className="space-y-3">
                          <label className="font-serif italic text-[15px] md:text-[16px] text-[#FAC775] block">Influence Section Title</label>
                          <input
                            type="text"
                            value={config.influence.title || ''}
                            onChange={(e) => setConfig({
                              ...config,
                              influence: { ...config.influence, title: e.target.value }
                            })}
                            className="w-full bg-transparent border-b border-[#BA7517]/25 focus:border-[#FAC775] py-3 text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-sans font-light"
                          />
                        </div>

                        {/* Section Description */}
                        <div className="space-y-3">
                          <label className="font-serif italic text-[15px] md:text-[16px] text-[#FAC775] block">Influence Description / Body Text</label>
                          <textarea
                            rows={6}
                            value={config.influence.description || ''}
                            onChange={(e) => setConfig({
                              ...config,
                              influence: { ...config.influence, description: e.target.value }
                            })}
                            className="w-full bg-[#1e1c19]/50 border border-[#BA7517]/15 focus:border-[#FAC775] p-4 rounded-[6px] text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-sans font-light resize-y min-h-[120px] leading-relaxed"
                          />
                        </div>

                        {/* Image Upload / URL Input */}
                        <div className="space-y-4 pt-6 border-t border-[#BA7517]/10">
                          <label className="font-serif italic text-[15px] md:text-[16px] text-[#FAC775] block">Influence Editorial Showcase Photo</label>
                          <div className="flex flex-col xl:flex-row gap-6 xl:items-end bg-[#1e1c19]/30 p-6 rounded-[8px] border border-[#BA7517]/15">
                            <div className="flex-1 w-full space-y-2">
                              <span className="text-[11px] uppercase tracking-[0.1em] text-[#888780] font-sans block">Image URL / Direct Path</span>
                              <input
                                type="text"
                                value={config.influence.image || ''}
                                onChange={(e) => setConfig({
                                  ...config,
                                  influence: { ...config.influence, image: e.target.value }
                                })}
                                className="w-full bg-transparent border-b border-[#BA7517]/25 focus:border-[#FAC775] py-2 text-sm text-[#F1EFE8] outline-none font-sans font-light"
                              />
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="relative">
                                <input
                                  type="file"
                                  id="influence-img-upload"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  onChange={(e) => handleFieldImageUpload(e, 'influence')}
                                  className="hidden"
                                  disabled={uploadingField !== null}
                                />
                                <label htmlFor="influence-img-upload" className="border border-[#BA7517]/25 hover:border-[#FAC775] hover:text-[#141311] hover:bg-[#FAC775] text-[11px] uppercase tracking-[0.15em] font-sans font-bold px-4 py-2.5 rounded-[4px] transition-all cursor-pointer inline-flex items-center gap-1.5 bg-[#262522] select-none">
                                  <Upload className="w-3.5 h-3.5" /> 
                                  {uploadingField === 'influence' ? 'Uploading...' : 'Upload File'}
                                </label>
                              </div>
                              {config.influence.image && (
                                <img src={getGoogleDriveUrl(config.influence.image)} className="w-12 h-16 object-cover border border-[#BA7517]/25 rounded-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.3)]" alt="influence highlight" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-8 pr-20 lg:pr-24 border-t border-[#BA7517]/15 mt-6">
                        <button
                          onClick={() => handleSaveConfig()}
                          disabled={savingConfig}
                          className="min-h-[52px] bg-[#BA7517] hover:bg-[#FAC775] text-white hover:text-[#141311] border border-[#BA7517] hover:border-[#FAC775] text-[11px] uppercase tracking-[0.2em] font-sans font-bold px-9 py-4 rounded-[6px] transition-all duration-300 cursor-pointer disabled:opacity-50 shadow-[0_4px_12px_rgba(186,117,23,0.15)] whitespace-nowrap"
                        >
                          {savingConfig ? 'Applying changes...' : 'Save Influence Section'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VIEW 4: FEATURED TAB */}
                  {activeTab === 'featured' && (
                    <div className="glass-panel p-8 rounded-[12px] border border-[#BA7517]/15 space-y-8 w-full min-h-[600px] flex flex-col justify-between text-[#F1EFE8] shadow-[0_15px_30px_rgba(0,0,0,0.3)] animate-fadeIn">
                      <div className="flex justify-between items-center pb-4 border-b border-[#BA7517]/15">
                        <div className="space-y-1">
                          <span className="text-[12px] tracking-[0.25em] uppercase text-[#FAC775] font-bold block">
                            FEATURED PRESS ENTRIES
                          </span>
                        </div>
                        <button
                          onClick={handleAddPressItem}
                          className="border border-[#BA7517]/35 hover:border-[#FAC775] hover:bg-[#FAC775] hover:text-[#141311] text-[11px] uppercase tracking-[0.15em] font-sans font-bold px-4 py-2.5 rounded-[4px] transition-all flex items-center gap-1.5 cursor-pointer bg-[#262522] select-none text-[#F1EFE8] shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Press
                        </button>
                      </div>

                      <div className="space-y-2 flex-grow overflow-y-auto pr-2 no-scrollbar">
                        {config.press.map((item) => (
                          <div 
                            key={item.id} 
                            className="flex flex-col gap-4 py-6 border-b border-[#BA7517]/15 group hover:bg-[#1e1c19]/10 px-3 rounded transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] tracking-[0.15em] uppercase text-[#FAC775] font-semibold">
                                Press Entry #{item.id}
                              </span>
                              <button
                                onClick={() => handleDeletePressItem(item.id)}
                                className="text-[#888780] hover:text-red-400 opacity-60 group-hover:opacity-100 transition-all p-2 cursor-pointer border-none bg-transparent"
                              >
                                <Trash2 className="w-4 h-4 stroke-[1.5]" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] text-[#888780] uppercase tracking-wider font-semibold block">Title / Publication Cover Info</label>
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => handleUpdatePressItem(item.id, 'title', e.target.value)}
                                  placeholder="e.g. GoodHomes India, Sept 2025 Edition"
                                  className="w-full bg-[#1c1a18] border border-[#BA7517]/20 focus:border-[#FAC775] px-3 py-2 text-[14px] text-[#F1EFE8] outline-none rounded transition-all font-light"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] text-[#888780] uppercase tracking-wider font-semibold block">Subtitle / Related Project</label>
                                <input
                                  type="text"
                                  value={item.subtitle}
                                  onChange={(e) => handleUpdatePressItem(item.id, 'subtitle', e.target.value)}
                                  placeholder="e.g. Pranaya"
                                  className="w-full bg-[#1c1a18] border border-[#BA7517]/20 focus:border-[#FAC775] px-3 py-2 text-[14px] text-[#F1EFE8] outline-none rounded transition-all font-light"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] text-[#888780] uppercase tracking-wider font-semibold block">Cover Image URL</label>
                                <input
                                  type="text"
                                  value={item.image}
                                  onChange={(e) => handleUpdatePressItem(item.id, 'image', e.target.value)}
                                  placeholder="https://images.unsplash.com/..."
                                  className="w-full bg-[#1c1a18] border border-[#BA7517]/20 focus:border-[#FAC775] px-3 py-2 text-[12px] text-[#F1EFE8] outline-none rounded transition-all font-light"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] text-[#888780] uppercase tracking-wider font-semibold block">Redirection Link URL</label>
                                <input
                                  type="text"
                                  value={item.link}
                                  onChange={(e) => handleUpdatePressItem(item.id, 'link', e.target.value)}
                                  placeholder="https://instagram.com/p/..."
                                  className="w-full bg-[#1c1a18] border border-[#BA7517]/20 focus:border-[#FAC775] px-3 py-2 text-[12px] text-[#FAC775] outline-none rounded transition-all font-light font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {config.press.length === 0 && (
                          <div className="py-24 text-center text-sm text-[#888780]/70 font-sans font-light">
                            No press entries found. Click Add Press to add.
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-8 border-t border-[#BA7517]/15">
                        <button
                          onClick={() => handleSaveConfig()}
                          disabled={savingConfig}
                          className="min-h-[52px] bg-[#BA7517] hover:bg-[#FAC775] text-white hover:text-[#141311] border border-[#BA7517] hover:border-[#FAC775] text-[11px] uppercase tracking-[0.2em] font-sans font-bold px-9 py-4 rounded-[6px] transition-all cursor-pointer disabled:opacity-50 shadow-[0_4px_12px_rgba(186,117,23,0.15)] whitespace-nowrap"
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
                        <div className="admin-edit-panel glass-panel p-8 rounded-[12px] border border-[#BA7517]/15 space-y-8 w-full text-[#F1EFE8] min-h-[600px] shadow-[0_15px_30px_rgba(0,0,0,0.3)] animate-fadeIn">
                          <div className="flex items-center justify-between pb-4 border-b border-[#BA7517]/15">
                            <h3 className="font-serif font-light text-2.5xl uppercase tracking-wider italic text-[#F1EFE8]">
                              {isNewBlog ? 'New Editorial Article' : `Edit Article: ${blogForm.title}`}
                            </h3>
                            <button
                              onClick={() => setEditingBlog(null)}
                              className="text-[11px] uppercase tracking-[0.25em] text-[#B4B2A9] hover:text-[#FAC775] flex items-center gap-1.5 font-bold transition-all cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" /> Back to list
                            </button>
                          </div>

                          <div className="space-y-12">
                            <div className="space-y-4">
                              <label className="font-serif italic text-[15px] md:text-[16px] text-[#FAC775] block">Blog Title *</label>
                              <input
                                type="text"
                                required
                                value={blogForm.title || ''}
                                onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                                placeholder="Article title..."
                                className="w-full bg-transparent border-b border-[#BA7517]/25 focus:border-[#FAC775] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-sans font-light"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                              <div className="space-y-4">
                                <label className="font-serif italic text-[15px] md:text-[16px] text-[#FAC775] block">Publish Date</label>
                                <input
                                  type="date"
                                  value={blogForm.date || ''}
                                  onChange={(e) => setBlogForm({ ...blogForm, date: e.target.value })}
                                  className="w-full bg-transparent border-b border-[#BA7517]/25 focus:border-[#FAC775] py-3 text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-sans font-light"
                                />
                              </div>
                              <div className="space-y-4">
                                <label className="font-serif italic text-[15px] md:text-[16px] text-[#FAC775] block">Author</label>
                                <input
                                  type="text"
                                  value={blogForm.author || ''}
                                  onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })}
                                  className="w-full bg-transparent border-b border-[#BA7517]/25 focus:border-[#FAC775] py-3 text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-sans font-light"
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <label className="font-serif italic text-[15px] md:text-[16px] text-[#FAC775] block">Article Excerpt / Card Summary *</label>
                              <textarea
                                rows={3}
                                required
                                value={blogForm.excerpt || ''}
                                onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                                placeholder="Short summary displayed on the blog catalog cards..."
                                className="w-full bg-[#1e1c19]/50 border border-[#BA7517]/15 focus:border-[#FAC775] p-4 rounded-[6px] text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-sans font-light resize-y min-h-[90px] leading-relaxed"
                              />
                            </div>

                            <div className="space-y-4">
                              <label className="font-serif italic text-[15px] md:text-[16px] text-[#FAC775] block">Full Article Body Content *</label>
                              <p className="text-[12px] text-[#B4B2A9]/65 font-sans font-light">Write the complete article content for the full reading view. Paragraphs separated by blank lines will format automatically.</p>
                              <textarea
                                rows={10}
                                required
                                value={blogForm.content || ''}
                                onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                                placeholder="Write full article thoughts and editorial details here..."
                                className="w-full bg-[#1e1c19]/50 border border-[#BA7517]/15 focus:border-[#FAC775] p-4 rounded-[6px] text-[15px] text-[#F1EFE8] outline-none transition-all duration-300 font-sans font-light resize-y min-h-[220px] leading-relaxed"
                              />
                            </div>

                            <div className="space-y-8 pt-10 border-t border-[#BA7517]/15">
                              <div>
                                <label className="font-serif italic text-[15px] md:text-[16px] text-[#FAC775] block">Article Image</label>
                                <p className="text-[12px] text-[#B4B2A9]/65 font-sans font-light mt-1">Upload a featured image or paste an external image URL.</p>
                              </div>
                              <div className="flex flex-col xl:flex-row gap-6 xl:items-end">
                                <div className="flex-1 w-full">
                                  <input
                                    type="text"
                                    value={blogForm.image || ''}
                                    onChange={(e) => setBlogForm({ ...blogForm, image: e.target.value })}
                                    placeholder="Paste article image URL..."
                                    className="w-full bg-[#1e1c19]/50 border border-[#BA7517]/15 focus:border-[#FAC775] px-5 py-4 rounded-[6px] text-[15px] md:text-[16px] text-[#F1EFE8] outline-none transition-all duration-300 font-sans font-light"
                                  />
                                </div>
                                <div className="relative w-full xl:w-auto">
                                  <input
                                    type="file"
                                    id="upload-blog-image"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={(e) => handleFieldImageUpload(e, 'blogImage')}
                                    className="hidden"
                                    disabled={uploadingField !== null}
                                  />
                                  <label
                                    htmlFor="upload-blog-image"
                                    className="w-full xl:w-auto min-h-[52px] border border-[#BA7517]/35 hover:border-[#FAC775] hover:text-[#141311] hover:bg-[#FAC775] text-[#F1EFE8] text-[12px] uppercase tracking-[0.2em] font-sans font-bold px-6 py-4 rounded-[6px] transition-all cursor-pointer flex items-center justify-center gap-2 bg-[#262522] select-none whitespace-nowrap"
                                  >
                                    <Upload className="w-4 h-4" />
                                    {uploadingField === 'blogImage' ? 'Uploading...' : 'Upload Image'}
                                  </label>
                                </div>
                              </div>

                              {blogForm.image && (
                                <div className="w-full max-w-[280px] aspect-[16/10] border border-[#BA7517]/20 rounded-[6px] overflow-hidden bg-black/20">
                                  <img src={getGoogleDriveUrl(blogForm.image)} className="w-full h-full object-cover" alt="Article preview" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:justify-end gap-4 sm:gap-6 border-t border-[#BA7517]/15 pt-10 mt-12">
                            <button
                              type="button"
                              onClick={() => setEditingBlog(null)}
                              className="min-h-[52px] border border-[#BA7517]/35 hover:border-[#FAC775] text-[#B4B2A9] hover:text-[#FAC775] bg-transparent text-[11px] uppercase tracking-[0.2em] px-8 py-4 rounded-[6px] transition-all cursor-pointer font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveBlogForm}
                              className="min-h-[52px] bg-[#BA7517] hover:bg-[#FAC775] text-white hover:text-[#141311] border border-[#BA7517] hover:border-[#FAC775] text-[11px] uppercase tracking-[0.2em] font-sans font-bold px-9 py-4 rounded-[6px] transition-all duration-300 cursor-pointer shadow-[0_4px_12px_rgba(186,117,23,0.15)]"
                            >
                              Save Article
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Blogs List Table */
                        <div className="glass-panel p-8 rounded-[12px] border border-[#BA7517]/15 space-y-6 text-[#F1EFE8] min-h-[600px] shadow-[0_15px_30px_rgba(0,0,0,0.3)] animate-fadeIn">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#BA7517]/15">
                            <div className="space-y-1">
                              <span className="text-[12px] tracking-[0.25em] uppercase text-[#FAC775] font-bold block">
                                EDITORIAL ARTICLES
                              </span>
                              <span className="text-[11px] text-[#888780] font-light font-sans block">
                                Managing editorial publications and design thoughts
                              </span>
                            </div>
                            {config && (
                              <div className="flex items-center gap-3 bg-[#1e1c19]/40 px-4 py-2 rounded-[6px] border border-[#BA7517]/15 select-none">
                                <span className="text-[12px] font-sans tracking-[0.1em] text-[#B4B2A9]">Visibility Status:</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const newConfig = {
                                      ...config,
                                      hideBlog: !config.hideBlog
                                    };
                                    setConfig(newConfig);
                                    await handleSaveConfig(newConfig);
                                  }}
                                  className={`min-h-[32px] px-3.5 py-1.5 rounded-[4px] text-[11px] uppercase tracking-[0.15em] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                                    config.hideBlog 
                                      ? 'bg-red-950/15 border-red-500/30 text-red-400 hover:bg-red-950/30' 
                                      : 'bg-[#BA7517]/10 border-[#BA7517]/30 text-[#FAC775] hover:bg-[#BA7517]/25'
                                  }`}
                                >
                                  {config.hideBlog ? (
                                    <>
                                      <EyeOff className="w-3.5 h-3.5" />
                                      Hidden
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3.5 h-3.5" />
                                      Visible
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                            <button
                              onClick={handleStartAddBlog}
                              className="bg-[#BA7517] hover:bg-[#FAC775] text-white hover:text-[#141311] text-[11px] uppercase tracking-[0.2em] font-sans font-bold px-4 py-2.5 rounded-[4px] transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(186,117,23,0.15)] cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Write Article
                            </button>
                          </div>

                          <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-[#BA7517]/10">
                                  <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-left w-24">Image</th>
                                  <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-left">Article Title</th>
                                  <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-left w-36">Author</th>
                                  <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-center w-32">Date</th>
                                  <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-right w-24">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#BA7517]/5 font-light">
                                {blogs.map((blog) => (
                                  <tr key={blog.id} className="hover:bg-[#1e1c19]/40 transition-colors group">
                                    <td className="py-6 pr-4">
                                      {blog.image ? (
                                        <div className="w-16 aspect-[4/3] rounded-[4px] overflow-hidden border border-[#BA7517]/20 bg-black/20">
                                          <img src={getGoogleDriveUrl(blog.image)} className="w-full h-full object-cover" alt={blog.title} />
                                        </div>
                                      ) : (
                                        <div className="w-16 aspect-[4/3] rounded-[4px] border border-dashed border-[#BA7517]/15 bg-[#1e1c19]/30" />
                                      )}
                                    </td>
                                    <td className="py-6 pr-4">
                                      <h4 className="font-serif font-medium text-[#F1EFE8] text-[17px] tracking-wide m-0">{blog.title}</h4>
                                      <p className="text-[13px] text-[#B4B2A9]/70 line-clamp-2 mt-1.5 leading-relaxed font-sans font-light">{blog.excerpt}</p>
                                    </td>
                                    <td className="py-6 text-[#B4B2A9] font-sans text-sm">{blog.author}</td>
                                    <td className="py-6 text-center font-mono text-xs text-[#B4B2A9]">{blog.date}</td>
                                    <td className="py-6 text-right">
                                      <div className="flex gap-4 justify-end items-center opacity-65 group-hover:opacity-100 transition-opacity duration-300">
                                        <button
                                          onClick={() => handleStartEditBlog(blog)}
                                          className="text-[#B4B2A9] hover:text-[#FAC775] hover:scale-110 transition-all cursor-pointer p-1"
                                          title="Edit Article"
                                        >
                                          <Edit3 className="w-4 h-4 stroke-[1.5]" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteBlog(blog.id)}
                                          className="text-[#B4B2A9] hover:text-red-400 hover:scale-110 transition-all cursor-pointer p-1"
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
                                    <td colSpan={5} className="py-24 text-center text-[#B4B2A9]/40 font-light text-[17px] font-sans">
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
                    <div className="glass-panel p-8 rounded-[12px] border border-[#BA7517]/15 space-y-6 text-[#F1EFE8] min-h-[600px] shadow-[0_15px_30px_rgba(0,0,0,0.3)] animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#BA7517]/15">
                        <div className="space-y-1">
                          <span className="text-[12px] tracking-[0.25em] uppercase text-[#FAC775] font-bold block">
                            CLIENT INQUIRIES INBOX
                          </span>
                          <span className="text-[11px] text-[#888780] font-light font-sans block">
                            Currently showing {
                              inquiries.filter(inq => {
                                const matchesSearch = inq.name.toLowerCase().includes(inquirySearch.toLowerCase()) || 
                                  inq.email.toLowerCase().includes(inquirySearch.toLowerCase()) || 
                                  inq.message.toLowerCase().includes(inquirySearch.toLowerCase());
                                const matchesType = inquiryTypeFilter === 'all' || inq.projectType.toLowerCase() === inquiryTypeFilter.toLowerCase();
                                return matchesSearch && matchesType;
                              }).length
                            } of {inquiries.length} client briefs
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                          {/* Search Input */}
                          <input
                            type="text"
                            placeholder="Search inbox..."
                            value={inquirySearch}
                            onChange={(e) => setInquirySearch(e.target.value)}
                            className="bg-[#1e1c19] border border-[#BA7517]/25 text-[#F1EFE8] placeholder:italic placeholder:text-[#888780]/40 text-xs px-4 py-2.5 rounded-[4px] outline-none focus:border-[#FAC775] transition-colors w-full sm:w-[200px]"
                          />
                          
                          {/* Filter Select */}
                          <select
                            value={inquiryTypeFilter}
                            onChange={(e) => setInquiryTypeFilter(e.target.value)}
                            className="bg-[#1e1c19] border border-[#BA7517]/25 text-[#F1EFE8] text-xs px-4 py-2.5 rounded-[4px] outline-none focus:border-[#FAC775] transition-colors w-full sm:w-[150px] cursor-pointer"
                          >
                            <option value="all">All Categories</option>
                            <option value="residential">Residential</option>
                            <option value="commercial">Commercial</option>
                            <option value="consultation">Consultation</option>
                            <option value="interiors">Interiors</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#BA7517]/10">
                              <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] w-40">Client Name</th>
                              <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] w-48">Email Address</th>
                              <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-center w-32">Type</th>
                              <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em]">Message Preview</th>
                              <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-center w-28">Submitted</th>
                              <th className="py-4 text-[#888780] text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-right w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#BA7517]/5 font-light">
                            {inquiries
                              .filter(inq => {
                                const matchesSearch = inq.name.toLowerCase().includes(inquirySearch.toLowerCase()) || 
                                  inq.email.toLowerCase().includes(inquirySearch.toLowerCase()) || 
                                  inq.message.toLowerCase().includes(inquirySearch.toLowerCase());
                                const matchesType = inquiryTypeFilter === 'all' || inq.projectType.toLowerCase() === inquiryTypeFilter.toLowerCase();
                                return matchesSearch && matchesType;
                              })
                              .map((inq) => (
                                <tr key={inq.id} className="hover:bg-[#1e1c19]/40 transition-colors group">
                                  <td className="py-6 font-semibold text-[#F1EFE8] font-sans">{inq.name}</td>
                                  <td className="py-6">
                                    <a href={`mailto:${inq.email}`} className="text-[#B4B2A9] hover:text-[#FAC775] transition-colors font-sans text-sm font-light">
                                      {inq.email}
                                    </a>
                                  </td>
                                  <td className="py-6 text-center">
                                    <span className="text-[10px] uppercase tracking-[0.1em] bg-[#BA7517]/10 text-[#FAC775] border border-[#BA7517]/20 px-2.5 py-0.5 rounded font-sans font-semibold inline-block">
                                      {inq.projectType}
                                    </span>
                                  </td>
                                  <td 
                                    className="py-6 pr-6 text-[#B4B2A9] max-w-[400px] cursor-pointer hover:text-[#FAC775] transition-colors"
                                    onClick={() => setViewingInquiry(inq)}
                                    title="Click to view full inquiry details"
                                  >
                                    <div className="line-clamp-2 text-xs leading-relaxed whitespace-pre-wrap font-sans font-light">
                                      {inq.message}
                                    </div>
                                  </td>
                                  <td className="py-6 text-center font-mono text-xs text-[#888780]/80">
                                    {new Date(inq.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </td>
                                  <td className="py-6 text-right">
                                    <button
                                      onClick={() => handleDeleteInquiry(inq.id)}
                                      className="text-[#888780] hover:text-red-400 opacity-65 group-hover:opacity-100 transition-all p-2 cursor-pointer border-none bg-transparent"
                                      title="Delete Inquiry"
                                    >
                                      <Trash2 className="w-4 h-4 stroke-[1.5]" />
                                    </button>
                                  </td>
                                </tr>
                              ))}

                            {inquiries.filter(inq => {
                              const matchesSearch = inq.name.toLowerCase().includes(inquirySearch.toLowerCase()) || 
                                inq.email.toLowerCase().includes(inquirySearch.toLowerCase()) || 
                                inq.message.toLowerCase().includes(inquirySearch.toLowerCase());
                              const matchesType = inquiryTypeFilter === 'all' || inq.projectType.toLowerCase() === inquiryTypeFilter.toLowerCase();
                              return matchesSearch && matchesType;
                            }).length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-24 text-center text-[#B4B2A9]/40 font-light text-[17px] font-sans">
                                  Inbox is empty. No matching inquiries found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
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
          <AnimatePresence>
            {viewingInquiry && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6 select-none">
                {/* Backdrop overlay */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setViewingInquiry(null)}
                  className="absolute inset-0 bg-[#0c0b0a]/80 backdrop-blur-[8px]"
                />

                {/* Modal Container */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  className="bg-[#181715]/95 border border-[#BA7517]/25 max-w-2xl w-full p-8 rounded-[12px] relative space-y-6 text-[#F1EFE8] z-10 shadow-[0_25px_60px_rgba(0,0,0,0.6)] gold-border-glow select-text"
                >
                  <button
                    onClick={() => setViewingInquiry(null)}
                    className="absolute top-6 right-6 text-[#888780] hover:text-[#FAC775] p-2 hover:bg-[#262522] rounded-full transition-all cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="space-y-2 pb-4 border-b border-[#BA7517]/15">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#FAC775] font-bold block">Client Inquiry Brief</span>
                    <h3 className="font-serif text-2xl text-[#F1EFE8] tracking-wide font-light">{viewingInquiry.name}</h3>
                    <a href={`mailto:${viewingInquiry.email}`} className="text-xs text-[#B4B2A9] hover:text-[#FAC775] transition-colors font-sans font-light">{viewingInquiry.email}</a>
                  </div>

                  <div className="grid grid-cols-2 gap-6 bg-[#1e1c19]/50 p-4 rounded-[6px] border border-[#BA7517]/10 text-xs">
                    <div>
                      <span className="text-[#888780] uppercase tracking-[0.1em] text-[10px] block font-sans font-semibold">Project Type</span>
                      <span className="text-[#FAC775] font-sans font-bold mt-1.5 block uppercase tracking-[0.05em]">{viewingInquiry.projectType}</span>
                    </div>
                    <div>
                      <span className="text-[#888780] uppercase tracking-[0.1em] text-[10px] block font-sans font-semibold">Received Date</span>
                      <span className="text-[#F1EFE8]/80 font-mono mt-1.5 block">
                        {new Date(viewingInquiry.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-sans uppercase tracking-[0.1em] text-[#888780] font-bold block">Client Message:</span>
                    <div className="text-[14px] text-[#F1EFE8] font-sans font-light leading-[1.7] bg-[#141311] p-5 border border-[#BA7517]/10 rounded-[6px] max-h-[35vh] overflow-y-auto whitespace-pre-wrap no-scrollbar">
                      {viewingInquiry.message}
                    </div>
                  </div>

                  <div className="flex gap-4 justify-end pt-4 border-t border-[#BA7517]/15">
                    <button
                      onClick={() => handleDeleteInquiry(viewingInquiry.id)}
                      className="border border-red-950 hover:bg-red-950/20 text-red-400/80 hover:text-red-400 text-[11px] uppercase tracking-[0.2em] font-sans font-bold px-4 py-2.5 rounded-[4px] transition-all cursor-pointer"
                    >
                      Delete Submission
                    </button>
                    <button
                      onClick={() => setViewingInquiry(null)}
                      className="bg-[#BA7517] hover:bg-[#FAC775] text-[#141311] hover:text-[#141311] text-[11px] uppercase tracking-[0.2em] font-sans font-bold px-5 py-2.5 rounded-[4px] transition-all cursor-pointer border-none shadow-[0_4px_12px_rgba(186,117,23,0.15)]"
                    >
                      Done Reading
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          </>
        )}

    </div>
  );
}
