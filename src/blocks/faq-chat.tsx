import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { Button } from "../components/button.js";
import { Input } from "../components/input.js";
import { InputGroup } from "../components/input-group.js";
import { cn } from "../lib/cn.js";

/** One reviewed question and its fixed answer. */
export type FaqChatEntry = {
  /** Stable identity for the entry. */
  id: string;
  /** The question as a visitor would ask it. Also shown as a suggestion. */
  question: string;
  /** The reviewed answer. The chat never generates text of its own. */
  answer: ReactNode;
  /** Lowercase words or phrases that route a typed question here. */
  keywords?: readonly string[];
  /** Caller-owned next steps shown under the answer, such as links. */
  actions?: ReactNode;
};

/** The reply for a typed question that matches no entry. */
export type FaqChatFallback = {
  answer: ReactNode;
  actions?: ReactNode;
};

/** Props accepted by FaqChat. */
export type FaqChatProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  entries: readonly FaqChatEntry[];
  /** The first agent message, shown before any question. */
  greeting: ReactNode;
  fallback: FaqChatFallback;
  /** Visible heading and accessible name of the chat. */
  title: ReactNode;
  /** A short honest note about where answers come from. */
  note?: ReactNode;
  /** Optional mark shown beside the title, such as a logo. */
  avatar?: ReactNode;
  /** Accessible label of the typed-question field. */
  inputLabel?: string;
  placeholder?: string;
  submitLabel?: string;
};

type Turn =
  | { key: number; speaker: "user"; text: string }
  | { key: number; speaker: "agent"; answer: ReactNode; actions?: ReactNode };

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9$]+/g) ?? [];
}

/**
 * Routes a typed question to the entry whose keywords it mentions most.
 * Returns undefined when nothing matches, so the caller can answer honestly.
 */
export function matchFaqEntry(
  entries: readonly FaqChatEntry[],
  text: string,
): FaqChatEntry | undefined {
  const asked = ` ${words(text).join(" ")} `;
  if (asked.trim().length === 0) return undefined;
  let best: FaqChatEntry | undefined;
  let bestScore = 0;
  for (const entry of entries) {
    const score = (entry.keywords ?? []).reduce((total, keyword) => {
      const phrase = words(keyword).join(" ");
      return phrase.length > 0 && asked.includes(` ${phrase} `)
        ? total + 1
        : total;
    }, 0);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return best;
}

/**
 * A chat-shaped FAQ. Visitors pick or type a question and get the caller's
 * reviewed answer with its next steps. Message rows follow Parakeet: the
 * visitor's turn sits on the surface with a primary rule, the answer is plain.
 */
export const FaqChat = forwardRef<HTMLElement, FaqChatProps>(function FaqChat(
  {
    avatar,
    className,
    entries,
    fallback,
    greeting,
    inputLabel = "Ask a question",
    note,
    placeholder = "Ask about the plans",
    submitLabel = "Ask",
    title,
    ...rootProps
  },
  ref,
) {
  const titleId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const nextKey = useRef(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [turns]);

  function ask(text: string, reply: FaqChatEntry | FaqChatFallback) {
    const userKey = nextKey.current++;
    const agentKey = nextKey.current++;
    setTurns((previous) => [
      ...previous,
      { key: userKey, speaker: "user", text },
      {
        actions: reply.actions,
        answer: reply.answer,
        key: agentKey,
        speaker: "agent",
      },
    ]);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (text.length === 0) return;
    ask(text, matchFaqEntry(entries, text) ?? fallback);
    setDraft("");
  }

  return (
    <section
      {...rootProps}
      aria-labelledby={titleId}
      className={cn("caps-faq-chat", className)}
      ref={ref}
    >
      <header className="caps-faq-chat-header">
        {avatar}
        <div className="caps-faq-chat-heading">
          <p className="caps-faq-chat-title" id={titleId}>
            {title}
          </p>
          {note ? <p className="caps-faq-chat-note">{note}</p> : null}
        </div>
      </header>
      <div
        aria-live="polite"
        className="caps-faq-chat-log"
        ref={logRef}
        role="log"
      >
        <div className="caps-faq-chat-agent">{greeting}</div>
        {turns.map((turn) =>
          turn.speaker === "user" ? (
            <p className="caps-faq-chat-user" key={turn.key}>
              {turn.text}
            </p>
          ) : (
            <div className="caps-faq-chat-agent" key={turn.key}>
              {turn.answer}
              {turn.actions ? (
                <div className="caps-faq-chat-actions">{turn.actions}</div>
              ) : null}
            </div>
          ),
        )}
      </div>
      <ul
        aria-label="Suggested questions"
        className="caps-faq-chat-suggestions"
      >
        {entries.map((entry) => (
          <li key={entry.id}>
            <Button
              onClick={() => {
                ask(entry.question, entry);
              }}
              size="xs"
              type="button"
              variant="outline"
            >
              {entry.question}
            </Button>
          </li>
        ))}
      </ul>
      <form className="caps-faq-chat-form" onSubmit={submit}>
        <InputGroup>
          <Input
            aria-label={inputLabel}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            placeholder={placeholder}
            value={draft}
          />
          <Button type="submit">{submitLabel}</Button>
        </InputGroup>
      </form>
    </section>
  );
});
