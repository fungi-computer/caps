// @vitest-environment jsdom
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";

import {
  cleanup,
  fireInput,
  render,
  requireValue,
} from "../test-utils/index.js";
import { FaqChat, matchFaqEntry, type FaqChatEntry } from "./faq-chat.js";

afterEach(cleanup);

const entries: FaqChatEntry[] = [
  {
    actions: <a href="/pay">Pay</a>,
    answer: <p>One request at a time.</p>,
    id: "standard",
    keywords: ["standard", "one request", "6500"],
    question: "What is Standard?",
  },
  {
    answer: <p>Two requests at a time.</p>,
    id: "priority",
    keywords: ["priority", "two requests"],
    question: "What is Priority?",
  },
];

const fallback = {
  actions: <a href="/session">Session</a>,
  answer: <p>I only answer from the list.</p>,
};

describe("matchFaqEntry", () => {
  it("routes by whole keywords and phrases, preferring the most hits", () => {
    expect(matchFaqEntry(entries, "Tell me about STANDARD")?.id).toBe(
      "standard",
    );
    expect(matchFaqEntry(entries, "can you do two requests?")?.id).toBe(
      "priority",
    );
    expect(
      matchFaqEntry(entries, "standard or priority, one request please")?.id,
    ).toBe("standard");
  });

  it("returns undefined instead of guessing", () => {
    expect(matchFaqEntry(entries, "what's the weather")).toBeUndefined();
    expect(matchFaqEntry(entries, "standards")).toBeUndefined();
    expect(matchFaqEntry(entries, "   ")).toBeUndefined();
  });
});

describe("FaqChat", () => {
  function mount() {
    return render(
      <FaqChat
        entries={entries}
        fallback={fallback}
        greeting={<p>Hi.</p>}
        note="Fixed answers"
        title="Ask about the plans"
      />,
    );
  }

  it("answers a suggested question with its reviewed answer and actions", () => {
    const view = mount();
    const log = requireValue(view.queryBySelector("[role=log]"), "chat log");
    expect(log.textContent).toBe("Hi.");
    const suggestion = requireValue(
      [...view.container.querySelectorAll("button")].find(
        (button) => button.textContent === "What is Priority?",
      ),
      "priority suggestion",
    );
    act(() => {
      suggestion.click();
    });
    expect(view.queryBySelector(".caps-faq-chat-user")?.textContent).toBe(
      "What is Priority?",
    );
    expect(log.textContent).toContain("Two requests at a time.");
    expect(
      view.queryBySelector("section")?.getAttribute("aria-labelledby"),
    ).toBe(view.queryByText("Ask about the plans")?.id);
  });

  it("routes typed questions and falls back honestly", () => {
    const view = mount();
    const input = requireValue(
      view.container.querySelector<HTMLInputElement>("input"),
      "question input",
    );
    const form = requireValue(view.queryBySelector("form"), "form");
    act(() => {
      fireInput(input, "how much is standard");
    });
    act(() => {
      form.dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(input.value).toBe("");
    act(() => {
      fireInput(input, "do you do taxes");
    });
    act(() => {
      form.dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    const log = requireValue(view.queryBySelector("[role=log]"), "chat log");
    expect(log.textContent).toContain("One request at a time.");
    expect(log.querySelector('a[href="/pay"]')).not.toBeNull();
    expect(log.textContent).toContain("I only answer from the list.");
    expect(log.querySelector('a[href="/session"]')).not.toBeNull();
  });
});
