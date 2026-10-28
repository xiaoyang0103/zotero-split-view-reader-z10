import { assert } from "chai";
import { SplitViewFactory } from "../src/modules/splitView";
import { config } from "../package.json";

// Optional real-reader check: place two public PDFs in the fixture directory.
// Activate the test window, then create .scaffold/scroll-runtime-go.
describe("PDF continuous-scroll runtime", function () {
  this.timeout(240000);
  it("scrolls both PDF panes repeatedly without a one-second event-loop stall", async function () {
    const profile = (Zotero as any).Profile.dir as string;
    assert.include(profile.replaceAll("\\", "/"), "/.scaffold/test/profile");
    const root = PathUtils.parent(PathUtils.parent(PathUtils.parent(profile)));
    const path = (...parts: string[]) =>
      PathUtils.join(root, ".scaffold", ...parts);
    const fixtures = path("zotero10-validation", "fixtures");
    if (!(await IOUtils.exists(PathUtils.join(fixtures, "fixture-a.pdf"))))
      this.skip();
    (globalThis as any).addon = (Zotero as any)[config.addonInstance];
    (globalThis as any).ztoolkit = (globalThis as any).addon.data.ztoolkit;
    const factory = SplitViewFactory as any;
    const win = Zotero.getMainWindow() as any;
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => win.setTimeout(resolve, ms));
    const items: Zotero.Item[] = [];
    let tabID: string | undefined;
    let timer: number | undefined;
    try {
      for (const name of ["fixture-a.pdf", "fixture-b.pdf"]) {
        items.push(
          await Zotero.Attachments.importFromFile({
            file: PathUtils.join(fixtures, name),
          }),
        );
      }
      const reader = await Zotero.Reader.open(items[0].id);
      await reader!._initPromise;
      tabID = reader!.tabID;
      await factory.convertToSplitView(reader, items[1]);
      const state = factory.stateMap.get(tabID);
      await sleep(2000);
      await IOUtils.writeJSON(path("scroll-runtime-ready.json"), {
        title: win.document.title,
        tabID,
      });
      const gate = path("scroll-runtime-go");
      for (let n = 0; !(await IOUtils.exists(gate)) && n < 720; n++)
        await sleep(250);
      assert.isTrue(
        await IOUtils.exists(gate),
        "activate the test window before creating the gate file",
      );
      assert.equal(
        win.document.visibilityState,
        "visible",
        "minimized-window timings are invalid",
      );
      assert.isFalse(
        state.eventListeners.some((entry: any) => entry.type === "wheel"),
      );
      const report: any = {
        version: "1.3.1-local.2",
        nativeUIAPreference: Services.prefs.getIntPref(
          "accessibility.uia.enable",
          -1,
        ),
        input: "Gecko windowUtils native wheel events",
        panes: [],
      };
      for (const side of ["left", "right"]) {
        const browser =
          side === "left" ? state.leftBrowser : state.rightBrowser;
        const other = factory.getViewerContainerFromBrowser(
          side === "left" ? state.rightBrowser : state.leftBrowser,
        );
        const internalReader = factory.getInternalReaderFromBrowser(browser);
        const iframe = internalReader._primaryView._iframeWindow;
        const viewer = factory.getViewerContainerFromBrowser(browser);
        assert.equal(iframe.document.visibilityState, "visible");
        const rect = viewer.getBoundingClientRect();
        assert.isAbove(rect.height, 100);
        // Native input is relative to the root widget, not the PDF iframe.
        const hostRect = browser.getBoundingClientRect();
        const frameRect =
          internalReader._primaryView._iframe.getBoundingClientRect();
        const inputX = hostRect.x + frameRect.x + rect.x + 100;
        const inputY = hostRect.y + frameRect.y + rect.y + 150;
        const utils = win.windowUtils;
        // Move the pointer and end the prior wheel transaction before changing
        // panes; Gecko otherwise keeps routing a continuous gesture to its old target.
        utils.sendMouseEvent("mousemove", inputX, inputY, 0, 0, 0);
        await sleep(1600);
        const gaps: number[] = [];
        let last = win.performance.now();
        timer = win.setInterval(() => {
          const now = win.performance.now();
          gaps.push(now - last);
          last = now;
        }, 16);
        const initialTop = viewer.scrollTop;
        const otherTop = other.scrollTop;
        let forwardTop = initialTop;
        for (const delta of [80, -80]) {
          for (let n = 0; n < 45; n++) {
            utils.sendWheelEvent(
              inputX,
              inputY,
              0,
              delta,
              0,
              0,
              0,
              0,
              Math.sign(delta),
              0,
            );
            await sleep(60);
          }
          await sleep(200);
          assert.closeTo(
            other.scrollTop,
            otherTop,
            1,
            "the other PDF must stay in place",
          );
          if (delta > 0) forwardTop = viewer.scrollTop;
        }
        win.clearInterval(timer);
        timer = undefined;
        const result = {
          side,
          visibility: iframe.document.visibilityState,
          wheelEvents: 90,
          initialTop,
          forwardTop,
          returnTop: viewer.scrollTop,
          maxHeartbeatGapMs: Math.max(...gaps),
          gapsOver200ms: gaps.filter((x) => x > 200).length,
        };
        report.panes.push(result);
        await IOUtils.writeJSON(path("scroll-runtime-results.json"), report);
        assert.equal(state.activeSide, side);
        assert.isAbove(
          forwardTop - initialTop,
          500,
          "native wheel input must actually scroll across pages",
        );
        assert.isBelow(
          viewer.scrollTop,
          forwardTop - 500,
          "reverse scrolling must work",
        );
        assert.isBelow(
          result.maxHeartbeatGapMs,
          1000,
          "event-loop stall during continuous scrolling",
        );
      }
      this.test!.title += ` ${JSON.stringify(report.panes.map((p: any) => ({ side: p.side, maxGapMs: p.maxHeartbeatGapMs })))}`;
    } finally {
      if (timer !== undefined) win.clearInterval(timer);
      if (tabID) {
        factory.cleanupTab(tabID);
        win.Zotero_Tabs.close(tabID);
      }
      for (const item of items) await item.eraseTx();
    }
  });
});
