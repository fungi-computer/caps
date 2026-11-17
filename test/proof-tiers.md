# Caps proof tiers

`test:nightly` serves graph-built stories on an owned loopback port and runs
these proofs serially. The server closes even when a proof fails. The
`build:workbench --prepared` path uses the existing prepared build after Turbo
builds workspace dependencies; tests never rebuild shared package outputs.

`a11y-tree.browser.mjs` runs Playwright's `a11y-tree.proof.mjs` serially in
nightly and through `test:a11y`. Its inline `toMatchAriaSnapshot` expectations
cover the open window menu, dialog, expanded combobox with selected/disabled
options, and error toast. Review snapshot changes as accessibility changes.

`proof:visual <story-id>` is an on-demand proof: `visual.browser.mjs` captures
the initial story at 1440×900/390×844 in light/dark, then `contrast.browser.mjs`
runs the existing theme sweep. PNGs are ignored local evidence, not committed
baselines. It rebuilds through the existing workbench builder first, then uses
the same server owner as nightly.

| Audited file                  | Disposition and reason                                                                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `screen-theme.browser.mjs`    | Nightly: validates Screen material colors for both standard themes and an inherited custom theme in the browser.                                                  |
| `scroll-area.browser.mjs`     | Nightly: validates native scrollbar activity/idle behavior with and without reduced motion.                                                                       |
| `display-density.browser.mjs` | Nightly: compares rendered default and compact Display gasket padding in Latte and Mocha.                                                                         |
| `resize-handle.browser.mjs`   | Nightly: checks the real DPR2 Latte/Mocha resize knob in both orientations, caller placement, keyboard/focus, captured-pointer drag and forced-colour visibility. |
| `dialog-fill.browser.mjs`     | Nightly: checks full-window dialog bounds, horizontal overflow, Escape and return focus at 1400 and 390 in Latte and Mocha.                                       |

`node --test scripts/style-size.test.mjs` runs with the Caps unit suite. Every
CSS file under `src/` must fit `style-size.json` (800 physical lines initially).
The checker compares the policy with its complete Git ancestry; the ceiling may
decrease but cannot increase, including across multiple commits or a policy file
deletion and reintroduction. There are no per-file exceptions. Turbo runs
`check:style-size` without caching before Caps lint and test tasks, so replaying
a cached result cannot bypass a lower ceiling in Git history.

Component CSS lives under `src/styles/`. The entry keeps the original layer
boundaries and import order. Declaration-level Prettier directives protect only
literal value whitespace which the pinned Tailwind compiler preserves in its
output. Before changing the import structure, build both sources with the same
workspace outputs and compare `dist/styles.css` with `cmp` and `sha256sum`. The
published Tailwind source includes these modules; registry generation expands
their parsed rules before applying the existing component scopes.
