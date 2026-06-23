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
  source: string;
  year: string;
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

export interface SiteConfig {
  brandStatement: string;
  story: StorySection;
  influence: InfluenceSection;
  press: PressItem[];
  projects: Project[];
}

export const defaultSiteConfig = siteConfigJson as SiteConfig;
export const projectsData = defaultSiteConfig.projects;
