(async () => {
  'use strict';
  const api = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
  const feedback = document.getElementById('feedback');
  if (!api?.storage) { document.getElementById('power-label').textContent = 'Install to start filtering'; document.getElementById('page-count').textContent = 'Extension preview'; return; }
  let settings, activeTab;
  const controls = ['enabled', 'hidePanels', 'hideSponsored', 'hideShortcuts', 'redirectAI', 'googleWeb'];
  const engineHost = document.getElementById('engines');
  for (const [key, value] of Object.entries(Stripper.engines)) {
    const row = document.createElement('div'); row.className = 'engine';
    const icon = document.createElement('span'); icon.className = 'engine-icon'; icon.textContent = key === 'duckduckgo' ? 'D' : value.name[0]; icon.setAttribute('aria-hidden','true');
    const copy = document.createElement('span'); copy.className = 'engine-copy';
    const name = document.createElement('strong'); name.textContent = value.name;
    const detail = document.createElement('small'); detail.textContent = value.description; copy.append(name, detail);
    const label = document.createElement('label'); label.className = 'switch';
    const input = document.createElement('input'); input.type = 'checkbox'; input.id = `engine-${key}`; input.setAttribute('role','switch'); input.setAttribute('aria-label', `Filter ${value.name}`);
    label.append(input, document.createElement('span')); row.append(icon, copy, label); engineHost.append(row);
    input.addEventListener('change', () => save({engines: {...settings.engines, [key]: input.checked}}));
  }
  function render() {
    for (const id of controls) { const el = document.getElementById(id); el.checked = settings[id]; el.disabled = false; }
    for (const key of Object.keys(Stripper.engines)) document.getElementById(`engine-${key}`).checked = settings.engines[key];
    document.body.classList.toggle('paused', !settings.enabled);
    document.getElementById('power-label').textContent = settings.enabled ? 'Filtering is on' : 'Filtering is paused';
    document.getElementById('power-description').textContent = settings.enabled ? 'Less AI and ads. More of the web.' : 'Original search features are visible.';
  }
  async function status() {
    const engine = Stripper.engineFor(activeTab?.url);
    document.getElementById('page-name').textContent = engine ? Stripper.engines[engine].name.toUpperCase() : 'CURRENT TAB';
    const count = document.getElementById('page-count');
    if (!engine) { count.textContent = 'Open a supported search engine'; return; }
    try {
      const result = await api.tabs.sendMessage(activeTab.id, {type:'stripper:status'});
      count.textContent = !result.enabled ? 'Paused on this engine' : `${result.hidden} ${result.hidden === 1 ? 'element' : 'elements'} hidden on this page`;
    } catch { count.textContent = 'Reload this tab to start filtering'; }
  }
  let queue = Promise.resolve();
  function save(patch) {
    settings = Stripper.normalize({...settings, ...patch}); render();
    const snapshot = structuredClone(settings);
    queue = queue.then(async () => {
      try {
        await api.storage.local.set({settings: snapshot});
        feedback.classList.remove('error'); feedback.textContent = 'Preferences saved on this device.';
        await status();
      } catch {
        feedback.classList.add('error'); feedback.textContent = 'Could not save. Reopen Stripper and try again.';
        try {settings = Stripper.normalize((await api.storage.local.get('settings')).settings); render();} catch { /* Keep the visible error. */ }
      }
    });
  }
  for (const id of controls) document.getElementById(id).addEventListener('change', e => save({[id]:e.target.checked}));
  try {
    settings = Stripper.normalize((await api.storage.local.get('settings')).settings);
    [activeTab] = await api.tabs.query({active:true,currentWindow:true});
    render(); await status();
  } catch {
    document.getElementById('power-label').textContent = 'Could not load settings';
    feedback.classList.add('error'); feedback.textContent = 'Close and reopen Stripper to try again.';
    document.querySelectorAll('input').forEach(el => el.disabled = true);
  }
})();
