export type Language = "en" | "ru";

export function basePrefix(): string {
  const raw = import.meta.env.BASE_URL || "/";
  return raw === "/" ? "" : raw.replace(/\/+$/, "");
}

export function stripBase(path: string): string {
  const prefix = basePrefix();
  if (prefix && (path === prefix || path.startsWith(prefix + "/"))) {
    return path.slice(prefix.length) || "/";
  }
  return path || "/";
}

export const languageOf = (path: string): Language =>
  /^\/ru(?:\/|$)/.test(stripBase(path)) ? "ru" : "en";

export function localizedPath(path: string, language: Language) {
  const clean = stripBase(path).replace(/^\/ru(?=\/|$)/, "") || "/";
  return basePrefix() + (language === "ru" ? "/ru" : "") + clean;
}

export function assetPath(path: string): string {
  const prefix = basePrefix();
  if (!prefix || !path.startsWith("/") || path.startsWith(prefix + "/")) {
    return path;
  }
  return prefix + path;
}

export function prefixAssetMarkup(html: string): string {
  const prefix = basePrefix();
  if (!prefix) return html;
  return html.replace(
    /\b(src|data-thumb)="(\/(?:media|previews)\/[^"]+)"/g,
    (_, attr, url) => `${attr}="${prefix}${url}"`,
  );
}
