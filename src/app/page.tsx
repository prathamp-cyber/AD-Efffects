'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { projectsData, Project } from '@/data';
import { MapPin, Mail, Phone, RefreshCw, User, Pencil, MessageSquare, Shield } from 'lucide-react';

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

  // Math Captcha state (initialize to 4 + 9 to match screenshot on load)
  const [captcha, setCaptcha] = useState({ num1: 4, num2: 9, answer: 13 });
  const [userCaptcha, setUserCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState('');

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
                  className="w-full bg-[#f8f6f3] text-[#111111] transition-colors duration-500 relative overflow-hidden"
                  style={{ marginTop: '0px' }}
                >
                  {/* Subtle Noise Texture Overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.025] mix-blend-overlay bg-[url('data:image/svg+xml;utf8,<svg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/></svg>')]"></div>

                  <div className="max-w-[1400px] w-full mx-auto py-[120px] px-6 md:px-12 lg:px-20">
                    <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-20 items-start">
                      
                      {/* Left Column (35%) */}
                      <div className="flex flex-col relative">
                        {/* Main Image with floating badge and console detail overlap */}
                        <div className="relative w-full aspect-[3/4] max-w-sm lg:max-w-none">
                          <img
                            src="/chair.png"
                            alt="Luxury studio interior"
                            className="w-full h-full object-cover shadow-[0_15px_40px_rgba(0,0,0,0.06)]"
                          />

                          {/* Circular Rotating Badge */}
                          <div className="absolute -top-12 -right-12 z-20 w-[110px] h-[110px] md:w-[120px] md:h-[120px] bg-[#f8f6f3] rounded-full border border-[#e5ded6] shadow-md flex items-center justify-center">
                            <motion.div 
                              className="absolute inset-0 w-full h-full"
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                            >
                              <svg viewBox="0 0 100 100" className="w-full h-full">
                                <path
                                  id="badgePath"
                                  d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
                                  fill="none"
                                />
                                <text className="text-[7.2px] font-sans font-bold tracking-[0.22em] fill-[#b89b74] uppercase">
                                  <textPath href="#badgePath" startOffset="0%">
                                    {"WE'D LOVE TO • HEAR FROM YOU • "}
                                  </textPath>
                                </text>
                              </svg>
                            </motion.div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="font-cormorant text-2xl text-[#b89b74] font-medium tracking-wide">A</span>
                            </div>
                          </div>

                          {/* Overlapping console cabinet image with double border frame */}
                          <div className="absolute -right-8 -bottom-10 z-20 w-[150px] h-[150px] md:w-[170px] md:h-[170px] bg-[#f8f6f3] p-1.5 shadow-[0_15px_35px_rgba(0,0,0,0.08)] border border-[#e5ded6]">
                            <div className="w-full h-full overflow-hidden border border-[#e5ded6]">
                              <img
                                src="/detail.png"
                                alt="Studio details console"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Title and botanical section below the image */}
                        <div className="relative mt-24 pl-2 pr-8 select-none">
                          {/* Botanical fine line sketch */}
                          <svg
                            viewBox="0 0 200 300"
                            className="absolute bottom-[-20px] right-[-20px] w-[200px] h-[300px] pointer-events-none opacity-[0.2] text-[#b89b74] fill-none stroke-current stroke-[0.75]"
                          >
                            <path d="M60,290 C70,220 90,160 120,80" />
                            <path d="M78,210 C50,190 35,210 25,230 C45,225 65,220 78,210" />
                            <path d="M25,230 C40,205 60,205 78,210" />
                            <path d="M85,190 C110,180 125,195 135,210 C120,195 100,190 85,190" />
                            <path d="M135,210 C115,185 100,180 85,190" />
                            <path d="M96,140 C75,120 60,135 50,150 C70,145 85,140 96,140" />
                            <path d="M50,150 C65,130 80,130 96,140" />
                            <path d="M102,125 C130,120 145,135 155,150 C140,135 120,130 102,125" />
                            <path d="M155,150 C135,130 120,125 102,125" />
                            <path d="M110,95 C95,80 85,90 80,100 C90,95 100,95 110,95" />
                            <path d="M115,85 C135,80 145,90 150,100 C140,90 128,88 115,85" />
                          </svg>

                          <div className="relative z-10">
                            <h3 className="text-3xl font-cormorant text-[#111111] leading-none">Let&apos;s Create</h3>
                            <h3 className="text-3xl font-cormorant italic text-[#b89b74] leading-none mt-1">Something Beautiful</h3>
                            <div className="w-12 h-[1px] bg-[#b89b74]/40 my-6" />
                            <p className="text-[12px] font-sans text-[#666666] tracking-wide leading-relaxed max-w-[280px]">
                              Have a project in mind or just want to say hello? Fill out the form and we&apos;ll get back to you soon.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column (65%) */}
                      <div className="flex flex-col">
                        {/* Heading */}
                        <div className="flex flex-col items-center text-center lg:items-start lg:text-left mb-10">
                          <div className="flex items-center gap-3 text-[11px] font-sans tracking-[0.3em] text-[#b89b74] font-bold uppercase">
                            <span className="w-8 h-[1px] bg-[#b89b74]/40" />
                            Contact
                            <span className="w-8 h-[1px] bg-[#b89b74]/40 lg:hidden" />
                          </div>
                          <h2 className="text-4xl md:text-5xl lg:text-[56px] font-cormorant font-light text-[#111111] leading-tight mt-3 mb-4">
                            Contact the Studio
                          </h2>
                          <p className="text-[11px] font-sans tracking-[0.25em] text-[#666666] font-bold uppercase">
                            We&apos;re here to bring your vision to life
                          </p>
                        </div>

                        {/* Form */}
                        <AnimatePresence mode="wait">
                          {!isSubmitted ? (
                            <motion.form
                              key="studio-contact-form"
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -15 }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              onSubmit={handleSubmit}
                              className="flex flex-col gap-6"
                            >
                              {/* Row 1: Name and Email */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1.5">
                                  <div className="relative flex items-center w-full">
                                    <div className="absolute left-5 text-[#b89b74]">
                                      <User className="w-[18px] h-[18px] stroke-[1.5]" />
                                    </div>
                                    <input
                                      type="text"
                                      name="name"
                                      value={formData.name}
                                      onChange={handleInputChange}
                                      placeholder="YOUR NAME *"
                                      className={`w-full h-[72px] bg-white border ${
                                        errors.name ? 'border-red-500' : 'border-[#e5ded6] focus:border-[#b89b74]'
                                      } rounded-[10px] pl-14 pr-5 text-xs font-sans tracking-[0.2em] font-bold text-[#111111] placeholder:text-[#b89b74] outline-none transition-colors uppercase`}
                                    />
                                  </div>
                                  {errors.name && (
                                    <span className="text-[9px] text-red-500 font-sans tracking-[0.1em] uppercase pl-2">{errors.name}</span>
                                  )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <div className="relative flex items-center w-full">
                                    <div className="absolute left-5 text-[#b89b74]">
                                      <Mail className="w-[18px] h-[18px] stroke-[1.5]" />
                                    </div>
                                    <input
                                      type="email"
                                      name="email"
                                      value={formData.email}
                                      onChange={handleInputChange}
                                      placeholder="YOUR EMAIL *"
                                      className={`w-full h-[72px] bg-white border ${
                                        errors.email ? 'border-red-500' : 'border-[#e5ded6] focus:border-[#b89b74]'
                                      } rounded-[10px] pl-14 pr-5 text-xs font-sans tracking-[0.2em] font-bold text-[#111111] placeholder:text-[#b89b74] outline-none transition-colors uppercase`}
                                    />
                                  </div>
                                  {errors.email && (
                                    <span className="text-[9px] text-red-500 font-sans tracking-[0.1em] uppercase pl-2">{errors.email}</span>
                                  )}
                                </div>
                              </div>

                              {/* Row 2: Phone and Subject */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1.5">
                                  <div className="relative flex items-center w-full">
                                    <div className="absolute left-5 text-[#b89b74]">
                                      <Phone className="w-[18px] h-[18px] stroke-[1.5]" />
                                    </div>
                                    <input
                                      type="text"
                                      name="phone"
                                      value={formData.phone}
                                      onChange={handleInputChange}
                                      placeholder="PHONE NUMBER *"
                                      className={`w-full h-[72px] bg-white border ${
                                        errors.phone ? 'border-red-500' : 'border-[#e5ded6] focus:border-[#b89b74]'
                                      } rounded-[10px] pl-14 pr-5 text-xs font-sans tracking-[0.2em] font-bold text-[#111111] placeholder:text-[#b89b74] outline-none transition-colors uppercase`}
                                    />
                                  </div>
                                  {errors.phone && (
                                    <span className="text-[9px] text-red-500 font-sans tracking-[0.1em] uppercase pl-2">{errors.phone}</span>
                                  )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <div className="relative flex items-center w-full">
                                    <div className="absolute left-5 text-[#b89b74]">
                                      <Pencil className="w-[18px] h-[18px] stroke-[1.5]" />
                                    </div>
                                    <input
                                      type="text"
                                      name="subject"
                                      value={formData.subject}
                                      onChange={handleInputChange}
                                      placeholder="SUBJECT *"
                                      className={`w-full h-[72px] bg-white border ${
                                        errors.subject ? 'border-red-500' : 'border-[#e5ded6] focus:border-[#b89b74]'
                                      } rounded-[10px] pl-14 pr-5 text-xs font-sans tracking-[0.2em] font-bold text-[#111111] placeholder:text-[#b89b74] outline-none transition-colors uppercase`}
                                    />
                                  </div>
                                  {errors.subject && (
                                    <span className="text-[9px] text-red-500 font-sans tracking-[0.1em] uppercase pl-2">{errors.subject}</span>
                                  )}
                                </div>
                              </div>

                              {/* Row 3: Message Textarea */}
                              <div className="flex flex-col gap-1.5">
                                <div className="relative flex w-full">
                                  <div className="absolute left-5 top-[26px] text-[#b89b74]">
                                    <MessageSquare className="w-[18px] h-[18px] stroke-[1.5]" />
                                  </div>
                                  <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    placeholder="WRITE MESSAGE *"
                                    className={`w-full h-[220px] bg-white border ${
                                      errors.message ? 'border-red-500' : 'border-[#e5ded6] focus:border-[#b89b74]'
                                    } rounded-[10px] pl-14 pr-5 pt-6 text-xs font-sans tracking-[0.2em] font-bold text-[#111111] placeholder:text-[#b89b74] outline-none transition-colors resize-none uppercase leading-relaxed`}
                                  />
                                </div>
                                {errors.message && (
                                  <span className="text-[9px] text-red-500 font-sans tracking-[0.1em] uppercase pl-2">{errors.message}</span>
                                )}
                              </div>

                              {/* Math Captcha and Submit Button Row */}
                              <div className="flex flex-col md:flex-row items-stretch gap-6 mt-2">
                                {/* Captcha Card */}
                                <div className="relative flex items-center px-6 h-[72px] bg-white border border-[#e5ded6] rounded-[10px] w-full md:w-[340px] gap-4">
                                  <div className="text-[#b89b74] flex-shrink-0">
                                    <Shield className="w-5 h-5 stroke-[1.5]" />
                                  </div>
                                  <div className="flex flex-col flex-grow min-w-0">
                                    <span className="text-[9px] font-sans font-bold tracking-[0.15em] text-[#b89b74] uppercase select-none">
                                      WHAT IS {captcha.num1} + {captcha.num2} ?
                                    </span>
                                    <input
                                      type="text"
                                      value={userCaptcha}
                                      onChange={(e) => {
                                        setUserCaptcha(e.target.value);
                                        if (captchaError) setCaptchaError('');
                                      }}
                                      placeholder="Your answer"
                                      className="w-full bg-transparent border-none outline-none text-xs font-sans tracking-[0.05em] text-[#111111] placeholder:text-[#b89b74]/60 p-0 h-6 font-bold"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={generateCaptcha}
                                    className="text-[#b89b74] hover:text-[#111111] transition-all p-1 cursor-pointer flex items-center justify-center hover:rotate-180 duration-500 flex-shrink-0"
                                    title="Refresh Captcha"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5 stroke-[1.5]" />
                                  </button>
                                  {captchaError && (
                                    <span className="absolute -bottom-5 left-2 text-[9px] text-red-500 font-sans tracking-[0.1em] uppercase">
                                      {captchaError}
                                    </span>
                                  )}
                                </div>

                                {/* Send Message Button */}
                                <button
                                  type="submit"
                                  disabled={isSubmitting}
                                  className="group relative flex items-center justify-between px-8 h-[72px] bg-[#1a1a1a] rounded-[10px] text-white hover:bg-[#2a2a2a] transition-all cursor-pointer w-full md:flex-grow md:w-auto disabled:opacity-50 select-none"
                                >
                                  <span className="text-xs font-sans tracking-[0.2em] font-bold text-[#b89b74] uppercase">
                                    {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
                                  </span>
                                  <svg className="w-6 h-6 stroke-[1.5] text-[#b89b74] transform group-hover:translate-x-2 transition-transform duration-300 fill-none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                                  </svg>
                                </button>
                              </div>
                            </motion.form>
                          ) : (
                            <motion.div
                              key="studio-success-message"
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-center py-16 px-8 flex flex-col items-center justify-center bg-white border border-[#e5ded6] rounded-[10px] shadow-sm max-w-xl mx-auto"
                            >
                              <div className="w-14 h-14 rounded-full border border-[#b89b74] flex items-center justify-center text-[#b89b74] mb-6">
                                <svg className="w-6 h-6 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </div>
                              <h3 className="text-3xl font-cormorant font-light text-[#111111] italic mb-4">Inquiry Received</h3>
                              <p className="text-xs font-sans text-[#666666] leading-relaxed max-w-[380px] mx-auto tracking-wide">
                                Thank you for reaching out to The AD Efffects. Your message has been sent to our curation team. We will review your details and respond within 48 business hours.
                              </p>
                              <button
                                type="button"
                                onClick={() => setIsSubmitted(false)}
                                className="text-[11px] uppercase tracking-[0.2em] text-[#b89b74] hover:text-[#111111] transition-colors pt-6 border-b border-[#b89b74] pb-0.5 hover:border-[#111111] cursor-pointer font-bold mt-4"
                              >
                                Send another message
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                    </div>

                    {/* Bottom coordinates bar */}
                    <div className="w-full h-[1px] bg-[#e5ded6] mt-24 mb-10" />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full">
                      {/* Studio Location */}
                      <div className="flex items-start gap-4">
                        <MapPin className="w-[18px] h-[18px] text-[#b89b74] stroke-[1.5] mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-sans tracking-[0.1em] text-[#b89b74] font-semibold uppercase">Studio Location</span>
                          <span className="text-[11px] font-sans text-[#666666] mt-1 leading-normal">
                            123 Design Street<br />New York, NY 10001
                          </span>
                        </div>
                      </div>

                      {/* Email Us */}
                      <div className="flex items-start gap-4">
                        <Mail className="w-[18px] h-[18px] text-[#b89b74] stroke-[1.5] mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-sans tracking-[0.1em] text-[#b89b74] font-semibold uppercase">Email Us</span>
                          <a href="mailto:hello@thestudio.com" className="text-[11px] font-sans text-[#666666] mt-1 hover:text-[#b89b74] transition-colors leading-normal">
                            hello@thestudio.com
                          </a>
                        </div>
                      </div>

                      {/* Call Us */}
                      <div className="flex items-start gap-4">
                        <Phone className="w-[18px] h-[18px] text-[#b89b74] stroke-[1.5] mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-sans tracking-[0.1em] text-[#b89b74] font-semibold uppercase">Call Us</span>
                          <a href="tel:+12125550199" className="text-[11px] font-sans text-[#666666] mt-1 hover:text-[#b89b74] transition-colors leading-normal font-sans">
                            +1 (212) 555-0199
                          </a>
                        </div>
                      </div>

                      {/* Follow Us */}
                      <div className="flex flex-col">
                        <span className="text-[11px] font-sans tracking-[0.1em] text-[#111111] font-semibold uppercase">Follow Us</span>
                        <div className="flex items-center gap-4 mt-2 text-[#666666]">
                          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#b89b74] transition-colors">
                            <svg className="w-5 h-5 fill-none stroke-[1.5]" stroke="currentColor" viewBox="0 0 24 24">
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                            </svg>
                          </a>
                          <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#b89b74] transition-colors">
                            <svg className="w-5 h-5 fill-none stroke-[1.5]" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 0 0-3.32 19.44c-.02-.93-.04-2.08.18-3.05l1.45-6.13s-.36-.72-.36-1.78c0-1.67.97-2.92 2.18-2.92 1.03 0 1.53.77 1.53 1.7 0 1.03-.66 2.58-1 4.02-.29 1.21.6 2.2 1.8 2.2 2.16 0 3.82-2.28 3.82-5.57 0-2.9-2.09-4.94-5.08-4.94-3.46 0-5.5 2.59-5.5 5.28 0 1.04.4 2.16.9 2.77.1.12.11.23.08.35l-.34 1.38c-.06.22-.19.3-.43.19-1.57-.73-2.55-3.03-2.55-4.88 0-3.98 2.89-7.63 8.33-7.63 4.37 0 7.78 3.12 7.78 7.29 0 4.35-2.74 7.85-6.55 7.85-1.28 0-2.48-.67-2.9-1.46l-.78 2.99c-.28 1.09-.9 2.45-1.37 3.22A10 10 0 1 0 12 2z" />
                            </svg>
                          </a>
                          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#b89b74] transition-colors">
                            <svg className="w-5 h-5 fill-none stroke-[1.5]" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                              <rect x="2" y="9" width="4" height="12" />
                              <circle cx="4" cy="4" r="2" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
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
