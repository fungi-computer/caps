import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown } from "./markdown.js";

const readme = `---
title: Draft README
status: internal
---

# Fungi Hub

- Routes requests between Apps and the Gatekeeper.
- Keeps the Gatekeeper's broker in sync.

\`\`\`shell
pnpm install
\`\`\`

[Field guide](/wiki/3-resources/field-guide.md)

[Delete everything](javascript:alert(1))
`;

describe("Markdown", () => {
  it("renders headings, lists and highlighted code inside Prose", () => {
    const markup = renderToStaticMarkup(<Markdown>{readme}</Markdown>);
    expect(markup).toContain("prose");
    expect(markup).toMatch(/<h1[^>]*>Fungi Hub<\/h1>/u);
    expect(markup).toContain(
      "Routes requests between Apps and the Gatekeeper.",
    );
    expect(markup).toContain('<pre class="tm-code" data-lang="shell">');
    expect(markup).toContain("pnpm");
    expect(markup).toContain("install");
  });

  it("keeps a safe relative link as an anchor without opening a new tab", () => {
    const markup = renderToStaticMarkup(<Markdown>{readme}</Markdown>);
    expect(markup).toContain('href="/wiki/3-resources/field-guide.md"');
    expect(markup).not.toMatch(/field-guide\.md"[^>]*target="_blank"/u);
  });

  it("never turns an unsafe javascript: link into an anchor", () => {
    const markup = renderToStaticMarkup(<Markdown>{readme}</Markdown>);
    expect(markup).not.toContain("javascript:");
    expect(markup).toContain("Delete everything");
  });

  it("never turns a protocol-relative link into an anchor", () => {
    const markup = renderToStaticMarkup(
      <Markdown>{"[go](//evil.example/take-over)"}</Markdown>,
    );
    expect(markup).not.toContain("<a ");
    expect(markup).toContain("go");
  });

  it("opens an external http(s) link in a new tab with rel=noopener noreferrer", () => {
    const markup = renderToStaticMarkup(
      <Markdown>{"[docs](https://example.com/docs)"}</Markdown>,
    );
    expect(markup).toContain('href="https://example.com/docs"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
  });

  it("strips YAML frontmatter by default", () => {
    const markup = renderToStaticMarkup(<Markdown>{readme}</Markdown>);
    expect(markup).not.toContain("Draft README");
    expect(markup).not.toContain("status: internal");
  });

  it("keeps frontmatter visible when frontmatter is set to false", () => {
    const markup = renderToStaticMarkup(
      <Markdown frontmatter={false}>{readme}</Markdown>,
    );
    expect(markup).toContain("title: Draft README");
  });

  it("never renders raw HTML", () => {
    const markup = renderToStaticMarkup(
      <Markdown>{"<script>alert(1)</script>\n\nhello"}</Markdown>,
    );
    expect(markup).not.toContain("<script>");
  });

  it("shows alt text instead of an unsafe image source", () => {
    const markup = renderToStaticMarkup(
      <Markdown>{"![a diagram](javascript:evil)"}</Markdown>,
    );
    expect(markup).not.toContain("<img");
    expect(markup).toContain("a diagram");
  });

  it("renders a safe relative image", () => {
    const markup = renderToStaticMarkup(
      <Markdown>{"![a diagram](/assets/diagram.png)"}</Markdown>,
    );
    expect(markup).toContain('src="/assets/diagram.png"');
  });

  it("inherits chat typography while retaining pre wrapping and token classes", () => {
    const markup = renderToStaticMarkup(
      <Markdown
        typography="inherit"
        className="markdown-renderer"
        frontmatter={false}
        components={{
          pre: ({ children, className, ...props }) => (
            <pre
              {...props}
              className={`${className ?? ""} whitespace-pre-wrap break-words`}
            >
              {children}
            </pre>
          ),
        }}
      >
        {"---\ntitle: chat content\n---\n\n```sql\nSELECT cap FROM garden;"}
      </Markdown>,
    );
    expect(markup).toMatch(/^<div class="[^"]*markdown-renderer/u);
    expect(markup).not.toContain("prose-caps");
    expect(markup).toContain("title: chat content");
    expect(markup).toContain('class="tm-code whitespace-pre-wrap break-words"');
    expect(markup).toContain('data-lang="sql"');
    expect(markup).toContain("th-keyword");
  });

  it("keeps visitor restrictions when a surface supplies custom elements", () => {
    const markup = renderToStaticMarkup(
      <Markdown
        policy="visitor"
        components={{
          img: ({ alt, src }) => <img alt={alt} src={src} />,
          a: ({ href, children }) => <a href={href}>{children}</a>,
        }}
      >
        {
          "![pixel](https://tracker.invalid/image) [Help](https://example.com/help) [Local](/file) [Email](mailto:hello@example.com) [Unsafe](javascript:alert(1))"
        }
      </Markdown>,
    );
    expect(markup).not.toContain("<img");
    expect(markup).not.toContain("tracker.invalid");
    expect(markup).not.toContain('href="/file"');
    expect(markup).not.toContain("mailto:");
    expect(markup).not.toContain("javascript:");
    expect(markup).toContain(
      '<a href="https://example.com/help" target="_blank" rel="noopener noreferrer">Help</a>',
    );
    expect(markup).toContain("Image removed");
    expect(markup).toContain("Local");
    expect(markup).toContain("Email");
    expect(markup).toContain("Unsafe");
  });

  it("filters image sources before applying a surface image treatment", () => {
    const markup = renderToStaticMarkup(
      <Markdown
        components={{
          img: ({ alt, src }) => <div data-image={src}>{alt}</div>,
        }}
      >
        {"![generated](/garden.png) ![unsafe](javascript:evil)"}
      </Markdown>,
    );
    expect(markup).toContain('data-image="/garden.png"');
    expect(markup).not.toContain("javascript:");
    expect(markup).toContain("unsafe");
  });
});
