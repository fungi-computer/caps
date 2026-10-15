import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn.js";
import { CheckboxBead } from "./checkbox-bead.js";

/** Props accepted by Checkbox. */
export type CheckboxProps = {
  /** Compact instruments keep the wrapper's focus ring and disabled ink readable. */
  appearance?: "default" | "compact";
  /** Replaces the bead while the native input continues to own selection. */
  indicator?: ReactNode;
  invalid?: boolean;
  /** Shows a mixed selection while checked still controls native form submission. */
  indeterminate?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

/** A native checkbox with styled invalid-state presentation. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      className,
      appearance,
      indicator,
      invalid,
      indeterminate = false,
      checked,
      defaultChecked = false,
      onChange,
      ...props
    },
    ref,
  ) {
    const input = useRef<HTMLInputElement>(null);
    const [localChecked, setLocalChecked] = useState(defaultChecked);
    const selected = checked ?? localChecked;
    const state = indeterminate ? "mixed" : selected ? "checked" : "unchecked";
    useImperativeHandle(ref, () => {
      if (!input.current) throw new Error("Checkbox input is not mounted");
      return input.current;
    }, []);
    useLayoutEffect(() => {
      if (input.current) input.current.indeterminate = indeterminate;
    }, [indeterminate]);
    useEffect(() => {
      const form = input.current?.form;
      if (!form || checked !== undefined) return;
      const reset = (event: Event) => {
        queueMicrotask(() => {
          if (!event.defaultPrevented && input.current)
            setLocalChecked(defaultChecked);
        });
      };
      form.addEventListener("reset", reset);
      return () => {
        form.removeEventListener("reset", reset);
      };
    }, [checked, defaultChecked, props.form]);
    return (
      <span
        className="caps-checkbox"
        data-appearance={appearance === "compact" ? appearance : undefined}
        data-state={state}
        data-custom-indicator={indicator !== undefined || undefined}
      >
        <input
          {...props}
          checked={selected}
          aria-checked={indeterminate ? "mixed" : selected}
          aria-invalid={
            invalid
              ? true
              : props["aria-invalid"] === false
                ? undefined
                : props["aria-invalid"]
          }
          className={cn("caps-checkbox-input", className)}
          onChange={(event) => {
            if (checked === undefined) setLocalChecked(event.target.checked);
            onChange?.(event);
            // The owner clears a controlled mixed state; native activation clears it first.
            event.currentTarget.indeterminate = indeterminate;
          }}
          ref={input}
          type="checkbox"
        />
        {indicator !== undefined ? indicator : <CheckboxBead state={state} />}
      </span>
    );
  },
);
