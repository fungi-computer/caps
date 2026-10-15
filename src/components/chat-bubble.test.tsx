import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChatBubble } from "./chat-bubble.js";

describe("ChatBubble", () => {
  it("puts an agent on the left with its mark, name and time", () => {
    const markup = renderToStaticMarkup(
      <ChatBubble
        side="agent"
        avatar={<i data-mark />}
        name="Shiitake"
        time="3:41 PM"
      >
        Hello there
      </ChatBubble>,
    );
    expect(markup).toContain('data-side="agent"');
    expect(markup).toContain('data-state="settled"');
    expect(markup).toContain("caps-chat-avatar");
    expect(markup).toContain("Shiitake");
    expect(markup).toContain("3:41 PM");
    expect(markup).toContain("Hello there");
    expect(markup).not.toContain("caps-chat-typing");
  });

  it("puts the person on the right, without a mark", () => {
    const markup = renderToStaticMarkup(
      <ChatBubble side="user">hello</ChatBubble>,
    );
    expect(markup).toContain('data-side="user"');
    expect(markup).not.toContain("caps-chat-avatar");
    expect(markup).not.toContain("caps-chat-meta");
  });

  it("shows the still-writing dots only while pending, and hides them from readers", () => {
    const pending = renderToStaticMarkup(
      <ChatBubble side="agent" state="pending" time="writing…">
        Partly
      </ChatBubble>,
    );
    expect(pending).toContain('data-state="pending"');
    expect(pending).toMatch(/caps-chat-typing"[^>]*>/u);
    expect(pending).toContain('aria-hidden="true" class="caps-chat-typing"');
    const error = renderToStaticMarkup(
      <ChatBubble side="agent" state="error">
        It stopped
      </ChatBubble>,
    );
    expect(error).toContain('data-state="error"');
    expect(error).not.toContain("caps-chat-typing");
  });
});
