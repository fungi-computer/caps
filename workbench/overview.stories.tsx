import type { Story, StoryDefault } from "@ladle/react";
import { useState } from "react";

import { Badge } from "@fungi.computer/caps/components/badge";
import { Button } from "@fungi.computer/caps/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@fungi.computer/caps/components/card";
import { Checkbox } from "@fungi.computer/caps/components/checkbox";
import { Field } from "@fungi.computer/caps/components/field";
import { Input } from "@fungi.computer/caps/components/input";
import { Label } from "@fungi.computer/caps/components/label";
import { Progress } from "@fungi.computer/caps/components/progress";
import { Switch } from "@fungi.computer/caps/components/switch";
import { catalog, componentStory } from "./guide.js";
import { StoryLink } from "./story-link.js";

export default { title: "Welcome" } satisfies StoryDefault;

export const Caps: Story = () => {
  const [saved, setSaved] = useState(false);
  return (
    <main className="caps-library">
      <header className="caps-library-hero">
        <div className="caps-library-intro">
          <p className="caps-library-eyebrow">CAPS / INTERFACE LIBRARY</p>
          <h1>
            Make yourself
            <br />
            at home.
          </h1>
          <p className="caps-library-lede">
            Comfortable controls, expressive details and layouts that fit
            together. Pick a piece. Try it. Make it yours.
          </p>
          <div className="caps-library-actions">
            <Button asChild>
              <StoryLink storyId={componentStory("button")}>
                Explore the components
              </StoryLink>
            </Button>
            <Button asChild variant="ghost">
              <StoryLink storyId="layouts--automatic-tiling">
                Try a window layout →
              </StoryLink>
            </Button>
          </div>
          <p className="caps-library-note">
            {catalog.length} components & blocks · Latte & Mocha · One shared
            spacing grid
          </p>
        </div>
        <section
          className="caps-library-demo"
          aria-label="Interactive workspace example"
        >
          <Card>
            <CardHeader>
              <div className="caps-library-demo-heading">
                <span className="caps-library-mark" aria-hidden="true">
                  c.
                </span>
                <div>
                  <CardTitle>A little workspace</CardTitle>
                  <CardDescription>A few pieces, together.</CardDescription>
                </div>
                <Badge tone="success" size="sm">
                  Ready
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Field
                label="Project name"
                description="Try editing this example."
              >
                <Input
                  defaultValue="Weekend ideas"
                  onChange={() => {
                    setSaved(false);
                  }}
                />
              </Field>
              <div className="grid gap-lg">
                <Field
                  label="Keep me in the loop"
                  description="Small updates as things happen."
                  orientation="horizontal"
                >
                  <Switch id="library-notifications" defaultChecked />
                </Field>
                <Label htmlFor="library-small">
                  <Checkbox id="library-small" defaultChecked /> Start with
                  something small
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <span role="status">
                {saved ? "Example saved." : "All controls are live."}
              </span>
              <Button
                size="sm"
                onClick={() => {
                  setSaved(true);
                }}
              >
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </section>
      </header>

      <section
        aria-labelledby="explore-heading"
        className="caps-library-section"
      >
        <div className="caps-library-section-heading">
          <h2 id="explore-heading">Find your starting point</h2>
          <p>From a single control to a whole workspace.</p>
        </div>
        <div className="caps-library-feature-grid">
          <StoryLink
            className="caps-library-feature"
            storyId={componentStory("field")}
          >
            <div className="caps-library-feature-art" aria-hidden="true">
              <div className="caps-library-form-art">
                <span>Your next idea</span>
                <div>Something worth making</div>
                <i />
              </div>
            </div>
            <h3>
              Forms that feel familiar <span>↗</span>
            </h3>
            <p>Labels, choices, hints and a clear next step.</p>
          </StoryLink>
          <StoryLink
            className="caps-library-feature"
            storyId="overlays--window-composition"
          >
            <div className="caps-library-feature-art" aria-hidden="true">
              <div className="caps-library-dialog-art">
                <span>Make a little room</span>
                <div />
                <i>Done</i>
              </div>
            </div>
            <h3>
              Space for a decision <span>↗</span>
            </h3>
            <p>Menus and dialogs that fit inside your app.</p>
          </StoryLink>
          <StoryLink
            className="caps-library-feature"
            storyId={componentStory("progress")}
          >
            <div className="caps-library-feature-art" aria-hidden="true">
              <div className="caps-library-progress-art">
                <span>
                  Coming along nicely <b>64%</b>
                </span>
                <Progress max={100} value={64} />
              </div>
            </div>
            <h3>
              A little useful feedback <span>↗</span>
            </h3>
            <p>Progress, status and just enough movement.</p>
          </StoryLink>
          <StoryLink
            className="caps-library-feature"
            storyId="layouts--automatic-tiling"
          >
            <div className="caps-library-feature-art" aria-hidden="true">
              <div className="caps-library-layout-art">
                <div />
                <div />
                <div />
              </div>
            </div>
            <h3>
              Room to work <span>↗</span>
            </h3>
            <p>Arrange panes, float a window, keep your place.</p>
          </StoryLink>
        </div>
      </section>

      <section aria-labelledby="apps-heading" className="caps-library-section">
        <div className="caps-library-section-heading">
          <h2 id="apps-heading">Open an App</h2>
          <p>Real interfaces with local fixtures for hands-on review.</p>
        </div>
        <nav className="caps-library-catalog" aria-label="App workbenches">
          {[
            { label: "Shed · Computers", storyId: "shed--workspace" },
            { label: "Prints · Media", storyId: "prints--studio" },
            { label: "Inkcap · Files", storyId: "inkcap--workspace" },
            { label: "Grove · Conversations", storyId: "grove--inbox" },
          ].map(({ label, storyId }) => (
            <StoryLink key={storyId} storyId={storyId}>
              <span>{label}</span>
              <span aria-hidden="true">↗</span>
            </StoryLink>
          ))}
        </nav>
      </section>

      <section
        aria-labelledby="catalog-heading"
        className="caps-library-section"
      >
        <div className="caps-library-section-heading">
          <h2 id="catalog-heading">The whole collection</h2>
          <p>
            Choose a component, or use Ladle’s search to jump straight to it.
          </p>
        </div>
        <nav className="caps-library-catalog" aria-label="All Caps components">
          <StoryLink storyId="surfaces--surface--sizes-and-depths">
            <span>Surface · sizes and depths</span>
            <span aria-hidden="true">↗</span>
          </StoryLink>
          <StoryLink storyId="surfaces--surface--screen-material">
            <span>Screen · material and texture</span>
            <span aria-hidden="true">↗</span>
          </StoryLink>
          {[...catalog]
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((item) => (
              <StoryLink key={item.name} storyId={item.storyId}>
                <span>{item.title}</span>
                <span aria-hidden="true">↗</span>
              </StoryLink>
            ))}
        </nav>
      </section>
      <footer className="caps-library-footer">
        <span>Caps, from Fungi.</span>
        <StoryLink storyId="foundations--themes">
          Explore the themes →
        </StoryLink>
      </footer>
    </main>
  );
};
