export default {
  addons: {
    action: { enabled: false },
    a11y: { enabled: true },
    theme: { enabled: true },
  },
  noWatch: true,
  defaultStory: "welcome--caps",
  storyOrder: [
    "welcome--*",
    "foundations--*",
    "surfaces--*",
    "buttons--*",
    "forms--*",
    "navigation--*",
    "overlays--*",
    "feedback--*",
    "blocks--*",
    "layouts--*",
    "game-pieces--*",
    "checks--*",
  ],
  stories: ["workbench/**/*.stories.{ts,tsx}"],
};
