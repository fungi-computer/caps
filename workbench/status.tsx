import type { Story } from "@ladle/react";
import { useState } from "react";
import {
  Status as CapsStatus,
  type StatusGlyph,
  type StatusTone,
  type StatusMotion,
} from "../src/components/status.js";
import "./status.css";

const glyphs: StatusGlyph[] = ["dot", "pill", "bang"];
const motions: StatusMotion[] = ["none", "pulse", "bounce"];
const tones: StatusTone[] = [
  "neutral",
  "primary",
  "secondary",
  "accent",
  "success",
  "info",
  "warning",
  "error",
];

export const Status: Story = () => {
  const [glyph, setGlyph] = useState<StatusGlyph>("dot");
  const [tone, setTone] = useState<StatusTone>("primary");
  const [motion, setMotion] = useState<StatusMotion>("none");
  const [hovered, setHovered] = useState(false);
  return (
    <main className="status-study" data-conformance="status">
      <section className="status-study-stage" aria-label="Status preview">
        <span className="status-study-caption">8× / {glyph}</span>
        <div className="status-study-magnified" data-status-preview>
          <CapsStatus glyph={glyph} tone={tone} motion={motion} />
        </div>
        <span className="status-study-hint">
          Switch shapes mid-morph. It follows you.
        </span>
      </section>
      <div className="status-study-controls">
        <fieldset>
          <legend>Shape</legend>
          <div className="status-study-options">
            {glyphs.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={glyph === value}
                onClick={() => {
                  setGlyph(value);
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Motion</legend>
          <div className="status-study-options">
            {motions.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={motion === value}
                onClick={() => {
                  setMotion(value);
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Tone</legend>
          <div className="status-study-tones">
            {tones.map((value) => (
              <button
                key={value}
                type="button"
                aria-label={value}
                title={value}
                aria-pressed={tone === value}
                onClick={() => {
                  setTone(value);
                }}
              >
                <CapsStatus tone={value} />
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <pre className="status-study-code">
        <code>{`<Status glyph="${glyph}" tone="${tone}" motion="${motion}" />`}</code>
      </pre>
      <section className="status-study-context" aria-label="Actual size">
        <div>
          <h2>Actual size</h2>
          <p>The same bead, at eight pixels.</p>
        </div>
        <div className="status-study-sample">
          <CapsStatus
            glyph={glyph}
            tone={tone}
            motion={motion}
            label="Connected"
          />
        </div>
        <button
          type="button"
          className="status-study-row"
          onPointerEnter={() => {
            setHovered(true);
          }}
          onPointerLeave={() => {
            setHovered(false);
          }}
          onFocus={() => {
            setHovered(true);
          }}
          onBlur={() => {
            setHovered(false);
          }}
        >
          <span>Hover or focus this row</span>
          <CapsStatus glyph={hovered ? "pill" : "dot"} tone={tone} />
        </button>
      </section>
    </main>
  );
};
