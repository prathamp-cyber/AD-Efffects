'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { projectsData, Project } from '@/data';
import { MapPin, Mail, Clock, Phone, RefreshCw } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (!formData.phone.trim()) newErrors.phone = 'PHONE NUMBER IS REQUIRED';
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
                    className="overflow-hidden bg-card-bg border border-border-custom aspect-[3/4]"
                  >
                    <img
                      src={img}
                      alt={`${activeProject.title} detail ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-[1.2s] ease-out"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* 2. MAIN NAVIGATION VIEWPORTS */
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
                    className="max-w-[700px] text-center px-6 mx-auto"
                    style={{ marginTop: '48px', marginBottom: '64px' }} // 48px top, 64px bottom
                  >
                    <p className="text-[18px] font-cormorant font-light text-primary leading-[1.6] text-center">
                      The AD Efffects is a bespoke interior design studio creating thoughtfully crafted homes and spaces. Our work is rooted in clarity of planning, depth of detail, and a deep respect for material, craft, and context. Every project is approached as a collaboration — designed with intent, executed with rigour, and shaped around the people who live within it.
                    </p>
                  </div>

                  {/* 3-Column Unified Grid - Balanced aspect ratio and equal gutters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl px-6 md:px-12 mb-20 mx-auto">
                    {projectsData.map((project) => (
                      <ProjectCard 
                        key={project.id} 
                        project={project} 
                        onClick={() => setActiveProject(project)} 
                      />
                    ))}
                  </div>

                  {/* Centered Pagination */}
                  <div className="flex justify-center items-center gap-8 mb-20 text-[10px] uppercase tracking-[0.3em] font-light">
                    <span className="text-accent font-semibold border-b border-accent pb-0.5">1</span>
                    <button className="text-secondary hover:text-accent transition-colors cursor-pointer">2</button>
                    <button className="text-secondary hover:text-accent transition-colors cursor-pointer">&gt;</button>
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
                    <span className="text-[9px] uppercase tracking-[0.35em] text-accent font-semibold block font-sans"><span className="mr-[-0.35em]">Philosophy</span></span>
                    <h2 className="text-4xl md:text-5xl font-cormorant font-light text-primary italic">Restraint & Harmony</h2>
                  </div>

                  {/* Paragraph Section - matching the home page paragraph width & centering style */}
                  <div className="max-w-[700px] px-6 text-center text-primary text-sm md:text-base leading-[1.8] space-y-6 font-light mx-auto">
                    <p>
                      Founded with a dedication to spatial purity, The AD Efffects focuses on modern minimalism, tactile materiality, and silent luxury. We reject excess to design enduring, peaceful sanctuaries.
                    </p>
                    <p>
                      Our projects range from high-end residential estates to curated workspace branding. In every commission, we seek architectural restraint, optimizing raw wood, travertine stone, and natural illumination.
                    </p>
                  </div>

                  {/* Image Row Section - matching the home page project grid width and padding bounds */}
                  <div 
                    className="grid grid-cols-2 gap-8 w-full max-w-7xl px-6 md:px-12 mx-auto"
                    style={{ marginTop: '64px' }} // Exact 64px gap below text
                  >
                    <div className="overflow-hidden bg-card-bg border border-border-custom aspect-[3/4] w-full">
                      <img 
                        src="https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=80" 
                        alt="Stone texture" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1.2s] ease-out"
                      />
                    </div>
                    <div className="overflow-hidden bg-card-bg border border-border-custom aspect-[3/4] w-full">
                      <img 
                        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80" 
                        alt="Interior architecture" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1.2s] ease-out"
                      />
                    </div>
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
                    <span className="text-[9px] uppercase tracking-[0.35em] text-accent font-semibold block"><span className="mr-[-0.35em]">Recognition</span></span>
                    <h2 className="text-3xl font-cormorant font-light text-primary italic">Featured Press</h2>
                  </div>
                  <ul className="space-y-6 max-w-md w-full text-[10px] uppercase tracking-[0.25em] text-secondary font-light mx-auto">
                    <li className="pb-6 border-b border-border-custom/60 flex justify-between items-center">
                      <span className="text-primary hover:text-accent transition-colors duration-300 cursor-pointer">Architectural Digest</span>
                      <span className="text-[9px] text-accent">2024</span>
                    </li>
                    <li className="pb-6 border-b border-border-custom/60 flex justify-between items-center">
                      <span className="text-primary hover:text-accent transition-colors duration-300 cursor-pointer">Elle Decor India</span>
                      <span className="text-[9px] text-accent">2023</span>
                    </li>
                    <li className="pb-6 border-b border-border-custom/60 flex justify-between items-center">
                      <span className="text-primary hover:text-accent transition-colors duration-300 cursor-pointer">Design Anthology</span>
                      <span className="text-[9px] text-accent">2024</span>
                    </li>
                    <li className="pb-6 border-b border-border-custom/60 flex justify-between items-center">
                      <span className="text-primary hover:text-accent transition-colors duration-300 cursor-pointer">The Architect&apos;s Diary</span>
                      <span className="text-[9px] text-accent">2024</span>
                    </li>
                  </ul>
                </div>
              )}

              {/* OUR INFLUENCE TAB */}
              {activeTab === 'our-influence' && (
                <div 
                  className="w-full flex flex-col items-center"
                  style={{ marginTop: '48px', marginBottom: '80px' }} // Exact 48px top gap
                >
                  <div className="space-y-4 text-center w-full" style={{ marginBottom: '32px' }}> {/* 32px gap below title */}
                    <span className="text-[9px] uppercase tracking-[0.35em] text-accent font-semibold block font-sans"><span className="mr-[-0.35em]">Inspiration</span></span>
                    <h2 className="text-3xl font-cormorant font-light text-primary italic">Spatial Influences</h2>
                  </div>
                  <p className="text-xs md:text-sm text-secondary font-light leading-[1.8] max-w-[700px] px-6 text-center mx-auto">
                    We draw inspiration from Japandi design principles, organic Wabi-Sabi textures, and mid-century architectural structuralism. We design with a deep reverence for local craft, raw wood structures, and passive light integration.
                  </p>
                  <div 
                    className="overflow-hidden bg-card-bg border border-border-custom aspect-[16/10] w-full max-w-7xl px-6 md:px-12 mx-auto"
                    style={{ marginTop: '64px' }} // Exact 64px gap below text
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80" 
                      alt="Inspiration reference" 
                      className="w-full h-full object-cover hover:scale-103 transition-transform duration-[1.5s] ease-out"
                    />
                  </div>
                </div>
              )}

              {/* CONTACT TAB */}
              {activeTab === 'contact' && (
                <div 
                  className="w-full flex flex-col items-center"
                  style={{ marginTop: '48px', marginBottom: '80px' }} // Exact 48px top gap
                >
                  {/* Page Title Header */}
                  <div className="space-y-3 text-center w-full" style={{ marginBottom: '56px' }}>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-accent font-semibold block font-sans"><span className="mr-[-0.4em]">CONNECT</span></span>
                    <h2 className="text-4xl md:text-5xl font-cormorant font-light text-primary italic">Contact the Studio</h2>
                  </div>

                  {/* Symmetrical Centralized Form Container (Max-W-4xl) */}
                  <div className="w-full max-w-4xl px-6 mx-auto">
                    <AnimatePresence mode="wait">
                      {!isSubmitted ? (
                        <motion.form
                          key="contact-form"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.5 }}
                          onSubmit={handleSubmit}
                          className="flex flex-col gap-12"
                        >
                          {/* Row 1: Name and Email */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                            <div className="flex flex-col gap-2">
                              <div className={`relative group flex items-center border ${
                                errors.name ? 'border-red-500/80 focus-within:border-red-500' : 'border-primary focus-within:border-accent'
                              } px-[30px] h-[72px] rounded-none bg-transparent w-full transition-all duration-300`}>
                                <input
                                  type="text"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleInputChange}
                                  placeholder="YOUR NAME *"
                                  className="w-full bg-transparent border-none outline-none text-xs md:text-sm font-bold text-primary text-center placeholder:text-primary/35 placeholder:font-bold tracking-[0.25em] rounded-none uppercase p-0"
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
                              } px-[30px] h-[72px] rounded-none bg-transparent w-full transition-all duration-300`}>
                                <input
                                  type="email"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleInputChange}
                                  placeholder="YOUR EMAIL *"
                                  className="w-full bg-transparent border-none outline-none text-xs md:text-sm font-bold text-primary text-center placeholder:text-primary/35 placeholder:font-bold tracking-[0.25em] rounded-none uppercase p-0"
                                />
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
                              </div>
                              {errors.email && (
                                <span className="text-[9px] text-red-500 font-sans tracking-[0.1em] uppercase pt-1">{errors.email}</span>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Phone and Subject */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                            <div className="flex flex-col gap-2">
                              <div className={`relative group flex items-center border ${
                                errors.phone ? 'border-red-500/80 focus-within:border-red-500' : 'border-primary focus-within:border-accent'
                              } px-[30px] h-[72px] rounded-none bg-transparent w-full transition-all duration-300`}>
                                <input
                                  type="text"
                                  name="phone"
                                  value={formData.phone}
                                  onChange={handleInputChange}
                                  placeholder="PHONE NUMBER *"
                                  className="w-full bg-transparent border-none outline-none text-xs md:text-sm font-bold text-primary text-center placeholder:text-primary/35 placeholder:font-bold tracking-[0.25em] rounded-none uppercase p-0"
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
                              } px-[30px] h-[72px] rounded-none bg-transparent w-full transition-all duration-300`}>
                                <input
                                  type="text"
                                  name="subject"
                                  value={formData.subject}
                                  onChange={handleInputChange}
                                  placeholder="SUBJECT *"
                                  className="w-full bg-transparent border-none outline-none text-xs md:text-sm font-bold text-primary text-center placeholder:text-primary/35 placeholder:font-bold tracking-[0.25em] rounded-none uppercase p-0"
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
                            } px-[30px] py-[22px] min-h-[260px] rounded-none bg-transparent w-full transition-all duration-300`}>
                              <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                placeholder="WRITE MESSAGE *"
                                className="w-full bg-transparent border-none outline-none text-xs md:text-sm font-bold text-primary text-center placeholder:text-primary/35 placeholder:font-bold tracking-[0.25em] resize-none uppercase leading-relaxed flex-grow p-0"
                              />
                              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
                            </div>
                            {errors.message && (
                              <span className="text-[9px] text-red-500 font-sans tracking-[0.1em] uppercase pt-1">{errors.message}</span>
                            )}
                          </div>

                          {/* Math Captcha and Submit Section */}
                          <div className="flex flex-col gap-10 pt-4">
                            {/* Captcha Card Widget */}
                            <div className="bg-card-bg/40 border border-border-custom p-5 flex flex-col gap-4 w-full max-w-[300px] transition-colors duration-300 backdrop-blur-sm">
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
                              
                              <div className="relative group w-full border border-primary/45 focus-within:border-primary px-4 py-2.5 flex items-center h-[46px] transition-all duration-300">
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
                            <div className="group relative w-fit">
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary border border-primary text-background hover:bg-transparent hover:text-primary px-14 py-4 text-xs md:text-sm font-bold tracking-[0.2em] font-sans rounded-none transition-all duration-300 cursor-pointer disabled:opacity-50 select-none uppercase flex items-center gap-3"
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
                  <div className="w-full max-w-4xl px-6 mt-16 mb-8">
                    <div className="w-full h-[1px] bg-primary/10 transition-colors duration-300" />
                  </div>

                  {/* Symmetrical Coordinates Info (Tidy Row Format) */}
                  <div className="w-full max-w-4xl px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-sans tracking-[0.18em] text-secondary/70 uppercase">
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
                  <div className="mt-6 text-[9px] font-sans tracking-[0.2em] text-accent font-medium uppercase flex items-center gap-2">
                    <Clock className="w-3 h-3 stroke-[1.5]" />
                    <span>GANDHIDHAM IST: {gandhidhamTime}</span>
                    <span className="ml-1 font-semibold text-secondary">
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

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden bg-card-bg border border-border-custom w-full aspect-[3/4] transition-colors duration-300"
    >
      <img
        src={project.image}
        alt={project.title}
        className="w-full h-full object-cover transition-transform duration-[1.2s] ease-[0.25,1,0.5,1] group-hover:scale-[1.02]"
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
