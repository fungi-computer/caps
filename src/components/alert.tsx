import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/cn.js";

/** Supported AlertTone values. */
export type AlertTone =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "info"
  | "warning"
  | "error";

const alertToneClasses = {
  neutral: "alert-neutral",
  primary: "alert-primary",
  secondary: "alert-secondary",
  accent: "alert-accent",
  success: "alert-success",
  info: "alert-info",
  warning: "alert-warning",
  error: "alert-error",
} satisfies Record<AlertTone, string>;

/** Props accepted by Alert. */
export type AlertProps = {
  action?: ReactNode;
  description?: ReactNode;
  title?: ReactNode;
  tone?: AlertTone;
} & Omit<HTMLAttributes<HTMLDivElement>, "title">;

/** A caller-labelled alert presentation. */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    action,
    children,
    className,
    description,
    title,
    tone = "neutral",
    ...props
  },
  ref,
) {
  return (
    <div
      {...props}
      className={cn("alert caps-alert", alertToneClasses[tone], className)}
      data-tone={tone}
      role={props.role ?? "alert"}
      ref={ref}
    >
      <div className="min-w-0 flex-1">
        {title ? <h3 className="font-semibold">{title}</h3> : null}
        {description ? <p className="text-sm">{description}</p> : null}
        {children}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
});
