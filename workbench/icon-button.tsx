import type { Story } from "@ladle/react";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Copy,
  Maximize2,
  Moon,
  Pin,
  Plus,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { IconButton as CapsIconButton } from "../src/components/icon-button.js";
import "./status.css";
import "./icon-button.css";

export const IconButton: Story = () => {
  const [pinned, setPinned] = useState(false);
  const [size, setSize] = useState<"xs" | "sm" | "default">("xs");
  const [disabled, setDisabled] = useState(false);
  const [lastAction, setLastAction] = useState(
    "Try an action. Every icon has a name.",
  );
  return (
    <main className="status-study" data-conformance="icon-button">
      <section className="status-study-stage" aria-label="Icon button preview">
        <span className="status-study-caption">
          Small controls / clear intent
        </span>
        <div
          className="caps-button-group icon-button-study-actions"
          role="group"
          aria-label="Window controls"
        >
          <CapsIconButton
            aria-label="Make main"
            title="Make main"
            icon={<ArrowUpRight />}
            size={size}
            disabled={disabled}
            onClick={() => {
              setLastAction("Made main");
            }}
          />
          <CapsIconButton
            aria-label="Zoom"
            title="Zoom"
            icon={<Maximize2 />}
            size={size}
            disabled={disabled}
            onClick={() => {
              setLastAction("Zoom requested");
            }}
          />
          <CapsIconButton
            aria-label="Pin window"
            title="Pin window"
            icon={<Pin />}
            size={size}
            disabled={disabled}
            active={pinned}
            aria-pressed={pinned}
            onClick={() => {
              setPinned(!pinned);
              setLastAction(pinned ? "Unpinned" : "Pinned");
            }}
          />
          <CapsIconButton
            aria-label="Close window"
            title="Close window"
            icon={<X />}
            size={size}
            disabled={disabled}
            tone="destructive"
            onClick={() => {
              setLastAction("Close requested");
            }}
          />
        </div>
        <span className="status-study-hint" role="status">
          {lastAction}
        </span>
      </section>
      <div className="status-study-controls">
        <fieldset>
          <legend>Size</legend>
          <div className="status-study-options">
            {(["xs", "sm", "default"] as const).map((option) => (
              <button
                type="button"
                key={option}
                aria-pressed={size === option}
                onClick={() => {
                  setSize(option);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>State</legend>
          <div className="status-study-options">
            <button
              type="button"
              aria-pressed={disabled}
              onClick={() => {
                setDisabled(!disabled);
              }}
            >
              Disabled
            </button>
          </div>
        </fieldset>
      </div>
      <section className="icon-button-study-context" aria-label="Other actions">
        <div>
          <h2>A glyph, not a guessing game.</h2>
          <p>
            Tab through for focus. Names belong to the action, not the shape.
          </p>
        </div>
        <div className="icon-button-study-samples">
          <div>
            <CapsIconButton
              aria-label="Add item"
              title="Add item"
              icon={<Plus />}
              size="sm"
              variant="secondary"
              onClick={() => {
                setLastAction("Added an item");
              }}
            />
            <span>Filled</span>
          </div>
          <div>
            <CapsIconButton
              aria-label="Copy"
              title="Copy"
              icon={<Copy />}
              size="sm"
              variant="outline"
              onClick={() => {
                setLastAction("Copy requested");
              }}
            />
            <span>Outline</span>
          </div>
          <div>
            <CapsIconButton
              aria-label="Delete item"
              title="Delete item"
              icon={<Trash2 />}
              size="sm"
              tone="destructive"
              onClick={() => {
                setLastAction("Delete requested");
              }}
            />
            <span>Destructive</span>
          </div>
          <ThemeAction />
        </div>
      </section>
      <pre className="status-study-code">
        <code>
          {
            '<IconButton\n  aria-label="Pin window"\n  icon={<Pin />}\n  active={pinned}\n  aria-pressed={pinned}\n  onClick={() => setPinned(!pinned)}\n/>'
          }
        </code>
      </pre>
    </main>
  );
};

function ThemeAction() {
  const [night, setNight] = useState(false);
  return (
    <div>
      <CapsIconButton
        aria-label="Night mode"
        title="Night mode"
        icon={night ? <Moon /> : <Sun />}
        size="sm"
        active={night}
        aria-pressed={night}
        onClick={() => {
          setNight(!night);
        }}
      />
      <span>Toggle</span>
    </div>
  );
}

export const IconButtonGroup: Story = () => (
  <div className="caps-button-group" role="group" aria-label="File navigation">
    <CapsIconButton icon={<ArrowLeft />} aria-label="Back" variant="outline" />
    <CapsIconButton
      icon={<ArrowRight />}
      aria-label="Forward"
      variant="outline"
    />
  </div>
);
