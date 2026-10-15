import type { StoryDefault } from "@ladle/react";
import { Display, Screen, Surface } from "../src/components/surface.js";
import { ScrollArea } from "../src/components/scroll-area.js";

export const Surfaces = () => (
  <div className="grid w-full max-w-[36rem] gap-lg p-lg">
    <h2 className="text-lg font-bold">Molded surfaces</h2>
    <Surface>
      <div className="p-lg bg-base-100 rounded-field">
        A recessed surface, with no built-in content padding or behavior.
      </div>
    </Surface>
    <ScrollArea surface className="h-64" aria-label="Surface scrolling example">
      <div className="grid gap-md p-md">
        {Array.from({ length: 20 }, (_, index) => (
          <p key={index}>Mounted item {index + 1}</p>
        ))}
      </div>
    </ScrollArea>
  </div>
);

export const SizesAndDepths = () => (
  <div className="grid w-full max-w-[60rem] gap-lg p-lg">
    <h2 className="text-lg font-bold">One casing, two depths</h2>
    <p>
      Size controls the rim—not the content dimensions. Depth is independent.
    </p>
    {(["shallow", "deep"] as const).map((depth) => (
      <section key={depth} className="grid gap-md">
        <h3 className="font-bold capitalize">{depth}</h3>
        <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Surface key={size} size={size} depth={depth}>
              <Screen>
                <div className="p-lg">
                  <p>{size.toUpperCase()}</p>
                  <p>/media</p>
                </div>
              </Screen>
            </Surface>
          ))}
        </div>
      </section>
    ))}
  </div>
);

export const ScreenMaterial = () => (
  <div className="grid w-full max-w-[48rem] gap-lg p-lg">
    <header className="grid gap-xs">
      <h2 className="text-lg font-bold">Theme-native display</h2>
      <p>
        The standard theme surface and content colors, with recessed edges and
        the theme's sans voice. Apply mono to machine values inside the screen;
        the screen itself does not change the content's typography.
      </p>
    </header>
    <Display size="lg">
      <div className="grid gap-lg p-lg">
        <dl className="grid gap-md">
          <div>
            <dt className="text-xs">COMPUTER</dt>
            <dd className="text-xl">Workbench</dd>
          </div>
          <div>
            <dt className="text-xs">DIRECTORY</dt>
            <dd>/media</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-lg text-sm">
          <span>READ · ALLOWED</span>
          <span>WRITE · ALLOWED</span>
        </div>
      </div>
    </Display>
    <Surface size="sm">
      <Screen>
        <div className="flex flex-wrap justify-between gap-sm p-sm text-sm">
          <span>Workbench</span>
          <span>/media</span>
        </div>
      </Screen>
    </Surface>
    <p className="text-sm">
      The same screen material also works without a casing:
    </p>
    <Screen>
      <div className="p-md">
        <span>0123456789 · Aa Bb Cc · </span>
        <code className="font-mono">/media/alpine-light.jpg</code>
      </div>
    </Screen>
  </div>
);

export const DisplayDensity = () => (
  <div className="grid w-full max-w-[48rem] gap-lg p-lg">
    <h2 className="text-lg font-bold">Display gasket density</h2>
    <div className="grid grid-cols-1 gap-lg sm:grid-cols-2">
      {(
        [
          ["normal", "Default"],
          ["compact", "Compact"],
        ] as const
      ).map(([density, label]) => (
        <section key={density} className="grid content-start gap-sm">
          <h3 className="font-bold">{label}</h3>
          <Display size="md" density={density}>
            <div className="grid min-h-24 content-center gap-xs p-md">
              <span className="text-xs">COMPUTER</span>
              <span className="text-lg">Workbench</span>
              <code className="font-mono text-sm">/media</code>
            </div>
          </Display>
        </section>
      ))}
    </div>
  </div>
);

export const Embedded = () => (
  <div className="grid w-full max-w-[48rem] gap-lg p-lg">
    <h2 className="text-lg font-bold">Recesses in an existing casing</h2>
    <p>
      Embedded placement removes only the exterior surround. The lip, recess and
      screen layers stay intact.
    </p>
    <div className="grid gap-lg rounded-box bg-base-200 p-lg">
      <Display size="sm" placement="embedded">
        <div className="p-sm text-sm">EMBEDDED · NO OUTER HALO</div>
      </Display>
      <Display size="sm">
        <div className="p-sm text-sm">STANDALONE · OUTER SURROUND</div>
      </Display>
    </div>
  </div>
);

export const ScrollingScreen = () => (
  <div className="w-full max-w-[48rem] p-lg">
    <ScrollArea
      surface
      screen
      surfaceSize="lg"
      surfaceDepth="deep"
      className="h-64"
      aria-label="Screen scrolling example"
    >
      <div className="grid gap-md p-md">
        {Array.from({ length: 20 }, (_, index) => (
          <p key={index}>Conversation {index + 1}</p>
        ))}
      </div>
    </ScrollArea>
  </div>
);

export default { title: "Surfaces / Surface" } satisfies StoryDefault;
