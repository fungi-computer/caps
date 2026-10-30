# Caps proof tiers

`test:nightly` serves graph-built stories on an owned loopback port and runs
these proofs serially. The server closes even when a proof fails. The
`build:workbench --prepared` path uses the existing prepared build after Turbo
builds workspace dependencies; tests never rebuild shared package outputs.

| Audited file                  | Disposition and reason                                                                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `screen-theme.browser.mjs`    | Nightly: validates Screen material colors for both standard themes and an inherited custom theme in the browser.                                                  |
| `scroll-area.browser.mjs`     | Nightly: validates native scrollbar activity/idle behavior with and without reduced motion.                                                                       |
| `display-density.browser.mjs` | Nightly: compares rendered default and compact Display gasket padding in Latte and Mocha.                                                                         |
| `resize-handle.browser.mjs`   | Nightly: checks the real DPR2 Latte/Mocha resize knob in both orientations, caller placement, keyboard/focus, captured-pointer drag and forced-colour visibility. |
