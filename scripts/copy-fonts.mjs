// Copies only the Latin variable-weight font files the site needs into public/fonts.
// Keeps the payload small (2 files) and avoids any external font CDN.
import { copyFileSync, mkdirSync } from "node:fs";

const files = [
  ["@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", "inter-var.woff2"],
  ["@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2", "fraunces-var.woff2"],
];

mkdirSync("public/fonts", { recursive: true });
for (const [src, out] of files) copyFileSync(`node_modules/${src}`, `public/fonts/${out}`);
console.log(`fonts: copied ${files.length} files to public/fonts`);
