import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import {
  createContext,
  forwardRef,
  type HTMLAttributes,
  useContext,
  useImperativeHandle,
  useState,
} from "react";

import { cn, resolveClassName } from "../lib/cn.js";
import { OverlayPopoverScope, useOverlayRoot } from "./overlay-root.js";

/** Details supplied to a Dialog open-change callback. */
export type DialogChangeDetails = BaseDialog.Root.ChangeEventDetails;
/** Supported DialogChangeReason values. */
export type DialogChangeReason = BaseDialog.Root.ChangeEventReason;
/** Supported DialogInteractionOwner values. */
export type DialogInteractionOwner = "host" | "local";
type DialogContextValue = {
  interactionOwner: DialogInteractionOwner;
  modal: BaseDialog.Root.Props["modal"];
  /** An enclosing Dialog hides what is outside it while open (modal or trap-focus). */
  insideModal: boolean;
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
  const parent = useContext(DialogContext);
  const insideModal =
    parent !== null && (parent.insideModal || parent.modal !== false);
  return (
    <DialogContext.Provider value={{ interactionOwner, modal, insideModal }}>
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

/**
 * Shell dialog destination, with Base UI container and mount lifetime overrides.
 * Menus and pickers opened inside portal into the dialog's own portal node,
 * after its popup, so a shell's popover root (ordered under its dialog root)
 * never draws them behind the dialog. They join that node when they open, as
 * they would join the document body, so a modal dialog's hiding of what was
 * already outside it does not reach them.
 */
export const DialogPortal = forwardRef<HTMLDivElement, BaseDialog.Portal.Props>(
  function DialogPortal({ container, children, ...props }, ref) {
    const root = useOverlayRoot("dialog");
    const [portal, setPortal] = useState<HTMLDivElement | null>(null);
    useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
      ref,
      () => portal,
      [portal],
    );
    if (container == null && root === null) return null;
    return (
      <BaseDialog.Portal
        {...props}
        container={container ?? root}
        ref={setPortal}
      >
        <OverlayPopoverScope container={portal}>{children}</OverlayPopoverScope>
      </BaseDialog.Portal>
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

/** Props accepted by DialogPopup. */
export type DialogPopupProps = BaseDialog.Popup.Props & {
  /** Fill the portal's positioning context instead of using the default width. */
  size?: "default" | "fill";
};

/** The styled popup with Base UI composition and caller-controlled focus targets. */
export const DialogPopup = forwardRef<HTMLDivElement, DialogPopupProps>(
  function DialogPopup(
    { className, finalFocus, size = "default", ...props },
    ref,
  ) {
    const dialog = useDialogContext();
    return (
      <BaseDialog.Popup
        {...props}
        data-size={size}
        className={(state) =>
          cn(
            "caps-dialog-popup overflow-y-auto overscroll-contain rounded-box bg-base-100 p-lg text-base-content shadow-xl",
            size === "fill"
              ? "fixed inset-0 h-full w-full max-w-none"
              : "caps-dialog-popup-default",
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
export type DialogContentProps = DialogPopupProps &
  Pick<BaseDialog.Portal.Props, "container" | "keepMounted"> & {
    /**
     * Base UI omits the backdrop of a Dialog that sits inside another Dialog's
     * tree, as a Dialog rendered inside an always-open navigation rail does.
     * Keep it, so the page behind still dims.
     */
    forceBackdrop?: boolean;
  };

/**
 * The default portal, backdrop and popup composition for a Dialog.
 * Keeps child state across closes. Like Base UI, only full modal mode has a backdrop.
 *
 * Inside a modal Dialog it mounts on open instead: the enclosing modal
 * marks every portal already beside it aria-hidden when it opens, and that mark
 * stays on a closed portal that was kept mounted, after it opens too.
 */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(
    {
      container,
      keepMounted,
      forceBackdrop = false,
      className,
      size = "default",
      ...props
    },
    ref,
  ) {
    const { modal, insideModal } = useDialogContext();
    return (
      <DialogPortal
        container={container}
        keepMounted={keepMounted ?? !insideModal}
      >
        {modal === true ? <DialogBackdrop forceRender={forceBackdrop} /> : null}
        <DialogPopup
          {...props}
          size={size}
          className={(state) =>
            cn(
              size === "default" &&
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
