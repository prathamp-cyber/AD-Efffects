'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { projectsData, Project } from '@/data';
import { MapPin, Mail, Clock, Phone } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectType: 'Residential',
    message: '',
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const handleProjectTypeChange = (type: string) => {
    setFormData((prev) => ({ ...prev, projectType: type }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; email?: string; message?: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        projectType: 'Residential',
        message: '',
      });
    }, 1500);
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
                      AD Efffects is a bespoke interior design studio creating thoughtfully crafted homes and spaces. Our work is rooted in clarity of planning, depth of detail, and a deep respect for material, craft, and context. Every project is approached as a collaboration — designed with intent, executed with rigour, and shaped around the people who live within it.
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
                      Founded with a dedication to spatial purity, AD Efffects focuses on modern minimalism, tactile materiality, and silent luxury. We reject excess to design enduring, peaceful sanctuaries.
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
                  {/* Title block */}
                  <div className="space-y-4 text-center w-full" style={{ marginBottom: '40px' }}> {/* 40px gap below title */}
                    <span className="text-[9px] uppercase tracking-[0.35em] text-accent font-semibold block font-sans"><span className="mr-[-0.35em]">Get In Touch</span></span>
                    <h2 className="text-4xl md:text-5xl font-cormorant font-light text-primary italic">Contact the Studio</h2>
                  </div>

                  {/* Intro paragraph - centered with matching width & font styling as "Our Story" */}
                  <div 
                    className="max-w-[700px] px-6 text-center text-primary text-base md:text-lg leading-[1.8] font-light mx-auto"
                    style={{ marginBottom: '56px' }}
                  >
                    <p>
                      Whether you are looking to design a bespoke residential sanctuary, curate a tactile workspace, or discuss an artistic collaboration, we welcome your inquiries. 
                    </p>
                  </div>

                  {/* Split grid for form and coordinates, matching max-w-7xl px-6 md:px-12 bounds */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-stretch w-full max-w-7xl px-6 md:px-12 mx-auto">
                    
                    {/* Left Column: Coordinates & Studio Info (6 cols) */}
                    <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
                      
                      {/* Coordinates details */}
                      <div className="space-y-10 text-left flex flex-col justify-center">
                        
                        {/* Studio Address */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-accent stroke-[1.5]" />
                            <span className="text-[15px] font-cormorant italic text-primary tracking-wide">
                              Studio Address
                            </span>
                          </div>
                          <div className="pl-7">
                            <p className="text-[15px] md:text-[16px] text-secondary leading-relaxed font-light">
                              14 Strandgade, 1401<br />
                              Copenhagen, Denmark
                            </p>
                          </div>
                        </div>

                        {/* General Inquiries */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-accent stroke-[1.5]" />
                            <span className="text-[15px] font-cormorant italic text-primary tracking-wide">
                              General Inquiries
                            </span>
                          </div>
                          <div className="pl-7 space-y-1">
                            <a href="mailto:hello@adefffects.com" className="text-[15px] md:text-[16px] text-secondary hover:text-accent transition-colors block font-light">
                              hello@adefffects.com
                            </a>
                            <a href="tel:+4533120000" className="text-[15px] md:text-[16px] text-secondary hover:text-accent transition-colors flex items-center gap-2 mt-2 font-light">
                              <Phone className="w-3.5 h-3.5 text-accent stroke-[1.25]" />
                              <span>+45 3312 0000</span>
                            </a>
                          </div>
                        </div>

                        {/* Opening Hours */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-accent stroke-[1.5]" />
                            <span className="text-[15px] font-cormorant italic text-primary tracking-wide">
                              Opening Hours
                            </span>
                          </div>
                          <div className="pl-7">
                            <p className="text-[15px] md:text-[16px] text-secondary leading-relaxed font-light">
                              Monday — Friday<br />
                              09:00 — 17:00 CET
                            </p>
                          </div>
                        </div>

                      </div>

                      {/* Studio Aesthetic Photo (runs full height next to text info) */}
                      <div className="relative min-h-[400px] lg:min-h-0 h-full overflow-hidden rounded-[8px] border border-border-custom">
                        <img 
                          src="https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=80" 
                          alt="Studio office space" 
                          className="absolute inset-0 w-full h-full object-cover grayscale opacity-90 hover:scale-102 hover:grayscale-0 transition-all duration-700 ease-out"
                        />
                      </div>
                    </div>

                    {/* Right Column: Contact Form Card System (6 cols) */}
                    <div className="lg:col-span-6 bg-card-bg p-8 md:p-10 border border-card-border rounded-[10px] shadow-[0_4px_30px_rgba(0,0,0,0.015)] transition-colors duration-300">
                      <AnimatePresence mode="wait">
                        {!isSubmitted ? (
                          <motion.form
                            key="contact-form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            onSubmit={handleSubmit}
                            className="space-y-6 pt-6"
                          >
                            {/* Project Type Selection */}
                            <div className="space-y-4">
                              <span className="text-[15px] font-cormorant italic text-primary/80 block">
                                Interest / Project Type
                              </span>
                              <div className="flex flex-wrap gap-3 pt-1">
                                {['Residential', 'Commercial', 'Consultation', 'Bespoke Craft'].map((type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => handleProjectTypeChange(type)}
                                    className={`px-[20px] py-[10px] text-[11px] md:text-[12px] uppercase tracking-[0.18em] border rounded-[20px] transition-all duration-300 cursor-pointer ${
                                      formData.projectType === type
                                        ? 'bg-accent border-accent text-white font-medium shadow-sm'
                                        : 'border-border-custom bg-transparent text-secondary/70 hover:border-accent hover:text-accent font-light'
                                    }`}
                                  >
                                    <span className="mr-[-0.18em]">{type}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Name Input */}
                            <div className="flex flex-col space-y-2">
                              <label 
                                htmlFor="name" 
                                className={`text-[15px] md:text-[16px] font-cormorant italic block transition-colors duration-300 ${
                                  focusedField === 'name' ? 'text-accent' : 'text-primary/80'
                                }`}
                              >
                                Your Name *
                              </label>
                              <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                                onChange={handleInputChange}
                                placeholder="Enter your name"
                                className="w-full bg-transparent border-b border-border-custom focus:border-accent py-3 text-[15px] md:text-[16px] text-primary placeholder:italic placeholder:text-secondary/30 outline-none transition-all duration-300 font-light"
                              />
                              {errors.name && (
                                <span className="text-xs text-red-500 font-light block pt-1">{errors.name}</span>
                              )}
                            </div>

                            {/* Email Input */}
                            <div className="flex flex-col space-y-2">
                              <label 
                                htmlFor="email" 
                                className={`text-[15px] md:text-[16px] font-cormorant italic block transition-colors duration-300 ${
                                  focusedField === 'email' ? 'text-accent' : 'text-primary/80'
                                }`}
                              >
                                Email Address *
                              </label>
                              <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                onChange={handleInputChange}
                                placeholder="Enter your email address"
                                className="w-full bg-transparent border-b border-border-custom focus:border-accent py-3 text-[15px] md:text-[16px] text-primary placeholder:italic placeholder:text-secondary/30 outline-none transition-all duration-300 font-light"
                              />
                              {errors.email && (
                                <span className="text-xs text-red-500 font-light block pt-1">{errors.email}</span>
                              )}
                            </div>

                            {/* Message Area */}
                            <div className="flex flex-col space-y-2">
                              <label 
                                htmlFor="message" 
                                className={`text-[15px] md:text-[16px] font-cormorant italic block transition-colors duration-300 ${
                                  focusedField === 'message' ? 'text-accent' : 'text-primary/80'
                                }`}
                              >
                                Tell us about your project *
                              </label>
                              <textarea
                                id="message"
                                name="message"
                                rows={4}
                                value={formData.message}
                                onFocus={() => setFocusedField('message')}
                                onBlur={() => setFocusedField(null)}
                                onChange={handleInputChange}
                                placeholder="Describe the space, timeline, or scope of your commission..."
                                className="w-full bg-transparent border-b border-border-custom focus:border-accent py-3 text-[15px] md:text-[16px] text-primary placeholder:italic placeholder:text-secondary/30 outline-none transition-all duration-300 resize-y min-h-[120px] font-light leading-relaxed"
                              />
                              {errors.message && (
                                <span className="text-xs text-red-500 font-light block pt-1">{errors.message}</span>
                              )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary border border-primary text-white px-[32px] py-[16px] text-[11px] md:text-[12px] uppercase tracking-[0.25em] font-semibold rounded-[8px] hover:bg-accent hover:border-accent hover:shadow-[0_4px_25px_rgba(198,182,164,0.3)] transition-all duration-500 cursor-pointer disabled:opacity-50 select-none text-center"
                              >
                                {isSubmitting ? 'SENDING...' : 'SEND INQUIRY'}
                              </button>
                            </div>
                          </motion.form>
                        ) : (
                          <motion.div
                            key="success-message"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="text-center py-16 px-4 space-y-6 flex flex-col items-center justify-center"
                          >
                            <div className="w-16 h-16 rounded-full border border-accent/40 flex items-center justify-center text-accent mb-2">
                              <svg className="w-6 h-6 stroke-[1.25]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </div>
                            <h3 className="text-2xl font-cormorant font-light text-primary italic">Inquiry Received</h3>
                            <p className="text-xs text-secondary leading-relaxed max-w-[340px] mx-auto font-light">
                              Thank you for reaching out to AD Efffects. Your message has been sent to our studio curation team. We will review your details and respond within 48 business hours.
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsSubmitted(false)}
                              className="text-[9px] uppercase tracking-[0.25em] text-accent hover:text-primary transition-colors pt-4 border-b border-accent pb-0.5 hover:border-primary cursor-pointer font-semibold"
                            >
                              Send another message
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
