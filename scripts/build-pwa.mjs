import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = path.resolve("dist");
const files = [];
async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) await walk(file);
        else files.push(path.relative(root, file).replaceAll("\\", "/"));
    }
}
await walk(root);
const assets = files.filter(file => file !== "sw.js" && /\.(html|css|js|json|png|svg|webp|woff2?)$/.test(file)).sort();
const hash = createHash("sha256");
for (const file of assets) {
    hash.update(file);
    hash.update(await readFile(path.join(root, file)));
}
const template = await readFile("public/sw.js", "utf8");
hash.update(template);
const shell = assets.map(file => file === "index.html" ? "/" : "/" + file.replace(/\/index\.html$/, ""));
const worker = template
    .replace(/const CACHE_NAME = .*?;/, `const CACHE_NAME = "food-nutrition-shell-${hash.digest("hex").slice(0, 12)}";`)
    .replace(/const SHELL = .*?;/, `const SHELL = ${JSON.stringify(shell)};`);
await writeFile(path.join(root, "sw.js"), worker);
console.log(`PWA: ${shell.length} recursos preparados para uso sin conexión.`);
