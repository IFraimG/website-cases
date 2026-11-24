import type { Copy } from "./studios";

export const c = (en: string, ru: string): Copy => ({ en, ru });

export type InnerView =
  | "catalog"
  | "catalog-detail"
  | "projects"
  | "project-detail"
  | "partners"
  | "request"
  | "about"
  | "team"
  | "journal"
  | "journal-detail"
  | "program"
  | "contact"
  | "careers";

export interface SiteTheme {
  paper: string;
  ink: string;
  accent: string;
  surface: string;
  surfaceStrong: string;
  edge: string;
  btnBg: string;
  btnFg: string;
  displayFont: "serif" | "sans";
  radius: string;
  dark?: boolean;
}

export interface SiteNavLabels {
  home: Copy;
  catalog: Copy;
  projects: Copy;
  partners: Copy;
  request: Copy;
  about: Copy;
  team: Copy;
  journal: Copy;
  program: Copy;
  contact: Copy;
  careers: Copy;
}

export interface CatalogItem {
  id: string;
  category: string;
  badge: Copy;
  title: Copy;
  subtitle: Copy;
  price: Copy;
  priceNum: number;
  location: Copy;
  image: string;
  gallery: string[];
  specs: { label: Copy; value: Copy }[];
  summary: Copy;
  overview: Copy;
  features: Copy[];
  advisorIndex: number;
}

export interface ProjectItem {
  id: string;
  category: string;
  status: Copy;
  title: Copy;
  location: Copy;
  year: string;
  metric: Copy;
  image: string;
  summary: Copy;
  overview: Copy;
  highlights: { label: Copy; value: Copy }[];
  formats: { title: Copy; detail: Copy }[];
  planTitle: Copy;
  planSubtitle: Copy;
  planRows: { stage: Copy; timing: Copy; share: Copy; note: Copy }[];
}

export interface TeamMember {
  name: Copy;
  role: Copy;
  experience: Copy;
  specialty: Copy;
  bio: Copy;
  photo: string;
  email: string;
  phone: string;
}

export interface JournalPost {
  id: string;
  category: string;
  date: Copy;
  readTime: Copy;
  title: Copy;
  excerpt: Copy;
  image: string;
  authorIndex: number;
  takeaways: Copy[];
  sections: { heading: Copy; body: Copy }[];
}

export interface JobOpening {
  id: string;
  department: string;
  title: Copy;
  location: Copy;
  type: Copy;
  level: Copy;
  salary: Copy;
  summary: Copy;
  requirements: Copy[];
}

export interface SiteExpansion {
  slug: string;
  brand: Copy;
  sector: Copy;
  tagline: Copy;
  theme: SiteTheme;
  nav: SiteNavLabels;
  media: {
    hero: string;
    secondary: string;
    studio: string;
    gallery: string[];
  };
  catalog: {
    eyebrow: Copy;
    title: Copy;
    lead: Copy;
    searchPlaceholder: Copy;
    categories: { id: string; label: Copy }[];
    items: CatalogItem[];
  };
  projects: {
    eyebrow: Copy;
    title: Copy;
    lead: Copy;
    categories: { id: string; label: Copy }[];
    items: ProjectItem[];
  };
  partners: {
    eyebrow: Copy;
    title: Copy;
    lead: Copy;
    pillars: { title: Copy; text: Copy }[];
    opportunities: {
      title: Copy;
      metric: Copy;
      text: Copy;
      image: string;
    }[];
    advisorQuote: Copy;
    whyTitle: Copy;
    whyPoints: { title: Copy; text: Copy }[];
    ctaLabel: Copy;
  };
  request: {
    eyebrow: Copy;
    title: Copy;
    lead: Copy;
    trustBadges: Copy[];
    formTitle: Copy;
    typeLabel: Copy;
    typeOptions: Copy[];
    scopeLabel: Copy;
    scopePlaceholder: Copy;
    budgetLabel: Copy;
    budgetPlaceholder: Copy;
    submitLabel: Copy;
    whyTitle: Copy;
    whyPoints: Copy[];
    helpTitle: Copy;
    helpNote: Copy;
  };
  about: {
    eyebrow: Copy;
    title: Copy;
    lead: Copy;
    manifesto: Copy;
    stats: { value: Copy; label: Copy }[];
    mission: Copy;
    vision: Copy;
    values: { title: Copy; text: Copy }[];
    milestones: { year: string; title: Copy; text: Copy }[];
  };
  team: {
    eyebrow: Copy;
    title: Copy;
    lead: Copy;
    cultureTitle: Copy;
    cultureLead: Copy;
    members: TeamMember[];
  };
  journal: {
    eyebrow: Copy;
    title: Copy;
    lead: Copy;
    categories: { id: string; label: Copy }[];
    posts: JournalPost[];
  };
  program: {
    eyebrow: Copy;
    title: Copy;
    lead: Copy;
    pillars: { title: Copy; text: Copy }[];
    steps: { title: Copy; text: Copy }[];
    ctaTitle: Copy;
    ctaLead: Copy;
    formTitle: Copy;
    interestLabel: Copy;
    interestOptions: Copy[];
  };
  contact: {
    eyebrow: Copy;
    title: Copy;
    lead: Copy;
    phone: string;
    email: string;
    address: Copy;
    hours: Copy;
    district: Copy;
    coordinates: string;
    transit: Copy;
    subjects: Copy[];
  };
  careers: {
    eyebrow: Copy;
    title: Copy;
    lead: Copy;
    perks: { title: Copy; text: Copy }[];
    departments: { id: string; label: Copy }[];
    openings: JobOpening[];
  };
}
