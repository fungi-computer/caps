import { ActionType, useLadleContext } from "@ladle/react";
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";

type StoryLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  storyId: string;
};

/** Navigate through Ladle while leaving modified and new-tab links native. */
export const StoryLink = forwardRef<HTMLAnchorElement, StoryLinkProps>(
  function StoryLink({ children, onClick, storyId, ...props }, ref) {
    const { dispatch, globalState } = useLadleContext();
    const query = new URLSearchParams(window.location.search);
    query.set("story", storyId);
    query.set("theme", globalState.theme);
    query.set("mode", globalState.mode);
    query.set("source", String(globalState.source));
    return (
      <a
        {...props}
        ref={ref}
        href={`?${query.toString()}`}
        onClick={(event) => {
          onClick?.(event);
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            (props.target && props.target !== "_self") ||
            props.download !== undefined
          )
            return;
          event.preventDefault();
          dispatch({ type: ActionType.UpdateStory, value: storyId });
        }}
      >
        {children}
      </a>
    );
  },
);
