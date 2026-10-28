# Zotero 10 local scrolling fix

This is a modified distribution of Split-View Reader by Fuling Lin, not an official upstream release.

- Original repository: https://github.com/zerolfl/zotero-split-view-reader
- Base release: v1.3.0
- Base commit: 600f1bd99d9a52a99683702f6681bf34b83bfec3
- Local version: 1.3.1-local.2
- Modification date: 2026-10-28
- License: AGPL-3.0-or-later; original authorship and LICENSE are preserved.
- Plugin ID is unchanged so this package updates an existing installation.
- Zotero compatibility declaration: 8.0.0 through 10.0.*; runtime loading checked on 10.0.6 only.

## Changes

- New split tabs scroll independently by default. Pointer entry activates a pane without enabling synchronization; the plugin registers no wheel activation listener.
- Legacy sessions migrate once to independent scrolling. Explicit primary-view choices made with this version persist across sessions.
- Manual synchronization remains available through the existing context menu.
- Synchronization coalesces scroll events with requestAnimationFrame, removes the extra 16 ms gate that could drop the final event, and writes the follower position with instant scrolling.
- Restarting or stopping synchronization removes the original listener and cancels its queued frame. Stale callbacks cannot act on a newly selected primary.
- Repeated click/focus/pointer-entry activation work is coalesced and tracked for cancellation on cleanup. Continuous wheel input queues no plugin activation or context-pane rendering tasks.
- Chinese and English preference descriptions explain the default and manual synchronization.

## Build and check

Use Node.js and npm with the supplied lockfile:

```text
npm ci --ignore-scripts --no-audit --no-fund
node test/scroll-behavior.node.mjs
npm run build
```

Some locked development dependencies use GitHub SSH URLs. If SSH access is unavailable, configure Git to rewrite GitHub SSH URLs to HTTPS before installing dependencies. Do not replace pinned dependencies with arbitrary newer versions.

The production XPI is `.scaffold/build/split-view-reader.xpi`. Its bundled JavaScript is rebuilt from this modified source; this is no longer the earlier manifest-only compatibility package. LICENSE and a modification notice are copied from `addon/` into the XPI.

## Windows UIA compatibility fix

Native sampling of the reproducible seconds-long stall on this Windows machine found MSCTF -> UIAutomationCore -> Oleacc -> COM waits, rather than a long plugin JavaScript scroll handler. Removing the wheel handler alone did not remove this stall.

The tested application-level setting is `accessibility.uia.enable = 2` on Zotero 10.0.6 / Gecko 140.17.0. This selects native UI Automation when compatible; it does not disable accessibility. The XPI does not silently change this global preference. For this user's machine, a separate, documented `user.js` startup preference was installed after validation; a Zotero restart is required. Other installations must configure this setting separately if affected. Screen-reader compatibility checks can retain the legacy path for incompatible clients.

Mozilla background: https://bugzilla.mozilla.org/show_bug.cgi?id=1394659 and https://bugzilla.mozilla.org/show_bug.cgi?id=1974928 . These explain related UIA bridge behavior and preference semantics, not a claim that this local stall is the identical upstream bug.

## Validation on 2026-10-28

- Node regression checks: 11/11 passed, including 200 consecutive wheel events queuing no plugin work. For the previous independent-scroll fix, 8 of the original 10 checks failed before modification.
- TypeScript compilation and production build: passed.
- ESLint for the changed TypeScript module and Prettier for the changed code: passed.
- Actual Zotero 10.0.6 tests: 11/11 passed (startup, nine title checks, one two-PDF runtime check).
- The runtime check used visible panes, native Gecko wheel input (90 events per pane, forward and backward), pointer movement between panes, and confirmed that the other pane stayed stationary. With native UIA mode 2, the largest measured event-loop gaps were approximately 123 ms (left) and 57 ms (right); none exceeded 200 ms. An earlier legacy-bridge run had a gap of approximately 2653 ms. This is a local diagnostic result, not a general performance ratio or measured UI frame rate.
- Large PDF rendering, graphics drivers, other plugins, and accessibility clients can still affect perceived smoothness.
- Tests used a separate profile/data directory and did not modify the user's production library.

The upstream test runner normally terminates Zotero by process name. For a development test run that must leave other Zotero instances alone, use the following PowerShell environment overrides before `npm test -- --no-watch`:

```powershell
$env:ZOTERO_PLUGIN_ZOTERO_BIN_PATH = 'D:\Zotero\zotero.exe' # adjust to your installation
$env:ZOTERO_PLUGIN_KILL_COMMAND = 'cmd /c exit 0'
$env:MOZ_NO_REMOTE = '1'
$env:ZOTERO_TEST_NATIVE_UIA = '1'
npm test -- --no-watch
```

The runner creates `.scaffold/test/profile` and `.scaffold/test/data`, then closes its own test process on completion. The optional PDF runtime test requires `fixture-a.pdf` and `fixture-b.pdf` in `.scaffold/zotero10-validation/fixtures/` (not distributed). Remove `.scaffold/scroll-runtime-go` before starting; activate the test window and then create that gate file. Minimized-window timings are rejected. Input coordinates are computed relative to the root widget, and pointer movement ends the previous wheel transaction before switching panes.

## Standalone public distribution (2026-10-28)

See NOTICE.md. Repository metadata points to the proposed independent repository; update_url is omitted for manual updates. Upstream workflow templates are retained under .github/upstream-workflows/. The public XPI is a metadata-only repack of the verified production XPI, with identical compiled JavaScript. No personal profile paths or local configuration-change records are included.
