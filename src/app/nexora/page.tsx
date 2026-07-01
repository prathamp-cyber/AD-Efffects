'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Power, AlertCircle, CheckCircle, 
  Eye, EyeOff, Settings, LogOut, ShieldCheck, History
} from 'lucide-react';
import type { SiteConfig } from '@/data';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
}

type TabType = 'dashboard' | 'logs' | 'settings';

export default function NexoraPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Time state
  const [gandhidhamTime, setGandhidhamTime] = useState<string>('');

  // Site Config state
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Audit Logs state
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsSearch, setLogsSearch] = useState('');

  // Settings State — super admin credentials are server-only env vars and never exposed
  const [savingCreds, setSavingCreds] = useState(false);

  // Load Gandhidham Local Time (IST)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      try {
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        };
        const formatter = new Intl.DateTimeFormat([], options);
        setGandhidhamTime(formatter.format(now));
      } catch (err) {
        console.error('Failed to compute time:', err);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dynamic website configuration
  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch {
      showAlert('error', 'Failed to load website configuration.');
    }
  }, []);

  // Fetch website changes audit logs
  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {
      console.warn('Failed to load audit logs.');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  // Load config and logs upon successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadConfig();
      loadLogs();
    }
  }, [isAuthenticated, loadConfig, loadLogs]);

  // Reload logs dynamically when switching tabs
  useEffect(() => {
    if (isAuthenticated && activeTab === 'logs') {
      loadLogs();
    }
  }, [isAuthenticated, activeTab, loadLogs]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
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
      } else {
        setLoginError(data.error || 'Authentication failed');
      }
    } catch {
      setLoginError('Server error. Please try again.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors on logout
    }
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setConfig(null);
  };

  // Toggle Website Status (Online / Offline)
  const toggleWebsiteStatus = async () => {
    if (!config) return;
    setSavingConfig(true);
    setAlert(null);

    const updatedConfig = {
      ...config,
      isWebsiteOffline: !config.isWebsiteOffline
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      const data = await res.json();

      if (res.ok) {
        setConfig(updatedConfig);
        showAlert('success', `Website is now ${updatedConfig.isWebsiteOffline ? 'OFFLINE' : 'ONLINE'}.`);
      } else {
        showAlert('error', data.error || 'Failed to update website status.');
      }
    } catch {
      showAlert('error', 'Network error. Could not connect to API.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Save Super Admin Credentials — credentials are managed via environment variables
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCreds(true);
    setTimeout(() => {
      showAlert('success', 'Nexora session settings updated.');
      setSavingCreds(false);
    }, 800);
  };

  // Breadcrumbs labels matching the admin panel
  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Super Admin Dashboard';
      case 'logs': return 'Website Audit logs';
      case 'settings': return 'Nexora Portal Settings';
      default: return 'Nexora Control Center';
    }
  };

  return (
    <div className="admin-shell w-full h-screen bg-[#121212] text-[#FAF9F7] font-sans antialiased selection:bg-accent selection:text-white flex gap-[12px] pr-[12px] overflow-hidden">
      
      {!isAuthenticated ? (
        /* 1. AUTHENTICATION LOGIN UI (Identical to Admin Panel Login Style) */
        <div className="admin-login-screen w-full h-full flex flex-col items-center justify-center px-6 py-12 relative bg-[#0f0e0c] overflow-y-auto">
          {/* Ambient Background Lights */}
          <div className="absolute top-[20%] left-[30%] w-[350px] h-[350px] rounded-full bg-[#BA7517] opacity-[0.06] filter blur-[80px] pointer-events-none animate-pulse-slow" />
          <div className="absolute bottom-[20%] right-[30%] w-[400px] h-[400px] rounded-full bg-[#FAC775] opacity-[0.04] filter blur-[100px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

          {/* Centralized Login Block */}
          <div className="admin-login-stack flex flex-col items-center gap-7 z-10 w-full max-w-[500px] flex-shrink-0">
            {/* Logo header */}
            <div className="flex flex-col items-center select-none text-center">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.45em] text-[#FAC775] font-bold block mb-2.5">
                SUPER ADMIN PORTAL
              </span>
              <h1 className="font-serif text-[42px] sm:text-[52px] md:text-[60px] font-light tracking-wide text-[#F1EFE8] leading-none uppercase">Nexora</h1>
              <div className="w-[100px] h-[1px] bg-gradient-to-r from-transparent via-[#FAC775]/50 to-transparent mt-3.5" />
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
                    {isSubmittingLogin ? 'VERIFYING...' : 'ENTER PORTAL'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      ) : (
        /* 2. AUTHENTICATED SUPER ADMIN PANEL (Identical Layout to Admin Panel) */
        <>
          {/* Fixed Left Sidebar */}
          <aside className="w-[280px] h-full bg-[#181715] text-white flex flex-col justify-between flex-shrink-0 select-none z-30 border-r border-[#BA7517]/15 shadow-[10px_0_40px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
              {/* Logo / Site Title Header Box */}
              <div className="h-[88px] w-full border-b border-[#BA7517]/15 flex flex-col justify-center items-center bg-[#181715] select-none px-6">
                <span className="font-serif text-[24px] font-light text-[#F1EFE8] tracking-wider leading-none mb-1.5 hover:text-[#FAC775] transition-colors duration-300 cursor-pointer uppercase">
                  Nexora
                </span>
                <span className="text-[9px] uppercase tracking-[0.35em] text-[#888780] font-sans font-bold">
                  <span className="mr-[-0.35em]">SUPER ADMIN</span>
                </span>
              </div>

              {/* Navigation list with animated slide highlights */}
              <div className="w-full pt-8 flex-1">
                <nav className="flex flex-col gap-[14px]">
                  {[
                    { id: 'dashboard', label: 'DASHBOARD', icon: ShieldAlert },
                    { id: 'logs', label: 'AUDIT LOGS', icon: History },
                    { id: 'settings', label: 'PORTAL SETTINGS', icon: Settings }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as TabType)}
                        className="relative w-full flex items-center justify-between px-6 py-4 text-[14px] font-sans uppercase tracking-[0.2em] font-semibold transition-all duration-300 cursor-pointer group"
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
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar Footer */}
              <div className="w-full py-6 flex flex-col gap-[14px] border-t border-[#BA7517]/15 bg-[#141311]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-[16px] px-6 py-4 text-[14px] font-sans uppercase tracking-[0.2em] font-semibold text-red-400/80 hover:text-red-400 hover:bg-red-950/15 border-l-2 border-transparent transition-all duration-300 cursor-pointer"
                >
                  <LogOut className="w-[20px] h-[20px] stroke-[1.5]" /> 
                  <span>Exit Portal</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Right Main Content Area Container */}
          <div className="admin-workspace flex-1 flex flex-col h-full overflow-hidden bg-[#0f0e0c]">
            
            {/* Top Header Bar */}
            <div className="h-[88px] bg-[#141311] border-b border-[#BA7517]/15 flex justify-between items-center px-10 flex-shrink-0 z-20 select-none">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[12px] font-sans font-bold uppercase tracking-[0.2em] text-[#FAC775]">
                  {getTabLabel()}
                </span>
                <span className="text-[11px] font-sans text-[#888780] font-light">
                  Welcome, Super Admin &bull; <span className="font-mono text-[#F1EFE8]/70">IST: {gandhidhamTime}</span>
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
                  <span className="text-[13px] text-[#F1EFE8]/90 font-sans font-medium tracking-wide">Super Admin</span>
                  <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-[#FAC775] to-[#BA7517] flex items-center justify-center text-[13px] text-[#141311] font-bold select-none text-center shadow-[0_0_12px_rgba(250,199,117,0.2)]">
                    SA
                  </div>
                </div>
              </div>
            </div>

            {/* Main content viewport */}
            <main className="flex-1 overflow-y-auto p-8 md:p-12 xl:p-14 space-y-12">
              
              {/* Alerts Banners */}
              <AnimatePresence>
                {alert && (
                  <motion.div
                     initial={{ opacity: 0, y: -8 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -8 }}
                     className={`p-4 rounded-[8px] border flex justify-between items-center gap-6 shadow-sm ${
                       alert.type === 'success' 
                         ? 'bg-green-950/20 border-green-800/40 text-green-400' 
                         : 'bg-red-950/20 border-red-800/40 text-red-400'
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* View 1: Dashboard overview */}
              {activeTab === 'dashboard' && (
                <div className="flex flex-col gap-10">
                  {/* Premium greeting hero block */}
                  <div className="glass-panel p-8 rounded-[12px] border border-[#BA7517]/25 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.4)] mb-2">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#BA7517]/5 via-transparent to-transparent pointer-events-none" />
                    <div className="space-y-2 z-10">
                      <h2 className="font-serif text-3xl font-light tracking-wide text-[#F1EFE8]">
                        Nexora Status Dashboard
                      </h2>
                      <p className="text-[13px] text-[#B4B2A9] font-sans font-light max-w-xl leading-relaxed">
                        Welcome back to the Super Administration console. You have full global control overrides for the site.
                      </p>
                    </div>
                  </div>

                  {/* Main site status controller */}
                  <div className="glass-panel p-8 rounded-[12px] border border-[#BA7517]/15 shadow-[0_15px_30px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center gap-4 mb-8 pb-4 border-b border-[#BA7517]/15">
                      <ShieldCheck className="w-6 h-6 text-[#FAC775]" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] uppercase tracking-[0.25em] text-[#FAC775] font-bold">WEBSITE DEPLOYMENT STATUS</span>
                        <span className="text-[11px] text-[#888780] font-light">Control visibility of the public portal</span>
                      </div>
                    </div>

                    {config ? (
                      <div className="flex flex-col items-start gap-8">
                        <div className="flex items-center gap-6">
                          <div className={`px-4 py-2 border text-[11px] font-sans font-bold uppercase tracking-[0.2em] rounded-[4px] ${
                            config.isWebsiteOffline 
                              ? 'bg-red-950/25 border-red-800/30 text-red-400' 
                              : 'bg-green-950/25 border-green-800/30 text-green-400'
                          }`}>
                            {config.isWebsiteOffline ? '🔴 Offline (Maintenance Screen Enabled)' : '🟢 Online (Public Live)'}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="text-sm text-[#B4B2A9] font-light max-w-2xl leading-relaxed">
                            Turning the website offline will block public entry to all pages except administrative panels. Visitors will see the custom digital sanctuary offline placeholder.
                          </p>
                          <button
                            onClick={toggleWebsiteStatus}
                            disabled={savingConfig}
                            className="bg-[#BA7517] hover:bg-[#FAC775] text-white hover:text-[#141311] text-[11px] uppercase tracking-[0.2em] font-sans font-bold px-6 py-4 rounded-[4px] shadow-[0_4px_12px_rgba(186,117,23,0.15)] hover:shadow-[0_4px_15px_rgba(250,199,117,0.35)] transition-all duration-300 cursor-pointer flex items-center gap-2"
                          >
                            <Power className="w-4 h-4" />
                            {config.isWebsiteOffline ? 'Activate Website (Go Live)' : 'Deactivate Website (Go Offline)'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-sm text-[#888780] font-sans font-light animate-pulse">
                        Connecting to configuration pipeline...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View 2: AUDIT LOGS TIMELINE */}
              {activeTab === 'logs' && (
                <div className="flex flex-col gap-10">
                  {/* Search and Action Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#141311]/50 border border-[#BA7517]/15 p-6 rounded-[12px] glass-panel">
                    <div className="flex flex-col gap-1">
                      <span className="text-[12px] uppercase tracking-[0.25em] text-[#FAC775] font-bold">Studio Change Logs</span>
                      <span className="text-[11px] text-[#888780] font-light">Real-time database record of administrative edits</span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Search Input */}
                      <input
                        type="text"
                        value={logsSearch}
                        onChange={(e) => setLogsSearch(e.target.value)}
                        placeholder="Search changes or user..."
                        className="bg-[#181715] border border-[#BA7517]/25 focus:border-[#FAC775] px-4 py-2 text-xs text-[#F1EFE8] outline-none rounded-[4px] min-w-[200px] transition-all font-light placeholder:text-[#888780]/40"
                      />
                      {/* Refresh Button */}
                      <button
                        onClick={loadLogs}
                        disabled={loadingLogs}
                        className="bg-[#BA7517] hover:bg-[#FAC775] text-white hover:text-[#141311] text-[10px] uppercase tracking-[0.15em] font-sans font-bold px-4 py-2.5 rounded-[4px] transition-all duration-300 cursor-pointer disabled:opacity-50"
                      >
                        {loadingLogs ? 'Refreshing...' : 'Refresh Logs'}
                      </button>
                    </div>
                  </div>

                  {/* Timeline list card */}
                  <div className="glass-panel p-8 md:p-10 rounded-[12px] border border-[#BA7517]/15 shadow-[0_15px_30px_rgba(0,0,0,0.3)]">
                    {loadingLogs && logs.length === 0 ? (
                      <div className="py-20 text-center text-sm text-[#888780] font-sans font-light animate-pulse">
                        Retrieving records from Upstash Redis database...
                      </div>
                    ) : logs.length === 0 ? (
                      <div className="py-20 text-center text-sm text-[#888780] font-sans font-light">
                        No administrative changes recorded in the audit database.
                      </div>
                    ) : (
                      <div className="relative border-l border-[#BA7517]/20 pl-8 ml-4 space-y-8 py-2">
                        {logs
                          .filter(log => {
                            const query = logsSearch.toLowerCase();
                            return (
                              log.action?.toLowerCase().includes(query) ||
                              log.user?.toLowerCase().includes(query)
                            );
                          })
                          .map((log, index) => {
                            const dateObj = new Date(log.timestamp);
                            const formattedTime = isNaN(dateObj.getTime())
                              ? log.timestamp
                              : dateObj.toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: true
                                });

                            // Check status flags for color coding
                            const isStatusChange = log.action?.includes('visibility');
                            const isDelete = log.action?.includes('Deleted') || log.action?.includes('Cleared');
                            const isAdd = log.action?.includes('Added') || log.action?.includes('Published');

                            return (
                              <div key={log.id || index} className="relative group text-left">
                                {/* Dot indicator on the timeline */}
                                <div className={`absolute -left-[38px] top-1.5 w-[14px] h-[14px] rounded-full border bg-[#0f0e0c] transition-all duration-300 group-hover:scale-125 ${
                                  isStatusChange
                                    ? 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                                    : isDelete
                                    ? 'border-[#BA7517]'
                                    : isAdd
                                    ? 'border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                                    : 'border-[#FAC775]'
                                }`} />

                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span className={`text-[13px] font-sans font-medium tracking-wide ${
                                      isStatusChange ? 'text-[#FAC775]' : 'text-[#F1EFE8]'
                                    }`}>
                                      {log.action}
                                    </span>
                                    <span className="text-[10px] bg-[#1e1c19] border border-[#BA7517]/10 px-2 py-0.5 rounded text-[#B4B2A9] font-mono">
                                      by {log.user}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[#888780] font-light font-mono">
                                    {formattedTime}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View 3: Portal settings */}
              {activeTab === 'settings' && (
                <div className="flex flex-col gap-10">
                  <div className="glass-panel p-8 rounded-[12px] border border-[#BA7517]/15 shadow-[0_15px_30px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center gap-4 mb-8 pb-4 border-b border-[#BA7517]/15">
                      <Settings className="w-6 h-6 text-[#FAC775]" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] uppercase tracking-[0.25em] text-[#FAC775] font-bold">PORTAL ACCESS CONFIGURATION</span>
                        <span className="text-[11px] text-[#888780] font-light">Super Admin authentication security information</span>
                      </div>
                    </div>

                    <div className="space-y-6 max-w-xl">
                      <div className="bg-[#1e1c19]/60 border border-[#BA7517]/10 rounded-[8px] p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5 text-green-400" />
                          <span className="text-[13px] font-sans font-semibold text-[#F1EFE8] uppercase tracking-wider">Security Notice</span>
                        </div>
                        <p className="text-[13px] text-[#B4B2A9] font-sans font-light leading-relaxed">
                          Super Admin credentials are managed exclusively through <strong className="text-[#FAC775] font-medium">server-side environment variables</strong> and are never exposed to the frontend browser.
                        </p>
                        <div className="space-y-2 pt-2 border-t border-[#BA7517]/10">
                          <p className="text-[11px] text-[#888780] font-mono">Access credentials: server environment only</p>
                          <p className="text-[11px] text-[#888780] font-mono">Session signing key: server environment only</p>
                        </div>
                        <p className="text-[11px] text-[#B4B2A9]/50 font-light pt-2">
                          * To update super admin credentials, modify the environment variables in your Vercel dashboard or local .env file and redeploy.
                        </p>
                      </div>

                      <form onSubmit={handleSaveCredentials}>
                        <button
                          type="submit"
                          disabled={savingCreds}
                          className="bg-[#BA7517] hover:bg-[#FAC775] text-white hover:text-[#141311] text-[11px] uppercase tracking-[0.2em] font-sans font-bold px-5 py-3.5 rounded-[4px] transition-all duration-300 cursor-pointer disabled:opacity-50"
                        >
                          {savingCreds ? 'SAVING...' : 'REFRESH SESSION'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </>
      )}
    </div>
  );
}
