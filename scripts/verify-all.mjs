import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "parse5";

const DIST = path.resolve("dist");
const rawBase = process.env.BASE_PATH || "/";
const BASE = rawBase === "/" ? "" : rawBase.replace(/\/+$/, "");

function stripBase(url) {
  if (!BASE) return url;
  if (url === BASE) return "/";
  if (url.startsWith(BASE + "/")) return url.slice(BASE.length);
  return null;
}

async function walkHtml(dir, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(full, acc);
    else if (entry.name === "index.html") acc.push(full);
  }
  return acc;
}

function walkDom(node, fn) {
  fn(node);
  if (node.childNodes) {
    for (const child of node.childNodes) walkDom(child, fn);
  }
}

function getAttr(node, name) {
  return node.attrs?.find((a) => a.name === name)?.value;
}

const files = (await walkHtml(DIST)).sort();
console.log(`Auditing ${files.length} built HTML pages in dist/...`);
assert.equal(files.length, 884, `Expected 884 pages, found ${files.length}`);

let totalLinks = 0;
let totalImages = 0;
let totalForms = 0;
const errors = [];

for (const file of files) {
  const rel = "/" + path.relative(DIST, path.dirname(file)).replace(/\\/g, "/");
  const route = rel === "/." || rel === "/" ? "/" : rel + "/";
  const isRu = route === "/ru/" || route.startsWith("/ru/");
  const expectedLang = isRu ? "ru" : "en";
  const html = await readFile(file, "utf8");
  const doc = parse(html);

  let htmlLang = null;
  let titleText = "";
  let footerHomeLinks = 0;
  let hasLangEn = false;
  let hasLangRu = false;
  let inFooter = false;
  let inSkipText = false;

  function visit(node, footerDepth, skipTextDepth) {
    const tag = node.tagName;
    const nowFooter = footerDepth + (tag === "footer" ? 1 : 0);
    const nowSkip =
      skipTextDepth +
      (["script", "style"].includes(tag) ||
      getAttr(node, "class") === "languages"
        ? 1
        : 0);

    if (tag === "html") htmlLang = getAttr(node, "lang");
    if (tag === "title" && node.childNodes?.[0]?.value) {
      titleText = node.childNodes[0].value;
    }

    if (tag === "form") totalForms++;

    if (tag === "img") {
      totalImages++;
      const src = getAttr(node, "src") || "";
      const alt = getAttr(node, "alt");
      if (!src.startsWith("/")) {
        errors.push(`${route}: non-root img src "${src}"`);
      } else {
        const stripped = stripBase(src);
        if (!stripped) {
          errors.push(`${route}: img src missing base "${BASE}": "${src}"`);
        } else {
          const asset = path.join(DIST, stripped.replace(/^\//, ""));
          if (!existsSync(asset)) {
            errors.push(`${route}: broken image "${src}"`);
          }
        }
      }
      if (alt === undefined || alt.trim() === "") {
        errors.push(`${route}: empty img alt for "${src}"`);
      }
      if (!isRu && alt && /[А-Яа-яЁё]/.test(alt)) {
        errors.push(`${route}: Cyrillic in EN img alt "${alt}"`);
      }
    }

    if (tag === "a") {
      totalLinks++;
      const href = getAttr(node, "href") || "";
      const hreflang = getAttr(node, "hreflang");
      if (hreflang === "en") hasLangEn = true;
      if (hreflang === "ru") hasLangRu = true;

      if (href.startsWith("/")) {
        const cleanRaw = href.split("#")[0];
        const clean = stripBase(cleanRaw);
        if (!clean) {
          errors.push(`${route}: link missing base "${BASE}": "${href}"`);
        } else {
          const target =
            clean === "/"
              ? path.join(DIST, "index.html")
              : path.join(DIST, clean.replace(/^\//, ""), "index.html");
          if (!existsSync(target)) {
            errors.push(`${route}: broken internal link "${href}"`);
          }
          if (nowFooter > 0 && clean === (isRu ? "/ru/" : "/")) {
            footerHomeLinks++;
          }
        }
      }
    }

    if (node.nodeName === "#text" && nowSkip === 0 && !isRu) {
      const val = node.value || "";
      if (/[А-Яа-яЁё]/.test(val)) {
        errors.push(`${route}: Cyrillic in EN text "${val.trim().slice(0, 80)}"`);
      }
    }

    if (tag && nowSkip === 0 && !isRu) {
      for (const attrName of ["aria-label", "placeholder", "title"]) {
        const val = getAttr(node, attrName);
        if (val && /[А-Яа-яЁё]/.test(val)) {
          errors.push(`${route}: Cyrillic in EN ${attrName}="${val}"`);
        }
      }
    }

    if (node.childNodes) {
      for (const ch of node.childNodes) visit(ch, nowFooter, nowSkip);
    }
  }

  visit(doc, 0, 0);

  if (htmlLang !== expectedLang) {
    errors.push(`${route}: expected lang="${expectedLang}", got "${htmlLang}"`);
  }
  if (!titleText.trim()) {
    errors.push(`${route}: empty <title>`);
  }
  if (!isRu && /[А-Яа-яЁё]/.test(titleText)) {
    errors.push(`${route}: Cyrillic in EN title "${titleText}"`);
  }
  if (!hasLangEn || !hasLangRu) {
    errors.push(`${route}: missing EN/RU language switcher links`);
  }
  if (route !== "/" && route !== "/ru/" && footerHomeLinks !== 1) {
    errors.push(
      `${route}: expected exactly 1 footer link back to Folio home, found ${footerHomeLinks}`,
    );
  }
}

if (errors.length) {
  console.error(`FAILED with ${errors.length} issue(s):`);
  for (const e of errors.slice(0, 40)) console.error("  -", e);
  process.exit(1);
}

console.log(
  `PASSED ALL CHECKS! ${files.length} pages | ${totalLinks} links verified | ${totalImages} images verified | ${totalForms} interactive forms | 0 errors | 0 broken links | 0 broken images | 0 Cyrillic leaks in EN.`,
);
