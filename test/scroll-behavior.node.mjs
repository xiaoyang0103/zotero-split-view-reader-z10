import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { build } from "esbuild";

const output = resolve(".scaffold/scroll-tests/splitView.mjs");
await build({
  entryPoints: ["src/modules/splitView.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: output,
  logLevel: "silent",
});
const { SplitViewFactory: factory } = await import(pathToFileURL(output).href);

class Viewer extends EventTarget {
  scrollTop = 0;
  scrollLeft = 0;
  writes = [];
  listeners = new Set();
  addEventListener(type, callback, options) {
    if (type === "scroll") this.listeners.add(callback);
    super.addEventListener(type, callback, options);
  }
  removeEventListener(type, callback, options) {
    if (type === "scroll") this.listeners.delete(callback);
    super.removeEventListener(type, callback, options);
  }
  scrollTo(first, top) {
    const options = typeof first === "number" ? { left: first, top } : first;
    this.scrollTop = options.top;
    this.scrollLeft = options.left;
    this.writes.push(options);
  }
  scroll(top) {
    this.scrollTop = top;
    this.dispatchEvent(new Event("scroll"));
  }
}

let win;
let state;
let saved;
const replacements = new Map();
const originalNow = Date.now;
function replace(name, value) {
  if (!replacements.has(name)) replacements.set(name, factory[name]);
  factory[name] = value;
}
function flush(queue) {
  const pending = [...queue.values()];
  queue.clear();
  pending.forEach((callback) => callback());
}
function makeState(primarySide = factory.getDefaultPrimarySide()) {
  const left = new Viewer();
  const right = new Viewer();
  const leftBrowser = Object.assign(new EventTarget(), { viewer: left });
  const rightBrowser = Object.assign(new EventTarget(), { viewer: right });
  return {
    primarySide,
    activeSide: "left",
    isCleaningUp: false,
    leftBrowser,
    rightBrowser,
    leftViewerContainer: left,
    rightViewerContainer: right,
    leftParentItemID: 1,
    rightParentItemID: 1,
    leftItemID: 1,
    rightItemID: 2,
    lastPrimaryScroll: { top: 0, left: 0 },
    syncPaused: false,
    ctrlPressed: false,
    zoomingCount: 0,
    scrollHandler: null,
    scrollHandlerContainer: null,
    scrollSyncFrame: null,
    eventListeners: [],
    timeoutIds: [],
  };
}

beforeEach(() => {
  let id = 0;
  win = {
    frames: new Map(),
    timers: new Map(),
    requestAnimationFrame(callback) {
      this.frames.set(++id, callback);
      return id;
    },
    cancelAnimationFrame(id) {
      this.frames.delete(id);
    },
    setTimeout(callback) {
      this.timers.set(++id, callback);
      return id;
    },
    Zotero_Tabs: {
      _getTab: () => ({ tab: { data: saved } }),
      setTabData: (_id, data) => Object.assign(saved, data),
    },
  };
  saved = {};
  globalThis.Zotero = {
    getMainWindow: () => win,
    debug() {},
    Prefs: { get: () => true },
    Items: { exists: () => true, get: (id) => ({ id }) },
    Reader: { getByTabID: () => ({ _initPromise: Promise.resolve() }) },
  };
  replace("getViewerContainerFromBrowser", (browser) => browser.viewer);
  replace("updateScrollbarColors", () => {});
  factory.stateMap.clear();
  state = makeState();
  factory.stateMap.set("tab", state);
});

afterEach(() => {
  factory.stopSyncPolling("tab");
  factory.stateMap.clear();
  for (const [name, value] of replacements) factory[name] = value;
  replacements.clear();
  Date.now = originalNow;
  delete globalThis.Zotero;
});

test("new split views scroll independently without a default primary", () => {
  assert.equal(state.primarySide, null);
  factory.startSyncPolling("tab");
  state.leftViewerContainer.scroll(200);
  flush(win.frames);
  assert.equal(state.rightViewerContainer.scrollTop, 0);
  assert.equal(state.leftViewerContainer.listeners.size, 0);
});

test("restarting synchronization does not leave duplicate listeners", () => {
  state.primarySide = "left";
  factory.startSyncPolling("tab");
  factory.startSyncPolling("tab");
  assert.equal(state.leftViewerContainer.listeners.size, 1);
});

test("many scroll events coalesce into one update using the final position", () => {
  state.primarySide = "left";
  factory.startSyncPolling("tab");
  for (let top = 1; top <= 100; top++) state.leftViewerContainer.scroll(top);
  assert.equal(win.frames.size, 1);
  flush(win.frames);
  assert.equal(state.rightViewerContainer.scrollTop, 100);
  assert.equal(state.rightViewerContainer.writes.length, 1);
  assert.equal(state.rightViewerContainer.writes[0].behavior, "instant");
});

test("a later animation frame keeps the final scroll event within 16 ms", () => {
  let now = 1000;
  Date.now = () => now;
  state.primarySide = "left";
  factory.startSyncPolling("tab");
  state.leftViewerContainer.scroll(20);
  flush(win.frames);
  now++;
  state.leftViewerContainer.scroll(40);
  flush(win.frames);
  assert.equal(state.rightViewerContainer.scrollTop, 40);
});

test("stopping synchronization cancels an already queued animation frame", () => {
  state.primarySide = "left";
  factory.startSyncPolling("tab");
  state.leftViewerContainer.scroll(30);
  const queued = [...win.frames.values()][0];
  factory.stopSyncPolling("tab");
  assert.equal(win.frames.size, 0);
  queued();
  assert.equal(state.rightViewerContainer.scrollTop, 0);
});

test("a stale frame cannot interfere with the newly selected primary", () => {
  state.primarySide = "left";
  factory.startSyncPolling("tab");
  state.leftViewerContainer.scroll(20);
  const stale = [...win.frames.values()][0];
  factory.stopSyncPolling("tab");
  state.primarySide = "right";
  factory.initSyncState("tab");
  factory.startSyncPolling("tab");
  state.rightViewerContainer.scroll(50);
  stale();
  assert.equal(state.leftViewerContainer.scrollTop, 20);
  assert.equal(win.frames.size, 1);
  flush(win.frames);
  assert.equal(state.leftViewerContainer.scrollTop, 70);
});

test("pointer entry activates the hovered pane without enabling synchronization", () => {
  factory.setupBrowserFocusListeners("tab", state.rightBrowser, "right", win);
  state.rightViewerContainer.dispatchEvent(new Event("pointerenter"));
  flush(win.timers);
  assert.equal(state.activeSide, "right");
  assert.equal(state.primarySide, null);
  assert.equal(win.frames.size, 0);
});

test("continuous wheel input queues no plugin activation or rendering work", () => {
  factory.setupBrowserFocusListeners("tab", state.rightBrowser, "right", win);
  assert.equal(
    state.eventListeners.some((entry) => entry.type === "wheel"),
    false,
  );
  for (let n = 0; n < 200; n++) {
    const wheel = new Event("wheel", { cancelable: true });
    state.rightViewerContainer.dispatchEvent(wheel);
    assert.equal(wheel.defaultPrevented, false);
  }
  assert.equal(win.timers.size, 0);
  assert.equal(win.frames.size, 0);
});

for (const [mode, side, expected] of [
  [undefined, "left", null],
  ["manual", "right", "right"],
  ["manual", null, null],
]) {
  test(`session restore: mode=${mode}, primary=${side}`, async () => {
    factory.stateMap.clear();
    Object.assign(saved, {
      leftItemID: 1,
      rightItemID: 2,
      primarySide: side,
      scrollSyncMode: mode,
      activeSide: "right",
    });
    replace("convertToSplitView", async () => {
      state = makeState();
      factory.stateMap.set("tab", state);
      factory.updateTabDataForSession("tab");
    });
    await factory.restoreSplitViewFromSession("tab", saved);
    assert.equal(state.primarySide, expected);
    assert.equal(state.activeSide, "right");
    assert.equal(saved.scrollSyncMode, "manual");
  });
}
