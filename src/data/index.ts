export interface Project {
  id: string;
  title: string;
  category: string;
  location: string;
  image: string;
  year: string;
  size?: string;
  detailImages: string[];
}

export const projectsData: Project[] = [
  {
    id: "01",
    title: "Anayasa",
    category: "Residential Architecture",
    location: "Bengaluru, India",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    year: "2024",
    size: "350 m²",
    detailImages: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "02",
    title: "Zephyr @ 17",
    category: "Modern Apartment",
    location: "Mumbai, India",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
    year: "2023",
    size: "220 m²",
    detailImages: [
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "03",
    title: "The Rose Residence",
    category: "Bespoke Workspace",
    location: "Bengaluru, India",
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
    year: "2024",
    size: "180 m²",
    detailImages: [
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "04",
    title: "Ryka",
    category: "Weekend Home",
    location: "Alibaug, India",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    year: "2023",
    size: "420 m²",
    detailImages: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1600585154166-d8897c8f930d?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "05",
    title: "Elysian",
    category: "Penthouse Curation",
    location: "Bengaluru, India",
    image: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80",
    year: "2024",
    size: "310 m²",
    detailImages: [
      "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "06",
    title: "Aura",
    category: "Hospitality Curation",
    location: "Goa, India",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
    year: "2023",
    size: "260 m²",
    detailImages: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=85"
    ]
  }
];
