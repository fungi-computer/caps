import { ActionType, type GlobalProvider, ThemeState } from "@ladle/react";
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";

import { guideForStory } from "./guide.js";
import { StoryLink } from "./story-link.js";

import "@fungi.computer/caps/styles.css";
import "@fungi.computer/caps/fonts.css";
import "../.ladle/workbench.css";

function subscribeSystemTheme(onChange: () => void) {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);
  return () => {
    query.removeEventListener("change", onChange);
  };
}

function systemIsDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Ladle owns navigation and theme selection; Stipe supplies the actual colors. */
export const Provider: GlobalProvider = ({
  children,
  globalState,
  dispatch,
}) => {
  const root = useRef<HTMLDivElement>(null);
  const systemDark = useSyncExternalStore(subscribeSystemTheme, systemIsDark);
  const dark =
    globalState.theme === ThemeState.Auto
      ? systemDark
      : globalState.theme === ThemeState.Dark;
  const guide = guideForStory(globalState.story);
  // Gallery frames theme the portal root as well as the specimen.
  const requestedTheme = new URLSearchParams(window.location.search).get(
    "capsTheme",
  );
  const theme =
    requestedTheme === "pirate-radio" || requestedTheme === "pirate-radio-night"
      ? requestedTheme
      : dark
        ? "mocha"
        : "latte";
  useLayoutEffect(() => {
    const body = root.current?.ownerDocument.body;
    if (!body) return;
    const previous = body.dataset.theme;
    body.dataset.theme = theme;
    return () => {
      if (previous === undefined) delete body.dataset.theme;
      else body.dataset.theme = previous;
    };
  }, [theme]);
  return (
    <div
      ref={root}
      className="caps-workbench-provider font-sans"
      data-caps-workbench
      data-theme={theme}
      data-full-bleed={
        globalState.story.startsWith("desktop--") ||
        globalState.story.startsWith("shed--") ||
        globalState.story.startsWith("marketplace--") ||
        undefined
      }
    >
      {guide ? (
        <header className="caps-guide-header">
          <StoryLink className="caps-guide-brand" storyId="welcome--caps">
            Caps
          </StoryLink>
          <div className="caps-guide-heading">
            <div>
              <h1>{guide.title}</h1>
              <p>{guide.description}</p>
            </div>
            <button
              type="button"
              className="caps-guide-source"
              onClick={() => {
                dispatch({
                  type: ActionType.UpdateSource,
                  value: !globalState.source,
                });
              }}
            >
              {globalState.source ? "Hide story source" : "Story source"}
            </button>
          </div>
        </header>
      ) : null}
      {children}
    </div>
  );
};
