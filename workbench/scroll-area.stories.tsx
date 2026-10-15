import type { StoryDefault } from "@ladle/react";
import { useState } from "react";
import { ScrollArea } from "../src/components/scroll-area.js";

export default { title: "Checks / Scroll area" } satisfies StoryDefault;

export const ChangingContent = () => {
  const [count, setCount] = useState(2);
  const [screen, setScreen] = useState(false);
  const [surface, setSurface] = useState(true);
  return (
    <div className="grid gap-md p-lg">
      <div className="flex flex-wrap gap-sm">
        <button
          type="button"
          onClick={() => {
            setCount(500);
          }}
        >
          Load 500 rows
        </button>
        <button
          type="button"
          onClick={() => {
            setCount(2);
          }}
        >
          Show two rows
        </button>
        <button
          type="button"
          onClick={() => {
            setScreen((value) => !value);
          }}
        >
          Toggle screen
        </button>
        <button
          type="button"
          onClick={() => {
            setSurface((value) => !value);
          }}
        >
          Toggle surface
        </button>
      </div>
      <ScrollArea
        surface={surface}
        screen={screen}
        className="h-64 w-full max-w-[48rem]"
        role="region"
        aria-label="Changing collection"
      >
        {Array.from({ length: count }, (_, index) => (
          <div className="h-12 p-sm" key={index}>
            Row {index + 1}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};
