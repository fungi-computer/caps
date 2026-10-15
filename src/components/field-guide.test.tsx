import { afterEach, expect, test } from "vitest";

import { cleanup, render } from "../test-utils/index.js";
import {
  CartridgeLabel,
  Keycap,
  SpecimenLabel,
  StatusLed,
} from "./field-guide.js";

afterEach(cleanup);

test("Keycap uses the native kbd element and forwards attributes", () => {
  const view = render(
    <Keycap aria-label="jump shortcut" data-key="j">
      J
    </Keycap>,
  );
  const keycap = view.queryBySelector("kbd.caps-keycap");
  expect(keycap?.textContent).toBe("J");
  expect(keycap?.getAttribute("aria-label")).toBe("jump shortcut");
  expect(keycap?.getAttribute("data-key")).toBe("j");
});

test("StatusLed exposes state in its accessible name and tone metadata", () => {
  const view = render(<StatusLed active={false} label="Signal" tone="spore" />);
  const led = view.queryBySelector('[role="img"].caps-led');
  expect(led?.getAttribute("aria-label")).toBe("Signal: off");
  expect(led?.getAttribute("data-tone")).toBe("spore");
  expect(led?.getAttribute("data-active")).toBe("false");
});

test("CartridgeLabel and SpecimenLabel retain their supplied material text", () => {
  const view = render(
    <>
      <CartridgeLabel title="VISHNU" subtitle="Living world engine" />
      <SpecimenLabel
        plate="Plate S01"
        detail="Watershed cutaway"
        kind="Engine specimen"
        number="01"
        title={<h3>Vishnu engine</h3>}
        summary="Water, soil and a playable world."
      />
    </>,
  );
  expect(view.queryBySelector(".caps-cartridge-label")?.textContent).toContain(
    "VISHNU",
  );
  expect(view.queryBySelector(".caps-cartridge-label")?.textContent).toContain(
    "Living world engine",
  );
  expect(view.queryBySelector(".caps-specimen-label-meta")?.textContent).toBe(
    "Engine specimen · 01",
  );
  expect(
    view.queryBySelector(".caps-specimen-label-summary")?.textContent,
  ).toBe("Water, soil and a playable world.");
});
