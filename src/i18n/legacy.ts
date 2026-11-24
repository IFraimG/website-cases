import { parseFragment, serialize, type DefaultTreeAdapterTypes } from "parse5";
import messages from "./legacy-en.json";

const dictionary: Record<string, string> = messages;
export function english(source: string) {
  const normalized = source.trim().replace(/\s+/g, " ");
  const translation = dictionary[normalized];
  if (translation !== undefined)
    return source.replace(/\S[\s\S]*\S|\S/, translation);
  if (/[а-яё]/i.test(source))
    throw new Error("Missing English copy: " + source);
  return source.replace(
    /(\d[\d ]*) ₽/g,
    (_, amount) =>
      "₽" + Number(amount.replaceAll(" ", "")).toLocaleString("en-US"),
  );
}

// Translate the original six editorial layouts at render time, including hidden
// dialogs and SVG labels. Keep application keys and embedded scripts intact.
export function englishMarkup(html: string) {
  const tree = parseFragment(html);
  function visit(node: DefaultTreeAdapterTypes["node"]) {
    if ("tagName" in node) {
      if (
        ["style", "script"].includes(node.tagName) ||
        node.attrs.some((a) => a.name === "class" && a.value === "languages")
      )
        return;
      for (const attr of node.attrs) {
        if (
          ["alt", "aria-label", "title", "placeholder", "value"].includes(
            attr.name,
          )
        )
          attr.value = english(attr.value);
      }
    }
    if (node.nodeName === "#text" && "value" in node)
      node.value = english(node.value);
    if ("childNodes" in node) node.childNodes.forEach(visit);
  }
  visit(tree);
  return serialize(tree);
}
