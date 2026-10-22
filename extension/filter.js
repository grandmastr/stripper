(() => {
  'use strict';
  const rules = {
    google: {
      ads: ['#tads', '#tadsb', '#bottomads', '[data-text-ad]', '.cu-container:has([data-pla])', '[data-pla]'],
      panels: ['[data-attrid="AIOverview"]', '[data-attrid="SGE"]', '#Odp5De', '.M8OgIe'],
      headings: ['ai overview', 'ai overviews', 'visión general creada por ia', 'vista creada con ia', 'aperçu ia', 'übersicht mit ki', 'visão geral criada por ia'],
      boundary: '[data-attrid="AIOverview"], [data-attrid="SGE"], #Odp5De, .M8OgIe, section',
      shortcuts: [],
      labels: ['ai mode', 'try ai mode', 'ask in ai mode', 'dive deeper in ai mode']
    },
    bing: {
      ads: ['.b_ad'],
      panels: ['#copans_container', '#ca_main', '#b_copilot_search_container', '#b_sydConvCont', '#b_syd_container', '#b_copilot_search', '.b_ans.b_syd', '.b_ans.b_sydAnswer', 'cib-serp'],
      headings: ['copilot answer', 'copilot search', 'ai-generated answer', 'ai generated answer'],
      boundary: '.b_ans, section, [role="region"]',
      shortcuts: ['#b-scopeListItem-conv', '#b-scopeListItem-copilotsearch', '#b_sydChatEntryPoint'],
      labels: ['copilot', 'copilot search', 'chat with copilot', 'ask copilot']
    },
    duckduckgo: {
      ads: ['.result--ad', '[data-testid="ad"]', '[data-testid="ad-result"]', '[data-layout="ad"]'],
      panels: ['[data-react-module-id="wikinlp"]', '[data-testid="duckassist"]', '[data-testid="duckassist-answer"]', '[data-testid="search-assist"]', '#duckassist', '.zci--duckassist'],
      headings: ['search assist', 'duckassist', 'ai-assisted answer'],
      boundary: '[data-testid="duckassist"], [data-testid="search-assist"], .zci, section, [role="region"]',
      shortcuts: ['[data-testid="duckai-tab"]', '[data-testid="ai-chat-button"]'],
      labels: ['duck.ai', 'duckai', 'ai chat', 'ask duck.ai', 'search assist']
    },
    brave: {
      ads: ['.snippet[data-type="ad"]', '.snippet[data-type="ads"]', '.snippet[data-type="sponsored"]', '[data-testid="ad-result"]'],
      panels: ['#summarizer', '#ai-answer', '.answer-with-ai', '[data-type="summarizer"]', '[data-testid="ai-answer"]'],
      headings: ['answer with ai', 'ai answer', 'ai answers'],
      boundary: '#summarizer, #ai-answer, .snippet, section, [role="region"]',
      shortcuts: ['#submit-llm-button', '#ask-brave', '[data-testid="ask-brave"]'],
      labels: ['ask brave', 'answer with ai', 'ask ai']
    }
  };
  const text = value => (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  // Never select page-wide containers. Ordinary result links with AI in their title
  // are not classified as AI-generated content.
  const protectedContainer = '#rso, #search, #center_col, #rcnt, #b_results, #b_content, #links, #results, main, body, html';
  const organic = '.g, .b_algo, [data-testid="result"], .result--web, .snippet[data-type="web"]';
  function collect(root, engine, settings, pageURL) {
    const rule = rules[engine], candidates = new Set();
    if (!rule || !settings.enabled || !settings.engines[engine]) return candidates;
    const add = node => {
      if (!node || node.matches(protectedContainer) || node.querySelector(protectedContainer)) return;
      if (node.matches(organic) || node.querySelector(organic)) return;
      candidates.add(node);
    };
    if (settings.hideSponsored) {
      // Require an engine-specific ad marker, never words in an ordinary title.
      // Some paid cards share the generic organic-card class; the explicit ad
      // marker can identify the card itself, but cannot swallow ordinary siblings.
      const adSelector = rule.ads.join(',');
      for (const node of root.querySelectorAll(adSelector)) {
        if (!node.textContent.trim() && !node.querySelector('img,iframe')) continue;
        if (node.matches(protectedContainer) || node.querySelector(protectedContainer)) continue;
        if ([...node.querySelectorAll(organic)].some(result => !result.matches(adSelector))) continue;
        candidates.add(node);
      }
    }
    if (settings.hidePanels) {
      for (const selector of rule.panels) root.querySelectorAll(selector).forEach(add);
      for (const heading of root.querySelectorAll('h1,h2,[role="heading"]')) {
        if (!rule.headings.includes(text(heading.textContent))) continue;
        if (heading.closest(organic) || heading.closest('a')) continue;
        const boundary = heading.closest(rule.boundary);
        if (boundary) add(boundary);
      }
    }
    if (settings.hideShortcuts) {
      for (const selector of rule.shortcuts) root.querySelectorAll(selector).forEach(add);
      for (const node of root.querySelectorAll('a[href],button,[role="tab"]')) {
        if (node.closest(organic) || node.querySelector('h3') || node.closest('h3')) continue;
        const label = text(node.getAttribute('aria-label') || node.textContent);
        let internalAI = false;
        if (node.tagName === 'A') {
          try {
            const url = new URL(node.getAttribute('href'), pageURL);
            const sameEngine = Stripper.engineFor(url.href) === engine;
            internalAI = sameEngine && ((engine === 'google' && (url.searchParams.get('udm') === '50' || url.pathname === '/aimode')) || (engine === 'bing' && ['/chat', '/copilotsearch'].includes(url.pathname)) || (engine === 'duckduckgo' && url.searchParams.get('ia') === 'chat') || (engine === 'brave' && url.pathname === '/ask'));
          } catch { /* Not a navigable link. */ }
        }
        if (internalAI || rule.labels.includes(label)) add(node);
      }
    }
    // Count a whole hidden panel once, even if it contains hidden shortcuts.
    return new Set([...candidates].filter(n => ![...candidates].some(parent => parent !== n && parent.contains(n))));
  }
  Stripper.collect = collect;
  Stripper.rules = rules;
})();
