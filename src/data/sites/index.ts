import { studios } from "../studios";
import type { SiteExpansion } from "../site-schema";
import { realEstateSite } from "./real-estate";
import { architectureSite } from "./architecture";
import { detailingSite } from "./detailing";
import { furnitureSite } from "./furniture";
import { warehouseSaasSite } from "./warehouse-saas";
import { dentalSite } from "./dental";
import { buildStudioExpansion, type StudioRichProfile } from "./studio-builder";
import { studiosPart1 } from "./studios-1";
import { studiosPart2 } from "./studios-2";
import { studiosPart3 } from "./studios-3";
import { studiosPart4 } from "./studios-4";
import { studiosPart5 } from "./studios-5";

const studioProfiles: StudioRichProfile[] = [
  ...studiosPart1,
  ...studiosPart2,
  ...studiosPart3,
  ...studiosPart4,
  ...studiosPart5,
];

const profileBySlug = new Map(studioProfiles.map((p) => [p.slug, p]));

const builtStudios: SiteExpansion[] = studios.map((studio) => {
  const profile = profileBySlug.get(studio.slug);
  if (!profile) {
    throw new Error(`Missing multi-page profile for studio: ${studio.slug}`);
  }
  return buildStudioExpansion(studio, profile);
});

export const allSites: SiteExpansion[] = [
  architectureSite,
  detailingSite,
  furnitureSite,
  warehouseSaasSite,
  dentalSite,
  realEstateSite,
  ...builtStudios,
];

export const siteBySlug: Record<string, SiteExpansion> = Object.fromEntries(
  allSites.map((s) => [s.slug, s]),
);

export function getSite(slug: string): SiteExpansion {
  const site = siteBySlug[slug];
  if (!site) throw new Error(`Unknown site slug: ${slug}`);
  return site;
}

/**
 * Total unique navigable pages per concept:
 * 1 Home + 1 Catalog + 4 Catalog Details + 1 Projects + 3 Project Details
 * + 1 Partners + 1 Request + 1 About + 1 Team + 1 Journal + 3 Journal Details
 * + 1 Program + 1 Contact + 1 Careers = 21 static HTML pages per site (covering all 13 page templates)!
 */
export function pageCountFor(site: SiteExpansion): number {
  return (
    11 +
    site.catalog.items.length +
    site.projects.items.length +
    site.journal.posts.length
  );
}
