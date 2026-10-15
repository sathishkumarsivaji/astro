import assert from "node:assert/strict";
import {
  DEFAULT_NAVIGATION,
  EXPLORE_MENU_IDS,
  MENU_REGISTRY,
  PRIMARY_MENU_IDS,
  TIMELINE_MENU_IDS,
  navigateToMenu,
  navigationFromUrl,
  navigationToUrl,
  normalizeNavigation
} from "./src/config/menuRegistry.js";

const allIds = [...PRIMARY_MENU_IDS, ...TIMELINE_MENU_IDS, ...EXPLORE_MENU_IDS];

assert.equal(new Set(allIds).size, allIds.length, "Menu IDs must be unique");
for (const id of allIds) {
  assert.ok(MENU_REGISTRY[id], `Missing registry entry for ${id}`);
  assert.equal(typeof MENU_REGISTRY[id].labelKey, "string", `${id} needs a label key`);
}

assert.deepEqual(normalizeNavigation({}), DEFAULT_NAVIGATION);
assert.deepEqual(
  navigateToMenu(DEFAULT_NAVIGATION, "journal"),
  { primaryMenu: "timeline", timelineMenu: "journal", exploreMenu: "panchang" }
);
assert.deepEqual(
  navigateToMenu(DEFAULT_NAVIGATION, "palm"),
  { primaryMenu: "explore", timelineMenu: "dasha", exploreMenu: "palm" }
);
assert.deepEqual(
  normalizeNavigation({ primaryMenu: "unknown", timelineMenu: "bad", exploreMenu: "bad" }),
  DEFAULT_NAVIGATION
);
assert.deepEqual(
  navigationFromUrl("https://astroverse.example/?menu=timeline&timeline=journal&explore=palm"),
  { primaryMenu: "timeline", timelineMenu: "journal", exploreMenu: "palm" }
);
assert.equal(
  navigationToUrl({ primaryMenu: "explore", timelineMenu: "gochar", exploreMenu: "numerology" }, "/app?view=legacy#tools"),
  "/app?view=legacy&menu=explore&timeline=gochar&explore=numerology#tools"
);

console.log(`Menu registry contract passed (${allIds.length} menu entries).`);
