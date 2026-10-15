import type { StoryDefault } from "@ladle/react";
import { Button } from "../src/components/button.js";
import { Monogram } from "../src/components/monogram.js";
import { StoreCard as CapsStoreCard } from "../src/components/store-card.js";
import { PriceTag as CapsPriceTag } from "../src/components/price-tag.js";

export {
  AsyncState,
  Card,
  CommandMenu,
  Composer,
  DataList,
  EmptyState,
  FaqChat,
  Mosaic,
  PricingCard,
  PricingCardSpec,
  ReleaseTag,
  ResourceSelect,
  ResultState,
  Rough,
  SectionCard,
  SpecSheet,
  TradingCard,
} from "./examples.js";

export { UploadQueue } from "./upload-queue.js";
export { PermissionGrid } from "./permission-grid.js";
export const PriceTag = () => <CapsPriceTag price={{ kind: "free" }} />;
export const StoreCard = () => (
  <div className="w-full max-w-(--container-md)">
    <CapsStoreCard
      title="Mosslight"
      tagline="A small world for a rainy afternoon."
      variant="cartridge"
      icon={
        <Monogram
          name="Mosslight"
          seed="mosslight"
          variant="specimen"
          subject="app"
        />
      }
      onSelect={() => {
        // Keep this visual specimen on screen when its opening control is pressed.
      }}
      badges={["New", "Agent-made"]}
      price={{ kind: "free" }}
      action={<Button size="sm">Play</Button>}
    />
  </div>
);

export default {
  title: "Blocks",
} satisfies StoryDefault;
