import type {
  MarkdownComponentProps,
  MarkdownComponents,
} from "@tanstack/markdown/react";
import { Markdown as TanStackMarkdown } from "@tanstack/markdown/react";
import { parseMarkdown } from "@tanstack/markdown/parser";
import { createElement, useMemo, type ReactNode } from "react";

import { cn } from "../lib/cn.js";
import { highlightMarkdownCode } from "../lib/tanstack-highlight.js";
import { Prose } from "./prose.js";

/** Props accepted by Markdown. */
export type MarkdownProps = {
  /** The Markdown source, including an unfinished streaming response. */
  children: string;
  /** Extra classes merged onto the rendered container. */
  className?: string;
  /** Element treatments; links use the shared policy, images are filtered first. */
  components?: MarkdownComponents;
  /** Strip a leading YAML frontmatter block before rendering. Defaults to true. */
  frontmatter?: boolean;
  /** Visitor content allows only absolute HTTP(S) links and never loads images. */
  policy?: "default" | "visitor";
  /** Use Caps Prose, or inherit typography from the containing surface. */
  typography?: "prose" | "inherit";
};

/** The protocol of an absolute URL, or `null` when the value is relative. */
function absoluteProtocol(value: string): string | null {
  return URL.parse(value)?.protocol ?? null;
}

/** Whether an href is safe to render live: http(s), mailto, or relative/hash. */
function isSafeHref(href: string): boolean {
  if (href === "" || href.startsWith("//")) return false;
  const protocol = absoluteProtocol(href);
  return (
    protocol === null ||
    protocol === "http:" ||
    protocol === "https:" ||
    protocol === "mailto:"
  );
}

/** Whether an href leaves the current document and should open in a new tab. */
function isExternalHref(href: string): boolean {
  const protocol = absoluteProtocol(href);
  return protocol === "http:" || protocol === "https:";
}

/** Whether an image src is safe to render: http(s) or relative. */
function isSafeImageSrc(src: string): boolean {
  if (src === "" || src.startsWith("//")) return false;
  const protocol = absoluteProtocol(src);
  return protocol === null || protocol === "http:" || protocol === "https:";
}

/**
 * Shared Markdown renderer with safe links, images and highlighted code.
 * Documents use Caps Prose; containing surfaces can supply their own typography
 * and element treatments. Replacing the source renders streaming partial Markdown.
 */
export function Markdown({
  children,
  className,
  components,
  frontmatter = true,
  policy = "default",
  typography = "prose",
}: MarkdownProps): ReactNode {
  const document = useMemo(
    () => parseMarkdown(children, { allowHtml: false, frontmatter }),
    [children, frontmatter],
  );
  const safeComponents = useMemo(
    () =>
      ({
        ...components,
        a(props: MarkdownComponentProps<"a">) {
          const href = props.href ?? "";
          if (policy === "visitor") {
            const destination = URL.parse(href);
            if (destination === null || !isExternalHref(destination.href))
              return <span>{props.children}</span>;
            return (
              <a
                href={destination.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {props.children}
              </a>
            );
          }
          if (!isSafeHref(href)) return <>{props.children}</>;
          const external = isExternalHref(href);
          return (
            <a
              {...props}
              href={href}
              rel={external ? "noopener noreferrer" : props.rel}
              target={external ? "_blank" : props.target}
            />
          );
        },
        img(props: MarkdownComponentProps<"img">) {
          if (policy === "visitor")
            return <span className="text-dim">Image removed</span>;
          const source = props.src ?? "";
          if (!isSafeImageSrc(source)) return <>{props.alt ?? ""}</>;
          if (components?.img) return createElement(components.img, props);
          return (
            <img alt={props.alt ?? ""} className="max-w-full" src={source} />
          );
        },
      }) satisfies MarkdownComponents,
    [components, policy],
  );
  const content = (
    <TanStackMarkdown
      allowHtml={false}
      components={safeComponents}
      highlighter={highlightMarkdownCode}
    >
      {document}
    </TanStackMarkdown>
  );
  const containerClass = cn("min-w-0 break-words", className);
  return typography === "prose" ? (
    <Prose className={containerClass}>{content}</Prose>
  ) : (
    <div className={containerClass}>{content}</div>
  );
}
