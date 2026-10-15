import type { Story } from "@ladle/react";
import { Button } from "../src/components/button.js";

/** The chamfer finish angles a button's ends inside its enclosing palette. */
export const Chamfer: Story = () => (
  <div data-theme="chamfer" className="flex flex-wrap gap-lg p-xl">
    <Button>Subscribe</Button>
    <Button variant="outline">See the plans</Button>
  </div>
);
