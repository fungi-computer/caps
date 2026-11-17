import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkStyleSizes,
  limitViolations,
  sizeViolations,
} from "./style-size.mjs";

test("the CSS ceiling accepts shrinkage and rejects an increase", () => {
  assert.deepEqual(limitViolations(800, []), []);
  assert.deepEqual(limitViolations(700, [800]), []);
  assert.deepEqual(limitViolations(800, [800]), []);
  assert.deepEqual(limitViolations(801, [800]), [
    "CSS line ceiling increased from 800 to 801",
  ]);
});

test("later commits cannot erase an earlier reduction of the ceiling", () => {
  assert.deepEqual(limitViolations(750, [800, 700, 750, 750]), [
    "CSS line ceiling increased from 700 to 750",
  ]);
});

test("each stylesheet must fit the ceiling, including a new file", () => {
  assert.deepEqual(sizeViolations({ "src/styles/new.css": "" }, 1), []);
  assert.deepEqual(sizeViolations({ "src/styles/new.css": "a\nb\n" }, 2), []);
  assert.deepEqual(sizeViolations({ "src/styles/new.css": "a\nb" }, 2), []);
  assert.deepEqual(sizeViolations({ "src/styles/new.css": "a\nb\nc\n" }, 2), [
    "src/styles/new.css: 3 lines exceeds 2",
  ]);
});

test("Caps styles and the current policy obey the shrink-only ceiling", () => {
  assert.deepEqual(checkStyleSizes(), []);
});
