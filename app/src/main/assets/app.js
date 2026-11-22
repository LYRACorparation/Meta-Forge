(function () {
  const DATA = window.META_FORGE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hasNative = !!window.NativeBridge;
  const state = {
    tab: 'home',
    query: '',
    game: 'all',
    status: 'all',
    mods: DATA.mods.slice(),
    games: DATA.games.slice(),
    device: {},
    installed: [],
    local: [],
    downloads: {}
  };

  function call(name, ...args) {
    if (!hasNative || !window.NativeBridge[name]) return null;
    try { return window.NativeBridge[name](...args); } catch (e) { console.warn(e); return null; }
  }
  function parse(raw, fallback) { try { return JSON.parse(raw); } catch { return fallback; } }
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add('hidden'), 2600);
  }
  function gameById(id) { return state.games.find(g => g.id === id); }
  function gameName(id) { const g = gameById(id); return g ? g.name : id; }
  function statusBadge(status) {
    const cls = status === 'Verified' ? 'verified' : 'unidentified';
    return `<span class="badge ${cls}">${esc(status)}</span>`;
  }

  function refresh() {
    state.device = parse(call('getDeviceInfo'), {}) || {};
    state.installed = parse(call('getInstalledApps'), []) || [];
    state.local = parse(call('listLocalMods'), []) || [];
    // mark installed games
    state.games.forEach(g => {
      const hit = state.installed.find(a => a.package === g.package);
      g.installed = !!hit;
      g.installedVersion = hit ? hit.version : '';
    });
    $('#deviceLine').textContent = `${state.device.model || 'Device'} · Android ${state.device.android || '?'} · Meta-Forge ${DATA.app.version}`;
  }

  function filteredMods() {
    const q = state.query.toLowerCase().trim();
    return state.mods.filter(m => {
      if (state.game !== 'all' && m.gameId !== state.game) return false;
      if (state.status !== 'all' && m.status !== state.status) return false;
      if (!q) return true;
      const g = gameName(m.gameId).toLowerCase();
      return [m.name, m.description, m.author, m.category, g, ...(m.tags||[])].join(' ').toLowerCase().includes(q);
    });
  }

  function modCard(m) {
    const g = gameById(m.gameId);
    const d = state.downloads[m.id];
    const canDownload = !!m.downloadUrl;
    const progress = d && d.state === 'started' ? `<div class="progress"><i style="width:${d.progress||15}%"></i></div><div class="small">Downloading...</div>` : '';
    const done = d && d.state === 'complete' ? `<div class="small" style="color:#86efac">Downloaded: ${esc(d.path || m.fileName)}</div>` : '';
    const err = d && d.state === 'error' ? `<div class="small" style="color:#fda4af">${esc(d.error || 'Download failed')}</div>` : '';
    return `<article class="card mod">
      <div class="mod-head">
        <div>
          <div class="game">${esc(g ? g.name : m.gameId)}</div>
          <h3>${esc(m.name)}</h3>
        </div>
        ${statusBadge(m.status)}
      </div>
      <p class="desc">${esc(m.description)}</p>
      <div class="meta">
        <span>v${esc(m.version)}</span>
        <span>${esc(m.author)}</span>
        <span>${esc(m.category)}</span>
        <span>${esc(m.size || 'N/A')}</span>
      </div>
      ${progress}${done}${err}
      <div class="actions">
        <button class="btn primary" data-action="details" data-id="${esc(m.id)}">Details</button>
        ${canDownload ? `<button class="btn" data-action="download" data-id="${esc(m.id)}" ${d && d.state==='started'?'disabled':''}>Download</button>` : `<button class="btn" data-action="source" data-id="${esc(m.id)}">Source</button>`}
        <button class="btn ghost" data-action="copy" data-id="${esc(m.id)}">Share</button>
      </div>
    </article>`;
  }

  function homeView() {
    const featured = state.mods.slice(0, 4);
    const installedGames = state.games.filter(g => g.installed);
    return `
      <section class="section split">
        <div class="card panel">
          <h2>Welcome to Meta-Forge</h2>
          <p class="lead">${esc(DATA.app.description)}</p>
          <div class="kv">
            <div class="k">Released by</div><div class="v">${esc(DATA.app.releasedBy)}</div>
            <div class="k">Version</div><div class="v">${esc(DATA.app.version)}</div>
            <div class="k">Platform</div><div class="v">${esc(DATA.app.platform)}</div>
            <div class="k">Status</div><div class="v">${statusBadge(DATA.app.status)} <span class="small">Catalog includes Verified and Unidentified entries</span></div>
            <div class="k">Support</div><div class="v"><a href="#" data-action="open-discord">Discord: ${esc(DATA.app.discord)}</a></div>
          </div>
        </div>
        <div class="card panel">
          <h3>Supported Games</h3>
          <div class="list">
            ${state.games.map(g => `
              <div class="row">
                <div>
                  <div class="title">${esc(g.name)}</div>
                  <div class="sub">${esc(g.summary)}</div>
                </div>
                ${statusBadge(g.installed ? 'Verified' : g.status)}
              </div>`).join('')}
          </div>
          <p class="small" style="margin-top:10px">${installedGames.length ? `${installedGames.length} supported game(s) detected on this device.` : 'No supported games detected by package name; you can still browse the catalog.'}</p>
        </div>
      </section>
      <section class="section">
        <h2>Featured Mods</h2>
        <p class="lead">Real downloadable files when a legitimate public source is available; catalog/source entries otherwise.</p>
        <div class="grid-cards">${featured.map(modCard).join('')}</div>
      </section>`;
  }

  function browseView() {
    const mods = filteredMods();
    return `
      <section class="section">
        <h2>Browse Mods</h2>
        <p class="lead">Find mods for Gorilla Tag, Orion Drift, Big Ballers 26, and Gym Class. Download real files or open trusted sources.</p>
        <div class="grid-cards">${mods.length ? mods.map(modCard).join('') : `<div class="empty">No mods match your filters.</div>`}</div>
      </section>`;
  }

  function gamesView() {
    return `
      <section class="section">
        <h2>Games</h2>
        <p class="lead">Game compatibility and install targets. "Installed" is detected from Android package names when available.</p>
        <div class="grid-cards">
          ${state.games.map(g => {
            const mods = state.mods.filter(m => m.gameId === g.id);
            return `<article class="card mod">
              <div class="mod-head"><div><div class="game">Meta Quest</div><h3>${esc(g.name)}</h3></div>${statusBadge(g.installed ? 'Verified' : g.status)}</div>
              <p class="desc">${esc(g.summary)}</p>
              <div class="meta"><span>${mods.length} mod(s)</span><span>${g.installed ? 'Installed' : 'Not detected'}</span><span>${esc(g.package)}</span></div>
              <div class="actions">
                <button class="btn primary" data-action="filter-game" data-game="${esc(g.id)}">Browse Mods</button>
                ${g.installed ? `<button class="btn" data-action="launch" data-package="${esc(g.package)}">Launch</button>` : ''}
              </div>
            </article>`;
          }).join('')}
        </div>
      </section>`;
  }

  function libraryView() {
    return `
      <section class="section split">
        <div class="card panel">
          <h3>Local Library</h3>
          <p class="lead">Files imported into Meta-Forge storage. You can add files from device storage or import completed downloads.</p>
          <div class="actions" style="margin-bottom:12px">
            <button class="btn primary" data-action="pick-files">Add Files</button>
            <button class="btn" data-action="refresh">Refresh</button>
          </div>
          <div class="list">
            ${state.local.length ? state.local.map(f => `
              <div class="row">
                <div><div class="title">${esc(f.name)}</div><div class="sub">${esc(f.size)} · ${esc(f.path)}</div></div>
                <span class="badge verified">Local</span>
              </div>`).join('') : `<div class="empty">No local mod files yet.</div>`}
          </div>
        </div>
        <div class="card panel">
          <h3>Downloads</h3>
          <p class="lead">Real downloads use Android DownloadManager and save to your Downloads/MetaForge folder. After download, import into Library for organization.</p>
          <div class="list">
            ${Object.keys(state.downloads).length ? Object.entries(state.downloads).map(([id, d]) => {
              const m = state.mods.find(x => x.id === id);
              return `<div class="row"><div><div class="title">${esc(m?m.name:id)}</div><div class="sub">${esc(d.state)} ${d.file? '· '+esc(d.file):''}</div></div>${d.state==='complete' && d.file ? `<button class="btn" data-action="import-download" data-file="${esc(d.file)}">Import</button>` : `<span class="badge ${d.state==='error'?'unidentified':'verified'}">${esc(d.state)}</span>`}</div>`;
            }).join('') : `<div class="empty">No downloads yet.</div>`}
          </div>
        </div>
      </section>`;
  }

  function infoView() {
    return `
      <section class="section split">
        <div class="card panel">
          <h3>Installation Guide</h3>
          <ul>
            <li><b>Browse:</b> Find a mod for your game and open Details.</li>
            <li><b>Download:</b> If a real public download is available, tap Download. The file is saved to <code>Downloads/MetaForge</code>.</li>
            <li><b>Import:</b> Tap Import in Library/Downloads, or use Add Files to import mod files you already have.</li>
            <li><b>Install:</b> Follow the mod's instructions. Gorilla Tag DLL mods usually require a compatible mod loader and go in <code>BepInEx/plugins</code>.</li>
            <li><b>Safety:</b> Only install mods from trusted sources, matching your game version/platform. Unidentified entries are catalog listings, not verified downloads.</li>
          </ul>
        </div>
        <div class="card panel">
          <h3>App Info</h3>
          <div class="kv">
            <div class="k">Name</div><div class="v">${esc(DATA.app.name)}</div>
            <div class="k">Released by</div><div class="v">${esc(DATA.app.releasedBy)}</div>
            <div class="k">Description</div><div class="v">A VR mod hub for browsing, downloading legitimate mod files, and organizing local mods for supported Meta games.</div>
            <div class="k">Version</div><div class="v">${esc(DATA.app.version)}</div>
            <div class="k">Platform</div><div class="v">${esc(DATA.app.platform)}</div>
            <div class="k">Status</div><div class="v">Verified / Unidentified (per mod)</div>
            <div class="k">Games</div><div class="v">${state.games.map(g=>esc(g.name)).join(', ')}</div>
            <div class="k">Support</div><div class="v"><a href="#" data-action="open-discord">${esc(DATA.app.discord)}</a></div>
          </div>
        </div>
      </section>`;
  }

  function render() {
    refresh();
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === state.tab));
    const v = $('#view');
    if (state.tab === 'home') v.innerHTML = homeView();
    else if (state.tab === 'browse') v.innerHTML = browseView();
    else if (state.tab === 'games') v.innerHTML = gamesView();
    else if (state.tab === 'library') v.innerHTML = libraryView();
    else v.innerHTML = infoView();
  }

  function openDetails(id) {
    const m = state.mods.find(x => x.id === id); if (!m) return;
    const g = gameById(m.gameId);
    $('#modalRoot').innerHTML = `
      <div class="modal" data-close="1">
        <div class="modal-card" onclick="event.stopPropagation()">
          <button class="close" data-close="1">Close</button>
          <div class="game" style="color:var(--purple);font-weight:700;font-size:12px;letter-spacing:.08em;text-transform:uppercase">${esc(g?g.name:'')}</div>
          <h2>${esc(m.name)}</h2>
          <p class="sub">by ${esc(m.author)} · ${esc(m.version)} · ${statusBadge(m.status)}</p>
          <div class="kv" style="margin-bottom:14px">
            <div class="k">Description</div><div class="v">${esc(m.description)}</div>
            <div class="k">How it works</div><div class="v">${esc(m.howItWorks)}</div>
            <div class="k">Category</div><div class="v">${esc(m.category)}</div>
            <div class="k">Source</div><div class="v"><a href="#" data-action="open-url" data-url="${esc(m.source)}">${esc(m.source)}</a></div>
            <div class="k">Download</div><div class="v">${m.downloadUrl ? `<span style="color:#86efac">Direct file available</span>` : `<span style="color:#fde68a">No verified direct download bundled</span>`}</div>
          </div>
          <div class="actions">
            ${m.downloadUrl ? `<button class="btn primary" data-action="download" data-id="${esc(m.id)}">Download</button>` : `<button class="btn primary" data-action="open-url" data-url="${esc(m.source)}">Open Source</button>`}
            <button class="btn" data-action="copy" data-id="${esc(m.id)}">Share</button>
          </div>
        </div>
      </div>`;
  }

  function downloadMod(id) {
    const m = state.mods.find(x => x.id === id);
    if (!m) return;
    if (!m.downloadUrl) { if (m.source) call('openUrl', m.source) || window.open(m.source, '_blank'); return; }
    if (!hasNative) { window.open(m.downloadUrl, '_blank'); toast('Opened download URL'); return; }
    state.downloads[id] = { state: 'starting', progress: 5, file: m.fileName };
    render();
    const res = parse(call('downloadMod', m.id, m.downloadUrl, m.fileName), {});
    if (!res.ok) {
      state.downloads[id] = { state: 'error', progress: 0, error: res.error || 'Download failed' };
      toast(res.error || 'Download failed');
    } else {
      state.downloads[id] = { state: 'started', progress: 15, file: res.file || m.fileName };
      toast('Download started');
    }
    render();
  }

  window.onDownloadEvent = function (evt) {
    if (!evt || !evt.modId) return;
    state.downloads[evt.modId] = { state: evt.state, progress: evt.progress, path: evt.path, error: evt.error, file: (state.downloads[evt.modId] && state.downloads[evt.modId].file) || '' };
    if (evt.state === 'complete') toast('Download complete');
    if (evt.state === 'error') toast(evt.error || 'Download error');
    render();
  };

  window.onModFilesPicked = function (names) {
    refresh(); render();
    toast((names && names.length ? names.length : 0) + ' file(s) imported');
  };

  document.addEventListener('click', (e) => {
    const close = e.target.closest('[data-close]');
    if (close && (e.target.classList.contains('modal') || close.classList.contains('close'))) { $('#modalRoot').innerHTML = ''; return; }
    const a = e.target.closest('[data-action]');
    if (!a) return;
    e.preventDefault();
    const act = a.dataset.action;
    if (act === 'details') openDetails(a.dataset.id);
    else if (act === 'download') downloadMod(a.dataset.id);
    else if (act === 'source') { const m = state.mods.find(x=>x.id===a.dataset.id); if (m) call('openUrl', m.source) || window.open(m.source,'_blank'); }
    else if (act === 'copy') { const m = state.mods.find(x=>x.id===a.dataset.id); const txt = m.name + ' - ' + (m.source || m.downloadUrl || ''); if (hasNative) { call('shareText', txt); } else { try { navigator.clipboard.writeText(txt); } catch(e) {} } toast('Share text ready'); }
    else if (act === 'open-discord') { call('openUrl', DATA.app.discord) || window.open(DATA.app.discord, '_blank'); }
    else if (act === 'open-url') { const url = a.dataset.url; call('openUrl', url) || window.open(url, '_blank'); }
    else if (act === 'filter-game') { state.game = a.dataset.game; state.tab = 'browse'; $('#gameFilter').value = state.game; render(); }
    else if (act === 'launch') { call('launchPackage', a.dataset.package); }
    else if (act === 'pick-files') { if (hasNative) call('pickModFiles'); else toast('File picker available in Android app'); }
    else if (act === 'refresh') { refresh(); render(); toast('Refreshed'); }
    else if (act === 'import-download') {
      const res = parse(call('importDownload', a.dataset.file), {});
      toast(res.ok ? 'Imported to library' : (res.error || 'Import failed'));
      refresh(); render();
    }
  });

  $$('.tab').forEach(t => t.addEventListener('click', () => { state.tab = t.dataset.tab; render(); }));
  $('#search').addEventListener('input', e => { state.query = e.target.value; if (state.tab !== 'browse') state.tab = 'browse'; render(); $('#search').focus(); });
  $('#gameFilter').addEventListener('change', e => { state.game = e.target.value; render(); });
  $('#statusFilter').addEventListener('change', e => { state.status = e.target.value; render(); });

  function initFilters() {
    const gf = $('#gameFilter');
    gf.innerHTML = `<option value="all">All games</option>` + state.games.map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('');
  }

  window.handleBack = function () {
    if ($('#modalRoot').innerHTML.trim()) { $('#modalRoot').innerHTML = ''; return true; }
    if (state.tab !== 'home') { state.tab = 'home'; render(); return true; }
    return false;
  };

  initFilters();
  refresh();
  render();
})();


