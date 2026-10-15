import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

/** Props accepted by Composer. */
export type ComposerProps = HTMLAttributes<HTMLDivElement> & {
  /** The caller-owned primary input control. */
  input: ReactNode;
  /** The caller-owned action control. Its disabled state and accessible name stay on that control. */
  action?: ReactNode;
  /** Optional caller-owned leading slot, such as an avatar. */
  leading?: ReactNode;
  /** Classes for the joined row; useful when the host exposes a busy state. */
  rowClassName?: string;
};

/** Layout and slots only. It never assigns action-control semantics. */
export const Composer = forwardRef<HTMLDivElement, ComposerProps>(
  function Composer(
    { action, className, input, leading, rowClassName, ...rootProps },
    ref,
  ) {
    return (
      <div
        {...rootProps}
        ref={ref}
        className={[
          "caps-composer flex min-w-0 flex-1 items-end gap-sm",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className={["join w-full p-2xs", rowClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {leading}
          {input}
          {action}
        </div>
      </div>
    );
  },
);
