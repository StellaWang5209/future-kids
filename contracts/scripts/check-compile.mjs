// Compile src + script + test with solc-js using real import resolution
// (like forge build) to pre-validate CI before pushing.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const solc = require("solc");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".sol")) acc.push(p);
  }
  return acc;
}

const files = [
  ...walk(path.join(ROOT, "src")),
  ...walk(path.join(ROOT, "script")),
  ...walk(path.join(ROOT, "test")),
];

const sources = {};
for (const f of files) sources[path.relative(ROOT, f).replace(/\\/g, "/")] = { content: fs.readFileSync(f, "utf8") };

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "shanghai",
    outputSelection: { "*": { "*": [] } },
  },
};

function findImport(importPath) {
  // mirror foundry.toml remappings
  const candidates = [
    path.join(ROOT, importPath),
    path.join(ROOT, "node_modules", importPath),
    path.join(ROOT, "lib", importPath),
    importPath.startsWith("forge-std/")
      ? path.join(ROOT, "lib", "forge-std", "src", importPath.slice("forge-std/".length))
      : null,
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return { contents: fs.readFileSync(c, "utf8") };
  }
  return { error: `not found: ${importPath}` };
}

const out = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));

let failed = false;
for (const e of out.errors || []) {
  const isErr = e.severity === "error";
  if (isErr) failed = true;
  console.log(`[${e.severity}] ${e.formattedMessage.split("\n").slice(0, 8).join("\n")}`);
}
console.log(failed ? "COMPILE FAILED" : `OK: ${files.length} source files compiled with 0 errors`);
process.exit(failed ? 1 : 0);
