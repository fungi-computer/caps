import type { Story } from "@ladle/react";
import { Bold, Italic, Link, Underline } from "lucide-react";

import { IconButton } from "../src/components/icon-button.js";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../src/components/tooltip.js";

const tools = [
  { label: "Bold", icon: <Bold /> },
  { label: "Italic", icon: <Italic /> },
  { label: "Underline", icon: <Underline /> },
  { label: "Link", icon: <Link /> },
] as const;

/**
 * Warm tooltips: the first label waits, its neighbours open at once while
 * the toolbar is warm, and the wait returns after resting away.
 */
export const TooltipToolbar: Story = () => (
  <div className="flex gap-xs p-2xl pt-3xl">
    {tools.map((tool) => (
      <Tooltip key={tool.label} side="top">
        <TooltipTrigger asChild>
          <IconButton
            aria-label={tool.label}
            icon={tool.icon}
            iconSize="sm"
            size="sm"
          />
        </TooltipTrigger>
        <TooltipContent>{tool.label}</TooltipContent>
      </Tooltip>
    ))}
  </div>
);
