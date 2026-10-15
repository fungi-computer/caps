import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";

import { cn } from "../lib/cn.js";
import {
  canAnimate,
  motionEasing,
  readMotion,
  type Motion,
} from "../lib/motion.js";

const graphemes = new Intl.Segmenter();

/** What the caller has learned about the entered code. */
export type CodeInputStatus = "idle" | "invalid" | "accepted";

/** Props accepted by CodeInput. */
export type CodeInputProps = {
  /** How many characters the code has. */
  length?: number;
  /** The current code. */
  value: string;
  /** Receives the code after a native edit or a normalized paste. */
  onValueChange: (value: string) => void;
  /**
   * `invalid` shakes the slots in a cascade and marks them; `accepted` lifts
   * them in a wave. Say what was wrong next to the field, as with any error.
   */
  status?: CodeInputStatus;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "maxLength" | "size"
>;

function land(slot: HTMLElement, motion: Motion) {
  // A character drops into its slot: a small press, then a settle sized by
  // the theme's bounce. Reduced motion only fades the character in.
  if (motion.reduced)
    return slot.animate([{ color: "transparent" }, {}], {
      duration: motion.fast,
    });
  const give = 0.06 * Math.min(1.5, motion.bounce / 0.3);
  return slot.animate(
    [
      { transform: `translateY(${String(motion.distance / 2)}px) scale(0.94)` },
      { transform: `scale(${String(1 + give)})`, offset: 0.55 },
      { transform: "none" },
    ],
    {
      duration: motion.springDuration,
      easing: motionEasing(motion, motion.ease),
    },
  );
}

function refuse(slot: HTMLElement, index: number, motion: Motion) {
  const x = motion.shake;
  return slot.animate(
    [
      { transform: "none" },
      { transform: `translateX(${String(-x)}px)` },
      { transform: `translateX(${String(x)}px)` },
      { transform: `translateX(${String(-x / 2)}px)` },
      { transform: "none" },
    ],
    {
      duration: motion.slow,
      delay: index * motion.stagger,
      easing: motionEasing(motion, "linear"),
    },
  );
}

function accept(slot: HTMLElement, index: number, motion: Motion) {
  return slot.animate(
    [
      { transform: "none" },
      { transform: `translateY(${String(-motion.distance)}px)`, offset: 0.4 },
      { transform: "none" },
    ],
    {
      duration: motion.slow,
      delay: index * motion.stagger,
      easing: motionEasing(motion, motion.ease),
    },
  );
}

/**
 * A short code (a sign-in or pairing code) shown as one slot per character.
 * It is a single native input underneath, so typing, pasting, one-time-code
 * autofill and screen readers behave as they do on any text field.
 */
export const CodeInput = forwardRef<HTMLInputElement, CodeInputProps>(
  function CodeInput(
    {
      length = 6,
      value,
      onValueChange,
      status = "idle",
      className,
      onFocus,
      onBlur,
      onSelect,
      onPaste,
      ...props
    },
    ref,
  ) {
    const input = useRef<HTMLInputElement>(null);
    const slots = useRef<HTMLDivElement>(null);
    useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(
      ref,
      () => input.current,
    );
    const [focused, setFocused] = useState(false);
    const [cursor, setCursor] = useState(value.length);
    const characters = Array.from(
      graphemes.segment(value),
      (part) => part.segment,
    ).slice(0, length);
    const active = Math.min(
      Array.from(graphemes.segment(value.slice(0, cursor))).length,
      length - 1,
    );
    const filled = useRef(characters.length);

    useLayoutEffect(() => {
      const root = slots.current;
      const before = filled.current;
      filled.current = characters.length;
      if (!root || !canAnimate(root) || characters.length <= before) return;
      const slot = root.children.item(characters.length - 1);
      if (!(slot instanceof HTMLElement)) return;
      const animation = land(slot, readMotion(root));
      return () => {
        animation.cancel();
      };
    }, [characters.length]);

    useLayoutEffect(() => {
      const root = slots.current;
      if (!root || !canAnimate(root) || status === "idle") return;
      const motion = readMotion(root);
      if (motion.reduced) return;
      const animations = [...root.children].flatMap((slot, index) =>
        slot instanceof HTMLElement
          ? [
              status === "invalid"
                ? refuse(slot, index, motion)
                : accept(slot, index, motion),
            ]
          : [],
      );
      return () => {
        for (const animation of animations) animation.cancel();
      };
    }, [status]);

    return (
      <div className={cn("caps-code-input", className)} data-status={status}>
        <input
          autoComplete="one-time-code"
          inputMode="numeric"
          spellCheck={false}
          {...props}
          aria-invalid={status === "invalid" ? true : props["aria-invalid"]}
          className="caps-code-field"
          maxLength={length}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onChange={(event) => {
            onValueChange(event.target.value.replace(/\s/gu, ""));
          }}
          onPaste={(event) => {
            onPaste?.(event);
            if (event.defaultPrevented || event.currentTarget.readOnly) return;
            const pasted = event.clipboardData.getData("text");
            const normalized = pasted.replace(/\s/gu, "");
            if (normalized === pasted) return;
            event.preventDefault();
            const field = event.currentTarget;
            const start = field.selectionStart ?? 0;
            const end = field.selectionEnd ?? start;
            // Native maxlength still owns ordinary edits. Formatted paste is
            // normalized before applying that same remaining input capacity.
            const available = Math.max(
              0,
              length - field.value.length + end - start,
            );
            field.setRangeText(
              normalized.slice(0, available),
              start,
              end,
              "end",
            );
            setCursor(field.selectionStart ?? field.value.length);
            onValueChange(field.value);
          }}
          onFocus={(event) => {
            setFocused(true);
            setCursor(event.currentTarget.selectionStart ?? value.length);
            onFocus?.(event);
          }}
          onSelect={(event) => {
            setCursor(event.currentTarget.selectionStart ?? value.length);
            onSelect?.(event);
          }}
          ref={input}
          value={characters.join("")}
        />
        <div ref={slots} className="caps-code-slots" aria-hidden="true">
          {Array.from({ length }, (_, index) => (
            <span
              key={index}
              className="input caps-input caps-code-slot"
              data-active={focused && index === active ? "true" : undefined}
              data-filled={index < characters.length ? "true" : undefined}
            >
              {characters[index] ?? ""}
              {focused && index === active && characters.length < length ? (
                <span className="caps-code-caret" />
              ) : null}
            </span>
          ))}
        </div>
      </div>
    );
  },
);
