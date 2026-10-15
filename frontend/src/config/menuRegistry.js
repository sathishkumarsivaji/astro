/**
 * Canonical navigation contract for the application.
 *
 * Components should use these identifiers instead of inventing local tab
 * names. Feature calculation status remains owned by featureRegistry.js.
 */

export const PRIMARY_MENU_IDS = Object.freeze([
  "home",
  "chart",
  "ask",
  "timeline",
  "relationships",
  "explore"
]);

export const TIMELINE_MENU_IDS = Object.freeze([
  "dasha",
  "gochar",
  "calendar",
  "journal"
]);

export const EXPLORE_MENU_IDS = Object.freeze([
  "rectification",
  "panchang",
  "recovery",
  "palm",
  "numerology",
  "names"
]);

export const MENU_REGISTRY = Object.freeze({
  home: Object.freeze({
    id: "home",
    parentId: null,
    labelKey: "menuHome",
    descriptionKey: "menuHomeDesc",
    kind: "primary"
  }),
  chart: Object.freeze({
    id: "chart",
    parentId: null,
    labelKey: "menuChart",
    descriptionKey: "menuChartDesc",
    kind: "primary"
  }),
  ask: Object.freeze({
    id: "ask",
    parentId: null,
    labelKey: "menuAsk",
    descriptionKey: "menuAskDesc",
    kind: "primary"
  }),
  timeline: Object.freeze({
    id: "timeline",
    parentId: null,
    labelKey: "menuTimeline",
    descriptionKey: "menuTimelineDesc",
    kind: "primary",
    defaultChildId: "dasha"
  }),
  relationships: Object.freeze({
    id: "relationships",
    parentId: null,
    labelKey: "menuRelationships",
    descriptionKey: "menuRelationshipsDesc",
    kind: "primary"
  }),
  explore: Object.freeze({
    id: "explore",
    parentId: null,
    labelKey: "menuExplore",
    descriptionKey: "menuExploreDesc",
    kind: "primary",
    defaultChildId: "panchang"
  }),
  dasha: Object.freeze({ id: "dasha", parentId: "timeline", labelKey: "menuDasha", kind: "timeline" }),
  gochar: Object.freeze({ id: "gochar", parentId: "timeline", labelKey: "menuGochar", kind: "timeline" }),
  calendar: Object.freeze({ id: "calendar", parentId: "timeline", labelKey: "menuCalendar", kind: "timeline" }),
  journal: Object.freeze({ id: "journal", parentId: "timeline", labelKey: "menuJournal", kind: "timeline" }),
  rectification: Object.freeze({ id: "rectification", parentId: "explore", labelKey: "menuRectification", kind: "explore" }),
  panchang: Object.freeze({ id: "panchang", parentId: "explore", labelKey: "menuPanchang", kind: "explore" }),
  recovery: Object.freeze({ id: "recovery", parentId: "explore", labelKey: "menuRecovery", kind: "explore" }),
  palm: Object.freeze({ id: "palm", parentId: "explore", labelKey: "menuPalm", kind: "explore" }),
  numerology: Object.freeze({ id: "numerology", parentId: "explore", labelKey: "menuNumerology", kind: "explore" }),
  names: Object.freeze({ id: "names", parentId: "explore", labelKey: "menuNames", kind: "explore" })
});

export const DEFAULT_NAVIGATION = Object.freeze({
  primaryMenu: "home",
  timelineMenu: "dasha",
  exploreMenu: "panchang"
});

export function isKnownMenuId(id) {
  return typeof id === "string" && Object.prototype.hasOwnProperty.call(MENU_REGISTRY, id);
}

export function normalizeNavigation(navigation = {}) {
  const primaryMenu = PRIMARY_MENU_IDS.includes(navigation.primaryMenu)
    ? navigation.primaryMenu
    : DEFAULT_NAVIGATION.primaryMenu;
  const timelineMenu = TIMELINE_MENU_IDS.includes(navigation.timelineMenu)
    ? navigation.timelineMenu
    : DEFAULT_NAVIGATION.timelineMenu;
  const exploreMenu = EXPLORE_MENU_IDS.includes(navigation.exploreMenu)
    ? navigation.exploreMenu
    : DEFAULT_NAVIGATION.exploreMenu;

  return { primaryMenu, timelineMenu, exploreMenu };
}

export function navigationFromUrl(urlLike) {
  if (!urlLike) return DEFAULT_NAVIGATION;
  const url = new URL(urlLike, "http://astroverse.local");
  return normalizeNavigation({
    primaryMenu: url.searchParams.get("menu"),
    timelineMenu: url.searchParams.get("timeline"),
    exploreMenu: url.searchParams.get("explore")
  });
}

export function navigationToUrl(navigation, currentUrl = "http://astroverse.local/") {
  const url = new URL(currentUrl, "http://astroverse.local");
  const normalized = normalizeNavigation(navigation);
  url.searchParams.set("menu", normalized.primaryMenu);
  url.searchParams.set("timeline", normalized.timelineMenu);
  url.searchParams.set("explore", normalized.exploreMenu);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function navigateToMenu(navigation, menuId) {
  if (PRIMARY_MENU_IDS.includes(menuId)) {
    return normalizeNavigation({ ...navigation, primaryMenu: menuId });
  }
  if (TIMELINE_MENU_IDS.includes(menuId)) {
    return normalizeNavigation({ ...navigation, primaryMenu: "timeline", timelineMenu: menuId });
  }
  if (EXPLORE_MENU_IDS.includes(menuId)) {
    return normalizeNavigation({ ...navigation, primaryMenu: "explore", exploreMenu: menuId });
  }
  return normalizeNavigation(navigation);
}
