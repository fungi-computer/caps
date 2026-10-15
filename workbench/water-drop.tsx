import { useEffect, useRef, useState } from "react";
import { ScrollToBottomBlob } from "../src/components/scroll-to-bottom-blob.js";
import { Button } from "../src/components/button.js";

/** A real forward scroller with scripted pull, unread and jump scenarios. */
export function ScrollBlobExample() {
  const scroller = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLInputElement>(null);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const [unread, setUnread] = useState(0);
  const [jumps, setJumps] = useState(0);
  const atEnd = () => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  };
  useEffect(() => {
    atEnd();
    return () => {
      for (const timer of timers.current) clearTimeout(timer);
    };
  }, []);
  const play = () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current.clear();
    atEnd();
    for (let step = 1; step <= 12; step++) {
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        const el = scroller.current;
        if (el) {
          el.scrollTop -= 18;
          el.dispatchEvent(new Event("scroll"));
        }
      }, step * 40);
      timers.current.add(timer);
    }
  };
  return (
    <section className="grid gap-md p-lg" data-scroll-blob-workbench>
      <div className="flex gap-md">
        <Button onClick={play}>Flick into history</Button>
        <Button
          onClick={() => {
            setUnread((n) => n + 3);
          }}
        >
          Three new messages
        </Button>
        <Button onClick={atEnd}>Reset to end</Button>
      </div>
      <div
        className="relative h-64 border border-base-300 rounded-box bg-base-100"
        data-scroll-blob-wrapper
      >
        <div
          ref={scroller}
          className="h-full overflow-y-auto p-lg"
          tabIndex={-1}
          data-drop-scroller=""
        >
          <div>
            {Array.from({ length: 40 }, (_, i) => (
              <p className="py-sm" key={i}>
                Conversation message {i + 1}
              </p>
            ))}
          </div>
        </div>
        <ScrollToBottomBlob
          scrollerRef={scroller}
          unread={unread}
          focusAfterJump={composer}
          onJump={() => {
            setUnread(0);
            setJumps((n) => n + 1);
            scroller.current?.scrollTo({
              top: scroller.current.scrollHeight,
              behavior: "smooth",
            });
          }}
        />
      </div>
      <input
        ref={composer}
        className="input"
        aria-label="Message"
        placeholder="Focus returns here after jumping"
      />
      <output data-scroll-blob-jumps={jumps}>Jumps: {jumps}</output>
    </section>
  );
}
