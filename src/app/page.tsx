'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { projectsData, Project } from '@/data';

export default function Home() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setActiveProject(null); // Clear active project to return to tab root
  };

  return (
    <>
      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="w-full min-h-[70vh] bg-white flex flex-col items-center">
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
                    className="overflow-hidden bg-[#fafafa] border border-border-custom aspect-[3/4]"
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
                    <div className="overflow-hidden bg-[#fafafa] border border-border-custom aspect-[3/4] w-full">
                      <img 
                        src="https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=80" 
                        alt="Stone texture" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1.2s] ease-out"
                      />
                    </div>
                    <div className="overflow-hidden bg-[#fafafa] border border-border-custom aspect-[3/4] w-full">
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
                    className="overflow-hidden bg-[#fafafa] border border-border-custom aspect-[16/10] w-full max-w-7xl px-6 md:px-12 mx-auto"
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

              {/* BLOG TAB */}
              {activeTab === 'blog' && (
                <div 
                  className="w-full flex flex-col items-center"
                  style={{ marginTop: '48px', marginBottom: '80px' }} // Exact 48px top gap
                >
                  <div className="space-y-4 text-center w-full" style={{ marginBottom: '64px' }}> {/* Exact 64px gap to articles */}
                    <span className="text-[9px] uppercase tracking-[0.35em] text-accent font-semibold block font-sans"><span className="mr-[-0.35em]">Journal</span></span>
                    <h2 className="text-3xl font-cormorant font-light text-primary italic">Latest Readings</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-center w-full max-w-3xl px-6 mx-auto">
                    <div className="space-y-4 border-b border-border-custom/60 pb-6 md:border-b-0 md:pb-0 flex flex-col items-center">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-accent font-semibold">
                        <span className="mr-[-0.2em]">June 2026</span>
                      </span>
                      <h3 className="text-lg font-cormorant font-light text-primary hover:text-accent transition-colors duration-500 cursor-pointer">
                        The Art of Travertine Detailing
                      </h3>
                      <p className="text-xs text-secondary font-light leading-[1.7] max-w-[320px] mx-auto">
                        Understanding the natural texture, scaling, and finishing of classic travertine stone elements in spatial design.
                      </p>
                    </div>
                    <div className="space-y-4 flex flex-col items-center">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-accent font-semibold">
                        <span className="mr-[-0.2em]">May 2026</span>
                      </span>
                      <h3 className="text-lg font-cormorant font-light text-primary hover:text-accent transition-colors duration-500 cursor-pointer">
                        Light, Void, and Proportion
                      </h3>
                      <p className="text-xs text-secondary font-light leading-[1.7] max-w-[320px] mx-auto">
                        A study on shadow projection and minimalist window spacing in Scandinavian and Japanese architecture.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTACT TAB */}
              {activeTab === 'contact' && (
                <div 
                  className="w-full flex flex-col items-center"
                  style={{ marginTop: '48px', marginBottom: '80px' }} // Exact 48px top gap
                >
                  <div className="space-y-4 text-center w-full" style={{ marginBottom: '48px' }}> {/* Exact 48px gap to coordinates */}
                    <span className="text-[9px] uppercase tracking-[0.35em] text-accent font-semibold block"><span className="mr-[-0.35em]">Reach Us</span></span>
                    <h2 className="text-3xl font-cormorant font-light text-primary italic">Coordinates</h2>
                  </div>
                  <div className="space-y-12 font-light text-center w-full flex flex-col items-center mx-auto">
                    <div className="space-y-2 flex flex-col items-center">
                      <span className="text-[9px] uppercase tracking-[0.3em] text-accent block font-semibold">
                        <span className="mr-[-0.3em]">Studio Address</span>
                      </span>
                      <p className="text-xs text-secondary leading-relaxed">
                        14 Strandgade, 1401<br />
                        Copenhagen, Denmark
                      </p>
                    </div>
                    <div className="space-y-2 flex flex-col items-center">
                      <span className="text-[9px] uppercase tracking-[0.3em] text-accent block font-semibold">
                        <span className="mr-[-0.3em]">General Inquiries</span>
                      </span>
                      <a href="mailto:hello@adefffects.com" className="text-xs text-secondary hover:text-accent transition-colors block">
                        hello@adefffects.com
                      </a>
                      <a href="tel:+4533120000" className="text-xs text-secondary hover:text-accent transition-colors block mt-1">
                        +45 3312 0000
                      </a>
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
      className="group relative cursor-pointer overflow-hidden bg-gray-50 border border-border-custom w-full aspect-[3/4]"
    >
      <img
        src={project.image}
        alt={project.title}
        className="w-full h-full object-cover transition-transform duration-[1.2s] ease-[0.25,1,0.5,1] group-hover:scale-[1.02]"
      />
      
      {/* Whiteout Hover Overlay - Premium Slide-Up Reveal */}
      <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out flex items-center justify-center">
        <h3 className="text-base font-cormorant font-light text-[#1f3d51] tracking-[0.2em] uppercase text-center px-4 translate-y-3 group-hover:translate-y-0 transition-transform duration-700 ease-out">
          {project.title}
        </h3>
      </div>
    </motion.div>
  );
}
