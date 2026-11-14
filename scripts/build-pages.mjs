// Injects shared partials (partials/*.html) into every root-level page.
// Pages hold marker pairs:  <!-- @include header --> ... <!-- @end header -->
// Re-running is idempotent. For the header it also marks the current page
// (aria-current="page" on its link, data-current on the Home dropdown trigger).
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const partial = (name) => readFileSync(`partials/${name}.html`, "utf8").trim();
const markers = /<!-- @include ([\w-]+) -->[\s\S]*?<!-- @end \1 -->/g;

function markCurrent(html, file) {
  return html
    .replace(/<a [^>]*>/g, (tag) =>
      tag.includes(`href="${file}"`) && !tag.includes('class="brand"') ? tag.replace("<a ", '<a aria-current="page" ') : tag
    )
    .replace(/data-group="([^"]*)"/g, (m, group) => (group.split(" ").includes(file) ? `${m} data-current` : m));
}

let changed = 0;
for (const file of readdirSync(".").filter((f) => f.endsWith(".html"))) {
  const src = readFileSync(file, "utf8");
  const out = src.replace(markers, (_, name) => {
    const html = name === "header" ? markCurrent(partial(name), file) : partial(name);
    return `<!-- @include ${name} -->\n${html}\n<!-- @end ${name} -->`;
  });
  if (out !== src) { writeFileSync(file, out); changed++; }
}
console.log(`pages: updated ${changed} file(s)`);
