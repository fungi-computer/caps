import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { Loader } from "../components/loader.js";
import { cn } from "../lib/cn.js";

/** A bounded, labelled loading region; the caller owns the message. */
export const LoadingState = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { message: ReactNode }
>(function LoadingState({ className, message, ...props }, ref) {
  return (
    <div
      {...props}
      className={cn("caps-loading-state", className)}
      ref={ref}
      role="status"
    >
      <Loader decorative size="sm" />
      <span>{message}</span>
    </div>
  );
});
