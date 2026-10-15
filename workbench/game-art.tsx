/**
 * Tiny pixel sprites for the game-piece stories. Each sprite is rows of
 * palette letters; colors come from Stipe tokens through game-pieces.css, so
 * the sprites follow Latte and Mocha like the pieces around them.
 *
 * Palette: k ink · w wood · W dark wood · l leaf · L dark leaf · m metal ·
 * M dark metal · b bread · B crust · s skin · S shade · a water · r red ·
 * p purple · P dark purple · c cream · o current color line · . clear
 */
import "./game-pieces.css";

const PALETTE = new Map([
  ["k", "ink"],
  ["w", "wood"],
  ["W", "wood-dark"],
  ["l", "leaf"],
  ["L", "leaf-dark"],
  ["m", "metal"],
  ["M", "metal-dark"],
  ["b", "bread"],
  ["B", "crust"],
  ["s", "skin"],
  ["S", "skin-dark"],
  ["a", "water"],
  ["r", "red"],
  ["p", "purple"],
  ["P", "purple-dark"],
  ["c", "cream"],
  ["o", "line"],
]);

function PixelArt({
  rows,
  label,
}: {
  rows: readonly string[];
  label?: string;
}) {
  const width = Math.max(...rows.map((row) => row.length));
  const pixels = rows.flatMap((row, y) =>
    Array.from({ length: row.length }, (_, x) => {
      const tone = PALETTE.get(row.charAt(x));
      return tone ? [{ x, y, tone }] : [];
    }).flat(),
  );
  return (
    <svg
      className="caps-workbench-pixel-art"
      viewBox={`0 0 ${String(width)} ${String(rows.length)}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {pixels.map(({ x, y, tone }) => (
        <rect
          key={`${String(x)}-${String(y)}`}
          x={x}
          y={y}
          width={1}
          height={1}
          className={`caps-workbench-px-${tone}`}
        />
      ))}
    </svg>
  );
}

const sprite = (rows: readonly string[]) =>
  function Sprite({ label }: { label?: string }) {
    return <PixelArt rows={rows} {...(label === undefined ? {} : { label })} />;
  };

export const Axe = sprite([
  "..kkkk..",
  ".kmmmMk.",
  "kmmmMkk.",
  "kmmMk.k.",
  ".kkWwk..",
  "...kwk..",
  "...kwk..",
  "...kwk..",
  "...kwk..",
  "...kwk..",
  "...kwk..",
  "...kWk..",
  "...kwk..",
  "...kwk..",
  "...kWk..",
  "....k...",
]);

export const Log = sprite([
  "..kkkkkk..",
  ".kwwWwwWk.",
  "kwWcccWwWk",
  "kwcWbWcwWk",
  "kwcbWbcwWk",
  "kwWcccWwWk",
  "kWwwWwwWWk",
  "kwWwwWwWwk",
  "kWwWwwWwWk",
  "kwwWwwWwWk",
  "kWwwWwWwWk",
  "kwWwwWwWwk",
  "kWwWwwWwWk",
  "kwwWwwWwWk",
  "kWwwWwWwWk",
  "kwWwwWwWwk",
  ".kWwWwWWk.",
  "..kkkkkk..",
]);

export const Bucket = sprite([
  "...kkkkkkk....",
  "..k.......k...",
  ".k.........k..",
  "kkkkkkkkkkkkk.",
  "kmaaaaaaaaaMk.",
  "kmaaaaaaaaaMk.",
  ".kmmmmmmmmMk..",
  ".kMmmmmmmmMk..",
  ".kmmmmmmmmMk..",
  ".kMMMMMMMMMk..",
  ".kmmmmmmmmMk..",
  "..kmmmmmmMk...",
  "..kkkkkkkkk...",
]);

export const Bread = sprite([
  "...kkkkk..",
  ".kkbbbbbkk",
  "kbbcbbcbBk",
  "kbbbcbbbBk",
  "kBbbbbbBBk",
  ".kBBBBBBk.",
  "..kkkkkk..",
]);

export const Sapling = sprite([
  "...kk.kk..",
  "..klLklLk.",
  "..kllklLk.",
  "...kkwkk..",
  "....kwk...",
  "..kkkwkkk.",
  ".kWWWWWWWk",
  ".kwwwwwwwk",
  "..kkkkkkk.",
]);

export const Shell = sprite([
  "..kkkk..",
  ".kccBck.",
  "kcBccBck",
  "kcBccBck",
  "kcBccBck",
  ".kcBcck.",
  "..kkkk..",
]);

export const Cobble = sprite([
  "..kkkkk..",
  ".kmmmmMk.",
  "kmMmmmMMk",
  "kmmMmmmMk",
  "kMmmmMmMk",
  ".kMMMMMk.",
  "..kkkkk..",
]);

export const MossArm = sprite([
  "..kkk.",
  ".kslSk",
  ".kslSk",
  ".kssSk",
  ".kSlSk",
  "..kSk.",
  "..ksk.",
  ".kslSk",
  ".kssSk",
  "kslSSk",
  "ksSSk.",
  ".kkk..",
]);

export const Hat = sprite([
  "....kk....",
  "...kbBk...",
  "..kbbbBk..",
  "..kbbbBk..",
  "..krrrrk..",
  "kkbbbbbBkk",
  "kbbbbbbbBk",
  ".kkkkkkkk.",
]);

export const Rowan = sprite([
  "...kkkkk...",
  "..kWWWWWk..",
  ".kWWWWWWWk.",
  ".kWsssssWk.",
  ".kskskskSk.",
  ".kssssssSk.",
  "..kSsssSk..",
  ".kkllllLkk.",
  "kllllllllLk",
  "kslllllllsk",
  "kkLLLLLLLkk",
]);

export const Sedge = sprite([
  ".....kk....",
  "....kpk....",
  "...kppk....",
  "..kpppPk...",
  "kkkkkkkkkkk",
  ".kSlllllSk.",
  ".klkllklLk.",
  ".kllllllLk.",
  "..kLllLLk..",
  ".kprrrrrpk.",
  "kprrrrrrrpk",
  "kkkkkkkkkkk",
]);

export const Bramble = sprite([
  "k.......k..",
  "kk.....kk..",
  "kckkkkkck..",
  "kcccccccck.",
  "kckcccckck.",
  "kcccrrccck.",
  ".kcccccck..",
  "..kccccck.k",
  ".kcccccccck",
  ".kcckcckck.",
  ".kkkkkkkk..",
]);

export const HeadOutline = sprite([
  "...oooo...",
  "..o....o..",
  ".o......o.",
  ".o.o..o.o.",
  ".o......o.",
  "..o.oo.o..",
  "...oooo...",
]);

export const ShirtOutline = sprite([
  ".oo....oo.",
  "o..oooo..o",
  "o........o",
  ".oo....oo.",
  "..o....o..",
  "..o....o..",
  "..oooooo..",
]);
