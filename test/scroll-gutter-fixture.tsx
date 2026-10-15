import { createRoot } from "react-dom/client";
import { ScrollArea } from "../src/components/scroll-area.js";

const options = new URLSearchParams(window.location.search);
const root = document.getElementById("root");
if (!root) throw new Error("Missing scroll fixture root");
createRoot(root).render(
  <ScrollArea
    surface={options.has("surface")}
    screen={options.has("screen")}
    aria-label="Responsive collection"
    style={{ height: "100%" }}
    className="gutter-fixture"
  >
    <div data-responsive-content>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index}>Tile {index + 1}</div>
      ))}
    </div>
  </ScrollArea>,
);
