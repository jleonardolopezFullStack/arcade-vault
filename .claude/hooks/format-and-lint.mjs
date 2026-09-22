// PostToolUse hook: pasa el archivo recién escrito/editado por Prettier, luego por
// ESLint --fix y finalmente compacta el código quitando TODAS las líneas en blanco.
// Nunca bloquea: sale siempre con 0. Si ESLint deja problemas sin arreglar, los
// devuelve a Claude como additionalContext.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
const PROJECT = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const PRETTIER = path.join(
  PROJECT,
  "node_modules",
  "prettier",
  "bin",
  "prettier.cjs",
);
const ESLINT = path.join(PROJECT, "node_modules", "eslint", "bin", "eslint.js");
const PRETTIER_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".md",
  ".mdx",
  ".json",
  ".css",
  ".scss",
  ".html",
  ".yml",
  ".yaml",
]);
const ESLINT_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
// Dónde es seguro borrar líneas en blanco. Excluidos a propósito:
//   .md/.mdx  -> la línea en blanco es sintaxis (separa párrafos, cierra listas)
//   .yml/.yaml/.html -> block scalars y <pre> la vuelven significativa
//   .json -> Prettier ya no deja ninguna
const COMPACT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
]);
const JS_LIKE = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
function done(context) {
  if (context) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext: context,
        },
      }),
    );
  }
  process.exit(0);
}
/**
 * Índices de línea que quedan DENTRO de un template literal multilínea.
 * Ahí una línea vacía es parte del string en runtime, no formato: borrarla
 * cambiaría el valor del dato. Mini-tokenizer con estados (comentarios,
 * comillas simples/dobles, backticks y anidación de `${}`).
 */
function linesInsideTemplates(src) {
  const protectedLines = new Set();
  const tplStack = [];
  let state = "code";
  let line = 0;
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === "\n") {
      line++;
      if (state === "line") state = "code";
      if (state === "tpl") protectedLines.add(line);
      i++;
      continue;
    }
    switch (state) {
      case "code":
        if (c === "/" && n === "/") {
          state = "line";
          i += 2;
        } else if (c === "/" && n === "*") {
          state = "block";
          i += 2;
        } else if (c === "'") {
          state = "sq";
          i++;
        } else if (c === '"') {
          state = "dq";
          i++;
        } else if (c === "`") {
          state = "tpl";
          i++;
        } else if (c === "{" && tplStack.length) {
          tplStack[tplStack.length - 1]++;
          i++;
        } else if (c === "}" && tplStack.length) {
          if (tplStack[tplStack.length - 1] > 0)
            tplStack[tplStack.length - 1]--;
          else {
            tplStack.pop();
            state = "tpl";
          }
          i++;
        } else i++;
        break;
      case "line":
        i++;
        break;
      case "block":
        if (c === "*" && n === "/") {
          state = "code";
          i += 2;
        } else i++;
        break;
      case "sq":
        if (c === "\\") i += 2;
        else if (c === "'") {
          state = "code";
          i++;
        } else i++;
        break;
      case "dq":
        if (c === "\\") i += 2;
        else if (c === '"') {
          state = "code";
          i++;
        } else i++;
        break;
      case "tpl":
        if (c === "\\") i += 2;
        else if (c === "`") {
          state = "code";
          i++;
        } else if (c === "$" && n === "{") {
          tplStack.push(0);
          state = "code";
          i += 2;
        } else i++;
        break;
    }
  }
  return protectedLines;
}
function compact(file, ext) {
  const src = readFileSync(file, "utf8");
  const keep = JS_LIKE.has(ext) ? linesInsideTemplates(src) : new Set();
  const lines = src.split("\n");
  const kept = lines.filter((l, idx) => l.trim() !== "" || keep.has(idx));
  const out = kept.join("\n").replace(/\n*$/, "\n");
  if (out !== src) writeFileSync(file, out, "utf8");
}
let payload;
try {
  payload = JSON.parse(readFileSync(0, "utf8"));
} catch {
  done();
}
const raw = payload?.tool_response?.filePath ?? payload?.tool_input?.file_path;
if (!raw) done();
const file = path.resolve(PROJECT, raw);
const rel = path.relative(PROJECT, file);
// Solo archivos dentro del proyecto, fuera de node_modules/.next/.git
if (rel.startsWith("..") || path.isAbsolute(rel)) done();
if (/(^|[\\/])(node_modules|\.next|\.git)([\\/]|$)/.test(rel)) done();
if (!existsSync(file) || !statSync(file).isFile()) done();
const ext = path.extname(file).toLowerCase();
if (!PRETTIER_EXT.has(ext)) done();
const run = (script, args) =>
  execFileSync(process.execPath, [script, ...args, file], {
    cwd: PROJECT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
if (existsSync(PRETTIER)) {
  try {
    run(PRETTIER, ["--write", "--log-level", "warn"]);
  } catch {
    // archivo con sintaxis inválida: no es asunto del hook
  }
}
let lintReport = "";
if (ESLINT_EXT.has(ext) && existsSync(ESLINT)) {
  try {
    run(ESLINT, ["--fix"]);
  } catch (err) {
    lintReport = `${err.stdout ?? ""}${err.stderr ?? ""}`.trim();
  }
}
// Último paso: compactar. Va después de ESLint porque --fix puede reintroducir
// líneas en blanco al reescribir el archivo.
if (COMPACT_EXT.has(ext)) {
  try {
    compact(file, ext);
  } catch {
    // no rompas el turno por esto
  }
}
done(
  lintReport
    ? `ESLint dejó problemas sin corregir en ${rel}:\n${lintReport}`
    : "",
);
