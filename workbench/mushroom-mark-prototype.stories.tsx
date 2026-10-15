import type { StoryDefault } from "@ladle/react";
import { useState } from "react";
import { Button } from "../src/components/button.js";
import "./mushroom-mark/prototype.css";

// Logo-only prototype: preserve the approved trace and compare three small
// proportion changes side by side, as requested. No production logo changes.
export default { title: "Brand / Mushroom" } satisfies StoryDefault;

const reference = new URL(
  "./mushroom-mark/approved-reference.png",
  import.meta.url,
).href;
const studies = [
  {
    name: "Original trace",
    file: new URL("./mushroom-mark/original.svg", import.meta.url).href,
    note: "Reference proportions. Sweeping cap and flared stem.",
  },
  {
    name: "Squatter stem",
    file: new URL("./mushroom-mark/squat.svg", import.meta.url).href,
    note: "Same cap; stem 18% shorter, anchored at its shoulder.",
  },
  {
    name: "Rounder stem",
    file: new URL("./mushroom-mark/round.svg", import.meta.url).href,
    note: "Same cap; fuller, rounder transitions into the foot.",
  },
  {
    name: "Softer edges",
    file: new URL("./mushroom-mark/soft.svg", import.meta.url).href,
    note: "Gentler cap shoulder, curl tip, and stem corners.",
  },
] as const;

function Mark({ file, size = 160 }: { file: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="mushroom-mark"
      ref={(element) => {
        element?.style.setProperty("--mark-url", `url("${file}")`);
        element?.style.setProperty("--mark-size", `${String(size)}px`);
      }}
    />
  );
}

export function Comparison() {
  const [selected, setSelected] = useState(0);
  const [overlay, setOverlay] = useState(false);
  const study = studies[selected] ?? studies[0];
  return (
    <main className="mushroom-prototype">
      <header>
        <p>BRAND STUDY · NOT INSTALLED IN THE APP</p>
        <h1>A little mushroom. A lot of personality.</h1>
        <p>
          The approved silhouette stays separate. The other three are small,
          deliberate variations.
        </p>
      </header>
      <section
        className="mushroom-comparisons"
        aria-label="Mushroom logo variants"
      >
        {studies.map((item, index) => (
          <article key={item.name} data-selected={index === selected}>
            <button
              type="button"
              className="mushroom-specimen"
              onClick={() => {
                setSelected(index);
              }}
              aria-label={`Inspect ${item.name}`}
              aria-pressed={index === selected}
            >
              <Mark file={item.file} />
            </button>
            <h2>{item.name}</h2>
            <p>{item.note}</p>
            <div className="mushroom-size-row" aria-label="Actual pixel sizes">
              {[16, 20, 24, 32].map((size) => (
                <span key={size}>
                  <Mark file={item.file} size={size} />
                  <small>{size}px</small>
                </span>
              ))}
            </div>
            <div className="mushroom-colors" aria-label="Single-color samples">
              {["inverse", "coral", "mint", "lilac"].map((color) => (
                <span key={color} data-ink={color}>
                  <Mark file={item.file} size={40} />
                </span>
              ))}
            </div>
            <a href={item.file} download>
              Download SVG
            </a>
          </article>
        ))}
      </section>
      <section className="mushroom-inspector" aria-label="Reference comparison">
        <div>
          <h2>{study.name}</h2>
          <p>{study.note}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setOverlay(!overlay);
            }}
            aria-pressed={overlay}
          >
            {overlay ? "Hide reference overlay" : "Overlay approved reference"}
          </Button>
          <p>
            The overlay uses the large original mark, not the slightly different
            color thumbnails. The SVG preserves the silhouette, not the
            generated texture.
          </p>
          <a href={reference} target="_blank" rel="noreferrer">
            Open untouched reference sheet ↗
          </a>
        </div>
        <svg
          className="mushroom-overlay"
          viewBox="300 210 680 550"
          role="img"
          aria-label={`${study.name}${overlay ? " over approved reference" : " enlarged"}`}
        >
          {overlay ? (
            <image href={reference} x="0" y="0" width="1254" height="1254" />
          ) : null}
          <image
            href={study.file}
            x="300"
            y="210"
            width="680"
            height="550"
            opacity={overlay ? 0.45 : 1}
          />
        </svg>
      </section>
      <section className="mushroom-menu-study" aria-label="Menu bar size study">
        <Mark file={study.file} size={20} />
        <strong>Inkcap</strong>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Window</span>
      </section>
    </main>
  );
}
