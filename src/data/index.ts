import siteConfigJson from './siteConfig.json';

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

export interface PressItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

export interface StorySection {
  title: string;
  paragraphs: string[];
  images: string[];
}

export interface InfluenceSection {
  title: string;
  description: string;
  image: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
}

export interface SiteConfig {
  brandStatement: string;
  story: StorySection;
  influence: InfluenceSection;
  press: PressItem[];
  projects: Project[];
  blogs?: BlogPost[];
  isWebsiteOffline?: boolean;
}

export const defaultSiteConfig = siteConfigJson as unknown as SiteConfig;
export const projectsData = defaultSiteConfig.projects;
export const pressData = defaultSiteConfig.press;
export const blogsData = defaultSiteConfig.blogs || [];
