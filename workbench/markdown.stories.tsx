import type { StoryDefault } from "@ladle/react";

import { Markdown } from "../src/components/markdown.js";

export default { title: "Markdown" } satisfies StoryDefault;

const readme = `---
title: Draft README
status: internal
---

# Fungi Hub

A worker that routes requests between Apps and the Gatekeeper.

## Install

\`\`\`shell
pnpm install
\`\`\`

- [Field guide](/wiki/3-resources/field-guide.md)
- [Upstream project](https://example.com/project)
- Report an issue by email: <mailto:hub@example.com>

![Architecture diagram](/assets/hub-architecture.png)
`;

export const Readme = () => (
  <div className="mx-auto max-w-[48rem] p-lg">
    <Markdown>{readme}</Markdown>
  </div>
);
