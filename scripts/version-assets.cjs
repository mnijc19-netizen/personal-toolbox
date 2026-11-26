const { createHash } = require("node:crypto");
const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const dist = join(__dirname, "..", "dist");
const index = join(dist, "index.html");
const html = readFileSync(index, "utf8");
const versioned = html.replace(/\b(src|href)="([\w.-]+\.(?:js|css))(?:\?v=[a-f0-9]+)?"/g,
  (_, attribute, filename) => {
    const content = readFileSync(join(dist, filename), "utf8").replace(/\r\n/g, "\n");
    const version = createHash("sha256").update(content).digest("hex").slice(0, 16);
    return `${attribute}="${filename}?v=${version}"`;
  });

if (versioned !== html) writeFileSync(index, versioned);
