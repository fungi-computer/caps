import type { Story } from "@ladle/react";
import { ArrowRight, Moon, Plus, Search, Settings, Trash2 } from "lucide-react";
import { Button } from "../src/components/button.js";
import { IconButton } from "../src/components/icon-button.js";
import { Keycap, KeycapButton } from "../src/components/keycap.js";
import "./button.css";

const variants = [
  "primary",
  "secondary",
  "accent",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const;

/** Every button finish side by side, with a header row of real controls. */
export const ButtonSet: Story = () => (
  <main className="button-set" data-conformance="button-set">
    <section className="button-set-section" aria-label="Header controls">
      <span className="button-set-caption">Header / one row</span>
      <div className="button-set-header">
        <label className="input input-sm button-set-search">
          <Search aria-hidden="true" size={14} />
          <input aria-label="Search" placeholder="Search docs" />
          <Keycap size="sm" aria-hidden="true">
            /
          </Keycap>
        </label>
        <IconButton
          aria-label="Theme"
          icon={<Moon />}
          iconSize="sm"
          size="sm"
          variant="outline"
        />
        <IconButton
          aria-label="Settings"
          icon={<Settings />}
          iconSize="sm"
          size="sm"
          variant="outline"
        />
        <Button size="sm" variant="outline">
          GitHub <span className="button-set-count">49.1K</span>
        </Button>
        <Button size="sm">Get started</Button>
      </div>
    </section>
    <section className="button-set-section" aria-label="Button variants">
      <span className="button-set-caption">Variants</span>
      <div className="button-set-row">
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </div>
      <div className="button-set-row">
        {variants.map((variant) => (
          <Button key={variant} variant={variant} disabled>
            {variant}
          </Button>
        ))}
      </div>
      <div className="button-set-row">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>
          Regular <ArrowRight aria-hidden="true" size={16} />
        </Button>
        <Button size="lg">Large</Button>
        <IconButton aria-label="Add" icon={<Plus />} iconSize="sm" />
        <IconButton
          aria-label="Delete"
          icon={<Trash2 />}
          iconSize="sm"
          tone="destructive"
        />
      </div>
    </section>
    <section className="button-set-section" aria-label="Keys">
      <span className="button-set-caption">Keys</span>
      <div className="button-set-row">
        <KeycapButton label="Build" shortcut="B" />
        <KeycapButton label="Run" tone="primary" shortcut="R" />
        <KeycapButton label="Grid" pressed />
        <KeycapButton label="Grid" pressed={false} />
        <span className="button-set-legend">
          Press <Keycap size="sm">⌘</Keycap>
          <Keycap size="sm">K</Keycap> to search
        </span>
      </div>
    </section>
  </main>
);
