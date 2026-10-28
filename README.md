# Split-View Reader: Zotero 10 Community Compatible Build
Forked from [Fuling Lin's Split-View Reader](https://github.com/zerolfl/zotero-split-view-reader). **This is an independently maintained community-modified release.** Original author, copyright and license notices can be found in [NOTICE.md](NOTICE.md) and [LICENSE](LICENSE).

## Features & Modifications
- View the same PDF or two separate PDFs side-by-side within a single tab.
- Independent scrolling by default: mouse wheel controls the pane under the cursor.
- Right-click inside the reader pane to set it as the master view for synchronized scrolling; select *Unset Master View* to revert to independent scrolling.
- Consolidated synchronization events, cleaned up listeners and pending animation frames to eliminate duplicate tasks.
- Pane activation follows mouse hover; consecutive scroll inputs do not trigger repeated plugin activation logic.

Full changelog and build instructions are documented in [ZOTERO10_COMPATIBILITY.md](ZOTERO10_COMPATIBILITY.md). The original upstream README is preserved as [UPSTREAM_README.md](UPSTREAM_README.md).

## Installation
1. Download the `.xpi` file from Releases in this repository.
2. Open Zotero → Tools → Add-ons → Gear icon → Install Add-on From File.
3. Select the XPI file, complete the prompt and restart Zotero.

This release uses manual updates. The add-on ID is kept identical to the upstream project. Installing it will replace the existing Split-View Reader; two builds sharing the same ID cannot coexist.

## Stuttering Continuous Scrolling on Windows
Local testing observed COM waits between Windows accessibility input services and legacy UIA bridge interfaces. If you encounter similar symptoms, navigate to Zotero Settings → Advanced → Config Editor and inspect `accessibility.uia.enable`. Setting this preference to integer **2** followed by a restart improved continuous scrolling in the validation environment.

A value of 2 enables native UI Automation for compatibility while retaining accessibility checks. This preference is **not written automatically by the add-on**. Users relying on screen readers or other assistive technology should verify compatibility separately.

Validation scope: Windows, Zotero 10.0.6 / Gecko 140.17.0. Tested with two PDFs over 90 round-trip native scroll sequences on one pane while the other remained static. Measured event loop intervals were approximately 123 ms / 57 ms. 11 Node regression checks and 11 in-Zotero checks passed. **These are local diagnostic results and do not constitute general performance or frame-rate guarantees.** macOS, Linux and other Zotero versions have not been validated.

## Build from Source
With Node.js, npm and Git installed, run the following in the project root:
```powershell
npm ci --ignore-scripts --no-audit --no-fund
node test/scroll-behavior.node.mjs
npm run build
```

The lockfile references development dependencies via GitHub SSH URLs. If you have not configured GitHub SSH, temporarily redirect Git URLs to HTTPS during dependency installation:
```powershell
$env:GIT_CONFIG_COUNT = '2'
$env:GIT_CONFIG_KEY_0 = 'url.[https://github.com/.insteadOf](https://github.com/.insteadOf)'
$env:GIT_CONFIG_VALUE_0 = 'ssh://git@github.com/'
$env:GIT_CONFIG_KEY_1 = 'url.[https://github.com/.insteadOf](https://github.com/.insteadOf)'
$env:GIT_CONFIG_VALUE_1 = 'git@github.com:'
npm ci --ignore-scripts --no-audit --no-fund
```

The compiled artifact is `.scaffold/build/split-view-reader.xpi`. Runtime PDF validation uses a separate Zotero profile and external test documents; preparation steps are noted in the changelog. Distributed source archives do not include test literature or personal Zotero configurations.

The initial release is published manually via GitHub Releases. Upstream workflow templates are located under `.github/upstream-workflows/`; review and adjust configurations before enabling them.

## Origin & License
- Original author: Fuling Lin
- Upstream repository: <[https://github.com/zerolfl/zotero-split-view-reader](https://github.com/zerolfl/zotero-split-view-reader)>
- Base version / commit: v1.3.0 / `600f1bd99d9a52a99683702f6681bf34b83bfec3`
- Maintainer of modified release: xiaoyang0103; modification dates: 2026-10-27, 2026-10-28
- License: **AGPL-3.0-or-later**. Original license text, copyright notices and disclaimers are retained. Corresponding source code is provided alongside distributed XPI builds.
