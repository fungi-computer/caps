import { GameShareCard } from "../src/blocks/game-share-card.js";

export default { title: "Game share" };

export const PublishedGame = () => (
  <GameShareCard
    heading="Mushroom trail"
    eyebrow="A game by the Forest Team"
    action={<a href="#play">Play Mushroom trail</a>}
  >
    <p>Follow the trail, gather mushrooms and share your best score.</p>
  </GameShareCard>
);
