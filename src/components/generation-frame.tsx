import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn.js";
import { canAnimate, motionEasing, readMotion } from "../lib/motion.js";
import { Loader } from "./loader.js";
import { VisuallyHidden } from "./visually-hidden.js";

/** Where one generated piece of media is in its life. */
export type GenerationStatus =
  "queued" | "generating" | "refining" | "done" | "failed";

/** Props accepted by GenerationFrame. */
export type GenerationFrameProps = {
  status: GenerationStatus;
  /** The finished media (or, while refining, a rough preview of it). */
  children?: ReactNode;
  /** Width over height. Omit when the parent already sizes the frame. */
  aspectRatio?: number;
  /** What is happening, for people using a screen reader. */
  label?: ReactNode;
  /** The working indicator; Caps' bloom loader by default. */
  indicator?: ReactNode;
  /** Shown over the dimmed frame when generation fails. */
  failure?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

const defaultLabels = {
  queued: "Waiting to start",
  generating: "Generating",
  refining: "Refining",
  done: undefined,
  failed: undefined,
} satisfies Record<GenerationStatus, string | undefined>;

/**
 * One fixed frame for a generation, from queued to done: the frame keeps
 * its size the whole time, so nothing around it moves. The finished media
 * develops inside it (it sharpens out of a soft blur), and a failure dims the
 * frame behind its message. Reduced motion keeps short fades only.
 */
export const GenerationFrame = forwardRef<HTMLDivElement, GenerationFrameProps>(
  function GenerationFrame(
    {
      status,
      children,
      aspectRatio,
      label,
      indicator,
      failure,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const node = useRef<HTMLDivElement>(null);
    useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
      ref,
      () => node.current,
    );
    const previous = useRef(status);
    // The working layer stays under the picture until the picture has
    // developed over it, so the loader never blinks out first.
    const [developing, setDeveloping] = useState(false);
    const [shownStatus, setShownStatus] = useState(status);
    if (shownStatus !== status) {
      setShownStatus(status);
      setDeveloping(status === "done");
    }

    useLayoutEffect(() => {
      const element = node.current;
      const before = previous.current;
      previous.current = status;
      if (!element || before === status) return;
      if (!canAnimate(element)) {
        setDeveloping(false);
        return;
      }
      const motion = readMotion(element);
      const easing = motionEasing(motion, motion.ease);
      const animations: Animation[] = [];
      const media = element.querySelector<HTMLElement>(
        ':scope > [data-layer="media"]',
      );
      const placeholder = element.querySelector<HTMLElement>(
        ':scope > [data-layer="placeholder"]',
      );
      const note = element.querySelector<HTMLElement>(
        ':scope > [data-layer="failure"]',
      );
      if (status === "done" && media) {
        // The picture develops: it sharpens and settles out of a soft blur.
        const develop = media.animate(
          motion.reduced
            ? [{ opacity: 0 }, { opacity: 1 }]
            : [
                { opacity: 0, filter: "blur(10px)", transform: "scale(1.03)" },
                { opacity: 1, filter: "blur(0px)", transform: "none" },
              ],
          {
            duration: motion.reduced ? motion.fast : motion.slow * 2,
            easing,
            fill: "backwards",
          },
        );
        develop.addEventListener("finish", () => {
          setDeveloping(false);
        });
        animations.push(develop);
        if (placeholder)
          animations.push(
            placeholder.animate([{ opacity: 1 }, { opacity: 0 }], {
              duration: motion.reduced ? motion.fast : motion.slow,
              easing,
              fill: "forwards",
            }),
          );
      }
      if (status === "failed" && note)
        animations.push(
          note.animate(
            [
              {
                opacity: 0,
                transform: `translateY(${String(motion.distance)}px)`,
              },
              { opacity: 1, transform: "none" },
            ],
            { duration: motion.normal, easing },
          ),
        );
      if (before === "failed" && placeholder)
        animations.push(
          placeholder.animate([{ opacity: 0.4 }, { opacity: 1 }], {
            duration: motion.normal,
            easing,
          }),
        );
      return () => {
        for (const animation of animations) animation.cancel();
      };
    }, [status]);

    const working =
      status === "queued" || status === "generating" || status === "refining";
    const spoken = label ?? defaultLabels[status];
    const showsMedia = status === "done" || status === "refining";
    return (
      <div
        {...props}
        ref={node}
        className={cn("caps-generation-frame", className)}
        data-status={status}
        data-aspect={aspectRatio === undefined ? undefined : ""}
        aria-busy={working}
        style={aspectRatio === undefined ? style : { aspectRatio, ...style }}
      >
        {status === "done" && !developing ? null : (
          <div
            className={cn(
              "caps-generation-placeholder",
              status === "queued" && "skeleton",
            )}
            data-layer="placeholder"
            role={status === "done" ? undefined : "status"}
            aria-hidden={status === "done" ? true : undefined}
          >
            {status === "generating" ||
            status === "refining" ||
            status === "done"
              ? (indicator ?? <Loader decorative size="lg" variant="bloom" />)
              : null}
            {spoken === undefined ? null : (
              <VisuallyHidden>{spoken}</VisuallyHidden>
            )}
          </div>
        )}
        {showsMedia ? (
          <div className="caps-generation-media" data-layer="media">
            {children}
          </div>
        ) : null}
        {status === "failed" && failure !== undefined ? (
          <div
            className="caps-generation-failure"
            data-layer="failure"
            role="alert"
          >
            {failure}
          </div>
        ) : null}
      </div>
    );
  },
);
