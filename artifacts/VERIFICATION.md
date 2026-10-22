# Verification — 22 October 2026

## Automated checks

`npm test`: 28 tests, 28 passed, 0 failures, 0 skips.

Coverage: exact host/path allowlist; corrupt preferences; query-preserving, non-looping AI redirects; opt-in Google Web filter and image/news/video preservation; per-engine and global pause; current/legacy panel shapes; ordinary results about AI retained; late insertion; removal/reclassification; restoration; persisted startup pause; popup save/load; rapid preference changes; save failures; manifest files, permissions and absence of runtime network/eval calls.

## Live search-page checks

The exact core/filter/content source was executed in an isolated context on live search pages through the browser's supported debugging capability. Browser storage and message APIs were replaced by a test bridge. These are live DOM filtering checks, **not installed-extension acceptance**.

Query: `why is the sky blue`.

| Engine | Targeted AI content before → after | Ordinary results before → after | Restoration |
| --- | --- | --- | --- |
| Google | AI Overview 1 → 0; AI Mode links hidden | 7 → 7 result headings | Overview restored; 0 Stripper markers |
| Bing | 3 → 0 (answer, composer, AI navigation) | 5 → 5 result cards | 3 AI elements restored; 0 markers |
| DuckDuckGo | Search Assist panel 1 → 0; shortcuts also hidden | 8 → 8 result cards | Panel restored; 0 markers |
| Brave | 2 → 0 Ask shortcuts | 20 → 20 result-content cards | Both shortcuts restored; 0 markers |

Brave did not show an AI answer panel during this check. Its panel rules have fixture coverage only. Engine experiments, other queries and regional/language variants are not exhaustive. Screenshots are in this directory. All temporary live-page modifications were removed by reloading the tabs.

## Popup preview

Browser controls verified: global pause/resume, per-engine Google pause/resume, detailed options and late-loading sample panel. Initial sample: 2 AI elements → 0 with 3 ordinary results unchanged. A late panel remained hidden; disabling Google restored all 3 AI elements while preserving all 3 ordinary results. Popup preferences persisted on reload. Sample API shim is excluded from the release.

## Installed Chrome acceptance

Installed with the user's approval in Chrome, extension ID `honpbmccnabihimnidlflmememnppfko`. Manifest registration, enabled state, real popup-to-content messaging and local preference persistence verified. Pausing restored Google AI Overview and AI Mode while seven ordinary sources stayed available. An AI Mode URL (`q=why+is+the+sky+blue&udm=50`) redirected to the same query with `udm=14`; Web results appeared. Final popup filtering and all engines are enabled. The user's Web-only preference is enabled.

Popup width fixed at 480 CSS pixels on both root and body. Removed the small-screen percentage rule that let Chrome shrink it to approximately 200 pixels. Verified the actual toolbar popup and expanded settings without horizontal clipping. Screenshot: `chrome-popup-wide.png`.

## Sponsored-result filtering

Added independent `hideSponsored` preference, on by default, with migration from existing settings. Uses specific paid-placement markers rather than keyword matching in result titles. Full-page and mixed organic-result containers are protected. Empty ad placeholders do not count as hidden ads. Late additions, attribute changes, disabling, re-enabling, and independent preference persistence are covered by automated tests.

Live Google query: `buy running shoes`. Exact final source in an isolated live-page context, using a test storage bridge: one sponsored product block visible → zero; all 11 headings in the regular-results area remained visible. Disabling only sponsored filtering restored the block, with all 11 headings still visible and zero hiding markers. Temporary injection removed by reloading. Screenshot: `google-sponsored-hidden.png`.

Bing, DuckDuckGo and Brave returned no paid placements for this query. Their sponsored selectors have fixture coverage, not live ad-removal proof. Google text-ad selectors also have fixture coverage; the live paid placement was a product carousel. These rules do not guarantee every regional or experimental ad layout.

The updated extension was reloaded in Chrome. Its real popup exposes **Hide sponsored results**, enabled, alongside the existing AI controls; screenshot: `chrome-sponsored-toggle.png`. The measured sponsored removal/restoration above used the isolated live-page test, not Chrome's installed content script. No new permissions or external requests were added. No store publication was performed. Edge and Brave browser installation were not tested.

## Microsoft Edge compatibility

The existing Manifest V3 package uses Edge-supported extension APIs: storage.local, storage.onChanged, tabs.query/sendMessage, runtime.onMessage, content scripts and an action popup. No browser-specific runtime change or extra permissions were required. Added dedicated Windows/macOS Edge sideloading and update instructions to README and bundled help, checked against Microsoft’s documentation. Edge was absent from both /Applications and the user Applications folder, so installed Edge acceptance remains unverified; Chrome acceptance does not substitute for it.

## Firefox package validation

Added a stable Gecko add-on ID, a Firefox 142 minimum, and a no-data-collection declaration. Shared source supports the Firefox browser namespace. Three additional automated checks verify Firefox manifest metadata, popup storage/messaging, and content-script pause/restoration through browser-only APIs. `npm test`: 28 passed, 0 failures, 0 skips. Mozilla addons-linter 10.14.0: 0 errors, 0 warnings, 0 notices. Both generated ZIPs passed integrity checks. Dependency audit: 0 known vulnerabilities.

Firefox 147.0.1 is present locally. Temporary installation was authorized, but native browser controls timed out while reading its startup window. Installed Firefox acceptance is pending; package validation and browser-API tests do not substitute for installed-browser proof. The ZIP is unsigned and temporary loading ends on restart; permanent standard-Firefox installation requires Mozilla signing.
