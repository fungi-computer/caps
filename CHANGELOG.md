# @fungi.computer/caps

## 0.10.5

### Patch Changes

- Changes since 0.10.4:

  - fix(tourtois): compact phone chrome and desktop widgets
  - fix(tourtois): compact phone chrome and desktop widgets

## 0.10.4

### Patch Changes

- Changes since 0.10.3:

  - fix(caps): keep paired empty-state actions explicit
  - fix(ui): restore consistent first-use empty state panels

## 0.10.3

### Patch Changes

- Changes since 0.10.2:

  - fix(tourtois): pulse pending loaders with reduced motion

## 0.10.2

### Patch Changes

- Changes since 0.10.1:

  - fix(caps): keep phone window commands and controls together

## 0.10.1

### Patch Changes

- Changes since 0.10.0:

  - fix(caps): focus a form's first error when React renders it, not on a timer
  - fix(hosts): an App's toast shows as a Caps notice in Oyster, Tourtois and
    Hub (#351)

## 0.10.0

### Minor Changes

- Changes since 0.9.0:

  - feat(caps): let a setup notice panel show the app's own glyph

## 0.9.0

### Minor Changes

- Changes since 0.8.0:

  - feat(parakeet): connect-a-model panel up front, specific Retry name
  - fix(prints): make Retry the one real button
  - fix(caps): keep a 16px safe-area gutter around phone dialogs

## 0.8.0

### Minor Changes

- Changes since 0.7.1:

  - fix(caps): allow setup notice banner and inline placements in theme guard
  - feat(caps): add apps label prop to app bar and hint size for keycap
  - fix(caps): readable toast description and title-aligned icon
  - fix(caps): one toast close and error look, centred failure tile dot
  - feat(caps): let loading state drop its frame
  - fix(caps): warning setup notice, themed toast icons and font, confirm action
    variant
  - feat(caps): theme the toaster and polish setup notice
  - feat(caps): add setup notice and failure line blocks
  - fix(caps): permission grid group labels, busy ghost ink, loading state icon
  - fix(caps): make registry:check pass again
  - fix(caps): polish first-run kit states, quiet hairline, permission grid
    layout
  - fix(oyster): group App permissions by scope and lead with what needs
    approval
  - feat(caps): first-run kit part 1 for EmptyState, ResultState, LoadingState,
    Loader
  - feat(oyster): compose the App permissions page from Caps PermissionGrid

### Patch Changes

- Updated dependencies
  - @fungi.computer/stipe@0.1.1

## 0.7.1

### Patch Changes

- Changes since 0.7.0:

  - fix(workbench): repair the root browser proofs the nightly first ran

## 0.7.0

### Minor Changes

- Changes since 0.6.0:

  - feat(hub,caps): give the shared Print page the Prints viewer language
  - feat(caps,tourtois,hub): check keys for short multi-selects
  - fix(caps): keep 44px touch targets for switches, swatches and compact keys
  - feat(caps,tourtois): tight Sigil-labelled keys, connectors and avatar
    settings
  - feat(caps,grove,tourtois,hub): tight Sigil-labelled Computer and Agent forms
  - fix(caps): keep a held key when the pointer leaves the HoldButton

## 0.6.0

### Minor Changes

- Changes since 0.5.0:

  - feat(caps): add full-window dialog size

## 0.5.0

### Minor Changes

- Changes since 0.4.0:

  - feat(repository): scope docs-only gates
  - fix(caps): give menu labels the remaining row width
  - fix(caps): align menu checks in a right-edge column
  - fix(caps): render native checked menu indicators
  - fix(composer): align native keys, empty Send and usage readouts
  - fix(caps): preserve the documented Button key material
  - fix(caps): keep opt-in columns consistent and fixed controls bounded
  - fix(caps): keep workbench fixture type private
  - fix(caps): finish one-row column proof and sync API docs
  - feat(caps): add opt-in columns to schema forms
  - feat(composer): finish native row controls and responsive parity
  - fix(caps): centre the shared resize knob

## 0.4.0

### Minor Changes

- Changes since 0.3.1:

  - fix(caps): drop the lighter ring from filled keys
  - feat(caps): tone the keycap down to a calm step from today
  - feat(caps): give buttons today's keycap material and raise the keycap
  - feat(caps): one key material for Button and KeycapButton
  - feat(composer): one Caps composer surface for chat and Prints
  - fix(caps): status bar counts read as quiet numerals, not pills
  - fix(caps): drop the lighter ring from filled keys
  - feat(caps): tone the keycap down to a calm step from today
  - feat(caps): give buttons today's keycap material and raise the keycap
  - feat(caps): one key material for Button and KeycapButton

## 0.3.1

### Patch Changes

- Changes since 0.3.0:

  - fix(prints): count @character expansion against the prompt limit; align the
    mention list

## 0.3.0

### Minor Changes

- Changes since 0.2.0:

  - feat(site): say Get in on every call to action

## 0.2.0

### Minor Changes

- Changes since 0.1.0:

  - feat(stranger): typecheck each public entry in its own environment
  - fix: cover Computer and Oyster packed dependency closures
  - fix(caps): reserve phone header targets before wrapping
  - fix(caps): keep decorative bead overflow out of hit testing
  - feat(docs): consolidate package documentation under one site
  - fix(trellis): finish workflow header feedback
  - fix(trellis): offer header variant A with status beads and icon Run
  - fix(caps): keep window header statuses at title size
  - fix(caps): keep window crumbs at title size in the 32px header
  - perf(oyster): ship only the sans font on login
  - fix(caps): tween button width by rendered label in layout pixels
  - feat(oyster): public release 0.2.0

### Patch Changes

- Updated dependencies
  - @fungi.computer/stipe@0.1.0

## 0.1.0

### Minor Changes

- Changes since 0.0.2:

  - refactor(caps): one status bead, the gooey one, everywhere
  - fix(trellis): clear fallow's two unused exports
  - fix(trellis): mockup sizes, in-row actions and beat/try in the run views
  - fix(caps): scan compiled components when Caps and Parakeet install from npm
  - fix(caps): keep header status as beads on a phone and space it from commands
  - feat(agar): carry crumbs, header commands and status in the navigation
    contract
  - feat(caps): add crumbs, primary commands and overflow menu to window header
  - feat(oyster): public release 0.1.0

## 0.0.2

### Patch Changes

- Changes since 0.0.1:

  - fix(oyster): clear the post-move fallow findings

## 0.0.1

### Patch Changes

- Inaugural public release of @fungi.computer/caps.
- Updated dependencies
  - @fungi.computer/stipe@0.0.1
