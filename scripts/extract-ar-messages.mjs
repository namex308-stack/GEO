// One-off migration script: extracts the `ar` field from the legacy bilingual
// `translations` dictionary in src/lib/i18n.ts and emits a plain Arabic-only
// message catalog at src/lib/locale/messages/ar.ts.
//
// Run with: node scripts/extract-ar-messages.mjs
// Safe to delete after the locale migration lands.
import * as ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "..", "src", "lib", "i18n.ts");
const OUT = path.join(__dirname, "..", "src", "lib", "locale", "messages", "ar.ts");

const sourceText = fs.readFileSync(SRC, "utf8");
const sourceFile = ts.createSourceFile(SRC, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

let translationsObj = null;

function visit(node) {
  if (
    ts.isVariableStatement(node) &&
    node.declarationList.declarations.some((d) => d.name.getText(sourceFile) === "translations")
  ) {
    const decl = node.declarationList.declarations.find((d) => d.name.getText(sourceFile) === "translations");
    let init = decl.initializer;
    // Unwrap `as const`
    if (ts.isAsExpression(init)) init = init.expression;
    translationsObj = init;
  }
  ts.forEachChild(node, visit);
}
visit(sourceFile);

if (!translationsObj || !ts.isObjectLiteralExpression(translationsObj)) {
  throw new Error("Could not locate `translations` object literal in i18n.ts");
}

const entries = [];
for (const prop of translationsObj.properties) {
  if (!ts.isPropertyAssignment(prop)) continue;
  const key = prop.name.getText(sourceFile).replace(/^["']|["']$/g, "");
  const value = prop.initializer;
  if (!ts.isObjectLiteralExpression(value)) continue;
  const arProp = value.properties.find(
    (p) => ts.isPropertyAssignment(p) && p.name.getText(sourceFile) === "ar"
  );
  if (!arProp || !ts.isStringLiteral(arProp.initializer)) continue;
  entries.push({ key, value: arProp.initializer.text });
}

function jsKeyLiteral(key) {
  return JSON.stringify(key);
}

function jsStringLiteral(value) {
  return JSON.stringify(value);
}

const lines = [
  "// AUTO-EXTRACTED from the legacy bilingual `src/lib/i18n.ts` dictionary.",
  "// This is the Modern Standard Arabic (فصحى) message catalog — the only",
  "// enabled locale today. See `../config.ts` for the locale registry and",
  "// `./ar-gulf.ts` for the reserved (disabled) Gulf dialect extension point.",
  "export const arMessages = {",
];
for (const { key, value } of entries) {
  lines.push(`  ${jsKeyLiteral(key)}: ${jsStringLiteral(value)},`);
}
lines.push("} as const;");
lines.push("");
lines.push("export type MessageKey = keyof typeof arMessages;");
lines.push("");

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(`Wrote ${entries.length} Arabic messages to ${OUT}`);
