import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "../test-utils/index.js";
import { CopyField } from "./copy-field.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CopyField", () => {
  it("pairs a wrapped code value with a labelled copy action", () => {
    const markup = renderToStaticMarkup(
      <CopyField value="play.mossy.fungi.computer:25565" />,
    );
    expect(markup).toContain("caps-copy-field-value");
    expect(markup).toContain("play.mossy.fungi.computer:25565");
    expect(markup).toContain(
      'aria-label="Copy: play.mossy.fungi.computer:25565"',
    );
  });

  it("labels a read-only input that shows a readable value", () => {
    const markup = renderToStaticMarkup(
      <CopyField
        displayValue="vishnu.shiit.app/frog"
        fieldLabel="Share link"
        label="Copy link"
        value="https://vishnu.shiit.app/frog"
      />,
    );
    expect(markup).toContain("caps-copy-field-input");
    expect(markup).toContain(">Share link</label>");
    expect(markup).toContain('value="vishnu.shiit.app/frog"');
    expect(markup).toContain("Copy link");
  });

  it("titles a block of coloured code and copies exactly the code it shows", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const value = "<script\n  async\n></script>";
    const { container } = render(
      <CopyField
        aria-label="Embed snippet"
        label="Copy snippet"
        title="HTML"
        tokens={[
          { kind: "tag", text: "<script" },
          { kind: "text", text: "\n  " },
          { kind: "attribute", text: "async" },
          { kind: "text", text: "\n" },
          { kind: "tag", text: "></script>" },
        ]}
        layout="block"
      />,
    );
    const figure = container.querySelector("figure");
    expect(figure?.getAttribute("aria-label")).toBe("Embed snippet");
    expect(figure?.querySelector("figcaption")?.textContent).toContain("HTML");
    const code = figure?.querySelector("pre code");
    expect(code?.textContent).toBe(value);
    expect(code?.querySelector('[data-kind="attribute"]')?.textContent).toBe(
      "async",
    );
    expect(figure?.querySelector("pre")?.tabIndex).toBe(0);
    const button = figure?.querySelector("button");
    expect(button?.textContent).toBe("Copy snippet");
    await act(async () => {
      button?.click();
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith(value);
    expect(button?.textContent).toBe("Copied");
    expect(figure?.querySelector('[role="status"]')?.textContent).toBe(
      "Copied to the clipboard",
    );
  });

  it("names a denied clipboard write in a block and asks for a manual copy", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const { container } = render(
      <CopyField label="Copy snippet" layout="block" value="<b>hi</b>" />,
    );
    const button = container.querySelector("button");
    expect(container.querySelector("pre code")?.textContent).toBe("<b>hi</b>");
    await act(async () => {
      button?.click();
      await Promise.resolve();
    });
    expect(button?.textContent).toBe("Copy failed");
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      "Could not copy. Select the code to copy it.",
    );
  });

  it("keeps a denied clipboard write as an explicit failed outcome", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const { container } = render(<CopyField value="share value" />);
    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    if (!button) return;

    await act(async () => {
      button.click();
      await Promise.resolve();
    });
    expect(button.textContent).toContain("Copy failed");
  });
});
