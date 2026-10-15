/** Caps owns material geometry; spacing and rounding come from the theme. */
export default {
  rules: {
    "color-no-hex": true,
    "declaration-property-value-disallowed-list": [
      {
        "/^(margin|padding)(-.+)?$|^(row-|column-)?gap$/": [
          "/[0-9.]+(px|rem|em|vh|vw|%)/",
          "/var\\(--spacing\\)/",
        ],
        "/^(border(-.+)?-radius|--radius-.+)$/": ["/[0-9.]+(px|rem|em|%)/"],
      },
      {
        message:
          "Use a named spacing or radius token from Stipe. Literal material geometry belongs outside layout spacing and corner declarations.",
      },
    ],
  },
};
