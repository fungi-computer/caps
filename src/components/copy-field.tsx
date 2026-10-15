import { Check, Copy } from "lucide-react";
import { useId, useState, type HTMLAttributes } from "react";
import { cn } from "../lib/cn.js";
import { Button } from "./button.js";
import { Input } from "./input.js";
import { InputGroup } from "./input-group.js";
import { Label } from "./label.js";
import { VisuallyHidden } from "./visually-hidden.js";

/** The colour role of one run of text in a block's code. */
export type CopyFieldTokenKind = "text" | "tag" | "attribute" | "string";
/** One run of a block's code; the runs, joined, are the copied value. */
export type CopyFieldToken = { kind: CopyFieldTokenKind; text: string };

/** Props accepted by CopyField. */
export type CopyFieldProps = {
  /** Copy action text; the code presentations default to "Copy". */
  label?: string;
} & (
  | {
      value: string;
      /** Absent: show the value as wrapped code beside its copy action. */
      fieldLabel?: undefined;
      displayValue?: undefined;
      layout?: "inline";
      title?: undefined;
      tokens?: undefined;
    }
  | {
      value: string;
      /** Visible label of a read-only input that holds the value. */
      fieldLabel: string;
      /** Readable text shown in the input instead of the copied value. */
      displayValue?: string;
      layout?: "inline";
      title?: undefined;
      tokens?: undefined;
    }
  | ({
      /**
       * `block`: a titled code panel for a snippet someone pastes elsewhere.
       * Lines keep their breaks and scroll inside the panel, never the page.
       */
      layout: "block";
      fieldLabel?: undefined;
      displayValue?: undefined;
      /** Short caption in the panel's header, such as the language. */
      title?: string;
    } & (
      | { value: string; tokens?: undefined }
      | {
          /** Coloured runs of the code; joined, they are what is copied. */
          tokens: readonly CopyFieldToken[];
          value?: undefined;
        }
    ))
) &
  Omit<HTMLAttributes<HTMLElement>, "children" | "title">;

/** Key each run by where it starts in the value, which is stable and unique. */
function tokenRuns(tokens: readonly CopyFieldToken[]) {
  let offset = 0;
  return tokens.map((token) => {
    const run = { ...token, offset };
    offset += token.text.length;
    return run;
  });
}

type CopyOutcome =
  { kind: "ready" } | { kind: "copied" } | { kind: "failed"; cause: unknown };

/**
 * A value with an explicit copy action and visible outcome: wrapped code by
 * default, a labelled read-only input when `fieldLabel` is given, or a titled
 * code panel with `layout="block"`.
 */
export function CopyField({
  value,
  label,
  fieldLabel,
  displayValue,
  layout,
  title,
  tokens,
  className,
  ...props
}: CopyFieldProps) {
  const id = useId();
  const [state, setState] = useState<CopyOutcome>({ kind: "ready" });
  const copied = tokens ? tokens.map((token) => token.text).join("") : value;
  const copy = async () => {
    setState(
      await navigator.clipboard.writeText(copied).then(
        () => ({ kind: "copied" }) as const,
        (cause: unknown) => ({ kind: "failed", cause }) as const,
      ),
    );
  };
  if (fieldLabel !== undefined)
    return (
      <div {...props} className={cn("caps-copy-field-input", className)}>
        <Label htmlFor={id}>{fieldLabel}</Label>
        <InputGroup>
          <Input
            className="caps-copy-field-control"
            aria-label={fieldLabel}
            id={id}
            onFocus={(event) => {
              event.currentTarget.select();
            }}
            readOnly
            value={displayValue ?? copied}
          />
          <Button onClick={() => void copy()} size="sm" variant="outline">
            {state.kind === "copied" ? "Copied" : (label ?? "Copy")}
          </Button>
        </InputGroup>
        {state.kind === "failed" ? (
          <span role="status">Could not copy. Select the text to copy it.</span>
        ) : null}
      </div>
    );
  const text =
    state.kind === "copied"
      ? "Copied"
      : state.kind === "failed"
        ? "Copy failed"
        : (label ?? "Copy");
  if (layout === "block")
    return (
      <figure
        {...props}
        className={cn("caps-copy-field-block", className)}
        data-state={state.kind}
      >
        <figcaption className="caps-copy-field-header">
          <span className="caps-copy-field-title">{title}</span>
          <Button
            onClick={() => void copy()}
            size="sm"
            variant={state.kind === "copied" ? "ghost" : "outline"}
          >
            {state.kind === "copied" ? (
              <Check aria-hidden="true" size={15} />
            ) : (
              <Copy aria-hidden="true" size={15} />
            )}
            {text}
          </Button>
          <VisuallyHidden role="status">
            {state.kind === "copied"
              ? "Copied to the clipboard"
              : state.kind === "failed"
                ? "Could not copy. Select the code to copy it."
                : ""}
          </VisuallyHidden>
        </figcaption>
        <pre className="caps-copy-field-code" tabIndex={0}>
          <code>
            {tokens
              ? tokenRuns(tokens).map((run) => (
                  <span
                    className="caps-copy-field-token"
                    data-kind={run.kind}
                    key={run.offset}
                  >
                    {run.text}
                  </span>
                ))
              : copied}
          </code>
        </pre>
      </figure>
    );
  return (
    <div {...props} className={cn("caps-copy-field", className)}>
      <code className="caps-copy-field-value">{copied}</code>
      <Button
        aria-label={`${text}: ${copied}`}
        onClick={() => void copy()}
        size="sm"
        variant="outline"
      >
        {state.kind === "copied" ? <Check size={15} /> : <Copy size={15} />}
        {text}
      </Button>
    </div>
  );
}
