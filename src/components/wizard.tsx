import { useId, type ReactNode } from "react";
import { Button } from "./button.js";

/** A named step. Values and validation remain in the caller's form. */
export type WizardStep = { id: string; title: string; content: ReactNode };

/** Controlled step presentation, composable with one TanStack Form across steps. */
export function Wizard({
  steps,
  current,
  onStepChange,
  disabled = false,
  nextDisabled = false,
  actions,
}: {
  steps: readonly WizardStep[];
  current: string;
  onStepChange: (id: string) => void;
  disabled?: boolean;
  /** Validation may block advancing without preventing edits to previous steps. */
  nextDisabled?: boolean;
  actions?: ReactNode;
}) {
  const id = useId();
  const index = steps.findIndex((step) => step.id === current);
  return (
    <div className="caps-wizard">
      <nav aria-label="Configuration steps">
        <ol className="caps-wizard-steps">
          {steps.map((step, stepIndex) => (
            <li key={step.id}>
              <Button
                id={`${id}-${step.id}-label`}
                type="button"
                size="sm"
                variant={current === step.id ? "outline" : "ghost"}
                aria-current={current === step.id ? "step" : undefined}
                aria-controls={`${id}-${step.id}`}
                disabled={disabled}
                onClick={() => {
                  onStepChange(step.id);
                }}
              >
                <span aria-hidden="true">{stepIndex + 1}.</span> {step.title}
              </Button>
            </li>
          ))}
        </ol>
      </nav>
      {steps.map((step) => (
        <section
          key={step.id}
          id={`${id}-${step.id}`}
          aria-labelledby={`${id}-${step.id}-label`}
          hidden={current !== step.id}
        >
          {step.content}
        </section>
      ))}
      <div className="caps-wizard-actions">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled || index <= 0}
          onClick={() => {
            const previous = steps[index - 1];
            if (previous) onStepChange(previous.id);
          }}
        >
          Back
        </Button>
        {index < steps.length - 1 ? (
          <Button
            type="button"
            size="sm"
            disabled={disabled || nextDisabled}
            onClick={() => {
              const next = steps[index + 1];
              if (next) onStepChange(next.id);
            }}
          >
            Next
          </Button>
        ) : (
          actions
        )}
      </div>
    </div>
  );
}
