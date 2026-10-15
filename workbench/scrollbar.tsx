import type { Story } from "@ladle/react";
import { Card, CardHeader, CardTitle } from "../src/components/card.js";
import { ScrollArea } from "../src/components/scroll-area.js";
import "./scrollbar.css";

export const Scrollbar: Story = () => (
  <Card data-conformance="scroll-area">
    <CardHeader>
      <CardTitle>A little momentum</CardTitle>
      <p>
        Flick, then slow down. Meaningful acceleration stretches the thumb;
        deceleration compresses it. Push past either end for a little edge
        squish. Steady scrolling stays quiet.
      </p>
    </CardHeader>
    <div className="scrollbar-study">
      <ScrollArea
        className="h-full"
        tabIndex={0}
        role="region"
        aria-label="Scrollable image collection"
      >
        {Array.from({ length: 24 }, (_, index) => (
          <div className="p-sm border-b border-base-300" key={index}>
            {String(index + 1).padStart(2, "0")} ·{" "}
            {
              [
                "Mountain studies",
                "Cloud shapes",
                "Desert light",
                "Forest textures",
              ][index % 4]
            }
          </div>
        ))}
      </ScrollArea>
    </div>
  </Card>
);
