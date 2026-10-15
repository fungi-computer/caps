import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";

import { cn } from "../lib/cn.js";
import { SwitchBead } from "./switch-bead.js";

/** Props accepted by Switch. */
export type SwitchProps = {
  /** Called after the checked state changes. */
  onCheckedChange?: (checked: boolean) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "type">;

/** A switch primitive with caller-owned checked state. */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    className,
    checked,
    defaultChecked = false,
    onChange,
    onCheckedChange,
    ...props
  },
  ref,
) {
  const input = useRef<HTMLInputElement>(null);
  const [localChecked, setLocalChecked] = useState(defaultChecked);
  const selected = checked ?? localChecked;
  useImperativeHandle(ref, () => {
    if (!input.current) throw new Error("Switch input is not mounted");
    return input.current;
  }, []);
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
    <span className="caps-switch" data-checked={selected}>
      <input
        {...props}
        checked={selected}
        className={cn("caps-switch-input", className)}
        onChange={(event) => {
          if (checked === undefined) setLocalChecked(event.target.checked);
          onChange?.(event);
          onCheckedChange?.(event.target.checked);
        }}
        ref={input}
        role="switch"
        type="checkbox"
      />
      <SwitchBead checked={selected} />
    </span>
  );
});
