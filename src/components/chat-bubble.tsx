import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/cn.js";

/** Which side of the conversation a bubble sits on. */
export type ChatBubbleSide = "agent" | "user";
/** `pending` is still being written; `error` is a turn that did not finish. */
export type ChatBubbleState = "settled" | "pending" | "error";

/** Props accepted by ChatBubble. */
export type ChatBubbleProps = {
  /** An agent speaks from the left with its mark; the person from the right. */
  side: ChatBubbleSide;
  /** A mark for an agent, drawn beside its bubble. */
  avatar?: ReactNode;
  /** Who is speaking, on the line above the bubble. */
  name?: ReactNode;
  /** When it was said, or what the speaker is doing instead. */
  time?: ReactNode;
  state?: ChatBubbleState;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

/**
 * One turn of a conversation: who said it, when, and what. It owns the
 * sides, the bubble and the still-writing dots; the caller owns the content.
 */
export const ChatBubble = forwardRef<HTMLDivElement, ChatBubbleProps>(
  function ChatBubble(
    {
      side,
      avatar,
      name,
      time,
      state = "settled",
      children,
      className,
      ...props
    },
    ref,
  ) {
    return (
      <div
        {...props}
        className={cn("caps-chat-bubble", className)}
        data-side={side}
        data-state={state}
        ref={ref}
      >
        {avatar ? (
          <span aria-hidden="true" className="caps-chat-avatar">
            {avatar}
          </span>
        ) : null}
        <div className="caps-chat-main">
          {name || time ? (
            <div className="caps-chat-meta">
              {name ? <span className="caps-chat-name">{name}</span> : null}
              {time ? <span className="caps-chat-time">{time}</span> : null}
            </div>
          ) : null}
          <div className="caps-chat-body">
            {children}
            {state === "pending" ? (
              <span aria-hidden="true" className="caps-chat-typing">
                <i />
                <i />
                <i />
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  },
);
