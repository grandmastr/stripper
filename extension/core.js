/* Shared configuration and URL policy. No network requests or telemetry. */
(() => {
  'use strict';
  const googleDomains = ['com', 'co.uk', 'com.ng', 'co.za', 'com.au', 'co.nz', 'ca', 'ie', 'de', 'fr', 'es', 'it', 'nl', 'pt', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi', 'pl', 'co.in', 'co.jp', 'co.kr', 'com.br', 'com.mx', 'com.sg', 'com.hk', 'co.id', 'com.tr', 'ae'];
  const engines = {
    google: {name: 'Google', description: 'AI Overviews & AI Mode'},
    bing: {name: 'Bing', description: 'Copilot answers & shortcuts'},
    duckduckgo: {name: 'DuckDuckGo', description: 'Search Assist & Duck.ai shortcuts'},
    brave: {name: 'Brave Search', description: 'AI answers & Ask Brave shortcuts'}
  };
  const defaults = {enabled: true, hidePanels: true, hideSponsored: true, hideShortcuts: true, redirectAI: true, googleWeb: false, engines: Object.fromEntries(Object.keys(engines).map(k => [k, true]))};
  function normalize(raw = {}) {
    if (!raw || typeof raw !== 'object') raw = {};
    const result = {...defaults, engines: {...defaults.engines}};
    for (const key of Object.keys(defaults).filter(k => k !== 'engines')) if (typeof raw[key] === 'boolean') result[key] = raw[key];
    for (const key of Object.keys(engines)) if (typeof raw.engines?.[key] === 'boolean') result.engines[key] = raw.engines[key];
    return result;
  }
  function engineFor(input) {
    let url;
    try { url = new URL(input); } catch { return null; }
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const host = url.hostname.replace(/^www\./, '');
    if (googleDomains.some(tld => host === `google.${tld}`) && /^\/(search|webhp|aimode)?\/?$/.test(url.pathname)) return 'google';
    if (host === 'bing.com' && /^\/(search|chat|copilotsearch)?\/?$/.test(url.pathname)) return 'bing';
    if (host === 'duckduckgo.com' && /^\/(html|lite)?\/?$/.test(url.pathname)) return 'duckduckgo';
    if (['search.brave.com', 'safe.search.brave.com'].includes(host) && /^\/(search|ask)?\/?$/.test(url.pathname)) return 'brave';
    return null;
  }
  function redirectFor(input, raw) {
    const settings = normalize(raw), engine = engineFor(input);
    if (!engine || !settings.enabled || !settings.engines[engine]) return null;
    const url = new URL(input), p = url.searchParams;
    const aiGoogle = url.pathname.startsWith('/aimode') || p.get('udm') === '50';
    if (engine === 'google') {
      if (settings.redirectAI && aiGoogle) {
        url.pathname = p.get('q') ? '/search' : '/';
        for (const key of ['udm', 'tbm', 'aep', 'ae', 'aem', 'atvm', 'sourceid', 'ved', 'sei', 'mstk']) p.delete(key);
        if (p.get('q')) p.set('udm', '14');
      } else if (settings.googleWeb && url.pathname === '/search' && p.get('q') && !p.get('tbm') && (!p.get('udm') || p.get('udm') === '0')) p.set('udm', '14');
    } else if (settings.redirectAI) {
      if (engine === 'bing' && ['/chat', '/copilotsearch', '/chat/', '/copilotsearch/'].includes(url.pathname)) url.pathname = p.get('q') ? '/search' : '/';
      if (engine === 'duckduckgo' && p.get('ia') === 'chat') {p.set('ia', 'web'); p.delete('iax');}
      if (engine === 'brave' && /^\/ask\/?$/.test(url.pathname)) url.pathname = p.get('q') ? '/search' : '/';
    }
    return url.href === new URL(input).href ? null : url.href;
  }
  globalThis.Stripper = {googleDomains, engines, defaults, normalize, engineFor, redirectFor};
})();
