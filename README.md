# Stripper

A local Manifest V3 browser extension that hides generative AI search features and recognized sponsored results. Designed for Chrome, Microsoft Edge, Brave and Firefox desktop.

## Install

1. Open `chrome://extensions` (Edge: `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and choose the `extension` folder in this project.
4. Pin Stripper, then reload existing search tabs.

Alternatively, extract `dist/stripper-1.0.0.zip` and load its extracted folder. Keep the folder in place after installation. No dependency installation or build is needed to use the extension. It is not published to an extension store.

## Microsoft Edge

The same `extension` folder and `dist/stripper-1.0.0.zip` support Microsoft Edge desktop on Windows and macOS; no separate build is required.

1. Extract the ZIP into a permanent folder, or use the existing `extension` folder.
2. In Edge, open `edge://extensions`.
3. Turn on **Developer mode** and choose **Load unpacked**.
4. Select the folder containing `manifest.json` (not the ZIP or the parent project folder).
5. Open Edge’s **Extensions** menu and show Stripper in the toolbar, then refresh existing search tabs.

AI and sponsored-result controls work on the same supported search pages, including Bing. Preferences are local to each browser, so Edge starts with its own settings. Edge’s browser sidebar, new-tab feed and built-in Copilot button are outside the extension’s search-page scope. A managed Edge installation may restrict unpacked extensions.

To update, replace the files in the same folder, click **Reload** for Stripper at `edge://extensions`, and refresh search tabs. This is an unpacked local release, not a Microsoft Edge Add-ons listing. Edge installation has not been verified locally because Edge is not installed here.

[Microsoft’s official sideloading instructions](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/extension-sideloading).

## Firefox (142 or newer)

1. Download/extract the source, or extract `dist/stripper-firefox-1.0.0.zip` after running `npm run build`.
2. Open `about:debugging#/runtime/this-firefox` in Firefox.
3. Click **Load Temporary Add-on** and select `manifest.json` inside the `extension` folder (or extracted Firefox ZIP).
4. Allow access to the supported search sites if Firefox requests it, then refresh your search tabs.
5. Open Stripper from Firefox’s Extensions menu. Preferences are separate from Chrome and Edge.

This development installation lasts until Firefox restarts. For permanent installation on standard Firefox, Mozilla must sign the add-on (listed or unlisted); the generated ZIP is unsigned and is not a permanently installable XPI. Signing and store publication are not part of this release. No security settings need to be disabled.

Both ZIPs contain the same runtime and manifest. Firefox uses the `browser` API namespace, a stable add-on ID, a minimum version of 142, and an explicit declaration that no data is collected/transmitted. Chromium browsers ignore the Firefox-specific manifest entry. Android Firefox is not included in the supported/tested browser list.

[Mozilla’s temporary installation guide](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/) · [Signing and distribution](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).

## Features

- Google: AI Overviews, AI Mode entry points, AI Mode-to-Web redirect, optional Web-only search.
- Bing: Copilot answer panels, AI Mode/Copilot shortcuts and chat/search redirects.
- DuckDuckGo: Search Assist answers, Duck.ai shortcuts and chat-to-web search redirects.
- Brave Search: recognized AI answer panels, Ask shortcuts and Ask-to-search redirects.
- Sponsored text listings and marked product-ad blocks on supported engines, with a separate **Hide sponsored results** switch (on by default).
- Global pause, individual engine switches and separate panel/shortcut controls.
- Immediate restoration of hidden elements when paused. MutationObserver handles late-loaded content; URL checks handle same-page navigation.
- Current-page hidden-element count. Preferences stay in local extension storage.

The extension filters engine-provided features, not websites based on whether their text might be AI-written. It does not identify all AI images, stop engine-side generation or disable AI ranking. Standalone chat services are not intercepted. Layouts and localizations change; there is no universal all-AI guarantee.

Google Web-only mode uses `udm=14`; explicit image/video/news and other vertical filters are preserved. It is off by default. Skipping AI pages is on by default. URL options may reload the current search. Pausing does not undo a completed URL redirect.

## Privacy and permissions

No external requests, analytics, accounts or remote code. `storage` persists preferences locally. `activeTab` lets the popup inspect and message the current tab when opened. Content scripts run only on the search domains listed in `extension/manifest.json`, and filter only supported search/home paths. Hidden counts and queries are not stored. Browser site-access prompts are expected.

## Development

```sh
npm ci
npm test
npm run lint:firefox
npm run build
npm run preview
```

Preview: http://127.0.0.1:4173. The preview is clearly labeled and uses a separate browser-API shim; that shim is excluded from the extension package. Its controls operate on a sample page and do not install the extension or change real extension preferences.

- `extension/core.js`: settings, exact host/path policy and query-preserving redirects.
- `extension/filter.js`: scoped selectors and semantic fallbacks. Protects result containers and ordinary result cards.
- `extension/content.js`: content-script lifecycle and reversible hiding.
- `extension/popup.*`: controls and current-page status.
- `extension/help.html`: installation, privacy and troubleshooting.
- `scripts/build.cjs`: manifest, raster icons and distributable ZIP.

To add a search layout, record the actual DOM boundary, add a narrow rule, and test that ordinary results remain visible. Do not remove a page ancestor based only on loose text matching. Rebuild and reload the unpacked extension after changes.

## Verification

See `artifacts/VERIFICATION.md` for measured results and coverage limits.

Reference documentation:
- [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [Chrome storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [Google AI Overviews and the Web filter](https://support.google.com/websearch/answer/14901683?hl=en-NG)
- [DuckDuckGo Search Assist](https://duckduckgo.com/duckduckgo-help-pages/results/ai-assisted-answers)
- [Brave Search AI features](https://search.brave.com/help/ai)

Sponsored filtering is cosmetic: it hides recognized paid placements, not every advertising request or promotions inside websites. Unlabeled ads and new layouts can slip through.
