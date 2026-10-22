(() => {
  'use strict';
  const api = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
  if (!api?.storage || !globalThis.Stripper || globalThis.__stripperRunning) return;
  globalThis.__stripperRunning = true;
  const marker = 'data-stripper-hidden';
  let settings = Stripper.normalize(), ready = false, hidden = new Set(), timer = null;
  let engine = Stripper.engineFor(location.href);
  const style = document.createElement('style');
  style.textContent = `[${marker}="true"]{display:none!important}`;
  function scan() {
    timer = null;
    if (!ready) return;
    engine = Stripper.engineFor(location.href);
    const redirect = Stripper.redirectFor(location.href, settings);
    if (redirect) { location.replace(redirect); return; }
    if (!style.isConnected && document.documentElement) document.documentElement.append(style);
    const next = Stripper.collect(document, engine, settings, location.href);
    for (const element of hidden) if (!next.has(element)) element.removeAttribute(marker);
    for (const element of next) if (element.getAttribute(marker) !== 'true') element.setAttribute(marker, 'true');
    hidden = next;
  }
  function schedule() { if (timer === null) timer = setTimeout(scan, 80); }
  const observer = new MutationObserver(schedule);
  observer.observe(document, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'id', 'href', 'aria-label', 'role', 'data-testid', 'data-attrid', 'data-text-ad', 'data-pla', 'data-type', 'data-layout']});
  addEventListener('popstate', schedule);
  addEventListener('hashchange', schedule);
  // Same-document navigation need not mutate the DOM (pushState in an isolated world).
  let lastURL = location.href;
  setInterval(() => {if (lastURL !== location.href) { lastURL = location.href; schedule(); }}, 750);
  api.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) { settings = Stripper.normalize(changes.settings.newValue); ready = true; scan(); }
  });
  api.runtime.onMessage.addListener((message, _sender, respond) => {
    if (message?.type === 'stripper:status') {
      scan();
      respond({engine, enabled: settings.enabled && !!settings.engines[engine], hidden: [...hidden].filter(n => n.isConnected).length});
    }
  });
  api.storage.local.get('settings').then(result => { settings = Stripper.normalize(result.settings); ready = true; scan(); }).catch(() => {
    // Fail open if preferences cannot be read: do not unexpectedly redirect a user.
    ready = false;
  });
})();
