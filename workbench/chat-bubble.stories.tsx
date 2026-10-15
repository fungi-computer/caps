import type { StoryDefault } from "@ladle/react";
import { ChatBubble } from "../src/components/chat-bubble.js";

export default { title: "Chat bubble" } satisfies StoryDefault;

export const RichText = () => (
  <div className="prose mx-auto max-w-[48rem]">
    <ChatBubble side="user" time="3:41 PM">
      <div>
        <p>Make the rain slower, please.</p>
      </div>
    </ChatBubble>
    <ChatBubble side="agent" name="Shiitake" time="3:42 PM">
      <div>
        <p>The rain has slowed down. Your mushroom has time to breathe.</p>
        <p>Try another round:</p>
        <ul>
          <li>Arrow keys move the cap.</li>
          <li>Catch a drop to grow.</li>
        </ul>
      </div>
    </ChatBubble>
    <ChatBubble side="agent" name="Shiitake" time="writing…" state="pending">
      <div>
        <p>And a little puddle by the</p>
      </div>
    </ChatBubble>
    <ChatBubble side="agent" name="Shiitake" time="3:43 PM" state="error">
      <div>
        <p>I lost my place. Send that again and I’ll pick it back up.</p>
      </div>
    </ChatBubble>
  </div>
);
