import { createHighlighter } from "@tanstack/highlight/core";
import { css } from "@tanstack/highlight/languages/css";
import { dockerfile } from "@tanstack/highlight/languages/dockerfile";
import { html } from "@tanstack/highlight/languages/html";
import { js } from "@tanstack/highlight/languages/js";
import { json } from "@tanstack/highlight/languages/json";
import { jsx } from "@tanstack/highlight/languages/jsx";
import { markdown } from "@tanstack/highlight/languages/markdown";
import { plaintext } from "@tanstack/highlight/languages/plaintext";
import { python } from "@tanstack/highlight/languages/python";
import { shell } from "@tanstack/highlight/languages/shell";
import { sql } from "@tanstack/highlight/languages/sql";
import { ts } from "@tanstack/highlight/languages/ts";
import { tsx } from "@tanstack/highlight/languages/tsx";
import { yaml } from "@tanstack/highlight/languages/yaml";
import { createTanStackMarkdownHighlighter } from "@tanstack/highlight/markdown";

const highlighter = createHighlighter({
  fallbackLanguage: "plaintext",
  languages: [
    css,
    dockerfile,
    html,
    js,
    json,
    jsx,
    markdown,
    plaintext,
    python,
    shell,
    sql,
    ts,
    tsx,
    yaml,
  ],
});

/** Highlights Markdown fences with the shared chat and document language set. */
export const highlightMarkdownCode =
  createTanStackMarkdownHighlighter(highlighter);

/** Converts source code to escaped token spans for a code display. */
export function highlightToHtml(code: string, lang?: string): string {
  return highlighter.highlightToHtml(code, lang ? { lang } : {});
}
