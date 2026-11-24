import type { Studio, Copy } from "../studios";
import { c, type SiteExpansion, type SiteNavLabels } from "../site-schema";

export interface StudioRichProfile {
  slug: string;
  dark?: boolean;
  displayFont: "serif" | "sans";
  radius: string;
  nav: Omit<SiteNavLabels, "home">;
  catalogLead: Copy;
  /** 3 category labels for options 0..2 + 1 flagship category for item 4 */
  cats: [string, Copy][];
  /** [priceCopy, priceNum, badge, location, spec4Label, spec4Val, features(4)] for each of the 4 items (0..2 extend studio.widget.options, 3 is flagship extra) */
  itemExtras: [Copy, number, Copy, Copy, Copy, Copy, Copy[]][];
  extraItem: { id: string; cat: string; title: Copy; sub: Copy; summary: Copy; overview: Copy };
  projectsLead: Copy;
  projCats: [string, Copy][];
  /** 3 projects: [id, cat, status, title, location, year, metric, summary, overview, highlights(2), formats(2)] */
  projects: [string, string, Copy, Copy, Copy, string, Copy, Copy, Copy, [Copy, Copy][], [Copy, Copy][]][];
  partners: {
    eyebrow: Copy;
    title: Copy;
    lead: Copy;
    pillars: [Copy, Copy][];
    opps: [Copy, Copy, Copy][];
    quote: Copy;
    cta: Copy;
  };
  request: {
    eyebrow: Copy;
    title: Copy;
    lead: Copy;
    badges: Copy[];
    typeLabel: Copy;
    types: Copy[];
    scopeLabel: Copy;
    scopePh: Copy;
    budgetLabel: Copy;
    budgetPh: Copy;
    submit: Copy;
    why: Copy[];
    help: Copy;
  };
  about: {
    title: Copy;
    manifesto: Copy;
    stats: [Copy, Copy][];
    mission: Copy;
    vision: Copy;
    values: [Copy, Copy][];
    milestones: [string, Copy, Copy][];
  };
  /** 4 specialists: [name, role, exp, spec, bio, photoNum] */
  team: {
    lead: Copy;
    culture: Copy;
    cultureLead: Copy;
    members: [Copy, Copy, Copy, Copy, Copy, number][];
  };
  /** 3 journal posts: [id, cat, date, read, title, excerpt, takeaways(3), sections(3)] */
  journal: {
    lead: Copy;
    cats: [string, Copy][];
    posts: [string, string, Copy, Copy, Copy, Copy, Copy[], [Copy, Copy][]][];
  };
  program: {
    eyebrow: Copy;
    title: Copy;
    lead: Copy;
    pillars: [Copy, Copy][];
    steps: [Copy, Copy][];
    ctaTitle: Copy;
    ctaLead: Copy;
    interestLabel: Copy;
    interests: Copy[];
  };
  contact: {
    title: Copy;
    lead: Copy;
    phone: string;
    email: string;
    address: Copy;
    hours: Copy;
    district: Copy;
    coords: string;
    transit: Copy;
    subjects: Copy[];
  };
  careers: {
    title: Copy;
    lead: Copy;
    perks: [Copy, Copy][];
    depts: [string, Copy][];
    /** 4 roles: [id, dept, title, loc, type, level, salary, summary, reqs(3)] */
    roles: [string, string, Copy, Copy, Copy, Copy, Copy, Copy, Copy[]][];
  };
}

function mixSurface(hex: string, dark?: boolean): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const d = dark ? 14 : -13;
  const h = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return "#" + h(((n >> 16) & 255) + d) + h(((n >> 8) & 255) + d) + h((n & 255) + d);
}

function relLum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function readableAccent(paper: string, accent: string, dark?: boolean): string {
  if (dark) return accent;
  const pLum = relLum(paper);
  const n = parseInt(accent.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const toHex = () =>
    "#" +
    [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  for (let i = 0; i < 14; i++) {
    const aLum = relLum(toHex());
    const cr = (Math.max(pLum, aLum) + 0.05) / (Math.min(pLum, aLum) + 0.05);
    if (cr >= 5.2) break;
    r *= 0.82;
    g *= 0.82;
    b *= 0.82;
  }
  return toHex();
}

export function buildStudioExpansion(studio: Studio, p: StudioRichProfile): SiteExpansion {
  const hero = `/media/${studio.slug}/hero.webp`;
  const detail = `/media/${studio.slug}/detail.webp`;
  const office = "/media/shared/office-meeting.webp";
  const dark = Boolean(p.dark);
  const domain = studio.slug.replace(/-/g, "") + ".demo";

  const members = p.team.members.map(([name, role, experience, specialty, bio, pIdx], i) => ({
    name,
    role,
    experience,
    specialty,
    bio,
    photo: `/media/shared/team-${pIdx}.webp`,
    email: `team${i + 1}@${domain}`,
    phone: p.contact.phone.slice(0, -2) + String(i + 1).padStart(2, "0"),
  }));

  const items = [0, 1, 2, 3].map((idx) => {
    const [price, priceNum, badge, location, s4Label, s4Val, features] = p.itemExtras[idx];
    const isExtra = idx === 3;
    const opt = !isExtra ? studio.widget.options[idx] : null;
    const cat = p.cats[idx][0];
    const slugId = isExtra
      ? p.extraItem.id
      : opt!.name.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const useDetail = idx % 2 === 1;

    return {
      id: slugId,
      category: cat,
      badge,
      title: isExtra ? p.extraItem.title : opt!.name,
      subtitle: isExtra ? p.extraItem.sub : opt!.metric,
      price,
      priceNum,
      location,
      image: useDetail ? detail : hero,
      gallery: useDetail ? [detail, hero, office] : [hero, detail, office],
      specs: [
        { label: studio.facts[0].label, value: studio.facts[0].value },
        { label: studio.facts[1].label, value: studio.facts[1].value },
        { label: studio.facts[2].label, value: studio.facts[2].value },
        { label: s4Label, value: s4Val },
      ],
      summary: isExtra ? p.extraItem.summary : opt!.text,
      overview: isExtra
        ? p.extraItem.overview
        : c(
            `${opt!.text.en} ${studio.story.en}`,
            `${opt!.text.ru} ${studio.story.ru}`,
          ),
      features,
      advisorIndex: idx % members.length,
    };
  });

  return {
    slug: studio.slug,
    brand: studio.brand,
    sector: studio.sector,
    tagline: studio.intro,
    theme: {
      paper: studio.palette.paper,
      ink: studio.palette.ink,
      accent: readableAccent(studio.palette.paper, studio.palette.accent, dark),
      surface: mixSurface(studio.palette.paper, dark),
      surfaceStrong: dark ? "#0a0d12" : studio.palette.ink,
      edge: dark ? "rgba(255,255,255,0.22)" : "rgba(20,25,22,0.18)",
      btnBg: dark ? studio.palette.accent : studio.palette.ink,
      btnFg: studio.palette.paper,
      displayFont: p.displayFont,
      radius: p.radius,
      dark,
    },
    nav: { home: c("Home", "Главная"), ...p.nav },
    media: { hero, secondary: detail, studio: office, gallery: [hero, detail, office] },
    catalog: {
      eyebrow: studio.sector,
      title: p.nav.catalog,
      lead: p.catalogLead,
      searchPlaceholder: c("Search by name, format or detail...", "Поиск по названию, формату или параметру..."),
      categories: p.cats.map(([id, label]) => ({ id, label })),
      items,
    },
    projects: {
      eyebrow: c("Selected work & cases", "Избранные проекты"),
      title: p.nav.projects,
      lead: p.projectsLead,
      categories: p.projCats.map(([id, label]) => ({ id, label })),
      items: p.projects.map(([id, category, status, title, location, year, metric, summary, overview, hl, formats], idx) => ({
        id,
        category,
        status,
        title,
        location,
        year,
        metric,
        image: idx === 1 ? detail : hero,
        summary,
        overview,
        highlights: [
          ...hl.map(([label, value]) => ({ label, value })),
          { label: studio.facts[0].label, value: studio.facts[0].value },
          { label: studio.facts[1].label, value: studio.facts[1].value },
        ],
        formats: [
          ...formats.map(([t, d]) => ({ title: t, detail: d })),
          { title: studio.widget.options[0].name, detail: studio.widget.options[0].metric },
          { title: studio.widget.options[1].name, detail: studio.widget.options[1].metric },
        ],
        planTitle: c("Stage & Handover Plan", "План этапов и контроля"),
        planSubtitle: c("Clear milestones with transparent timing and verification before completion.", "Чёткие этапы с понятными сроками и проверкой результата."),
        planRows: [
          { stage: c("01 · Brief & Check", "01 · Бриф и осмотр"), timing: c("Stage 1", "Этап 1"), share: c("30%", "30%"), note: studio.facts[0].value },
          { stage: c("02 · Core Execution", "02 · Основная работа"), timing: c("Stage 2", "Этап 2"), share: c("45%", "45%"), note: studio.facts[1].value },
          { stage: c("03 · Review & Handover", "03 · Проверка и сдача"), timing: c("Stage 3", "Этап 3"), share: c("25%", "25%"), note: studio.facts[2].value },
        ],
      })),
    },
    partners: {
      eyebrow: p.partners.eyebrow,
      title: p.partners.title,
      lead: p.partners.lead,
      pillars: p.partners.pillars.map(([title, text]) => ({ title, text })),
      opportunities: p.partners.opps.map(([title, metric, text], idx) => ({
        title,
        metric,
        text,
        image: idx === 1 ? detail : idx === 2 ? office : hero,
      })),
      advisorQuote: p.partners.quote,
      whyTitle: c(`Why Partner With ${studio.brand.en}?`, `Почему выбирают партнёрство с «${studio.brand.ru}»?`),
      whyPoints: p.partners.pillars.map(([title, text]) => ({ title, text })),
      ctaLabel: p.partners.cta,
    },
    request: {
      eyebrow: p.request.eyebrow,
      title: p.request.title,
      lead: p.request.lead,
      trustBadges: p.request.badges,
      formTitle: p.nav.request,
      typeLabel: p.request.typeLabel,
      typeOptions: p.request.types,
      scopeLabel: p.request.scopeLabel,
      scopePlaceholder: p.request.scopePh,
      budgetLabel: p.request.budgetLabel,
      budgetPlaceholder: p.request.budgetPh,
      submitLabel: p.request.submit,
      whyTitle: c(`How ${studio.brand.en} Works`, `Как строится работа в «${studio.brand.ru}»`),
      whyPoints: p.request.why,
      helpTitle: c("Need Quick Advice First?", "Нужна быстрая консультация?"),
      helpNote: p.request.help,
    },
    about: {
      eyebrow: c("Our studio", "О проекте"),
      title: p.about.title,
      lead: studio.story,
      manifesto: p.about.manifesto,
      stats: p.about.stats.map(([value, label]) => ({ value, label })),
      mission: p.about.mission,
      vision: p.about.vision,
      values: p.about.values.map(([title, text]) => ({ title, text })),
      milestones: p.about.milestones.map(([year, title, text]) => ({ year, title, text })),
    },
    team: {
      eyebrow: c("Specialists & makers", "Люди проекта"),
      title: c(`Meet the ${studio.brand.en} Team`, `Команда «${studio.brand.ru}»`),
      lead: p.team.lead,
      cultureTitle: p.team.culture,
      cultureLead: p.team.cultureLead,
      members,
    },
    journal: {
      eyebrow: c("Insights & field notes", "Журнал и заметки"),
      title: c(`${studio.brand.en} Journal`, `Журнал «${studio.brand.ru}»`),
      lead: p.journal.lead,
      categories: p.journal.cats.map(([id, label]) => ({ id, label })),
      posts: p.journal.posts.map(([id, category, date, readTime, title, excerpt, takeaways, sections], idx) => ({
        id,
        category,
        date,
        readTime,
        title,
        excerpt,
        image: idx === 1 ? detail : hero,
        authorIndex: idx % members.length,
        takeaways,
        sections: sections.map(([heading, body]) => ({ heading, body })),
      })),
    },
    program: {
      eyebrow: p.program.eyebrow,
      title: p.program.title,
      lead: p.program.lead,
      pillars: p.program.pillars.map(([title, text]) => ({ title, text })),
      steps: p.program.steps.map(([title, text]) => ({ title, text })),
      ctaTitle: p.program.ctaTitle,
      ctaLead: p.program.ctaLead,
      formTitle: c("Request Program Access", "Оставить заявку по программе"),
      interestLabel: p.program.interestLabel,
      interestOptions: p.program.interests,
    },
    contact: {
      eyebrow: c("Location & contact", "Контакты и адрес"),
      title: p.contact.title,
      lead: p.contact.lead,
      phone: p.contact.phone,
      email: p.contact.email,
      address: p.contact.address,
      hours: p.contact.hours,
      district: p.contact.district,
      coordinates: p.contact.coords,
      transit: p.contact.transit,
      subjects: p.contact.subjects,
    },
    careers: {
      eyebrow: c("Join our team", "Вакансии"),
      title: p.careers.title,
      lead: p.careers.lead,
      perks: p.careers.perks.map(([title, text]) => ({ title, text })),
      departments: p.careers.depts.map(([id, label]) => ({ id, label })),
      openings: p.careers.roles.map(([id, department, title, location, type, level, salary, summary, requirements]) => ({
        id,
        department,
        title,
        location,
        type,
        level,
        salary,
        summary,
        requirements,
      })),
    },
  };
}
