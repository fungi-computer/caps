import type { StoryDefault } from "@ladle/react";
import { useRef, useState, type CSSProperties } from "react";
import { Checkbox } from "../src/components/checkbox.js";
import { Switch } from "../src/components/switch.js";
import { Button } from "../src/components/button.js";
import { RadioGroup, RadioGroupItem } from "../src/components/radio-group.js";
import { useMotion } from "../src/lib/motion.js";

export default { title: "Foundations / Motion" } satisfies StoryDefault;

function Sample({ theme, style }: { theme: string; style?: CSSProperties }) {
  const root = useRef<HTMLElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const motion = useMotion(root);
  const [checked, setChecked] = useState(false);
  const play = () => {
    setChecked((value) => !value);
    target.current?.animate(
      motion.reduced
        ? [{ opacity: 0.3 }, { opacity: 1 }]
        : [
            {
              opacity: 0.3,
              transform: `translateY(${String(motion.distance)}px)`,
            },
            { opacity: 1, transform: "none" },
          ],
      {
        duration: motion.normal,
        easing:
          motion.steps > 0
            ? `steps(${String(motion.steps)}, end)`
            : motion.ease,
      },
    );
  };
  return (
    <section
      ref={root}
      data-theme={theme}
      style={style}
      className="bg-base-100 text-base-content p-lg grid gap-md"
      data-motion-sample={theme}
    >
      <h2 className="font-heading text-lg">{theme}</h2>
      <div ref={target} className="flex items-center gap-md">
        <RadioGroup value={checked ? "on" : "off"}>
          <RadioGroupItem value="on" aria-label="Theme-owned spring" />
        </RadioGroup>
        <Checkbox
          checked={checked}
          onChange={(event) => {
            setChecked(event.currentTarget.checked);
          }}
          aria-label="Theme-owned checkbox"
        />
        <Switch
          checked={checked}
          onCheckedChange={setChecked}
          aria-label="Theme-owned switch"
        />
        <span>Theme-owned springs</span>
      </div>
      <Button onClick={play}>Try motion</Button>
      <output className="font-mono text-sm" data-motion-values="">
        {JSON.stringify({
          bounce: motion.bounce,
          duration: motion.springDuration,
          distance: motion.distance,
          reduced: motion.reduced,
        })}
      </output>
    </section>
  );
}

/** Current theme values, not proposed new theme personalities. */
export function Feel() {
  return (
    <div className="grid gap-md md:grid-cols-2">
      {[
        "latte",
        "mocha",
        "field-guide",
        "field-guide-night",
        "consulting",
        "phosphor",
        "codec",
        "pirate-radio",
      ].map((theme) => (
        <Sample key={theme} theme={theme} />
      ))}
    </div>
  );
}

/** An outer inline spring override must stop at the nested theme boundary. */
export function Nested() {
  const override: CSSProperties & Record<`--${string}`, string> = {
    "--stipe-motion-bounce": "0.7",
    "--stipe-motion-spring-duration": "640ms",
  };
  return (
    <div data-theme="latte" style={override} className="grid gap-md p-lg">
      <Sample theme="latte" style={override} />
      <div className="p-lg">
        <Sample theme="mocha" />
      </div>
    </div>
  );
}
