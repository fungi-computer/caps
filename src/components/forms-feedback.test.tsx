// @vitest-environment jsdom
import { act, createRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { Alert } from "./alert.js";
import { Badge } from "./badge.js";
import { Card, CardContent, CardHeader, CardTitle } from "./card.js";
import { Checkbox } from "./checkbox.js";
import { CountBadge } from "./count-badge.js";
import { InputGroup, InputGroupAddon } from "./input-group.js";
import { Progress } from "./progress.js";
import { Prose } from "./prose.js";
import { RadioGroup, RadioGroupItem } from "./radio-group.js";
import { Select } from "./select.js";
import { Separator } from "./separator.js";
import { Skeleton } from "./skeleton.js";
import { Loader } from "./loader.js";
import { Status } from "./status.js";
import { Switch } from "./switch.js";
import { VisuallyHidden } from "./visually-hidden.js";

afterEach(cleanup);

describe("Caps forms and feedback", () => {
  it("forwards refs and caller classes across native controls", () => {
    const inputRef = createRef<HTMLSelectElement>();
    const view = render(
      <main>
        <InputGroup className="group-custom">
          <InputGroupAddon>$</InputGroupAddon>
          <Select
            ref={inputRef}
            className="select-custom"
            invalid
            defaultValue="usd"
          >
            <option value="usd">USD</option>
          </Select>
        </InputGroup>
        <Checkbox aria-label="Remember" className="check-custom" />
      </main>,
    );
    const group = view.queryBySelector(".group-custom");
    expect(group).not.toBeNull();
    expect(group?.className).toContain("[&>*]:join-item");
    expect(group?.className).toContain("[&>.input]:flex-1");
    expect(view.queryBySelector(".select-custom")).not.toBeNull();
    expect(inputRef.current).toBe(view.queryBySelector("select"));
    expect(view.queryBySelector("select")?.getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(view.queryBySelector(".check-custom")?.getAttribute("type")).toBe(
      "checkbox",
    );
  });

  it("keeps RadioGroup controlled and reports native selection", () => {
    const onValueChange = vi.fn();
    let setValue: ((value: string) => void) | undefined;
    function Harness() {
      const [value, update] = useState("one");
      setValue = update;
      return (
        <RadioGroup name="choice" value={value} onValueChange={onValueChange}>
          <RadioGroupItem aria-label="One" value="one" />
          <RadioGroupItem aria-label="Two" value="two" />
        </RadioGroup>
      );
    }
    const view = render(<Harness />);
    const radios =
      view.container.querySelectorAll<HTMLInputElement>("input[type=radio]");
    expect(radios[0]?.checked).toBe(true);
    act(() => radios[1]?.click());
    expect(onValueChange).toHaveBeenCalledWith("two");
    expect(radios[1]?.checked).toBe(false);
    act(() => setValue?.("two"));
    expect(radios[1]?.checked).toBe(true);
  });

  it("exposes a native switch with a controlled change callback", () => {
    const onCheckedChange = vi.fn();
    const view = render(
      <Switch aria-label="Enabled" checked onCheckedChange={onCheckedChange} />,
    );
    const input = requireValue(
      view.container.querySelector<HTMLInputElement>("input"),
      "Switch input",
    );
    expect(input.getAttribute("role")).toBe("switch");
    expect(input.checked).toBe(true);
    act(() => {
      input.click();
    });
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it("keeps feedback generic and lets callers control placement", () => {
    const view = render(
      <main>
        <Card variant="interactive" data-card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge tone="success">Ready</Badge>
          </CardContent>
        </Card>
        <Alert
          tone="warning"
          title="Heads up"
          description="Review this choice"
        />
        <Status tone="info" label="Available" motion="pulse" />
        <CountBadge count={3} label="items" />
        <Progress tone="success" value={3} max={5} aria-label="Progress" />
        <Loader label="Working" />
        <Skeleton className="h-4 w-20" />
        <Separator decorative={false} />
        <Prose>
          <p>Readable copy.</p>
        </Prose>
        <VisuallyHidden>Screen reader copy</VisuallyHidden>
      </main>,
    );
    expect(view.queryBySelector("[data-card]")?.className).toContain(
      "caps-card-interactive",
    );
    expect(view.queryBySelector("[role=alert]")?.textContent).toContain(
      "Heads up",
    );
    expectOwnedLoaderLabel(
      requireValue(view.queryBySelector("[role=status]"), "labelled Loader"),
      "Working",
    );
    expect(
      view
        .queryBySelector("[role=separator]")
        ?.getAttribute("aria-orientation"),
    ).toBe("horizontal");
    expect(view.queryBySelector(".skeleton")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("renders the same gooey material at three sizes with unique SVG definitions", () => {
    const view = render(
      <>
        <Loader size="sm" />
        <Loader size="md" />
        <Loader size="lg" />
      </>,
    );
    for (const size of ["sm", "md", "lg"]) {
      expect(
        view.container.querySelector(`.caps-loader-${size} svg`),
      ).not.toBeNull();
    }
    const ids = [...view.container.querySelectorAll("[id]")].map(
      (node) => node.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(view.container.querySelector(".loading-spinner")).toBeNull();
  });

  it("keeps bloom and donut geometry inside one shared material mask", () => {
    const view = render(
      <>
        <Loader variant="bloom" />
        <Loader variant="donut" />
      </>,
    );
    for (const [variant, count] of [
      ["bloom", 5],
      ["donut", 16],
    ] as const) {
      const loader = requireValue(
        view.container.querySelector(`[data-variant="${variant}"]`),
        variant,
      );
      expect(loader.querySelectorAll("mask ellipse")).toHaveLength(count);
      expect(loader.querySelectorAll("rect[mask]")).toHaveLength(1);
    }
  });

  it("uses one accessible label path for string and ReactNode labels", () => {
    const view = render(
      <main>
        <Loader data-loader="default" />
        <Loader data-loader="string" label="Synchronizing" />
        <Loader
          data-loader="node"
          label={
            <span data-supplied-node>
              Indexing <strong>files</strong>
            </span>
          }
        />
        <Loader
          aria-label="Host loading"
          data-loader="aria-label"
          label="Unused string fallback"
        />
        <span id="external-loader-label">External loading</span>
        <Loader
          aria-labelledby="external-loader-label"
          data-loader="aria-labelledby"
          label={<span data-unused-node>Unused node fallback</span>}
        />
        <Loader
          data-loader="decorative"
          decorative
          label={<span data-decorative-label>Decorative fallback</span>}
        />
      </main>,
    );

    const defaultLoader = getLoader(view.container, "default");
    const stringLoader = getLoader(view.container, "string");
    const nodeLoader = getLoader(view.container, "node");
    expectOwnedLoaderLabel(defaultLoader, "Loading");
    expectOwnedLoaderLabel(stringLoader, "Synchronizing");
    const nodeLabel = expectOwnedLoaderLabel(nodeLoader, "Indexing files");
    expect(nodeLabel.querySelector("[data-supplied-node]")).not.toBeNull();

    const ariaLabelLoader = getLoader(view.container, "aria-label");
    expect(ariaLabelLoader.getAttribute("aria-label")).toBe("Host loading");
    expect(ariaLabelLoader.getAttribute("aria-labelledby")).toBeNull();
    expect(ariaLabelLoader.textContent).toBe("");

    const externalLabelLoader = getLoader(view.container, "aria-labelledby");
    expect(externalLabelLoader.getAttribute("aria-label")).toBeNull();
    expect(externalLabelLoader.getAttribute("aria-labelledby")).toBe(
      "external-loader-label",
    );
    expect(externalLabelLoader.textContent).toBe("");
    expect(externalLabelLoader.querySelector("[data-unused-node]")).toBeNull();

    const decorativeLoader = getLoader(view.container, "decorative");
    expect(decorativeLoader.getAttribute("aria-hidden")).toBe("true");
    expect(decorativeLoader.getAttribute("role")).toBeNull();
    expect(decorativeLoader.getAttribute("aria-label")).toBeNull();
    expect(decorativeLoader.getAttribute("aria-labelledby")).toBeNull();
    expect(decorativeLoader.textContent).toBe("");
    expect(
      decorativeLoader.querySelector("[data-decorative-label]"),
    ).toBeNull();
  });
});

function getLoader(container: HTMLElement, name: string): HTMLElement {
  return requireValue(
    container.querySelector<HTMLElement>(`[data-loader="${name}"]`),
    `${name} Loader`,
  );
}

function expectOwnedLoaderLabel(
  loader: HTMLElement,
  expectedContent: string,
): HTMLElement {
  expect(loader.getAttribute("aria-label")).toBeNull();
  const labelId = requireValue(
    loader.getAttribute("aria-labelledby"),
    "Loader-owned label relationship",
  );
  const label = requireValue(
    loader.ownerDocument.getElementById(labelId),
    "Loader-owned label node",
  );
  expect(loader.contains(label)).toBe(true);
  expect(label.textContent.replace(/\s+/g, " ").trim()).toBe(expectedContent);
  expect(label.className).toContain("absolute");
  expect(label.className).toContain("overflow-hidden");
  return label;
}
