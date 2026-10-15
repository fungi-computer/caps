import type { Story } from "@ladle/react";
import { useEffect, useState } from "react";
import {
  UploadQueue as Queue,
  type UploadQueueItem,
} from "../src/blocks/upload-queue.js";
import { Button } from "../src/components/button.js";
import "./status.css";
import "./upload-queue.css";

const names = ["desert-study.jpg", "alpine-light.jpg", "forest-canopy.jpg"];
const photos = [
  "photo-1509316785289-025f5b846b35",
  "photo-1464822759023-fed622ff2c3b",
  "photo-1448375240586-882707db888b",
];
function initialItems(): UploadQueueItem[] {
  return names.map((name, index) => {
    const item: UploadQueueItem = {
      id: name,
      name,
      preview: {
        kind: "image",
        url: `https://images.unsplash.com/${photos[index] ?? "photo-1509316785289-025f5b846b35"}?w=120&h=120&fit=crop`,
      },
      progress: index === 0 ? 48 : index === 1 ? 100 : null,
      progressLabel: index === 0 ? "48%" : "",
      statusLabel: index === 0 ? "Uploading" : "Saved to Computer",
      actions:
        index === 0
          ? { cancel: { label: "Cancel", accessibleLabel: `Cancel ${name}` } }
          : {
              remove: { label: "Dismiss", accessibleLabel: `Dismiss ${name}` },
            },
    };
    if (index !== 2) return item;
    return {
      ...item,
      alert: "Connection interrupted. Try again.",
      actions: {
        ...item.actions,
        retry: { label: "Retry", accessibleLabel: `Retry ${name}` },
      },
    };
  });
}

export const UploadQueue: Story = () => {
  const [items, setItems] = useState(initialItems);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    // Fixture events, not a real transfer or estimated network progress.
    const steps = [
      [700, 4],
      [1500, 12],
      [2300, 27],
      [3600, 31],
      [4700, 52],
      [6200, 68],
      [7600, 74],
      [8900, 93],
      [10500, 100],
    ] as const;
    const timers = steps.map(([delay, progress]) =>
      setTimeout(() => {
        setItems((rows) =>
          rows.map((row) => {
            if (row.id !== names[0]) return row;
            return {
              ...row,
              progress,
              progressLabel: progress === 100 ? "" : `${String(progress)}%`,
              statusLabel: progress === 100 ? "Saved to Computer" : "Uploading",
              actions:
                progress === 100
                  ? {
                      remove: {
                        label: "Dismiss",
                        accessibleLabel: `Dismiss ${row.name}`,
                      },
                    }
                  : {
                      cancel: {
                        label: "Cancel",
                        accessibleLabel: `Cancel ${row.name}`,
                      },
                    },
            };
          }),
        );
        if (progress === 100) setPlaying(false);
      }, delay),
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [playing]);
  const remove = (id: string) => {
    if (id === names[0]) setPlaying(false);
    setItems((rows) => rows.filter((row) => row.id !== id));
  };
  return (
    <main className="status-study" data-conformance="upload-queue">
      <section
        className="status-study-stage p-lg"
        aria-label="Upload queue preview"
      >
        <span className="status-study-caption">Uploads / small cargo</span>
        <div className="upload-study-preview">
          <Queue
            items={items}
            onCancel={remove}
            onRemove={remove}
            onRetry={(id) => {
              setItems((rows) =>
                rows.map((row) => {
                  if (row.id !== id) return row;
                  return {
                    id: row.id,
                    name: row.name,
                    preview: row.preview,
                    progressLabel: "",
                    progress: null,
                    statusLabel: "Sending to Computer",
                    actions: {
                      cancel: {
                        label: "Cancel",
                        accessibleLabel: `Cancel ${row.name}`,
                      },
                    },
                  };
                }),
              );
            }}
          />
        </div>
        <span className="status-study-hint">
          Simulate an upload. Retry or dismiss a row.
        </span>
      </section>
      <div className="status-study-controls">
        <Button
          size="sm"
          disabled={playing}
          onClick={() => {
            setItems(
              initialItems().map((row, index) =>
                index === 0
                  ? { ...row, progress: 0, progressLabel: "0%" }
                  : row,
              ),
            );
            setPlaying(true);
          }}
        >
          {playing ? "Uploading…" : "Simulate upload"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setPlaying(false);
            setItems(initialItems());
          }}
        >
          Reset uploads
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setPlaying(false);
            setItems((rows) =>
              rows.map((row) => ({
                id: row.id,
                name: row.name,
                preview: row.preview,
                progress: 100,
                progressLabel: "",
                statusLabel: "Saved to Computer",
                actions: {
                  remove: {
                    label: "Dismiss",
                    accessibleLabel: `Dismiss ${row.name}`,
                  },
                },
              })),
            );
          }}
        >
          Complete uploads
        </Button>
      </div>
    </main>
  );
};
