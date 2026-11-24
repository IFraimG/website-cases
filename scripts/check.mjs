import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import sharp from "sharp";

const origin = process.env.PREVIEW_URL || "http://127.0.0.1:4321";
const newSites = {};
for (const file of await readdir("src/data/studios")) {
  const studio = JSON.parse(await readFile("src/data/studios/" + file, "utf8"));
  newSites[studio.slug] = studio;
}
const sites = [
  "architecture",
  "detailing",
  "furniture",
  "warehouse-saas",
  "dental",
  "real-estate",
  ...Object.keys(newSites),
];
const previews = process.argv.includes("--previews");
const routes =
  process.env.CHECK_ROUTES?.split(",") ||
  (previews ? sites : ["index", ...sites]);
const macChrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH || (existsSync(macChrome) ? macChrome : undefined),
});
const reports = [];
function pathFor(slug, lang) {
  return (
    (lang === "ru" ? "/ru" : "") + "/" + (slug === "index" ? "" : slug + "/")
  );
}

async function exercise(page, slug, lang) {
  const ru = lang === "ru";
  if (slug === "index") {
    for (const s of sites)
      assert.equal(
        await page
          .locator('a.case-link[href="' + pathFor(s, lang) + '"]')
          .count(),
        1,
      );
    for (const filter of await page.locator("[data-group]").all()) {
      await filter.click();
      const group = await filter.getAttribute("data-group");
      const visible = page.locator("[data-category]:visible");
      assert.equal(
        await visible.count(),
        group === "all"
          ? sites.length
          : await page.locator('[data-category="' + group + '"]').count(),
      );
    }
    await page.locator('[data-group="all"]').click();
    await page.locator("a.case-link").first().click();
    await page.waitForURL(origin + pathFor(sites[0], lang));
    await page.goBack();
    return;
  }
  if (slug === "architecture") {
    for (const btn of await page.locator("[data-dialog]").all()) {
      await btn.click();
      assert(await page.getByRole("dialog").isVisible());
      await page.locator("dialog:visible button").click();
    }
  } else if (slug === "detailing") {
    const range = page.getByRole("slider");
    for (const [key, v] of [
      ["End", "100%"],
      ["Home", "0%"],
      ["ArrowRight", "1%"],
    ]) {
      await range.focus();
      await range.press(key);
      assert.equal(
        await page
          .locator(".compare")
          .evaluate((x) => x.style.getPropertyValue("--cut")),
        v,
      );
    }
  } else if (slug === "furniture") {
    for (const btn of (await page.locator("[data-filter]").all()).slice(1)) {
      await btn.click();
      assert.equal(await page.locator("[data-kind]:visible").count(), 1);
      await page.locator(".product:visible").click();
      assert(await page.getByRole("dialog").isVisible());
      await page.keyboard.press("Escape");
    }
    await page.locator("[data-filter]").first().click();
    assert.equal(await page.locator("[data-kind]:visible").count(), 3);
  } else if (slug === "warehouse-saas") {
    for (const idx of [1, 0]) {
      await page.locator("[data-period]").nth(idx).click();
      assert.equal(
        await page.locator("[data-month]").first().textContent(),
        idx
          ? ru
            ? "49 000 ₽ / год"
            : "₽49,000 / year"
          : ru
            ? "4 900 ₽ / месяц"
            : "₽4,900 / month",
      );
    }
  } else if (slug === "dental") {
    const form = page.locator(".book-form");
    await form.locator("button").click();
    assert.equal(await form.locator("select:invalid").count(), 2);
    const service = await form
      .locator('[name="service"]')
      .selectOption({ index: 2 });
    await form.locator('[name="time"]').selectOption("14:30");
    await form.locator("button").click();
    const confirmation = await form.locator("output").textContent();
    assert(confirmation.includes(service[0]) && confirmation.includes("14:30"));
    assert(
      confirmation.includes(
        ru ? "Демозапись подтверждена" : "Demo visit confirmed",
      ),
    );
  } else if (slug === "real-estate") {
    for (const [i, area] of [30, 48, 70].entries()) {
      await page.locator("[data-plan]").nth(i).click();
      const plan = page.locator("[data-flat]:visible");
      assert.equal(await plan.count(), 1);
      assert((await plan.textContent()).includes(area + (ru ? " м²" : " m²")));
    }
  } else {
    const w = newSites[slug].widget;
    for (const [i, option] of w.options.entries()) {
      await page.locator("[data-choice]").nth(i).click();
      assert.equal(
        await page.locator("[data-answer]:visible h3").textContent(),
        option.metric[lang],
      );
    }
    if (w.type === "calculator") {
      const input = page.locator("#quantity");
      await input.fill(String(w.min));
      await page.locator('[data-step="1"]').click();
      assert.equal(await input.inputValue(), String(w.min + 1));
      const amount = w.options[2].rate * (w.min + 1) + w.options[2].base;
      const formatted = new Intl.NumberFormat(ru ? "ru-RU" : "en-US", {
        maximumFractionDigits: 1,
      }).format(amount);
      assert(
        (await page.locator("#estimate").textContent()).includes(formatted),
      );
      await input.fill(String(w.max + 1));
      assert(!(await input.evaluate((el) => el.validity.valid)));
      assert(
        (await page.locator("#estimate").textContent()).includes(String(w.max)),
      );
    } else if (w.type === "session") {
      const form = page.locator(".session-form");
      await form.locator("button").click();
      assert.equal(await form.locator("select:invalid").count(), 1);
      await form.locator("select").selectOption(w.slots[1]);
      await form.locator("button").click();
      assert(
        (await form.locator("output").textContent()).includes(
          w.options[2].name[lang] + " · " + w.slots[1],
        ),
      );
      await page.locator("[data-choice]").first().click();
      assert.equal(await form.locator("output").textContent(), "");
    }
  }
  assert.equal(
    await page
      .locator('footer a[href="' + pathFor("index", lang) + '"]')
      .count(),
    1,
  );
}

async function check(context, slug, lang, width) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  try {
    const pathname = pathFor(slug, lang);
    assert.equal((await page.goto(origin + pathname)).status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator("html").getAttribute("lang"), lang);
    const issues = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      broken: [...document.images]
        .filter((i) => !i.complete || !i.naturalWidth)
        .map((i) => i.src),
      mixed:
        document.documentElement.lang === "en" &&
        /[А-Яа-яЁё]/.test(document.body.innerText + " " + document.title),
    }));
    assert.deepEqual(
      issues,
      { overflow: false, broken: [], mixed: false },
      pathname + " " + width + " " + JSON.stringify(issues),
    );
    const dir = previews ? "public/previews" : "screenshots";
    const sub = lang === "ru" ? "/ru/" : "/";
    await mkdir(dir + sub, { recursive: true });
    if (previews) {
      await sharp(await page.screenshot())
        .resize(960)
        .webp({ quality: 82 })
        .toFile(dir + sub + slug + ".webp");
    } else {
      const file = dir + sub + slug + "-" + width + ".png";
      await page.screenshot({
        path: file,
        fullPage: true,
        animations: "disabled",
      });
      await exercise(page, slug, lang);
      const other = lang === "ru" ? "en" : "ru";
      await page.locator('.languages a[hreflang="' + other + '"]').click();
      await page.waitForURL(origin + pathFor(slug, other));
      assert.equal(await page.locator("html").getAttribute("lang"), other);
      await page.locator('.languages a[hreflang="' + lang + '"]').click();
      await page.waitForURL(origin + pathname);
      assert.deepEqual(errors, [], pathname);
      reports.push({
        route: pathname,
        lang,
        width,
        fullPage: file,
        ...issues,
        errors,
        interaction: "passed",
        languageSwitch: "passed",
      });
    }
  } catch (e) {
    throw new Error(slug + " " + lang + " " + width + ": " + e.message, {
      cause: e,
    });
  } finally {
    await page.close();
  }
}
try {
  for (const lang of ["en", "ru"]) {
    for (const width of previews ? [1440] : [1440, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: width === 1440 ? 900 : 844 },
        locale: lang,
        reducedMotion: "reduce",
      });
      try {
        for (let i = 0; i < routes.length; i += 3) {
          const batch = routes.slice(i, i + 3);
          const result = await Promise.allSettled(
            batch.map((slug) => check(context, slug, lang, width)),
          );
          const failed = result.filter((r) => r.status === "rejected");
          if (failed.length)
            throw new AggregateError(
              failed.map((r) => r.reason),
              failed.map((r) => r.reason.message).join("\n"),
            );
          console.log(lang, width, batch.join(", "));
        }
      } finally {
        await context.close();
      }
    }
  }
  if (!previews && !process.env.CHECK_ROUTES) {
    // Also exercise deep multi-page flows across representative flagship & studio sites
    const multiChecks = [
      ["real-estate", "en"],
      ["real-estate", "ru"],
      ["detailing", "en"],
      ["lighting", "ru"],
    ];
    for (const [slug, lang] of multiChecks) {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        locale: lang,
        reducedMotion: "reduce",
      });
      const p = await ctx.newPage();
      try {
        const prefix = lang === "ru" ? "/ru" : "";
        for (const sub of [
          "catalog",
          "projects",
          "partners",
          "request",
          "about",
          "team",
          "journal",
          "program",
          "contact",
          "careers",
        ]) {
          const url = origin + prefix + "/" + slug + "/" + sub + "/";
          assert.equal((await p.goto(url)).status(), 200, url);
          assert.equal(await p.locator("html").getAttribute("lang"), lang);
          const overflow = await p.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          );
          assert.equal(overflow, false, "Overflow on " + url);
        }
        // Test catalog -> item detail -> gallery -> form submission
        await p.goto(origin + prefix + "/" + slug + "/catalog/");
        await p.locator("[data-item-card] a").first().click();
        await p.waitForLoadState("networkidle");
        await p.locator("[data-thumb]").nth(1).click();
        await p.locator('[data-demo-form] [name="name"]').fill("Test User");
        await p.locator('[data-demo-form] [name="contact"]').fill("+79990000000");
        await p.locator('[data-demo-form] button[type="submit"]').click();
        assert(
          (await p.locator("[data-demo-form] output").textContent()).includes(
            "REF-",
          ),
        );
      } finally {
        await p.close();
        await ctx.close();
      }
    }
    const width = 360,
      height = 225,
      gap = 8,
      cols = 3;
    const images = await Promise.all(
      sites.map(async (site, i) => ({
        input: await sharp("screenshots/" + site + "-1440.png")
          .extract({ left: 0, top: 0, width: 1440, height: 900 })
          .resize(width, height)
          .png()
          .toBuffer(),
        left: (i % cols) * (width + gap),
        top: Math.floor(i / cols) * (height + gap),
      })),
    );
    await sharp({
      create: {
        width: (width + gap) * cols - gap,
        height: (height + gap) * Math.ceil(sites.length / cols) - gap,
        channels: 3,
        background: "#fff",
      },
    })
      .composite(images)
      .png()
      .toFile("screenshots/first-screens.png");
    await writeFile(
      "screenshots/checks.json",
      JSON.stringify(
        reports.sort(
          (a, b) => a.route.localeCompare(b.route) || b.width - a.width,
        ),
        null,
        2,
      ) + "\n",
    );
  }
} finally {
  await browser.close();
}
