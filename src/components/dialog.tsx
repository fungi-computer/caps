import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import {
  createContext,
  forwardRef,
  type HTMLAttributes,
  useContext,
} from "react";

import { cn, resolveClassName } from "../lib/cn.js";
import { useOverlayRoot } from "./overlay-root.js";

/** Details supplied to a Dialog open-change callback. */
export type DialogChangeDetails = BaseDialog.Root.ChangeEventDetails;
/** Supported DialogChangeReason values. */
export type DialogChangeReason = BaseDialog.Root.ChangeEventReason;
/** Supported DialogInteractionOwner values. */
export type DialogInteractionOwner = "host" | "local";
type DialogContextValue = {
  interactionOwner: DialogInteractionOwner;
  modal: BaseDialog.Root.Props["modal"];
};

const DialogContext = createContext<DialogContextValue | null>(null);
/** Props accepted by Dialog. */
export type DialogProps<Payload = unknown> = BaseDialog.Root.Props<Payload> & {
  interactionOwner?: DialogInteractionOwner;
};

/** A dialog controller with explicit controlled or uncontrolled open state. */
export function Dialog<Payload = unknown>({
  children,
  interactionOwner = "local",
  modal = true,
  onOpenChange,
  ...props
}: DialogProps<Payload>) {
  return (
    <DialogContext.Provider value={{ interactionOwner, modal }}>
      <BaseDialog.Root
        {...props}
        modal={modal}
        onOpenChange={(next, details) => {
          if (
            interactionOwner === "host" &&
            !next &&
            details.reason === "escape-key"
          ) {
            details.cancel();
            details.allowPropagation();
            return;
          }
          onOpenChange?.(next, details);
        }}
      >
        {children}
      </BaseDialog.Root>
    </DialogContext.Provider>
  );
}

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("Dialog parts must be used inside <Dialog>");
  return context;
}

/** The trigger control for a Dialog. */
export const DialogTrigger = forwardRef<
  HTMLButtonElement,
  BaseDialog.Trigger.Props
>(function DialogTrigger({ className, type = "button", ...props }, ref) {
  return (
    <BaseDialog.Trigger
      {...props}
      className={(state) => cn("btn", resolveClassName(className, state))}
      ref={ref}
      type={type}
    />
  );
});

/** Shell dialog destination, with Base UI container and mount lifetime overrides. */
export const DialogPortal = forwardRef<HTMLDivElement, BaseDialog.Portal.Props>(
  function DialogPortal({ container, ...props }, ref) {
    const root = useOverlayRoot("dialog");
    if (container == null && root === null) return null;
    return (
      <BaseDialog.Portal {...props} container={container ?? root} ref={ref} />
    );
  },
);

/** The styled backdrop for a composed Dialog. */
export const DialogBackdrop = forwardRef<
  HTMLDivElement,
  BaseDialog.Backdrop.Props
>(function DialogBackdrop({ className, ...props }, ref) {
  return (
    <BaseDialog.Backdrop
      {...props}
      ref={ref}
      className={(state) =>
        cn(
          "caps-dialog-backdrop fixed inset-0 bg-black/40",
          resolveClassName(className, state),
        )
      }
    />
  );
});

/** The styled popup with Base UI composition and caller-controlled focus targets. */
export const DialogPopup = forwardRef<HTMLDivElement, BaseDialog.Popup.Props>(
  function DialogPopup({ className, finalFocus, ...props }, ref) {
    const dialog = useDialogContext();
    return (
      <BaseDialog.Popup
        {...props}
        className={(state) =>
          cn(
            "caps-dialog-popup max-h-screen w-11/12 max-w-(--container-lg) overflow-y-auto overscroll-contain rounded-box bg-base-100 p-lg text-base-content shadow-xl",
            resolveClassName(className, state),
          )
        }
        finalFocus={
          dialog.interactionOwner === "host" ? false : (finalFocus ?? true)
        }
        ref={ref}
      />
    );
  },
);

/** Props accepted by DialogContent. */
export type DialogContentProps = BaseDialog.Popup.Props &
  Pick<BaseDialog.Portal.Props, "container" | "keepMounted">;

/**
 * The default portal, backdrop and popup composition for a Dialog.
 * Keeps child state across closes. Like Base UI, only full modal mode has a backdrop.
 */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(
    { container, keepMounted = true, className, ...props },
    ref,
  ) {
    const { modal } = useDialogContext();
    return (
      <DialogPortal container={container} keepMounted={keepMounted}>
        {modal === true ? <DialogBackdrop /> : null}
        <DialogPopup
          {...props}
          className={(state) =>
            cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              resolveClassName(className, state),
            )
          }
          ref={ref}
        />
      </DialogPortal>
    );
  },
);

/** A footer layout for caller-provided Dialog actions. */
export function DialogFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("flex justify-end gap-sm", className)} />
  );
}
/** A header layout for caller-provided Dialog content. */
export function DialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("flex flex-col gap-sm", className)} />;
}
/** The accessible title for a Dialog. */
export const DialogTitle = forwardRef<
  HTMLHeadingElement,
  BaseDialog.Title.Props
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <BaseDialog.Title
      {...props}
      className={(state) =>
        cn("text-lg font-semibold", resolveClassName(className, state))
      }
      ref={ref}
    />
  );
});
/** The accessible description for a Dialog. */
export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  BaseDialog.Description.Props
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <BaseDialog.Description
      {...props}
      className={(state) =>
        cn("text-sm text-base-content", resolveClassName(className, state))
      }
      ref={ref}
    />
  );
});
/** A control that requests a Dialog to close. */
export const DialogClose = forwardRef<
  HTMLButtonElement,
  BaseDialog.Close.Props
>(function DialogClose({ className, type = "button", ...props }, ref) {
  return (
    <BaseDialog.Close
      {...props}
      className={(state) =>
        cn("btn btn-ghost", resolveClassName(className, state))
      }
      ref={ref}
      type={type}
    />
  );
});
