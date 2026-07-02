'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { defaultSiteConfig, Project, BlogPost, SiteConfig } from '@/data';
import { MapPin, Mail, Clock, Phone, RefreshCw } from 'lucide-react';
import { getGoogleDriveUrl } from '@/lib/firebase';

export default function Home() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeBlog, setActiveBlog] = useState<BlogPost | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 3;

  // Resolve Google Drive URLs and local paths for all project images
  const projectsData = (siteConfig.projects || []).map(p => ({
    ...p,
    image: getGoogleDriveUrl(p.image || ''),
    detailImages: Array.isArray(p.detailImages)
      ? p.detailImages.map((img: string) => getGoogleDriveUrl(img))
      : []
  }));
  const pressData = siteConfig.press;
  const blogsData = siteConfig.blogs || [];

  const totalPages = Math.max(1, Math.ceil(projectsData.length / projectsPerPage));
  const currentProjects = projectsData.slice(
    (currentPage - 1) * projectsPerPage,
    currentPage * projectsPerPage
  );

  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; subject?: string; message?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Math Captcha state
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: 0 });
  const [userCaptcha, setUserCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Gandhidham live time state
  const [gandhidhamTime, setGandhidhamTime] = useState('');
  const [isStudioOpen, setIsStudioOpen] = useState(true);

  // Generate captcha
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setCaptcha({ num1: n1, num2: n2, answer: n1 + n2 });
    setUserCaptcha('');
    setCaptchaError('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSiteConfig = async () => {
      try {
        const res = await fetch('/api/config', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          setSiteConfig(data);
        }
      } catch (err) {
        console.warn('Failed to load live site configuration:', err);
      }
    };

    loadSiteConfig();
    const interval = setInterval(loadSiteConfig, 5000);
    const channel = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('site-config-updates')
      : null;

    channel?.addEventListener('message', loadSiteConfig);

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === 'site-config-updated-at') {
        loadSiteConfig();
      }
    };

    window.addEventListener('site-config-updated', loadSiteConfig);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      isMounted = false;
      clearInterval(interval);
      channel?.removeEventListener('message', loadSiteConfig);
      channel?.close();
      window.removeEventListener('site-config-updated', loadSiteConfig);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  useEffect(() => {
    if (!activeProject) return;
    const latestProject = projectsData.find((project) => project.id === activeProject.id);
    if (latestProject && latestProject !== activeProject) {
      setActiveProject(latestProject);
    }
  }, [activeProject, projectsData]);

  useEffect(() => {
    if (!activeBlog) return;
    const latestBlog = (siteConfig.blogs || []).find((blog) => blog.id === activeBlog.id);
    if (latestBlog && latestBlog !== activeBlog) {
      setActiveBlog(latestBlog);
    }
  }, [activeBlog, siteConfig.blogs]);

  // Update Gandhidham local time (IST)
  useEffect(() => {
    const updateTime = () => {
      try {
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        };
        const formatter = new Intl.DateTimeFormat([], options);
        setGandhidhamTime(formatter.format(new Date()));
        
        const indiaDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const hours = indiaDate.getHours();
        const mins = indiaDate.getMinutes();
        const day = indiaDate.getDay(); // 0 Sunday, 6 Saturday
        
        // Studio is open Mon-Sat 9:30 AM (9.5) to 6:30 PM (18.5)
        const timeDecimal = hours + mins / 60;
        const isOpen = day >= 1 && day <= 6 && timeDecimal >= 9.5 && timeDecimal < 18.5;
        setIsStudioOpen(isOpen);
      } catch (err) {
        console.error('Failed to compute time:', err);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setActiveProject(null); // Clear active project to return to tab root
    setActiveBlog(null); // Clear active blog to return to tab root
    setCurrentPage(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) newErrors.name = 'YOUR NAME IS REQUIRED';
    if (!formData.email.trim()) {
      newErrors.email = 'YOUR EMAIL IS REQUIRED';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'PLEASE ENTER A VALID EMAIL';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'PHONE NUMBER IS REQUIRED';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'ENTER A VALID 10 DIGIT PHONE NUMBER';
    }
    if (!formData.subject.trim()) newErrors.subject = 'SUBJECT IS REQUIRED';
    if (!formData.message.trim()) newErrors.message = 'MESSAGE IS REQUIRED';

    // Verify Captcha
    if (!userCaptcha.trim()) {
      setCaptchaError('CAPTCHA ANSWER IS REQUIRED');
      setErrors(newErrors);
      return;
    } else if (parseInt(userCaptcha.trim(), 10) !== captcha.answer) {
      setCaptchaError('INCORRECT ANSWER. PLEASE TRY AGAIN');
      setErrors(newErrors);
      return;
    } else {
      setCaptchaError('');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    // Combine phone, subject, and original message into a structured message payload
    const formattedMessage = `Phone: ${formData.phone}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`;

    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        projectType: 'General Inquiry',
        message: formattedMessage,
      }),
    })
      .then(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
        setUserCaptcha('');
      })
      .catch(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
      });
  };

  if (siteConfig.isWebsiteOffline) {
    return (
      <div className="w-full min-h-screen bg-background text-primary flex flex-col items-center justify-center p-6 transition-colors duration-300">
        <div className="max-w-[700px] w-full text-center flex flex-col items-center gap-10">
          {/* Logo Header */}
          <div className="flex flex-col items-center select-none">
            <h1 className="brand-logo text-[56px] sm:text-[76px] text-primary leading-none">
              The AD Efffects
            </h1>
            <div className="w-[180px] h-[1px] bg-primary mt-3 transition-colors duration-300" />
          </div>

          {/* Offline Message */}
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-cormorant font-light tracking-[0.25em] text-accent uppercase leading-relaxed">
              Sanctuary Temporarily Offline
            </h2>
            <p className="text-sm md:text-base leading-[1.8] text-secondary font-light max-w-[550px] mx-auto">
              We are currently refining our digital sanctuary. During this period, our design operations and projects continue uninterrupted. Please contact us directly below.
            </p>
          </div>

          <div className="w-full max-w-lg h-[1px] bg-primary/10 transition-colors" />

          {/* Contact Coordinates */}
          <div className="flex flex-col gap-5 text-[11px] sm:text-xs tracking-[0.2em] uppercase text-secondary font-sans">
            <div className="flex items-center justify-center gap-2.5">
              <MapPin className="w-4 h-4 text-accent stroke-[1.5]" />
              <span>Gandhidham, Gujarat, India</span>
            </div>
            <div className="flex items-center justify-center gap-2.5">
              <Mail className="w-4 h-4 text-accent stroke-[1.5]" />
              <a href="mailto:hello@adefffects.com" className="hover:text-primary transition-colors">
                hello@adefffects.com
              </a>
            </div>
            <div className="flex items-center justify-center gap-2.5">
              <Phone className="w-4 h-4 text-accent stroke-[1.5]" />
              <a href="tel:+919825012345" className="hover:text-primary transition-colors">
                +91 98250 12345
              </a>
            </div>
          </div>

          {/* Gandhidham Local Time (IST) */}
          <div className="flex items-center justify-center gap-2.5 text-[10px] sm:text-[11px] tracking-[0.22em] text-accent font-semibold uppercase">
            <Clock className="w-4 h-4 stroke-[1.5]" />
            <span>GANDHIDHAM IST: {gandhidhamTime}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="w-full min-h-[70vh] bg-background flex flex-col items-center transition-colors duration-300">
        <AnimatePresence mode="wait">
          {/* 1. PROJECT DETAIL VIEW */}
          {activeProject ? (
            <motion.div
              key={`project-${activeProject.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="w-full max-w-7xl px-6 md:px-12 mx-auto"
              style={{ marginTop: '48px', marginBottom: '80px' }} // Exact 48px top gap below nav
            >
              {/* Back Navigation & Title Header */}
              <div className="flex flex-col" style={{ marginBottom: '64px' }}> {/* Exact 64px gap to photo grid */}
                <button
                  onClick={() => setActiveProject(null)}
                  className="text-[9px] uppercase tracking-[0.35em] text-secondary hover:text-accent w-fit cursor-pointer flex items-center gap-2 group transition-colors"
                  style={{ marginBottom: '32px' }} // Exact 32px gap below back button
                >
                  <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back to Portfolio
                </button>
                <h2 className="text-3xl md:text-4xl font-cormorant font-light tracking-[0.2em] text-primary uppercase leading-none">
                  {activeProject.title}
                </h2>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[9px] uppercase tracking-[0.25em] text-secondary font-light">
                    {activeProject.category} — {activeProject.location}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">
                    {activeProject.year} / {activeProject.size}
                  </span>
                </div>
              </div>

              {/* 3-Column Detail Images with uniform aspect ratio and gutters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {activeProject.detailImages.map((img, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1, duration: 1.0, ease: [0.25, 1, 0.5, 1] }}
                    className="relative overflow-hidden bg-card-bg border border-border-custom aspect-[3/4]"
                  >
                    <Image
                      src={img}
                      alt={`${activeProject.title} detail ${idx + 1}`}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover hover:scale-[1.03] transition-transform duration-[1.2s] ease-out"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : activeBlog ? (
            /* 2. BLOG ARTICLE DETAIL VIEW */
            <motion.div
              key={`blog-${activeBlog.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="w-full max-w-4xl px-6 md:px-12 mx-auto"
              style={{ marginTop: '48px', marginBottom: '80px' }}
            >
              {/* Back Navigation & Article Header */}
              <div className="flex flex-col mb-12">
                <button
                  onClick={() => setActiveBlog(null)}
                  className="text-[9px] uppercase tracking-[0.35em] text-secondary hover:text-accent w-fit cursor-pointer flex items-center gap-2 group transition-colors mb-8"
                >
                  <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back to Editorial Blog
                </button>
                <span className="text-[10px] font-mono tracking-widest text-accent uppercase block mb-3">
                  {activeBlog.date}
                </span>
                <h1 className="text-3xl md:text-5xl font-cormorant font-light text-primary leading-tight">
                  {activeBlog.title}
                </h1>
              </div>

              {/* Featured Hero Image */}
              {activeBlog.image && (
                <div className="relative overflow-hidden bg-card-bg border border-border-custom aspect-[16/9] w-full mb-12">
                  <Image
                    src={activeBlog.image}
                    alt={activeBlog.title}
                    fill
                    sizes="(min-width: 768px) 100vw, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              {/* Excerpt Pull-Quote Box */}
              {activeBlog.excerpt && (
                <div className="border-l-2 border-accent pl-6 py-2 my-8 bg-card-bg/40">
                  <p className="text-base md:text-lg font-cormorant italic text-primary leading-relaxed">
                    &quot;{activeBlog.excerpt}&quot;
                  </p>
                </div>
              )}

              {/* Full Article Content */}
              <div className="prose dark:prose-invert max-w-none text-primary text-sm md:text-base font-light leading-[1.8] space-y-6">
                {(activeBlog.content || activeBlog.excerpt || '')
                  .split('\n')
                  .filter((paragraph) => paragraph.trim() !== '')
                  .map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
              </div>
            </motion.div>
          ) : (
            /* 3. MAIN NAVIGATION VIEWPORTS */
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="w-full flex flex-col items-center"
            >
              {/* PORTFOLIO TAB */}
              {activeTab === 'portfolio' && (
                <>
                  {/* Premium Brand Statement - Single Centered Calm Paragraph with Exact Spacing */}
                  <div 
                    className="mobile-brand-statement max-w-[700px] text-center px-6 mx-auto"
                    style={{ marginTop: '48px', marginBottom: '64px' }} // 48px top, 64px bottom
                  >
                    <p className="text-[19px] font-cormorant font-medium text-primary leading-[1.6] text-center">
                      {siteConfig.brandStatement}
                    </p>
                  </div>

                  {/* 3-Column Unified Grid - Smooth Animated Page Transition */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`portfolio-page-${currentPage}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
                      className="mobile-project-grid grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl px-6 md:px-12 mb-12 mx-auto"
                    >
                      {currentProjects.map((project, idx) => (
                        <ProjectCard 
                          key={project.id} 
                          project={project} 
                          priority={idx < 3}
                          index={idx}
                          onClick={() => setActiveProject(project)} 
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  {/* Centered Workable Pagination with clean spacing */}
                  <div className="flex justify-center items-center gap-6 md:gap-8 mt-12 md:mt-16 mb-24 md:mb-32 text-[16px] md:text-[18px] uppercase tracking-[0.18em] font-medium">
                    {currentPage > 1 && (
                      <button
                        onClick={() => {
                          setCurrentPage((prev) => Math.max(prev - 1, 1));
                          window.scrollTo({ top: 250, behavior: 'smooth' });
                        }}
                        className="min-w-10 h-10 flex items-center justify-center text-secondary hover:text-accent transition-colors cursor-pointer"
                        aria-label="Previous portfolio page"
                      >
                        &lt;
                      </button>
                    )}
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 250, behavior: 'smooth' });
                          }}
                          className={`min-w-10 h-10 flex items-center justify-center transition-all cursor-pointer ${
                            isActive
                              ? 'text-accent font-semibold border-b-2 border-accent pb-0.5'
                              : 'text-secondary hover:text-accent hover:border-b-2 hover:border-accent pb-0.5'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {currentPage < totalPages && (
                      <button
                        onClick={() => {
                          setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                          window.scrollTo({ top: 250, behavior: 'smooth' });
                        }}
                        className="min-w-10 h-10 flex items-center justify-center text-secondary hover:text-accent transition-colors cursor-pointer"
                        aria-label="Next portfolio page"
                      >
                        &gt;
                      </button>
                    )}
                  </div>
                </>
              )}
              {/* OUR STORY TAB */}
              {activeTab === 'our-story' && (
                <div 
                  className="w-full flex flex-col items-center"
                  style={{ marginTop: '48px', marginBottom: '80px' }} // Exact 48px top gap
                >
                  {/* Heading Section */}
                  <div className="space-y-4 text-center w-full" style={{ marginBottom: '40px' }}> {/* 40px gap below title */}
                    <span className="text-[9.5px] uppercase tracking-[0.35em] text-accent font-semibold block font-sans"><span className="mr-[-0.35em]">Philosophy</span></span>
                    <h2 className="text-4xl md:text-5xl font-cormorant font-light text-primary italic">{siteConfig.story.title}</h2>
                  </div>

                  {/* Paragraph Section - matching the home page paragraph width & centering style */}
                  <div className="max-w-[700px] px-6 text-center text-primary text-sm md:text-base leading-[1.8] space-y-6 font-light mx-auto">
                    {siteConfig.story.paragraphs.map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>

                  {/* Image Row Section - matching the home page project grid width and padding bounds */}
                  <div 
                    className="grid grid-cols-2 gap-8 w-full max-w-7xl px-6 md:px-12 mx-auto"
                    style={{ marginTop: '64px' }} // Exact 64px gap below text
                  >
                    {siteConfig.story.images.map((image, idx) => (
                      <div key={`${image}-${idx}`} className="relative overflow-hidden bg-card-bg border border-border-custom aspect-[3/4] w-full">
                        <Image 
                          src={image} 
                          alt={`Our story image ${idx + 1}`} 
                          fill
                          sizes="(min-width: 768px) 50vw, 50vw"
                          className="object-cover hover:scale-105 transition-transform duration-[1.2s] ease-out"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FEATURED PRESS TAB */}
              {activeTab === 'featured' && (
                <div 
                  className="w-full flex flex-col items-center"
                  style={{ marginTop: '48px', marginBottom: '80px' }} // Exact 48px top gap
                >
                  <div className="space-y-4 text-center w-full" style={{ marginBottom: '48px' }}> {/* Exact 48px gap to press items */}
                    <span className="text-[9.6px] uppercase tracking-[0.35em] text-accent font-semibold block"><span className="mr-[-0.35em]">Recognition</span></span>
                    <h2 className="text-[32px] font-cormorant font-light text-primary italic">Featured Press</h2>
                  </div>

                  {/* Symmetrical Grid for Magazine Covers and Awards matching reference website */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-7xl px-6 md:px-12 mx-auto">
                    {pressData.map((item) => (
                      <a 
                        key={item.id} 
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-card-bg border border-card-border p-4 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)] transition-all duration-500 ease-out group cursor-pointer block"
                      >
                        <div>
                          {/* Vertical Image Container for Magazine Covers / Awards */}
                          <div className="relative overflow-hidden aspect-[3/4] w-full bg-background border border-border-custom/40 flex items-center justify-center">
                            <Image 
                              src={item.image} 
                              alt={item.title} 
                              fill
                              sizes="(min-width: 768px) 25vw, (min-width: 640px) 50vw, 100vw"
                              className="object-cover group-hover:scale-[1.02] transition-transform duration-[1.2s] ease-out"
                            />
                          </div>
                        </div>

                        <div>
                          {/* Title: Center aligned, bold weight, highly readable size */}
                          <h3 className="text-[14px] md:text-[15px] font-bold text-primary leading-[1.4] text-center mt-5 font-sans tracking-wide">
                            {item.title}
                          </h3>
                          
                          {/* Subtitle (Optional): Centered, elegant cormorant serif, slightly muted */}
                          {item.subtitle && (
                            <div className="text-[12px] md:text-[13px] font-cormorant font-medium italic text-accent text-center mt-1.5 pb-1">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* BLOG TAB */}
              {activeTab === 'blog' && (
                <div 
                  className="w-full flex flex-col items-center"
                  style={{ marginTop: '48px', marginBottom: '80px' }} // Exact 48px top gap
                >
                  <div className="space-y-4 text-center w-full" style={{ marginBottom: '56px' }}>
                    <span className="text-[9.5px] uppercase tracking-[0.35em] text-accent font-semibold block font-sans"><span className="mr-[-0.35em]">JOURNAL</span></span>
                    <h2 className="text-[31.5px] font-cormorant font-light text-primary italic">Editorial Blog</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-7xl px-6 md:px-12 mx-auto">
                    {blogsData.map((blog) => (
                      <div 
                        key={blog.id} 
                        onClick={() => setActiveBlog(blog)}
                        className="bg-card-bg border border-card-border p-6 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 ease-out group cursor-pointer"
                      >
                        <div>
                          {/* Image Container */}
                          <div className="relative overflow-hidden aspect-[16/10] w-full bg-background border border-border-custom/40">
                            <Image 
                              src={blog.image} 
                              alt={blog.title} 
                              fill
                              sizes="(min-width: 768px) 50vw, 100vw"
                              className="object-cover group-hover:scale-[1.02] transition-transform duration-[1.2s] ease-out"
                            />
                          </div>
                          <span className="text-[9px] font-mono tracking-widest text-accent uppercase block mt-6">
                            {blog.date}
                          </span>
                          <h3 className="text-[18px] md:text-[20px] font-cormorant font-light text-primary leading-[1.4] mt-3 group-hover:text-accent transition-colors duration-300">
                            {blog.title}
                          </h3>
                          <p className="text-xs md:text-sm text-secondary font-light leading-[1.7] mt-3">
                            {blog.excerpt}
                          </p>
                        </div>

                        {/* Read Full Article */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveBlog(blog);
                          }}
                          className="border-t border-border-custom/40 pt-4 mt-6 flex justify-between items-center w-full bg-transparent border-x-0 border-b-0 cursor-pointer text-left focus:outline-none"
                        >
                          <span className="text-[10px] tracking-[0.2em] font-sans font-medium uppercase text-primary group-hover:text-accent transition-colors">
                            Read Full Article
                          </span>
                          <span className="text-accent group-hover:translate-x-1 transition-transform duration-300">
                            &rarr;
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OUR INFLUENCE TAB */}
              {activeTab === 'our-influence' && (
                <div 
                  className="w-full flex flex-col items-center"
                  style={{ marginTop: '48px', marginBottom: '80px' }} // Exact 48px top gap
                >
                  <div className="space-y-4 text-center w-full" style={{ marginBottom: '32px' }}> {/* 32px gap below title */}
                    <span className="text-[9.9px] uppercase tracking-[0.35em] text-accent font-semibold block font-sans"><span className="mr-[-0.35em]">Inspiration</span></span>
                    <h2 className="text-[33px] font-cormorant font-light text-primary italic">{siteConfig.influence.title}</h2>
                  </div>
                  <p className="text-xs md:text-sm text-secondary font-light leading-[1.8] max-w-[700px] px-6 text-center mx-auto">
                    {siteConfig.influence.description}
                  </p>
                  <div 
                    className="relative overflow-hidden bg-card-bg border border-border-custom aspect-[16/10] w-full max-w-7xl px-6 md:px-12 mx-auto"
                    style={{ marginTop: '64px' }} // Exact 64px gap below text
                  >
                    <Image 
                      src={siteConfig.influence.image} 
                      alt="Inspiration reference" 
                      fill
                      sizes="100vw"
                      className="object-cover hover:scale-103 transition-transform duration-[1.5s] ease-out"
                    />
                  </div>
                </div>
              )}

              {/* CONTACT TAB */}
              {activeTab === 'contact' && (
                <div 
                  className="contact-section w-full flex flex-col items-center"
                  style={{ marginTop: '48px', marginBottom: '80px' }} // Exact 48px top gap
                >
                  {/* Page Title Header */}
                  <div className="contact-title-block space-y-3 text-center w-full" style={{ marginBottom: '56px' }}>
                    <span className="text-[10.5px] uppercase tracking-[0.4em] text-accent font-semibold block font-sans"><span className="mr-[-0.4em]">CONNECT</span></span>
                    <h2 className="contact-heading text-4xl md:text-5xl font-cormorant font-light text-primary italic">Contact the Studio</h2>
                  </div>

                  {/* Symmetrical Centralized Form Container (Max-W-4xl) */}
                  <div className="contact-form-container w-full max-w-4xl px-6 mx-auto">
                    <AnimatePresence mode="wait">
                      {!isSubmitted ? (
                        <motion.form
                          key="contact-form"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.5 }}
                          onSubmit={handleSubmit}
                          className="contact-form flex flex-col gap-12"
                        >
                          {/* Row 1: Name and Email */}
                          <div className="contact-form-grid grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                            <div className="flex flex-col gap-2">
                              <div className={`relative group flex items-center border ${
                                errors.name ? 'border-red-500/80 focus-within:border-red-500' : 'border-primary focus-within:border-accent'
                              } contact-field-frame px-[30px] h-[72px] rounded-none bg-transparent w-full transition-all duration-300`}>
                                <input
                                  type="text"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleInputChange}
                                  placeholder="YOUR NAME *"
                                  className="contact-control w-full bg-transparent border-none outline-none text-xs md:text-sm font-bold text-primary text-center placeholder:text-primary/35 placeholder:font-bold tracking-[0.25em] rounded-none uppercase p-0"
                                />
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
                              </div>
                              {errors.name && (
                                <span className="text-[9px] text-red-500 font-sans tracking-[0.1em] uppercase pt-1">{errors.name}</span>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <div className={`relative group flex items-center border ${
                                errors.email ? 'border-red-500/80 focus-within:border-red-500' : 'border-primary focus-within:border-accent'
                              } contact-field-frame px-[30px] h-[72px] rounded-none bg-transparent w-full transition-all duration-300`}>
                                <input
                                  type="email"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleInputChange}
                                  placeholder="YOUR EMAIL *"
                                  className="contact-control w-full bg-transparent border-none outline-none text-xs md:text-sm font-bold text-primary text-center placeholder:text-primary/35 placeholder:font-bold tracking-[0.25em] rounded-none uppercase p-0"
                                />
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
                              </div>
                              {errors.email && (
                                <span className="text-[9px] text-red-500 font-sans tracking-[0.1em] uppercase pt-1">{errors.email}</span>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Phone and Subject */}
                          <div className="contact-form-grid grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                            <div className="flex flex-col gap-2">
                              <div className={`relative group flex items-center border ${
                                errors.phone ? 'border-red-500/80 focus-within:border-red-500' : 'border-primary focus-within:border-accent'
                              } contact-field-frame px-[30px] h-[72px] rounded-none bg-transparent w-full transition-all duration-300`}>
                                <input
                                  type="tel"
                                  name="phone"
                                  value={formData.phone}
                                  onChange={handleInputChange}
                                  inputMode="numeric"
                                  pattern="[0-9]{10}"
                                  maxLength={10}
                                  placeholder="PHONE NUMBER *"
                                  className="contact-control w-full bg-transparent border-none outline-none text-xs md:text-sm font-bold text-primary text-center placeholder:text-primary/35 placeholder:font-bold tracking-[0.25em] rounded-none uppercase p-0"
                                />
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
                              </div>
                              {errors.phone && (
                                <span className="text-[9px] text-red-500 font-sans tracking-[0.1em] uppercase pt-1">{errors.phone}</span>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <div className={`relative group flex items-center border ${
                                errors.subject ? 'border-red-500/80 focus-within:border-red-500' : 'border-primary focus-within:border-accent'
                              } contact-field-frame px-[30px] h-[72px] rounded-none bg-transparent w-full transition-all duration-300`}>
                                <input
                                  type="text"
                                  name="subject"
                                  value={formData.subject}
                                  onChange={handleInputChange}
                                  placeholder="SUBJECT *"
                                  className="contact-control w-full bg-transparent border-none outline-none text-xs md:text-sm font-bold text-primary text-center placeholder:text-primary/35 placeholder:font-bold tracking-[0.25em] rounded-none uppercase p-0"
                                />
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
                              </div>
                              {errors.subject && (
                                <span className="text-[9px] text-red-500 font-sans tracking-[0.1em] uppercase pt-1">{errors.subject}</span>
                              )}
                            </div>
                          </div>

                          {/* Row 3: Message Textarea */}
                          <div className="flex flex-col gap-2">
                            <div className={`relative group flex flex-col border ${
                              errors.message ? 'border-red-500/80 focus-within:border-red-500' : 'border-primary focus-within:border-accent'
                            } contact-message-frame px-[30px] py-[22px] min-h-[260px] rounded-none bg-transparent w-full transition-all duration-300`}>
                              <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                placeholder="WRITE MESSAGE *"
                                className="contact-control contact-textarea w-full bg-transparent border-none outline-none text-xs md:text-sm font-bold text-primary text-center placeholder:text-primary/35 placeholder:font-bold tracking-[0.25em] resize-none uppercase leading-relaxed flex-grow p-0"
                              />
                              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
                            </div>
                            {errors.message && (
                              <span className="text-[9px] text-red-500 font-sans tracking-[0.1em] uppercase pt-1">{errors.message}</span>
                            )}
                          </div>

                          {/* Math Captcha and Submit Section */}
                          <div className="contact-action-stack flex flex-col gap-10 pt-4">
                            {/* Captcha Card Widget */}
                            <div className="contact-captcha-card bg-card-bg/40 border border-border-custom p-5 flex flex-col gap-4 w-full max-w-[300px] transition-colors duration-300 backdrop-blur-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-sans font-bold tracking-[0.15em] text-primary uppercase select-none">
                                  What is {captcha.num1} + {captcha.num2} ?
                                </span>
                                <button
                                  type="button"
                                  onClick={generateCaptcha}
                                  className="text-secondary hover:text-accent transition-all p-1 cursor-pointer flex items-center justify-center hover:rotate-180 duration-500"
                                  title="Refresh Captcha"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 stroke-[1.5]" />
                                </button>
                              </div>
                              
                              <div className="contact-captcha-input relative group w-full border border-primary/45 focus-within:border-primary px-4 py-2.5 flex items-center h-[46px] transition-all duration-300">
                                <input
                                  type="text"
                                  value={userCaptcha}
                                  onChange={(e) => {
                                    setUserCaptcha(e.target.value);
                                    if (captchaError) setCaptchaError('');
                                  }}
                                  placeholder="TYPE YOUR ANSWER"
                                  className="w-full bg-transparent border-none outline-none text-xs text-primary text-center placeholder:text-primary/30 placeholder:font-bold font-bold tracking-[0.15em] rounded-none uppercase p-0"
                                />
                                <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-accent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                              </div>
                              {captchaError && (
                                <span className="text-[9px] text-red-500 font-sans tracking-[0.08em] uppercase block pt-0.5">{captchaError}</span>
                              )}
                              <span className="text-[9px] font-sans text-secondary/50 tracking-[0.08em] uppercase block">
                                Spam prevention verification
                              </span>
                            </div>

                            {/* Submit Button */}
                            <div className="contact-submit-wrap group relative w-fit">
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="contact-submit-button text-[#BA7517] hover:text-[#111111] px-14 py-4 text-xs md:text-sm font-bold tracking-[0.2em] font-sans rounded-none transition-all duration-300 cursor-pointer disabled:opacity-50 select-none uppercase flex items-center gap-3"
                              >
                                <span>SUBMIT</span>
                                <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300 stroke-[2] fill-none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </motion.form>
                      ) : (
                        <motion.div
                          key="success-message"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="text-center py-16 px-4 space-y-6 flex flex-col items-center justify-center border border-border-custom bg-card-bg/25"
                        >
                          <div className="w-12 h-12 rounded-none border border-accent flex items-center justify-center text-accent mb-2">
                            <svg className="w-5 h-5 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-cormorant font-light text-primary italic">Inquiry Received</h3>
                          <p className="text-xs text-secondary leading-relaxed max-w-[360px] mx-auto font-light tracking-wide">
                            Thank you for reaching out to The AD Efffects. Your message has been sent to our curation team. We will review your details and respond within 48 business hours.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsSubmitted(false)}
                            className="text-[10px] uppercase tracking-[0.2em] text-accent hover:text-primary transition-colors pt-4 border-b border-accent pb-0.5 hover:border-primary cursor-pointer font-semibold"
                          >
                            Send another message
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Horizontal Separator Line */}
                  <div className="contact-separator w-full max-w-4xl px-6 mt-16 mb-8">
                    <div className="w-full h-[1px] bg-primary/10 transition-colors duration-300" />
                  </div>

                  {/* Symmetrical Coordinates Info (Tidy Row Format) */}
                  <div className="contact-coordinate-row w-full max-w-4xl px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-6 font-sans tracking-[0.18em] text-secondary/70 uppercase">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                      <span>Gandhidham, Gujarat, India</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                      <a href="mailto:hello@adefffects.com" className="hover:text-primary transition-colors">
                        hello@adefffects.com
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-accent stroke-[1.5]" />
                      <a href="tel:+919825012345" className="hover:text-primary transition-colors">
                        +91 98250 12345
                      </a>
                    </div>
                  </div>

                  {/* Live IST Time Display */}
                  <div className="contact-time-status w-full max-w-4xl mx-auto mt-12 md:mt-16 mb-12 px-6 font-sans tracking-[0.2em] text-accent font-semibold uppercase flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-center leading-relaxed">
                    <Clock className="w-4 h-4 stroke-[1.7] flex-shrink-0" />
                    <span>GANDHIDHAM IST: {gandhidhamTime}</span>
                    <span className="font-bold text-secondary">
                      {isStudioOpen ? '[ STUDIO OPEN ]' : '[ STUDIO CLOSED ]'}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer onTabChange={handleTabChange} />
    </>
  );
}

function ProjectCard({ project, priority = false, index = 0, onClick }: { project: Project; priority?: boolean; index?: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.25, 1, 0.5, 1] }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden bg-card-bg border border-border-custom w-full aspect-[3/4] transition-colors duration-300"
    >
      <Image
        src={project.image}
        alt={project.title}
        fill
        priority={priority}
        sizes="(min-width: 768px) 33vw, 100vw"
        className="object-cover transition-transform duration-[1.2s] ease-[0.25,1,0.5,1] group-hover:scale-[1.02]"
      />
      
      {/* Whiteout Hover Overlay - Premium Slide-Up Reveal */}
      <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-all duration-400 ease-out flex items-center justify-center">
        <h3 className="text-base font-cormorant font-light text-[#111111] tracking-[0.2em] uppercase text-center px-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-200 ease-out">
          {project.title}
        </h3>
      </div>
    </motion.div>
  );
}
