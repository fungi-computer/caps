import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type FieldsetHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn.js";
import { RadioBead } from "./radio-bead.js";

type RadioGroupContextValue = {
  disabled: boolean;
  name: string;
  onValueChange?: (value: string) => void;
  value: string | undefined;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/** Props accepted by RadioGroup. */
export type RadioGroupProps = {
  children: ReactNode;
  defaultValue?: string;
  name?: string;
  /** Called after the selected radio value changes. */
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  value?: string;
} & Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "defaultValue" | "onChange"
>;

/** A radio-group primitive with caller-owned selection state. */
export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  function RadioGroup(
    {
      children,
      className,
      defaultValue,
      disabled = false,
      name: providedName,
      onValueChange,
      orientation = "vertical",
      value: controlledValue,
      ...props
    },
    ref,
  ) {
    const generatedName = useId();
    const fieldset = useRef<HTMLFieldSetElement>(null);
    useImperativeHandle(ref, () => {
      if (!fieldset.current) throw new Error("RadioGroup is not mounted");
      return fieldset.current;
    }, []);
    const name = providedName ?? `radio-group-${generatedName}`;
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const value = controlledValue ?? uncontrolledValue;
    useEffect(() => {
      const form = fieldset.current?.form;
      if (!form || controlledValue !== undefined) return;
      const reset = (event: Event) => {
        queueMicrotask(() => {
          if (!event.defaultPrevented) setUncontrolledValue(defaultValue);
        });
      };
      form.addEventListener("reset", reset);
      return () => {
        form.removeEventListener("reset", reset);
      };
    }, [controlledValue, defaultValue, props.form]);
    const handleChange = (next: string) => {
      if (controlledValue === undefined) setUncontrolledValue(next);
      onValueChange?.(next);
    };
    return (
      <RadioGroupContext.Provider
        value={{ disabled, name, onValueChange: handleChange, value }}
      >
        <fieldset
          {...props}
          className={cn(
            "flex gap-md",
            orientation === "horizontal" ? "flex-row flex-wrap" : "flex-col",
            className,
          )}
          disabled={disabled}
          role={props.role ?? "radiogroup"}
          ref={fieldset}
        >
          {children}
        </fieldset>
      </RadioGroupContext.Provider>
    );
  },
);

/** Props accepted by RadioGroupItem. */
export type RadioGroupItemProps = {
  value: string;
  /** Replaces the bead while the native input continues to own selection. */
  indicator?: ReactNode;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "checked" | "defaultChecked" | "name" | "type" | "value"
>;

/** A selectable item in a RadioGroup. */
export const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
  function RadioGroupItem(
    { className, indicator, onChange, onClick, value: itemValue, ...props },
    ref,
  ) {
    const context = useContext(RadioGroupContext);
    if (!context)
      throw new Error("RadioGroupItem must be used inside <RadioGroup>");
    const checked = context.value === itemValue;
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      if (event.target.checked) context.onValueChange?.(itemValue);
    };
    return (
      <span
        className="caps-radio"
        data-checked={checked}
        data-custom-indicator={indicator !== undefined || undefined}
      >
        <input
          {...props}
          aria-checked={checked}
          checked={checked}
          className={cn("caps-radio-input", className)}
          disabled={context.disabled || props.disabled}
          name={context.name}
          onChange={handleChange}
          onClick={onClick}
          ref={ref}
          type="radio"
          value={itemValue}
        />
        {indicator !== undefined ? indicator : <RadioBead checked={checked} />}
      </span>
    );
  },
);

/** Props accepted by RadioGroupCard. */
export type RadioGroupCardProps = {
  title: ReactNode;
  description?: ReactNode;
  /** A short readout on the card's trailing edge, such as a price or size. */
  meta?: ReactNode;
} & RadioGroupItemProps;

/**
 * A radio choice presented as a card: bead, title, optional description and a
 * trailing readout. The whole card is the hit area; the title names it.
 */
export const RadioGroupCard = forwardRef<HTMLInputElement, RadioGroupCardProps>(
  function RadioGroupCard({ description, id, meta, title, ...props }, ref) {
    const context = useContext(RadioGroupContext);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const checked = context?.value === props.value;
    const disabled = context?.disabled === true || props.disabled === true;
    return (
      <label
        className="caps-choice-card"
        data-checked={checked}
        data-disabled={disabled || undefined}
        htmlFor={inputId}
      >
        <RadioGroupItem
          {...props}
          aria-describedby={description ? `${inputId}-description` : undefined}
          aria-labelledby={`${inputId}-title`}
          id={inputId}
          ref={ref}
        />
        <span className="caps-choice-card-copy">
          <span className="caps-choice-card-title" id={`${inputId}-title`}>
            {title}
          </span>
          {description ? (
            <span
              className="caps-choice-card-description"
              id={`${inputId}-description`}
            >
              {description}
            </span>
          ) : null}
        </span>
        {meta ? <span className="caps-choice-card-meta">{meta}</span> : null}
      </label>
    );
  },
);
