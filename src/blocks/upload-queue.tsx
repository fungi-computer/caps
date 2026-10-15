import type { JSX } from "react";
import { FileImage, RotateCcw, X } from "lucide-react";
import { IconButton } from "../components/icon-button.js";
import { Progress } from "../components/progress.js";

/**
 * LAW — queue thumbnails are decorative. The adjacent filename is the row's
 * accessible file fact; lifecycle status, progress, and actions remain named.
 */

export type UploadQueueAction = Readonly<{
  accessibleLabel: string;
  label: string;
}>;

/** Caller-owned labels for the row actions that may be shown. */
export type UploadQueueActions = Readonly<{
  cancel?: UploadQueueAction;
  remove?: UploadQueueAction;
  retry?: UploadQueueAction;
}>;

/** Caller-provided upload queue item data. */
export type UploadQueueItem = Readonly<{
  actions: UploadQueueActions;
  alert?: string;
  id: string;
  name: string;
  preview: UploadQueuePreview;
  /** Null means the transport does not report byte progress. */
  progress: number | null;
  progressLabel: string;
  statusLabel: string;
}>;

/** A caller-provided file or image preview for one upload row. */
export type UploadQueuePreview =
  Readonly<{ kind: "file" }> | Readonly<{ kind: "image"; url: string }>;

/** Props accepted by UploadQueue. */
export type UploadQueueProps = Readonly<{
  className?: string;
  items: readonly UploadQueueItem[];
  /** Handles a caller-requested cancellation. */
  onCancel: (id: string) => Promise<void> | void;
  /** Handles removal of a completed or failed row. */
  onRemove: (id: string) => void;
  /** Handles a caller-requested retry. */
  onRetry: (id: string) => Promise<void> | void;
  rowClassName?: string;
}>;

/** Product-neutral upload facts and affordances; lifecycle stays with the host. */
export function UploadQueue({
  className,
  items,
  onCancel,
  onRemove,
  onRetry,
  rowClassName,
}: UploadQueueProps): JSX.Element | null {
  if (!items.length) return null;
  return (
    <div
      aria-live="polite"
      className={`caps-upload-queue flex w-full min-w-0 flex-col gap-sm ${className ?? ""}`}
      data-upload-rows
    >
      {items.map((item) => (
        <UploadQueueRow
          item={item}
          key={item.id}
          onCancel={onCancel}
          onRemove={onRemove}
          onRetry={onRetry}
          {...(rowClassName === undefined ? {} : { rowClassName })}
        />
      ))}
    </div>
  );
}

function UploadQueueAction({
  action,
  id,
  onAction,
  retry = false,
}: {
  action: undefined | UploadQueueAction;
  id: string;
  onAction: (id: string) => Promise<void> | void;
  retry?: boolean;
}): JSX.Element | null {
  if (!action) return null;
  return (
    <IconButton
      aria-label={action.accessibleLabel}
      title={action.label}
      variant="ghost"
      size="xs"
      className="motion-reduce:transition-none"
      icon={retry ? <RotateCcw /> : <X />}
      onClick={() => void onAction(id)}
      type="button"
    />
  );
}

function UploadQueueDetails({ item }: { item: UploadQueueItem }): JSX.Element {
  return (
    <div className="min-w-0">
      <span className="block min-w-0 truncate" title={item.name}>
        {item.name}
      </span>
      <div className="caps-upload-details">
        <span
          aria-live={item.alert ? "assertive" : undefined}
          className="caps-upload-status min-w-0 break-words"
          data-upload-status
          role={item.alert ? "alert" : undefined}
        >
          {item.alert ?? item.statusLabel} {item.progressLabel}
        </span>
      </div>
    </div>
  );
}

function UploadQueueRow({
  item,
  onCancel,
  onRemove,
  onRetry,
  rowClassName,
}: {
  item: UploadQueueItem;
} & Omit<UploadQueueProps, "className" | "items">): JSX.Element {
  return (
    <div
      className={`caps-upload-row grid w-full min-w-0 max-w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-sm p-sm text-xs ${rowClassName ?? ""}`}
    >
      {item.preview.kind === "image" ? (
        <img
          alt=""
          className="caps-upload-preview mask mask-squircle size-8 shrink-0 object-cover"
          src={item.preview.url}
        />
      ) : (
        <span
          aria-hidden="true"
          className="caps-upload-preview mask mask-squircle flex size-8 shrink-0 items-center justify-center bg-base-300"
        >
          <FileImage className="size-4" />
        </span>
      )}
      <UploadQueueDetails item={item} />
      <UploadQueueRowActions
        actions={item.actions}
        id={item.id}
        onCancel={onCancel}
        onRemove={onRemove}
        onRetry={onRetry}
      />
      <Progress
        aria-label={`${item.name} progress`}
        className="caps-upload-progress"
        tone={
          item.alert ? "error" : item.progress === 100 ? "success" : "accent"
        }
        max={100}
        value={item.progress ?? (item.alert ? 0 : undefined)}
      />
    </div>
  );
}

function UploadQueueRowActions({
  actions,
  id,
  onCancel,
  onRemove,
  onRetry,
}: {
  actions: UploadQueueActions;
  id: string;
  onCancel: UploadQueueProps["onCancel"];
  onRemove: UploadQueueProps["onRemove"];
  onRetry: UploadQueueProps["onRetry"];
}): JSX.Element {
  return (
    <div className="caps-upload-actions flex min-w-0 flex-wrap justify-end gap-xs">
      <UploadQueueAction
        action={actions.retry}
        id={id}
        onAction={onRetry}
        retry
      />
      <UploadQueueAction action={actions.cancel} id={id} onAction={onCancel} />
      <UploadQueueAction action={actions.remove} id={id} onAction={onRemove} />
    </div>
  );
}
