import type { Language } from "../i18n/locale";
export type Copy = Record<Language, string>;
export interface Studio {
  slug: string;
  layout: string;
  palette: { paper: string; ink: string; accent: string };
  brand: Copy;
  sector: Copy;
  headline: Copy;
  intro: Copy;
  action: Copy;
  heroAlt: Copy;
  storyTitle: Copy;
  story: Copy;
  detailAlt: Copy;
  facts: { label: Copy; value: Copy }[];
  widget: {
    type: "calculator" | "session" | "explore";
    title: Copy;
    hint: Copy;
    label: Copy;
    unit?: Copy;
    quantity?: Copy;
    min?: number;
    max?: number;
    initial?: number;
    slots?: string[];
    options: {
      name: Copy;
      metric: Copy;
      text: Copy;
      rate?: number;
      base?: number;
    }[];
  };
  guideTitle: Copy;
  guide: { q: Copy; a: Copy }[];
}
const files = import.meta.glob<Studio>("./studios/*.json", {
  eager: true,
  import: "default",
});
export const studios = Object.values(files);
export const legacySlugs = [
  "architecture",
  "detailing",
  "furniture",
  "warehouse-saas",
  "dental",
  "real-estate",
];
