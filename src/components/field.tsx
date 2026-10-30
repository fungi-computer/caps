import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  useRef,
  useState,
  type AriaAttributes,
  type FieldsetHTMLAttributes,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "../lib/cn.js";
import { Button } from "./button.js";
import { Label } from "./label.js";
import { InputGroup, InputGroupAddon } from "./input-group.js";
import { Collapse } from "./presence.js";

/** An announced error that takes no space when absent and collapses smoothly. */
export function FieldError({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const [lastError, setLastError] = useState(children);
  // Retain the closing content so its intrinsic height can animate to zero.
  if (children && children !== lastError) setLastError(children);
  return (
    <Collapse
      {...props}
      className={cn("caps-field-error-reveal", props.className)}
      open={Boolean(children)}
    >
      <div className="caps-field-error" role="alert" aria-hidden={!children}>
        {lastError}
      </div>
    </Collapse>
  );
}

/** Props accepted by FormFooter. */
export type FormFooterProps = {
  /** The submit-time error, announced above the actions. */
  error?: ReactNode;
  /** `end` right-aligns actions; `stretch` stacks full-width actions for single-column cards. */
  layout?: "end" | "stretch";
  /** Quiet state opposite the actions (role="status"), such as a Status LED reading "Saved". */
  status?: ReactNode;
  /** Draws the rule above the footer; short inline forms leave it off. */
  divider?: boolean;
} & HTMLAttributes<HTMLElement>;

/**
 * A form's stationary action area. Put exactly one primary Button last;
 * every other action is `ghost` or `outline`.
 */
export function FormFooter({
  children,
  divider = true,
  error,
  layout = "end",
  status,
  ...props
}: FormFooterProps) {
  return (
    <footer
      {...props}
      className={cn("caps-form-footer", props.className)}
      data-divider={divider}
      data-layout={layout}
    >
      <FieldError>{error}</FieldError>
      <div className="caps-form-footer-row">
        {status ? (
          <div className="caps-form-footer-status" role="status">
            {status}
          </div>
        ) : null}
        <div className="caps-form-footer-actions">{children}</div>
      </div>
    </footer>
  );
}

/** Props accepted by Form. */
export type FormProps = {
  /** Disables every control while a submission is in flight. */
  busy?: boolean;
  /** Opt-in label/control grid; the default field rhythm is unchanged. */
  layout?: "columns" | undefined;
} & FormHTMLAttributes<HTMLFormElement>;

/**
 * A form with Caps' field rhythm. While `busy`, its fieldset disables every
 * control and the form reports `aria-busy`; validation stays with the caller.
 */
export const Form = forwardRef<HTMLFormElement, FormProps>(function Form(
  { busy = false, children, className, layout, ...props },
  ref,
) {
  return (
    <form
      {...props}
      aria-busy={busy || undefined}
      className={cn("caps-form", className)}
      data-layout={layout}
      ref={ref}
    >
      <fieldset className="caps-form-body" disabled={busy}>
        {children}
      </fieldset>
    </form>
  );
});

/** Props accepted by FormSection. */
export type FormSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Opt-in label/control grid when used without a Form parent. */
  layout?: "columns" | undefined;
  /** Heading level inside the page outline. */
  level?: 2 | 3 | 4;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "title">;

const sectionHeadings = { 2: "h2", 3: "h3", 4: "h4" } as const;

/** A titled group of fields; consecutive sections share one quiet rule. */
export const FormSection = forwardRef<HTMLElement, FormSectionProps>(
  function FormSection(
    { children, className, description, layout, level = 3, title, ...props },
    ref,
  ) {
    const id = useId();
    const Heading = sectionHeadings[level];
    return (
      <section
        {...props}
        aria-labelledby={`${id}-title`}
        className={cn("caps-form-section", className)}
        data-layout={layout}
        ref={ref}
      >
        <header className="caps-form-section-copy">
          <Heading className="caps-form-section-title" id={`${id}-title`}>
            {title}
          </Heading>
          {description ? (
            <p className="caps-form-section-description">{description}</p>
          ) : null}
        </header>
        <div className="caps-form-section-fields">{children}</div>
      </section>
    );
  },
);

/** Props accepted by FieldSet. */
export type FieldSetProps = {
  legend: ReactNode;
  /** Full legend on hover when a columns form clips it to one line. */
  legendTitle?: string;
  description?: ReactNode;
  /** Opt-in label/control grid when used without a Form parent. */
  layout?: "columns" | undefined;
  /** The group's announced error, such as "Choose at least one right". */
  error?: ReactNode;
  children: ReactNode;
} & FieldsetHTMLAttributes<HTMLFieldSetElement>;

/**
 * A legend-named group of related choices, such as a list of inline
 * checkbox Fields. `disabled` disables every control inside.
 */
export const FieldSet = forwardRef<HTMLFieldSetElement, FieldSetProps>(
  function FieldSet(
    {
      children,
      className,
      description,
      error,
      layout,
      legend,
      legendTitle,
      ...props
    },
    ref,
  ) {
    const id = useId();
    const describedBy =
      [
        description ? `${id}-description` : props["aria-describedby"],
        error ? `${id}-error` : null,
      ]
        .filter(Boolean)
        .join(" ") || undefined;
    return (
      <fieldset
        {...props}
        aria-describedby={describedBy}
        aria-invalid={error ? true : props["aria-invalid"]}
        className={cn("caps-fieldset", className)}
        data-layout={layout}
        ref={ref}
      >
        <legend className="caps-fieldset-legend" title={legendTitle}>
          {legend}
        </legend>
        {description ? (
          <p className="caps-fieldset-description" id={`${id}-description`}>
            {description}
          </p>
        ) : null}
        <div className="caps-fieldset-fields">{children}</div>
        {/* Present only for groups that can fail, so other groups keep their DOM. */}
        {error === undefined ? null : (
          <FieldError id={`${id}-error`}>{error}</FieldError>
        )}
      </fieldset>
    );
  },
);

/** Props accepted by Field. */
export type FieldProps = {
  children: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  /**
   * A decorative marker, such as a Sigil or App icon, before the label. It is
   * hidden from assistive tech; the label stays the control's name.
   */
  icon?: ReactNode;
  label?: ReactNode;
  /** Full label on hover when a columns form clips it to one line. */
  labelTitle?: string;
  /**
   * `vertical` stacks label, control and error; `horizontal` puts the control
   * opposite its copy (settings rows); `inline` puts a checkbox or switch
   * before its copy.
   */
  orientation?: "horizontal" | "inline" | "vertical";
  /** Marks an optional field in a mostly required form. */
  optional?: boolean;
  /**
   * The child is a read-only readout, such as a Status, not a control: the
   * label names the row and nothing is wired to the child.
   */
  readout?: boolean;
  required?: boolean;
} & HTMLAttributes<HTMLDivElement>;

type FieldControlProps = {
  "aria-describedby"?: AriaAttributes["aria-describedby"];
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  "aria-required"?: AriaAttributes["aria-required"];
  id?: string;
  required?: boolean;
  children?: ReactNode;
};

/** The labelled control inside an InputGroup: its first non-addon element. */
function groupControl(
  group: ReactElement<FieldControlProps>,
): ReactElement<FieldControlProps> | null {
  const controls: ReactElement<FieldControlProps>[] = [];
  Children.forEach(group.props.children, (part) => {
    if (
      isValidElement<FieldControlProps>(part) &&
      part.type !== InputGroupAddon
    )
      controls.push(part);
  });
  return controls[0] ?? null;
}

/** A labelled form-field layout that renders caller-provided control and supporting content. */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    children,
    className,
    description,
    error,
    icon,
    label,
    labelTitle,
    optional,
    orientation = "vertical",
    readout = false,
    required,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const child = isValidElement<FieldControlProps>(children) ? children : null;
  // An InputGroup is layout: the labelled control is the input inside it.
  const group = child?.type === InputGroup;
  const controlElement = group ? groupControl(child) : child;
  const id = controlElement?.props.id;
  const controlId = id ?? generatedId;
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;
  // Keep any description the caller already wired to the control.
  const describedBy =
    [
      controlElement?.props["aria-describedby"],
      description ? descriptionId : null,
      error ? errorId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  const requiredValue =
    required === true ? true : controlElement?.props.required;
  const invalidValue = error ? true : controlElement?.props["aria-invalid"];
  const ariaRequiredValue =
    required === true ? true : controlElement?.props["aria-required"];
  const clonedProps: FieldControlProps = { id: controlId };
  if (requiredValue !== undefined) clonedProps.required = requiredValue;
  if (describedBy !== undefined) clonedProps["aria-describedby"] = describedBy;
  if (invalidValue !== undefined) clonedProps["aria-invalid"] = invalidValue;
  if (ariaRequiredValue !== undefined)
    clonedProps["aria-required"] = ariaRequiredValue;
  const control =
    child && controlElement && !readout
      ? group
        ? cloneElement(
            child,
            undefined,
            Children.map(child.props.children, (part) =>
              part === controlElement
                ? cloneElement(controlElement, clonedProps)
                : part,
            ),
          )
        : cloneElement(child, clonedProps)
      : children;
  const labelContent = label ? (
    <Label
      htmlFor={readout ? undefined : controlId}
      title={labelTitle}
      // A choice's own label reads as body text; the group's legend carries weight.
      className={orientation === "inline" ? "font-normal" : undefined}
      {...(required === undefined ? {} : { required })}
      {...(optional === undefined ? {} : { optional })}
    >
      {label}
    </Label>
  ) : null;
  const copy =
    label || description ? (
      <div className="caps-field-copy">
        {labelContent}
        {description ? (
          <p className="caps-field-description" id={descriptionId}>
            {description}
          </p>
        ) : null}
      </div>
    ) : null;
  const heading = icon ? (
    <div className="caps-field-lead">
      <span className="caps-field-icon" aria-hidden="true">
        {icon}
      </span>
      {copy}
    </div>
  ) : (
    copy
  );
  return (
    <div
      {...props}
      className={cn("caps-field", className)}
      data-orientation={orientation}
      ref={ref}
    >
      {orientation === "horizontal" ? (
        <div className="caps-field-row">
          {heading}
          {control}
        </div>
      ) : orientation === "inline" ? (
        <div className="caps-field-row">
          {control}
          {heading}
        </div>
      ) : (
        <>
          {heading}
          {control}
        </>
      )}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
});

/** Props accepted by NumberField. */
export type NumberFieldProps = {
  /** Controlled value; `null` is empty. */
  value?: number | null;
  defaultValue?: number | null;
  /** Called with each committed value, already clamped to min/max. */
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  /** Arrow keys and the − / + keys move by `step`; Page Up/Down by ten steps. */
  step?: number;
  /** A short unit readout after the value, such as "min" or "GB". */
  unit?: ReactNode;
  /** Cycle from max back to min (and back) instead of stopping at the ends. */
  wrap?: boolean;
  invalid?: boolean;
  /** Accessible names for the − / + keys. */
  decrementLabel?: string;
  incrementLabel?: string;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "max" | "min" | "onChange" | "step" | "type" | "value"
>;

function stepPrecision(step: number): number {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

/** A 270° encoder arc from 7:30 to 4:30, measured as 100 path units. */
const DIAL_ARC = "M 9.86 38.14 A 20 20 0 1 1 38.14 38.14";
/** Pixels of vertical drag per step on the dial. */
const DIAL_TRAVEL = 6;

const keySteps = new Map([
  ["ArrowUp", 1],
  ["ArrowDown", -1],
  ["PageUp", 10],
  ["PageDown", -10],
]);

/**
 * A number spinbutton: a native `input type="number"` between − and + keys,
 * with the value as a mono readout. Field wires its label, description and
 * error to the input. The `caps-number-field-*` parts are stable so a context
 * such as a Screen can redraw them; the semantics stay here.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(
    {
      className,
      decrementLabel = "Decrease",
      defaultValue = null,
      disabled,
      incrementLabel = "Increase",
      invalid,
      max,
      min,
      onBlur,
      onKeyDown,
      onValueChange,
      step = 1,
      unit,
      value,
      wrap = false,
      ...props
    },
    ref,
  ) {
    const [inner, setInner] = useState<number | null>(defaultValue);
    const [draft, setDraft] = useState<string | null>(null);
    const current = value === undefined ? inner : value;
    const precision = stepPrecision(step);
    const clamp = (next: number) => {
      const rounded = Number(next.toFixed(precision));
      if (min !== undefined && rounded < min) return min;
      if (max !== undefined && rounded > max) return max;
      return rounded;
    };
    const commit = (next: number | null) => {
      const settled = next === null ? null : clamp(next);
      setInner(settled);
      setDraft(null);
      if (settled !== current) onValueChange?.(settled);
    };
    const commitDraft = () => {
      if (draft === null) return;
      const parsed = Number(draft);
      commit(draft.trim() === "" || !Number.isFinite(parsed) ? null : parsed);
    };
    const stepBy = (steps: number) => {
      const next = (current ?? min ?? 0) + steps * step;
      if (wrap && min !== undefined && max !== undefined) {
        if (next > max) {
          commit(min);
          return;
        }
        if (next < min) {
          commit(max);
          return;
        }
      }
      commit(next);
    };
    const atMin = min !== undefined && current !== null && current <= min;
    const atMax = max !== undefined && current !== null && current >= max;
    const isDisabled = disabled === true;
    const drag = useRef<{ y: number; value: number } | null>(null);
    // The dial is drawn only where a context (a Screen) asks for it, and only
    // for a bounded value; the input stays the spinbutton either way.
    const fraction =
      min !== undefined && max !== undefined && max > min
        ? ((current ?? min) - min) / (max - min)
        : null;
    const onDialDown = (event: PointerEvent<SVGSVGElement>) => {
      if (isDisabled) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { y: event.clientY, value: current ?? min ?? 0 };
    };
    const onDialMove = (event: PointerEvent<SVGSVGElement>) => {
      if (!drag.current) return;
      const steps = Math.trunc((drag.current.y - event.clientY) / DIAL_TRAVEL);
      const next = clamp(drag.current.value + steps * step);
      if (next !== current) commit(next);
    };
    const endDial = () => {
      drag.current = null;
    };
    return (
      <span
        className={cn("caps-number-field", className)}
        data-at-max={atMax || undefined}
        data-at-min={atMin || undefined}
        data-disabled={isDisabled || undefined}
        data-wrap={wrap || undefined}
      >
        {fraction === null ? null : (
          <svg
            className="caps-number-field-dial"
            viewBox="0 0 48 48"
            aria-hidden="true"
            focusable="false"
            onPointerDown={onDialDown}
            onPointerMove={onDialMove}
            onPointerUp={endDial}
            onPointerCancel={endDial}
          >
            <path
              className="caps-number-field-dial-track"
              d={DIAL_ARC}
              pathLength={100}
            />
            <path
              className="caps-number-field-dial-level"
              d={DIAL_ARC}
              pathLength={100}
              strokeDasharray={`${String(Math.max(0.5, fraction * 100))} 100`}
            />
          </svg>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="caps-number-field-decrement"
          aria-label={decrementLabel}
          aria-controls={props.id}
          tabIndex={-1}
          disabled={isDisabled || (atMin && !wrap)}
          onClick={() => {
            stepBy(-1);
          }}
        >
          <Minus aria-hidden="true" />
        </Button>
        <span className="caps-number-field-readout">
          <input
            {...props}
            aria-invalid={
              invalid
                ? true
                : props["aria-invalid"] === false
                  ? undefined
                  : props["aria-invalid"]
            }
            className="input caps-input caps-number-field-input"
            disabled={disabled}
            inputMode={
              props.inputMode ?? (precision > 0 ? "decimal" : "numeric")
            }
            max={max}
            min={min}
            onBlur={(event) => {
              commitDraft();
              onBlur?.(event);
            }}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (event.defaultPrevented) return;
              const steps = keySteps.get(event.key);
              if (steps !== undefined) {
                event.preventDefault();
                stepBy(steps);
              } else if (event.key === "Home" && min !== undefined) {
                event.preventDefault();
                commit(min);
              } else if (event.key === "End" && max !== undefined) {
                event.preventDefault();
                commit(max);
              } else if (event.key === "Enter") {
                commitDraft();
              }
            }}
            ref={ref}
            step={step}
            type="number"
            value={draft ?? (current === null ? "" : String(current))}
          />
          {unit ? (
            <span className="caps-number-field-unit" aria-hidden="true">
              {unit}
            </span>
          ) : null}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="caps-number-field-increment"
          aria-label={incrementLabel}
          aria-controls={props.id}
          tabIndex={-1}
          disabled={isDisabled || (atMax && !wrap)}
          onClick={() => {
            stepBy(1);
          }}
        >
          <Plus aria-hidden="true" />
        </Button>
      </span>
    );
  },
);
