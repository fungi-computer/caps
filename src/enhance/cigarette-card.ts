/** Only the pressed-button card turns over; a preview card is a link. */
const CARD = "button.caps-cigarette-card";

/** Show one face of a server-rendered CigaretteCard. */
export function setCigaretteCardFlipped(
  card: HTMLElement,
  flipped: boolean,
): void {
  card.setAttribute("aria-pressed", String(flipped));
  card.dataset.flipped = String(flipped);
  card
    .querySelector(".caps-cigarette-card-front")
    ?.setAttribute("aria-hidden", String(flipped));
  card
    .querySelector(".caps-cigarette-card-back")
    ?.setAttribute("aria-hidden", String(!flipped));
}

function onClick(event: Event): void {
  // A hydrated CigaretteCard handles its own click and marks it prevented.
  if (event.defaultPrevented || !(event.target instanceof Element)) return;
  const card = event.target.closest<HTMLElement>(CARD);
  if (!card) return;
  setCigaretteCardFlipped(card, card.getAttribute("aria-pressed") !== "true");
}

/**
 * Flip server-rendered CigaretteCards on click, tap, Enter or Space. The card
 * is a native button, so the keyboard reaches it as a click; this only
 * toggles the pressed state. Returns a cleanup that removes the listener.
 */
export function enhanceCigaretteCards(
  root: Document | HTMLElement = document,
): () => void {
  root.addEventListener("click", onClick);
  return () => {
    root.removeEventListener("click", onClick);
  };
}
