import type { ReactNode } from "react";

/** The decorative face shared by icon choices; its native input names it. */
export function IconChoiceMark({
  icon,
  caption,
}: {
  icon: ReactNode;
  caption?: string | undefined;
}) {
  return (
    <span className="caps-icon-choice-mark" aria-hidden="true">
      <span className="caps-icon-choice-art">{icon}</span>
      {caption ? (
        <span className="caps-icon-choice-caption">{caption}</span>
      ) : null}
      <span className="caps-icon-choice-lamp" />
    </span>
  );
}
