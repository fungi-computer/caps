import coverage from "./coverage.json";

export type Guide = { title: string; description: string };

/** Human-facing introductions for the component catalog. */
const componentGuide = {
  "confirm-action": {
    title: "Confirm a destructive action",
    description:
      "Hold a key or type an exact phrase before continuing. Try both modes while idle, busy and after a refusal.",
  },
  "icon-checkbox": {
    title: "Icon choices",
    description:
      "Independent rights use checkboxes; one-of-many choices use radios. Each icon has a full accessible name and a native input.",
  },
  "icon-lamp": {
    title: "Icon lamps",
    description:
      "A right or setting shown but not changed here: the icon key's face, lit in colour or a grey silhouette, read as label and state.",
  },
  "icon-radio": {
    title: "Icon radio",
    description:
      "Choose one icon with the existing RadioGroup. Arrow keys, form submission and reset stay native.",
  },
  "price-tag": {
    title: "Price tag",
    description:
      "The catalog price uses the same semantic badge treatment as other product facts.",
  },
  "game-share-card": {
    title: "Game share card",
    description:
      "Present a published game with its cover, share details and a host-owned play action.",
  },
  "store-card": {
    title: "Store card",
    description: "Catalog art, summary and price share one selectable card.",
  },
  toaster: {
    title: "Toaster",
    description:
      "Swipeable notifications with molded Caps surfaces. Dismiss the message, not the work.",
  },
  "scroll-area": {
    title: "Scroll area",
    description:
      "Native content scrolling with a spring-loaded plastic thumb. Drag, wheel, touch, or use the keyboard.",
  },
  button: {
    title: "Button",
    description:
      "Give an action a clear place to land. Choose its emphasis, size and disabled state.",
  },
  "icon-button": {
    title: "Icon button",
    description:
      "A compact action with an accessible name, visible focus and room to press.",
  },
  keycap: {
    title: "Keycap",
    description:
      "Molded game keys. A kbd legend for shortcuts and a chunky action key whose lamp shows the current mode.",
  },
  "release-tag": {
    title: "Release tag",
    description:
      "A torn calendar page for what just shipped: a stacked title, one accent strip and a ruled list of versions.",
  },
  rough: {
    title: "Rough",
    description:
      "Hand-drawn boxes, underlines, circles and speech bubbles around real content. Seeded so the wobble holds still.",
  },
  "trading-card": {
    title: "Trading card",
    description:
      "A collectible card with a name bar, art window, one move and printed facts. Holo foil stills for reduced motion.",
  },
  "pixel-number": {
    title: "Pixel number",
    description:
      "Crisp 3×5 numerals for clocks, counters and floating numbers. Drawn, not typeset, so they never blur.",
  },
  "item-grid": {
    title: "Item grid",
    description:
      "A backpack you can drive from the keyboard: footprints, stacks, a drop ghost that says why not, and equipment slots.",
  },
  "game-feedback": {
    title: "Game feedback",
    description:
      "Flashes, floating numbers and refusal notes over a game world. Stepped like sprite frames, frozen on pause, still under reduced motion.",
  },
  "game-hud": {
    title: "Game HUD",
    description:
      "Paper plates, segmented bars, a clock, portraits, a minimap and cards for a game shell. One theme, three accents.",
  },
  window: {
    title: "Window",
    description:
      "A rounded application shell with a title handle and clear controls. Layout and lifecycle stay with the host.",
  },
  input: {
    title: "Input",
    description:
      "A quiet solid surface with a fine upper rim. Native editing, clear focus, and room to breathe.",
  },
  textarea: {
    title: "Textarea",
    description:
      "Give longer thoughts room to grow, from a quick note to a conversation draft.",
  },
  label: {
    title: "Label",
    description:
      "Name a control clearly and keep its text connected to the input.",
  },
  "activity-line": {
    title: "Activity line",
    description:
      "Show agent work with a live clock, then settle into how long it took.",
  },
  "tool-call-chip": {
    title: "Tool call chip",
    description:
      "Show one tool call running, landing or asking for a retry, without noise.",
  },
  "generation-frame": {
    title: "Generation frame",
    description:
      "Hold a generated image's place from queued to done, so it develops without moving anything.",
  },
  "send-action": {
    title: "Send action",
    description:
      "Send from a composer: wake when there is something to send, launch while working, offer stop.",
  },
  presence: {
    title: "Presence",
    description:
      "Let content arrive, leave, open its space or cross-fade instead of popping.",
  },
  "undo-action": {
    title: "Undo action",
    description:
      "Let a destructive action wait out a short undo window, or ask for a hold when nothing can undo it.",
  },
  "code-input": {
    title: "Code input",
    description:
      "Take a sign-in or pairing code one character at a time, without losing paste or autofill.",
  },
  field: {
    title: "Field",
    description:
      "Keep a label, input, help text and validation message together.",
  },
  dialog: {
    title: "Dialog",
    description:
      "Make room for a focused decision, then return the person to where they were.",
  },
  mosaic: {
    title: "Mosaic",
    description: "Arrange related content into a responsive grid.",
  },
  "app-bar": {
    title: "App bar",
    description:
      "Keep running apps, the launcher and common actions within reach.",
  },
  technonomicon: {
    title: "Technonomicon",
    description:
      "Editorial plates, growth labels, issue layouts and collector cards in field-guide materials.",
  },
  composer: {
    title: "Composer",
    description:
      "Bring an input, attachments and actions together into a compact writing surface.",
  },
  "spec-sheet": {
    title: "Spec sheet",
    description:
      "Lay out a 1-bit printed-manual page: section rulers, hatched figure frames, fact strips, numbered steps and plain questions and answers.",
  },
  "faq-chat": {
    title: "FAQ chat",
    description:
      "Answer common questions from a fixed, reviewed list, in the shape of a chat, and end on a next step.",
  },
  "command-menu": {
    title: "Command menu",
    description: "Offer a searchable set of actions with keyboard navigation.",
  },
  "resource-select": {
    title: "Resource select",
    description:
      "Choose from a caller-provided collection, with loading and empty states nearby.",
  },
  combobox: {
    title: "Combobox",
    description:
      "Search a longer list without losing keyboard selection or a clear current value.",
  },
  "async-state": {
    title: "Async state",
    description:
      "Show what is loading, what failed and where a person can try again.",
  },
  "empty-state": {
    title: "Empty state",
    description: "Explain an empty space and offer a useful next step.",
  },
  "result-state": {
    title: "Result state",
    description:
      "Present the outcome of an action with a clear message and next step.",
  },
  "section-card": {
    title: "Section card",
    description:
      "Group a heading, supporting text and content into one quiet section.",
  },
  "pricing-card": {
    title: "Pricing card",
    description:
      "Make an offer easy to compare: price, features and one clear action.",
  },
  "permission-grid": {
    title: "Permission grid",
    description:
      "Show what a scope may use at a glance: one spec-sheet row per capability with its mark, state and scope.",
  },
  "upload-queue": {
    title: "Upload queue",
    description:
      "Keep individual file progress, errors and cancellation visible. The caller owns the transfer.",
  },
  "input-group": {
    title: "Input group",
    description:
      "Place a prefix, suffix or related action beside an input without crowding it.",
  },
  select: {
    title: "Select",
    description: "Choose one value from a short, known list.",
  },
  checkbox: {
    title: "Checkbox",
    description: "A hand-drawn check with a sculpted, gooey finish.",
  },
  "radio-group": {
    title: "Radio group",
    description: "A soft snap into a recessed well. One choice at a time.",
  },
  switch: {
    title: "Switch",
    description:
      "A bead that compresses, then fills its track. One material from off to on.",
  },
  slider: {
    title: "Slider",
    description:
      "Adjust a value within a range using a pointer or the keyboard.",
  },
  card: {
    title: "Card",
    description:
      "Give related content a comfortable boundary, with optional heading and actions.",
  },
  separator: {
    title: "Separator",
    description: "Create a quiet division between related sections.",
  },
  "visually-hidden": {
    title: "Visually hidden",
    description:
      "Provide an accessible name or explanation without adding visible clutter.",
  },
  prose: {
    title: "Prose",
    description:
      "Readable headings, lists, code and longer passages inside an interface.",
  },
  markdown: {
    title: "Markdown",
    description:
      "Render a repository document's Markdown source in Prose, with safe links, safe images and highlighted code.",
  },
  badge: {
    title: "Badge",
    description:
      "Add a small label for a category, status or piece of context.",
  },
  alert: {
    title: "Alert",
    description:
      "Bring an important message into the flow without opening a dialog.",
  },
  status: {
    title: "Status",
    description:
      "A bead that stretches, splits, and snaps back. Change its shape; it handles the motion.",
  },
  "scroll-to-bottom-blob": {
    title: "Scroll to bottom",
    description: "A small animated invitation to return to the latest content.",
  },
  "count-badge": {
    title: "Count badge",
    description: "Keep a count close to the thing it describes.",
  },
  eyebrow: {
    title: "Eyebrow",
    description:
      "A short line above a heading, written the way you would say it.",
  },
  progress: {
    title: "Progress",
    description: "Show how much of a known task is complete.",
  },
  loader: {
    title: "Loader",
    description:
      "Show that work is happening when a useful percentage is not available.",
  },
  skeleton: {
    title: "Skeleton",
    description: "Hold the shape of incoming content while it loads.",
  },
  stat: {
    title: "Stat",
    description: "Make a useful number and its context easy to scan.",
  },
  "quota-meter": {
    title: "Quota meter",
    description:
      "Show usage against a known allowance without hiding the actual values.",
  },
  "data-list": {
    title: "Data list",
    description: "Present a readable set of labels and values.",
  },
  tabs: {
    title: "Tabs",
    description:
      "Switch between related views while keeping their place in the interface.",
  },
  listbox: {
    title: "Listbox",
    description:
      "Keep choices visible with clear selection and keyboard movement.",
  },
  "dropdown-menu": {
    title: "Dropdown menu",
    description:
      "Keep secondary actions nearby, with checkable items and native keyboard behavior.",
  },
  tooltip: {
    title: "Tooltip",
    description:
      "Offer a brief hint on hover or focus. Keep essential instructions visible elsewhere.",
  },
} satisfies Record<string, Guide>;

const exampleGuide = {
  "foundations--themes": {
    title: "Color & themes",
    description:
      "The same pieces in Latte and Mocha. Semantic colors keep content, surfaces and actions consistent.",
  },
  "overlays--window-composition": {
    title: "Dialogs inside windows",
    description:
      "A dialog, form and menu sharing one window. Try opening, editing and returning to your workspace.",
  },
  "layouts--automatic-tiling": {
    title: "Window layouts",
    description:
      "Try tiling, resizing and floating real Maosaico panes. Their contents stay with the window.",
  },
  "layouts--dashboard-composition": {
    title: "Dashboard",
    description:
      "See cards, status and actions together in a compact workspace.",
  },
  "layouts--parakeet-composition": {
    title: "Conversation",
    description:
      "A conversation-shaped composition using the same controls and feedback pieces.",
  },
} satisfies Record<string, Guide>;

const componentGuides = new Map(Object.entries(componentGuide));
const exampleGuides = new Map(Object.entries(exampleGuide));

export const catalog = coverage.items.map((item) => {
  const guide = componentGuides.get(item.name);
  if (!guide)
    throw new Error(`Caps catalog needs an introduction for ${item.name}`);
  return { ...item, ...guide };
});

export function guideForStory(storyId: string): Guide | undefined {
  const component = coverage.items.find((item) => item.storyId === storyId);
  return component
    ? componentGuides.get(component.name)
    : exampleGuides.get(storyId);
}

export function componentStory(name: string): string {
  const item = coverage.items.find((entry) => entry.name === name);
  if (!item) throw new Error(`Caps catalog has no component named ${name}`);
  return item.storyId;
}
