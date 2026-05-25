// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
let V = { view: 'today', topicId: null, filter: 'all', query: '', speaking: null, libTab: 'saved', patFilter: 'learning', historyDay: null };

// ══════════════════════════════════════════════
// PATTERN DETECTION FOR SENTENCES
// ══════════════════════════════════════════════
function findMatchingPattern(sentence) {
  const explicit = (sentence.patternIds || []).map(id => PATTERN_BY_ID[id]).find(Boolean);
  if (explicit) return explicit;
  return null;
}
const VALID_VIEWS = new Set(['today', 'browse', 'patterns', 'saved', 'history', 'history-day', 'stats']);
const VALID_FILTERS = new Set(['all', 'unlearned', 'learned', 'favorites']);
const VALID_PATTERN_FILTERS = new Set(['learning', 'due', 'understood', 'all']);
const VALID_LIBRARY_TABS = new Set(['saved', 'learned']);
const TOPIC_IDS = new Set(TOPICS.map(t => t.id));

function normalizeViewName(view) {
  const raw = String(view || 'today');
  if (raw === 'library') return 'saved';
  return VALID_VIEWS.has(raw) ? raw : 'today';
}
function normalizePatternFilter(value) {
  const raw = String(value || 'learning');
  if (raw === 'new') return 'learning';
  return VALID_PATTERN_FILTERS.has(raw) ? raw : 'learning';
}
function stateFromUrl(href) {
  const fallback = { view: 'today', topicId: null, filter: 'all', query: '', libTab: 'saved', patFilter: 'learning', historyDay: null };
  let params;
  try {
    const base = window.location && window.location.href ? window.location.href : 'http://localhost/';
    params = new URL(href || base, base).searchParams;
  } catch (error) {
    params = new URLSearchParams(window.location ? window.location.search : '');
  }
  const viewParam = params.get('view');
  const view = normalizeViewName(viewParam || 'today');
  const topic = params.get('topic');
  const filter = params.get('filter');
  const tab = params.get('tab');
  const day = normalizeDateKey(params.get('day'));

  if (view === 'browse') {
    fallback.view = 'browse';
    fallback.topicId = topic && TOPIC_IDS.has(topic) ? topic : null;
    fallback.filter = VALID_FILTERS.has(filter) ? filter : 'all';
  } else if (view === 'patterns') {
    fallback.view = 'patterns';
    fallback.patFilter = normalizePatternFilter(filter);
  } else if (view === 'saved') {
    fallback.view = 'saved';
    fallback.libTab = VALID_LIBRARY_TABS.has(tab) ? tab : 'saved';
  } else if (view === 'history') {
    fallback.view = day ? 'history-day' : 'history';
    fallback.historyDay = day;
  } else if (view === 'history-day') {
    fallback.view = day ? 'history-day' : 'history';
    fallback.historyDay = day;
  } else {
    fallback.view = view;
  }
  return fallback;
}
function urlFromState(state = V) {
  const params = new URLSearchParams();
  const view = normalizeViewName(state.view);
  const publicView = view === 'saved' ? 'library' : view === 'history-day' ? 'history' : view;
  if (publicView !== 'today') params.set('view', publicView);
  if (view === 'browse') {
    if (state.topicId && TOPIC_IDS.has(state.topicId)) params.set('topic', state.topicId);
    if (state.filter && state.filter !== 'all') params.set('filter', state.filter);
  } else if (view === 'patterns') {
    params.set('filter', normalizePatternFilter(state.patFilter));
  } else if (view === 'saved') {
    if (state.libTab && state.libTab !== 'saved') params.set('tab', state.libTab);
  } else if (view === 'history-day' && state.historyDay) {
    params.set('day', state.historyDay);
  }
  const query = params.toString();
  const pathname = window.location && window.location.pathname ? window.location.pathname : '/';
  return query ? `${pathname}?${query}` : pathname;
}
function applyUrlState(href) {
  const next = stateFromUrl(href);
  V.view = next.view;
  V.topicId = next.topicId;
  V.filter = next.filter;
  V.query = '';
  V.libTab = next.libTab;
  V.patFilter = next.patFilter;
  V.historyDay = next.historyDay;
}
function syncUrl(replace = false) {
  if (!window.history || !window.location) return;
  const next = urlFromState(V);
  const current = `${window.location.pathname}${window.location.search}`;
  if (next === current) return;
  const method = replace ? 'replaceState' : 'pushState';
  window.history[method]({ view: V.view }, '', next);
}
function commitState({ replace = false, scroll = false } = {}) {
  syncUrl(replace);
  render();
  if (scroll) window.scrollTo(0, 0);
}
function nav(view, extra) {
  const nextView = normalizeViewName(view);
  V.view = nextView;
  V.topicId = nextView === 'browse' && extra && TOPIC_IDS.has(extra) ? extra : null;
  V.filter = 'all';
  V.query = '';
  V.historyDay = null;
  if (nextView === 'patterns') V.patFilter = 'learning';
  commitState({ scroll: true });
}

function jsArg(v) {
  return JSON.stringify(String(v))
    .replace(/&/g, '&amp;')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function idsArg(ids) {
  return JSON.stringify(ids).replace(/"/g, "'");
}

// ══════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════
const ICO = {
  speak: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
};

// ══════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════
function render() {
  updateHeader();
  updateNavBtns();
  const root = document.getElementById('root');
  if (V.view === 'today') root.innerHTML = renderToday();
  else if (V.view === 'browse' && V.topicId) root.innerHTML = renderTopic();
  else if (V.view === 'browse') root.innerHTML = renderBrowse();
  else if (V.view === 'patterns') root.innerHTML = renderPatterns();
  else if (V.view === 'saved') root.innerHTML = renderSaved();
  else if (V.view === 'history') root.innerHTML = renderHistory();
  else if (V.view === 'history-day') root.innerHTML = renderHistoryDay();
  else if (V.view === 'stats') { root.innerHTML = renderStats(); }
  root.querySelectorAll('.sc,.pc').forEach((el, i) => el.style.animationDelay = i * 25 + 'ms');
}

function updateHeader() {
  const tot = SENTENCES.length, done = DB.learned.size, pct = tot ? Math.round(done / tot * 100) : 0;
  document.getElementById('hpf').style.width = pct + '%';
  document.getElementById('hpl').textContent = `${done} / ${tot} sentences learned`;
  document.getElementById('stk-n').textContent = DB.streak;
}
function updateNavBtns() {
  ['today', 'browse', 'patterns', 'stats'].forEach(v => {
    const el = document.getElementById('nb-' + v);
    if (el) el.className = 'nb' + (V.view === v ? ' on' : '');
    const mel = document.getElementById('mnb-' + v);
    if (mel) mel.className = 'mnb' + (V.view === v ? ' on' : '');
  });
  const libBtn = document.getElementById('nb-library');
  if (libBtn) libBtn.className = 'nb' + (V.view === 'saved' ? ' on' : '');
  const mLibBtn = document.getElementById('mnb-library');
  if (mLibBtn) mLibBtn.className = 'mnb' + (V.view === 'saved' ? ' on' : '');
  const histBtn = document.getElementById('nb-history');
  if (histBtn) histBtn.className = 'nb' + (V.view === 'history' || V.view === 'history-day' ? ' on' : '');
  const mHistBtn = document.getElementById('mnb-history');
  if (mHistBtn) mHistBtn.className = 'mnb' + (V.view === 'history' || V.view === 'history-day' ? ' on' : '');
  const sc = document.getElementById('sb-learned-count');
  if (sc) sc.textContent = DB.learned.size;
}

// ─── TODAY ───────────────────────────────────
function renderToday() {
  ensureDailyQueue();
  const qs = DB.dailyQueue.map(id => SENTENCES.find(s => s.id === id)).filter(Boolean);
  const queueDone = qs.filter(s => DB.dailyQueueDone.has(s.id) || (DB.srs[s.id] && DB.srs[s.id].lastReview === today())).length;
  const learnedToday = (DB.historyWords[today()] || []).filter(id => DB.learned.has(id)).length;
  const reviewedToday = DB.attempts.filter(a => a.date === today() && a.wasDue && (a.result === 'got' || a.result === 'again')).length;
  const tot = qs.length, pct = tot ? Math.min(100, Math.round(queueDone / tot * 100)) : 0, done = queueDone >= tot && tot > 0;
  const storageWarning = DB.storageError ? `<div class="tip-card storage-warning"><div class="tip-lbl">Storage warning</div><div class="tip-text">${esc(DB.storageError)}</div></div>` : '';

  const gc = `<div class="goal-card">
<div class="goal-top">
  <div><div class="goal-title">📅 Today's Practice</div><div class="goal-date">${new Date().toLocaleDateString('en-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
  <button class="goal-btn" onclick="openGoalModal()">Goal: ${DB.dailyGoal} ✏️</button>
</div>
<div class="goal-nums">
  <div><div class="gnum-v" style="color:var(--green)">${queueDone}</div><div class="gnum-l">Queue done</div></div>
  <div><div class="gnum-v" style="color:var(--text-3)">${Math.max(0, tot - queueDone)}</div><div class="gnum-l">Remaining</div></div>
  <div><div class="gnum-v" style="color:var(--accent)">${learnedToday}</div><div class="gnum-l">New learned</div></div>
  <div><div class="gnum-v" style="color:var(--blue)">${reviewedToday}</div><div class="gnum-l">Reviews</div></div>
  <div><div class="gnum-v" style="color:var(--accent)">${DB.dailyGoal}</div><div class="gnum-l">Daily goal</div></div>
</div>
${done ? `<div class="goal-complete">🎉 Daily goal complete. Review due cards, browse topics, or raise the goal if you want more practice.</div>` : `<div class="goal-bar-bg"><div class="goal-bar-fill" style="width:${pct}%"></div></div>`}
  </div>`;

  return `${storageWarning}${gc}

<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
  <div style="font-size:14px;font-weight:600;color:var(--text)">Today's ${tot} Sentences</div>
  <div style="display:flex;gap:7px">
    <button onclick="startPractice({ids:${idsArg(qs.map(s => s.id))}})" style="background:var(--accent);color:white;border:none;border-radius:8px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif">🎯 Practice</button>
    <button onclick="refreshQueue()" style="background:var(--white);border:1px solid var(--border);border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;color:var(--text-2);font-family:'Inter',sans-serif;font-weight:500">🔄 New batch</button>
  </div>
</div>

${qs.map((s, i) => renderSentenceCard(s, i, true)).join('')}`;
}

// ─── BROWSE ──────────────────────────────────
function renderBrowse() {
  const q = V.query.trim().toLowerCase();
  const searchResults = q
    ? SENTENCES.filter(s => {
      const topic = TOPICS.find(t => t.id === s.t);
      const pattern = findMatchingPattern(s);
      return [s.de, s.en, s.use, s.lv, s.register, topic && topic.name, topic && topic.german, pattern && pattern.template]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q));
    })
    : [];
  const topicCards = TOPICS.map(t => {
    const tot = SENTENCES.filter(s => s.t === t.id).length;
    const done = SENTENCES.filter(s => s.t === t.id && DB.learned.has(s.id)).length;
    const pct = tot ? Math.round(done / tot * 100) : 0;
    return `<button class="topic-card" onclick="nav('browse','${t.id}')" style="--tc:${t.color}" type="button">
  <span class="tc-emoji">${t.emoji}</span>
  <div class="tc-name">${t.name}</div>
  <div class="tc-de">${t.german}</div>
  <div class="tc-prog"><span class="tc-count">${done}/${tot}</span><div class="tc-bar-bg"><div class="tc-bar-fill" style="width:${pct}%;background:var(--tc)"></div></div></div>
</button>`;
  }).join('');
  return `<div style="padding-top:14px">
	<h2 class="page-title">Browse</h2>
	<p class="page-sub">${SENTENCES.length} sentences - ${PATTERNS.length} patterns - ${TOPICS.length} topics</p>
	<div class="search-wrap" style="margin:0 0 16px"><span class="search-icon">🔍</span><input class="search-input" placeholder="Search all phrases, topics, and patterns..." value="${esc(V.query)}" oninput="setQuery(this.value)" type="text"></div>
	${V.query ? `<div class="sec-lbl">Search Results (${searchResults.length})</div>${searchResults.length ? searchResults.map((s, i) => renderSentenceCard(s, i, true)).join('') : `<div class="empty-state"><div class="empty-icon">🔍</div>No phrases match.</div>`}` : ''}
	${V.query ? '<div class="sec-lbl">Topics</div>' : ''}
	<div class="topic-grid">${topicCards}</div>
	  </div>`;
}

// ─── TOPIC ───────────────────────────────────
function renderTopic() {
  const topic = TOPICS.find(t => t.id === V.topicId);
  if (!topic) return renderBrowse();
  let sents = SENTENCES.filter(s => s.t === V.topicId);
  if (V.filter === 'learned') sents = sents.filter(s => DB.learned.has(s.id));
  else if (V.filter === 'unlearned') sents = sents.filter(s => !DB.learned.has(s.id));
  else if (V.filter === 'favorites') sents = sents.filter(s => DB.favorites.has(s.id));
  if (V.query) { const q = V.query.toLowerCase(); sents = sents.filter(s => s.de.toLowerCase().includes(q) || s.en.toLowerCase().includes(q)); }
  const done = SENTENCES.filter(s => s.t === V.topicId && DB.learned.has(s.id)).length;
  const tot = SENTENCES.filter(s => s.t === V.topicId).length;
  const allTopicIds = JSON.stringify(SENTENCES.filter(s => s.t === V.topicId).map(s => s.id)).replace(/"/g, "'");
  const unlearnedTopicIds = JSON.stringify(SENTENCES.filter(s => s.t === V.topicId && !DB.learned.has(s.id)).map(s => s.id)).replace(/"/g, "'");
  const practiceTopicBtn = `<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
<button onclick="startPractice({ids:${allTopicIds}})" style="flex:1;background:var(--accent);color:white;border:none;border-radius:9px;padding:10px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:opacity 0.15s" onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">🎯 Practice All ${tot}</button>
${SENTENCES.filter(s => s.t === V.topicId && !DB.learned.has(s.id)).length > 0 ? `<button onclick="startPractice({ids:${unlearnedTopicIds}})" style="flex:1;background:var(--white);border:1px solid var(--border);border-radius:9px;padding:10px 14px;font-size:13px;font-weight:600;cursor:pointer;color:var(--text-2);font-family:'Inter',sans-serif;transition:all 0.15s" onmouseover="this.style.borderColor='var(--border-strong)'" onmouseout="this.style.borderColor='var(--border)'">📚 Unlearned Only (${tot - done})</button>` : ''}
  </div>`;
  const cards = sents.length ? sents.map((s, i) => renderSentenceCard(s, i, false)).join('') : `<div class="empty-state"><div class="empty-icon">🔍</div>No sentences match.</div>`;
  return `<button class="back-btn" onclick="nav('browse')">← All Topics</button>
<div class="topic-hdr">
  <div class="topic-hdr-em">${topic.emoji}</div>
  <div><div class="topic-hdr-name">${topic.name}</div><div class="topic-hdr-de">${topic.german}</div>
    <div class="topic-hdr-stats"><span class="topic-stat"><strong>${done}</strong> learned</span><span class="topic-stat"><strong>${tot - done}</strong> remaining</span></div>
  </div>
</div>
<div class="filter-row">
  ${['all', 'unlearned', 'learned', 'favorites'].map(f => `<button class="filter-chip${V.filter === f ? ' on' : ''}" onclick="setFilter('${f}')" aria-pressed="${V.filter === f}" type="button">${f === 'all' ? 'All' : f === 'unlearned' ? 'To Learn' : f === 'learned' ? '✓ Learned' : '⭐ Saved'}</button>`).join('')}
</div>
${practiceTopicBtn}
	<div class="search-wrap"><span class="search-icon">🔍</span><input class="search-input" placeholder="Search..." value="${esc(V.query)}" oninput="setQuery(this.value)" type="text"></div>

${cards}`;
}

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function revealVocabItems(s) {
  const items = [];
  const add = (de, en, note = '') => {
    const key = `${de}|${en}`.toLowerCase();
    if (!de || items.some(item => item.key === key)) return;
    items.push({ key, de, en, note });
  };
  (s.vocab || []).forEach(item => add(item.de, item.en, item.note));
  (s.chunks || []).forEach(chunk => add(chunk[0], chunk[1]));
  return items.slice(0, 8);
}
function renderRevealDetails(s, compact = false, idPrefix = 'rd-') {
  const learn = s.learn;
  if (!learn) return '';
  const vocab = revealVocabItems(s);
  const variants = Array.isArray(learn.variants) ? learn.variants : [];
  const vocabHtml = vocab.length ? `<div class="reveal-box"><div class="reveal-box-title">Sentence vocab</div>${vocab.map(item => `<div class="vocab-row"><strong lang="de">${esc(item.de)}</strong><span>${esc(item.en)}${item.note ? ` · ${esc(item.note)}` : ''}</span></div>`).join('')}</div>` : '';
  const variantsHtml = variants.length ? `<div class="reveal-box"><div class="reveal-box-title">Formal / informal</div>${variants.map(v => `<div class="vocab-row"><strong>${esc(v.label)}</strong><span lang="de">${esc(v.de)}</span></div>`).join('')}</div>` : '';
  const style = compact ? '' : ' style="display:none"';
  return `<div class="reveal-details${compact ? ' compact' : ''}" id="${idPrefix}${s.id}"${style}>
<div class="reveal-grid">
  ${vocabHtml}
  ${variantsHtml}
</div>
  </div>`;
}

function renderVariantPreview(s) {
  const variants = s.learn && Array.isArray(s.learn.variants) ? s.learn.variants : [];
  if (!variants.length) return '';
  return `<div class="variant-preview" id="vp-${s.id}">
<div class="variant-preview-title">Formal / informal</div>
${variants.map(v => `<div class="variant-preview-row">
  <span class="variant-preview-label">${esc(v.label)}</span>
  <span class="variant-preview-de">${esc(v.de)}</span>
</div>`).join('')}
  </div>`;
}

// ─── SENTENCE CARD ───────────────────────────
function renderSentenceCard(s, i, showTopic) {
  const lrn = DB.learned.has(s.id), fav = DB.favorites.has(s.id);
  const topic = TOPICS.find(t => t.id === s.t);
  const gram = grammarTag(s.de);
  const srsLvl = getSrsLevel(s.id);
  const nextLabel = srsNextLabel(s.id);
  const srsDots = lrn ? `<span class="srs-dots" title="${esc(nextLabel)}">${SRS_INTERVALS.map((_, i) => `<span class="srs-dot${i < srsLvl ? ' filled' : ''}"></span>`).join('')}</span>${nextLabel ? `<span class="srs-next">${esc(nextLabel)}</span>` : ''}` : '';
  const matchedPattern = findMatchingPattern(s);
  const patTag = matchedPattern ? `<span class="pattern-tag" title="This sentence uses a pattern">🧩 ${matchedPattern.template.replace(/\[.*?\]/g, '...').substring(0, 25)}</span>` : '';
  const variantTag = s.learn && s.learn.variants && s.learn.variants.length ? `<span class="pattern-tag" title="Includes formal and informal versions">Sie / du</span>` : '';
  const recognitionTag = isRecognitionSentence(s) ? `<span class="pattern-tag" title="Recognize this phrase and know how to respond">Recognition</span>` : '';
  return `<div class="sc${lrn ? ' lrn' : ''}${fav ? ' fav' : ''}" id="sc-${s.id}">
<div class="sc-top">
  ${showTopic && topic ? `<span class="topic-label">${topic.emoji} ${topic.name}</span>` : ''}
  <span class="lvl-tag l${s.lv}">${s.lv}</span>
  ${gram ? `<span class="gram-tag" style="color:${gram.c};background:${gram.bg}">${gram.t}</span>` : ''}
  ${patTag}
  ${variantTag}
  ${recognitionTag}
  ${lrn ? `<span class="lrn-badge">✓ Learned</span>${srsDots}` : ''}
</div>
<button class="sentence-de reveal-btn" onclick="toggleReveal('${s.id}')" aria-expanded="false" type="button" lang="de">${esc(s.de)}</button>
<div class="sentence-ph"><span class="ph-lbl">🔊</span>${esc(s.ph)}</div>
<div class="reveal-hint" id="hn-${s.id}">👆 Tap to reveal translation</div>
<button class="sentence-en hid reveal-btn" id="en-${s.id}" onclick="toggleReveal('${s.id}')" aria-hidden="true" hidden type="button">${esc(s.en)}</button>
${renderRevealDetails(s)}
<div class="card-actions">
  <button class="act-btn${V.speaking === s.id ? ' is-playing' : ''} speak-btn" data-id="${s.id}" onclick="speak(${jsArg(s.de)},'${s.id}')" type="button">
    ${ICO.speak} ${V.speaking === s.id ? `<span class="pulse">Playing...</span>` : 'Listen'}
  </button>
  <button class="act-btn${lrn ? ' is-learned' : ''}" id="lrn-btn-${s.id}" onclick="toggleLearned('${s.id}')">
    ${ICO.check} ${lrn ? 'Learned' : 'Mark done'}
  </button>
  <button class="act-btn${fav ? ' is-fav' : ''}" id="fav-btn-${s.id}" onclick="toggleFav('${s.id}')">
    ${ICO.star} ${fav ? 'Saved' : 'Save'}
  </button>
</div>
  </div>`;
}

// ─── PATTERNS ────────────────────────────────
function activePatterns() {
  return PATTERNS
    .filter(p => p.status !== 'hidden')
    .slice()
    .sort((a, b) => (a.priority || 999) - (b.priority || 999) || a.template.localeCompare(b.template));
}
function patternsForFilter(filter, duePatternIds = getPatternReviewIds()) {
  const due = new Set(duePatternIds);
  const all = activePatterns();
  if (filter === 'understood') return all.filter(p => DB.understood.has(p.id));
  if (filter === 'due') return all.filter(p => due.has(p.id));
  if (filter === 'all') return all;
  return all.filter(p => !DB.understood.has(p.id) || due.has(p.id));
}
function renderPatterns() {
  const duePatternIds = getPatternReviewIds();
  const pats = patternsForFilter(normalizePatternFilter(V.patFilter), duePatternIds);
  const active = activePatterns();
  const undCount = active.filter(p => DB.understood.has(p.id)).length;
  const learningCount = active.filter(p => !DB.understood.has(p.id) || duePatternIds.includes(p.id)).length;
  const understoodCount = active.filter(p => DB.understood.has(p.id)).length;
  const duePatternSection = duePatternIds.length ? `<div class="review-section pattern-review-section">
    <div class="review-section-hdr">
      <div class="review-section-title">🧩 Due Pattern Review <span class="review-count-badge">${duePatternIds.length}</span></div>
      <button class="review-practice-btn" onclick="startPatternPractice({ids:${idsArg(duePatternIds)}})">Practice Now</button>
    </div>
    <div class="review-section-sub">Patterns ready for spaced review.</div>
  </div>` : '';
  const cards = pats.length ? pats.map((p, i) => renderPatternCard(p, i)).join('') : `<div class="empty-state"><div class="empty-icon">🔍</div>No patterns match.</div>`;
  const visibleIds = JSON.stringify(pats.map(p => p.id)).replace(/"/g, "'");
  const learningIds = JSON.stringify(active.filter(p => !DB.understood.has(p.id) || duePatternIds.includes(p.id)).map(p => p.id)).replace(/"/g, "'");
  const understoodIds = JSON.stringify(active.filter(p => DB.understood.has(p.id)).map(p => p.id)).replace(/"/g, "'");
  return `<div style="padding-top:14px">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
  <h2 class="page-title" style="margin-top:0">Sentence Patterns</h2>
  <span style="font-size:12px;font-weight:500;color:var(--purple)">${undCount}/${active.length} understood</span>
</div>
<p class="page-sub">Master these ${active.length} A1/A2 patterns and reuse them in real situations</p>
${duePatternSection}

<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
  ${pats.length > 0 ? `<button onclick="startPatternPractice({ids:${visibleIds}})" style="flex:1;background:var(--purple);color:white;border:none;border-radius:9px;padding:10px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:opacity 0.15s" onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">🧩 Practice Visible (${pats.length})</button>` : ''}
  ${learningCount > 0 ? `<button onclick="startPatternPractice({ids:${learningIds}})" style="flex:1;background:var(--white);border:1px solid var(--purple-border);border-radius:9px;padding:10px 14px;font-size:13px;font-weight:600;cursor:pointer;color:var(--purple);font-family:'Inter',sans-serif;transition:all 0.15s">📚 Learning (${learningCount})</button>` : ''}
  ${understoodCount > 0 ? `<button onclick="startPatternPractice({ids:${understoodIds}})" style="flex:1;background:var(--white);border:1px solid var(--green-border);border-radius:9px;padding:10px 14px;font-size:13px;font-weight:600;cursor:pointer;color:var(--green);font-family:'Inter',sans-serif;transition:all 0.15s">✅ Learned (${understoodCount})</button>` : ''}
</div>

<div class="filter-row">
  <button class="filter-chip${V.patFilter === 'learning' ? ' on' : ''}" onclick="setPatFilter('learning')" aria-pressed="${V.patFilter === 'learning'}" type="button">📚 Learning</button>
  <button class="filter-chip${V.patFilter === 'due' ? ' on' : ''}" onclick="setPatFilter('due')" aria-pressed="${V.patFilter === 'due'}" type="button">🔁 Due</button>
  <button class="filter-chip${V.patFilter === 'understood' ? ' on' : ''}" onclick="setPatFilter('understood')" aria-pressed="${V.patFilter === 'understood'}" type="button">✅ Understood</button>
  <button class="filter-chip${V.patFilter === 'all' ? ' on' : ''}" onclick="setPatFilter('all')" aria-pressed="${V.patFilter === 'all'}" type="button">All</button>
</div>

${cards}
  </div>`;
}

function setPatFilter(f) { V.patFilter = normalizePatternFilter(f); commitState(); }

const PATTERN_INFORMAL_EXAMPLES = {
  polite_request_modal: { de: 'Könntest du bitte langsamer sprechen?', en: 'Could you please speak more slowly?' },
  ask_write_down: { de: 'Kannst du das bitte aufschreiben?', en: 'Can you write that down, please?' },
  ask_explain_again: { de: 'Kannst du das kurz erklären?', en: 'Can you briefly explain that?' },
  ask_availability: { de: 'Hast du diese Woche Zeit?', en: 'Do you have time this week?' },
  works_for_you: { de: 'Passt dir Dienstagvormittag?', en: 'Does Tuesday morning work for you?' },
  call_about: { de: 'Ich rufe wegen deiner Nachricht an.', en: 'I am calling about your message.' },
  written_confirmation: { de: 'Kannst du mir das schriftlich bestätigen?', en: 'Can you confirm that in writing for me?' },
  would_possible: { de: 'Könnte ich später kommen?', en: 'Could I come later?' },
  send_followup: { de: 'Ich schicke dir später den Link.', en: 'I will send you the link later.' },
  plan_invite: { de: 'Hättest du Lust, einen Kaffee zu trinken?', en: 'Would you like to have a coffee?' },
  let_know: { de: 'Sag mir Bescheid, wenn du da bist.', en: 'Let me know when you are there.' },
};

function informalPatternExample(pattern) {
  if (PATTERN_INFORMAL_EXAMPLES[pattern.id]) return PATTERN_INFORMAL_EXAMPLES[pattern.id];
  return (pattern.examples || []).find(e => /\b(du|dir|dich|dein|deine|deiner|deinem|deinen)\b/i.test(e.de)) || null;
}

function renderPatternCard(p, i) {
  const und = DB.understood.has(p.id);
  const cat = PAT_CATS.find(c => c.id === p.cat);
  const tpl = p.template.replace(/\[([^\]]+)\]/g, '<span class="pat-blank">[$1]</span>');
  const informal = informalPatternExample(p);
  return `<div class="pc${und ? ' und' : ''}" id="pc-${p.id}">
${cat ? `<span class="pat-cat-tag">${cat.icon} ${cat.label}</span>` : ''}
<div class="pat-template" lang="de">${tpl}</div>
<div class="pat-meaning">${p.meaning}</div>
<div class="pat-examples">${p.examples.map((e, ei) => `<div class="pat-ex"><div class="pat-de" lang="de"><button class="pat-ex-speak" onclick="event.stopPropagation();speak(${jsArg(e.de)},'pex-${p.id}-${ei}')" title="Listen" type="button">🔊</button> ${esc(e.de)}</div><div class="pat-en">${esc(e.en)}</div></div>`).join('')}</div>
${informal ? `<div class="pat-informal">
  <div class="pat-informal-label">Informal example</div>
  <div class="pat-informal-de" lang="de"><button class="pat-ex-speak" onclick="event.stopPropagation();speak(${jsArg(informal.de)},'pinf-${p.id}')" title="Listen" type="button">🔊</button> ${esc(informal.de)}</div>
  <div class="pat-informal-en">${esc(informal.en)}</div>
</div>` : ''}
<div class="pat-actions">
  <button class="act-btn${und ? ' is-learned' : ''}" onclick="toggleUnderstood('${p.id}')">
    ${ICO.check} ${und ? 'Understood ✓' : 'Mark understood'}
  </button>
  <button class="act-btn speak-btn" data-id="p${p.id}" onclick="speak(${jsArg(p.examples[0].de)},'p${p.id}')" type="button">
    ${ICO.speak} Listen
  </button>
  <button class="act-btn" onclick="startPatternPractice({ids:['${p.id}']})" style="color:var(--purple)">
    🧩 Practice
  </button>
</div>
  </div>`;
}

// ─── SAVED / LIBRARY ─────────────────────────
function setLibTab(tab) { V.libTab = VALID_LIBRARY_TABS.has(tab) ? tab : 'saved'; commitState(); }

function renderSaved() {
  const favSents = SENTENCES.filter(s => DB.favorites.has(s.id));
  const learnedSents = SENTENCES.filter(s => DB.learned.has(s.id));
  const tabs = `<div class="lib-tabs">
<button class="lib-tab${V.libTab === 'saved' ? ' on' : ''}" onclick="setLibTab('saved')">⭐ Saved (${favSents.length})</button>
<button class="lib-tab${V.libTab === 'learned' ? ' on' : ''}" onclick="setLibTab('learned')">📗 Learned (${learnedSents.length})</button>
  </div>`;

  // SRS due-for-review section
  const reviewIds = getSrsReviewIds();
  const reviewSents = reviewIds.map(id => SENTENCES.find(s => s.id === id)).filter(Boolean);
  const reviewSection = reviewSents.length ? (() => {
    const ids = JSON.stringify(reviewSents.map(s => s.id)).replace(/"/g, "'");
    return `<div class="review-section">
  <div class="review-section-hdr">
    <div class="review-section-title">🔁 Due for Review <span class="review-count-badge">${reviewSents.length}</span></div>
    <button class="review-practice-btn" onclick="startPractice({ids:${ids},isSRS:true})">Practice Now</button>
  </div>
  <div class="review-section-sub">These sentences are scheduled for review today - spaced repetition in action!</div>
</div>`;
  })() : '';

  if (V.libTab === 'learned') return renderLearnedTab(tabs, learnedSents, reviewSection);
  if (!favSents.length) return `<div style="padding-top:14px"><h2 class="page-title">Library</h2>${tabs}${reviewSection}<div class="empty-state" style="padding-top:40px"><div class="empty-icon">⭐</div>No saved sentences yet.<br><span style="font-size:13px">Tap ⭐ Save on any card.</span></div></div>`;
  const favIds = JSON.stringify(favSents.map(s => s.id)).replace(/"/g, "'");
  return `<div style="padding-top:14px"><h2 class="page-title">Library</h2>${tabs}${reviewSection}
<div class="learned-cta">
  <div class="learned-cta-info">
    <div class="learned-cta-title">⭐ ${favSents.length} saved sentence${favSents.length !== 1 ? 's' : ''}</div>
    <div class="learned-cta-sub">Practice your saved sentences</div>
  </div>
  <button class="learned-practice-btn" onclick="startPractice({ids:${favIds}})">🎯 Practice All</button>
</div>
${favSents.map((s, i) => renderSentenceCard(s, i, true)).join('')}</div>`;
}

function renderLearnedTab(tabs, learnedSents, reviewSection) {
  if (!learnedSents.length) return `<div style="padding-top:14px"><h2 class="page-title">Library</h2>${tabs}<div class="empty-state" style="padding-top:40px"><div class="empty-icon">📗</div>No learned sentences yet.<br><span style="font-size:13px">Mark sentences ✓ Done to track your progress.</span></div></div>`;

  // SRS due sentences
  const dueIds = getSrsReviewIds();
  const dueSents = dueIds.map(id => SENTENCES.find(s => s.id === id)).filter(Boolean);

  // Sentences reviewed today (practiced via SRS today, now scheduled for future)
  const td = todayISO();
  const reviewedTodaySents = learnedSents.filter(s => {
    const srs = DB.srs[s.id];
    return srs && srs.lastReview === td && !dueIds.includes(s.id);
  });

  const dueIdsJson = JSON.stringify(dueSents.map(s => s.id)).replace(/"/g, "'");

  // Due for practice section with individual cards
  const dueSection = dueSents.length ? `
    <div class="review-section">
      <div class="review-section-hdr">
        <div class="review-section-title">🔁 Due for Review <span class="review-count-badge">${dueSents.length}</span></div>
        <button class="review-practice-btn" onclick="startPractice({ids:${dueIdsJson},isSRS:true})">🎯 Practice Due</button>
      </div>
      <div class="review-section-sub">These sentences are scheduled for review today — spaced repetition in action!</div>
    </div>
    ${dueSents.map((s, i) => renderSentenceCard(s, i, true)).join('')}
  ` : `<div style="background:var(--green-bg);border:1px solid var(--green-border);border-radius:14px;padding:18px;margin-bottom:16px;text-align:center">
      <div style="font-size:15px;font-weight:700;color:var(--green)">✅ All caught up!</div>
      <div style="font-size:12px;color:var(--text-3);margin-top:4px">No sentences due for review right now. Check back later!</div>
    </div>`;

  // Reviewed today section
  const reviewedSection = reviewedTodaySents.length ? `
    <div class="sec-lbl">✅ Reviewed Today (${reviewedTodaySents.length})</div>
    ${reviewedTodaySents.map((s, i) => renderSentenceCard(s, i, true)).join('')}
  ` : '';

  // All learned section
  const allSection = `
    <div class="sec-lbl">📗 All Learned (${learnedSents.length})</div>
    ${learnedSents.map((s, i) => renderSentenceCard(s, i, true)).join('')}
  `;

  return `<div style="padding-top:14px">
<h2 class="page-title">Library</h2>
${tabs}
${dueSection}
${reviewedSection}
${allSection}
  </div>`;
}

// ─── STATS ───────────────────────────────────
function pct(got, total) { return total ? Math.round(got / total * 100) : 0; }
function aggregateAttempts(attempts, keyFn) {
  const map = {};
  attempts.forEach(a => {
    const key = keyFn(a);
    if (!key) return;
    if (!map[key]) map[key] = { got: 0, again: 0, skip: 0, total: 0 };
    if (a.result === 'got' || a.result === 'manual') map[key].got++;
    else if (a.result === 'again') map[key].again++;
    else if (a.result === 'skip') map[key].skip++;
    if (a.result !== 'skip') map[key].total++;
  });
  return map;
}
function reviewForecast(days = 7) {
  return Array.from({ length: days }, (_, i) => {
    const key = addDaysISO(i);
    const count = Object.values(DB.srs).filter(s => s.nextReview === key).length;
    return { key, count, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : parseDateKey(key).toLocaleDateString('en-DE', { weekday: 'short' }) };
  });
}
function renderStats() {
  const tot = SENTENCES.length, done = DB.learned.size, fav = DB.favorites.size, und = DB.understood.size;
  const completion = pct(done, tot);
  const lvColors = { A1: '#16A34A', A2: '#D97706' };
  const byLevel = ['A1', 'A2'].map(lv => {
    const lvS = SENTENCES.filter(s => s.lv === lv); const lvD = lvS.filter(s => DB.learned.has(s.id)).length;
    return { lv, done: lvD, tot: lvS.length, pct: pct(lvD, lvS.length) };
  });
  const histRows = [];
  for (let i = 6; i >= 0; i--) {
    const key = addDaysISO(-i);
    const cnt = DB.attempts.filter(a => a.date === key && a.result !== 'skip').length + DB.patternAttempts.filter(a => a.date === key && a.result !== 'skip').length;
    const d = parseDateKey(key);
    const label = i === 0 ? 'Today' : i === 1 ? 'Yest' : d.toLocaleDateString('en-DE', { weekday: 'short' });
    histRows.push({ label, cnt, isToday: i === 0 });
  }
  const maxH = Math.max(...histRows.map(r => r.cnt), 1);
  const studiedDates = new Set([...DB.attempts, ...DB.patternAttempts].filter(a => a.result !== 'skip').map(a => a.date));
  Object.keys(DB.historyWords).forEach(k => studiedDates.add(k));
  const reviewDue = getSrsReviewIds().length;
  const patternDue = getPatternReviewIds().length;
  const overdue = Object.values(DB.srs).filter(s => s.nextReview && s.nextReview < today()).length;
  const srsTotal = Object.keys(DB.srs).length;
  const srsLvl5plus = Object.entries(DB.srs).filter(([id, v]) => DB.learned.has(id) && v.level >= 5).length;
  const newToday = (DB.historyWords[today()] || []).length;
  const reviewsToday = DB.attempts.filter(a => a.date === today() && a.wasDue && a.result !== 'skip').length;
  const sentenceAgg = aggregateAttempts(DB.attempts, a => a.id);
  const topicAgg = aggregateAttempts(DB.attempts, a => a.topic);
  const dirAgg = aggregateAttempts(DB.attempts, a => a.direction);
  const patternAgg = aggregateAttempts(DB.patternAttempts, a => a.id);
  const weakSentences = Object.entries(sentenceAgg)
    .map(([id, s]) => ({ id, ...s, acc: pct(s.got, s.total) }))
    .filter(s => s.total >= 1 && (s.again > 0 || s.acc < 70))
    .sort((a, b) => b.again - a.again || a.acc - b.acc)
    .slice(0, 5);
  const weakPatterns = Object.entries(patternAgg)
    .map(([id, s]) => ({ id, ...s, acc: pct(s.got, s.total) }))
    .filter(s => s.total >= 1 && (s.again > 0 || s.acc < 70))
    .sort((a, b) => b.again - a.again || a.acc - b.acc)
    .slice(0, 5);
  const topicRows = Object.entries(topicAgg)
    .map(([id, s]) => ({ topic: TOPICS.find(t => t.id === id), ...s, acc: pct(s.got, s.total) }))
    .filter(r => r.topic && r.total > 0)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 5);
  const forecast = reviewForecast(7);
  const maxForecast = Math.max(...forecast.map(r => r.count), 1);

  const barChart = `<div class="hist-chart">
${histRows.map(r => {
    const heightPct = Math.max(Math.round(r.cnt / maxH * 100), r.cnt > 0 ? 8 : 0);
    return `<div class="hist-col"><div class="hist-bar-wrap"><div class="hist-bar-inner${r.isToday ? ' today' : ''}${r.cnt === 0 ? ' zero' : ''}" style="height:${heightPct}%">${r.cnt > 0 ? `<span class="hist-bar-num">${r.cnt}</span>` : ''}</div></div><div class="hist-day-lbl${r.isToday ? ' today' : ''}">${r.label}</div></div>`;
  }).join('')}
  </div>`;
  const forecastChart = `<div class="stats-chart-title"><strong>Review Forecast</strong><span>Next 7 days of scheduled sentence reviews</span></div>
  <div class="forecast-row">${forecast.map(r => `<div class="forecast-day"><div class="forecast-count">${r.count}</div><div class="forecast-bar"><span style="height:${Math.max(8, Math.round(r.count / maxForecast * 100))}%"></span></div><div class="forecast-label">${r.label}</div></div>`).join('')}</div>`;

  return `<div style="padding-top:14px">
<h2 class="page-title">Statistics</h2>
<p class="page-sub">Progress, recall quality, and what needs attention next</p>
<div class="stats-grid">
  <div class="stat-box"><div class="stat-lbl">Sentences Learned</div><div class="stat-num" style="color:var(--green)">${done}</div><div class="stat-sub">of ${tot} sentences</div></div>
  <div class="stat-box"><div class="stat-lbl">Completion</div><div class="stat-num" style="color:var(--accent)">${completion}%</div><div class="stat-sub">overall progress</div></div>
  <div class="stat-box"><div class="stat-lbl">Streak</div><div class="stat-num">🔥 ${DB.streak}</div><div class="stat-sub">study days in a row</div></div>
  <div class="stat-box"><div class="stat-lbl">Days Studied</div><div class="stat-num" style="color:var(--blue)">${studiedDates.size}</div><div class="stat-sub">with activity</div></div>
</div>
<div class="stats-grid stats-grid-three">
  <div class="stat-box"><div class="stat-lbl">New Today</div><div class="stat-num" style="color:var(--green)">${newToday}</div><div class="stat-sub">sentences learned</div></div>
  <div class="stat-box"><div class="stat-lbl">Reviews Today</div><div class="stat-num" style="color:var(--amber)">${reviewsToday}</div><div class="stat-sub">due cards answered</div></div>
  <div class="stat-box"><div class="stat-lbl">Patterns</div><div class="stat-num" style="color:var(--purple)">${und}</div><div class="stat-sub">${patternDue} due</div></div>
</div>

<div class="stats-sec-hdr">🔁 Spaced Repetition</div>
<div class="stats-grid stats-grid-three">
  <div class="stat-box"><div class="stat-lbl">Due Today</div><div class="stat-num" style="color:${reviewDue > 0 ? 'var(--amber)' : 'var(--green)'}">${reviewDue}</div><div class="stat-sub">sentence reviews</div></div>
  <div class="stat-box"><div class="stat-lbl">Overdue</div><div class="stat-num" style="color:${overdue > 0 ? 'var(--red)' : 'var(--green)'}">${overdue}</div><div class="stat-sub">before today</div></div>
  <div class="stat-box"><div class="stat-lbl">Mastered</div><div class="stat-num" style="color:var(--green)">${srsLvl5plus}</div><div class="stat-sub">of ${srsTotal} scheduled</div></div>
</div>
${forecastChart}

	<div class="stats-sec-hdr">📅 Practice Activity - Past 7 Days</div>
${barChart}

<div class="stats-sec-hdr">🎯 Accuracy By Direction</div>
${['de2en', 'en2de', 'type'].map(dir => {
    const row = dirAgg[dir] || { got: 0, total: 0 };
    const label = dir === 'de2en' ? 'German → English' : dir === 'en2de' ? 'English → German' : 'Typed German';
    return `<div class="prog-row"><div class="prog-lbl" style="min-width:130px">${label}</div><div class="prog-bar"><div class="prog-fill" style="width:${pct(row.got, row.total)}%;background:var(--blue)"></div></div><div class="prog-pct">${pct(row.got, row.total)}%</div><div class="prog-cnt">${row.got}/${row.total}</div></div>`;
  }).join('')}

<div class="stats-sec-hdr">⚠️ Needs Attention</div>
${weakSentences.length ? weakSentences.map(w => {
    const s = SENTENCES.find(x => x.id === w.id);
    return s ? `<div class="insight-row"><div><strong lang="de">${esc(s.de)}</strong><span>${esc(s.en)}</span></div><button onclick="startPractice({ids:['${w.id}'],skipSessionFilter:true})">Practice</button></div>` : '';
  }).join('') : '<div class="empty-mini">No weak sentence data yet. Practice a few sessions first.</div>'}

<div class="stats-sec-hdr">📊 Weak Topics</div>
${topicRows.length ? topicRows.map(r => `<div class="prog-row"><div class="prog-lbl" style="min-width:130px">${r.topic.emoji} ${r.topic.name}</div><div class="prog-bar"><div class="prog-fill" style="width:${r.acc}%;background:var(--amber)"></div></div><div class="prog-pct">${r.acc}%</div><div class="prog-cnt">${r.got}/${r.total}</div></div>`).join('') : '<div class="empty-mini">Topic accuracy appears after practice attempts.</div>'}

<div class="stats-sec-hdr">🧩 Hardest Patterns</div>
${weakPatterns.length ? weakPatterns.map(w => {
    const p = PATTERNS.find(x => x.id === w.id);
    return p ? `<div class="insight-row"><div><strong lang="de">${esc(p.template)}</strong><span>${esc(p.meaning)} · ${w.acc}% accuracy</span></div><button onclick="startPatternPractice({ids:['${w.id}']})">Practice</button></div>` : '';
  }).join('') : '<div class="empty-mini">Pattern accuracy appears after pattern practice.</div>'}

<div class="stats-sec-hdr">📊 By Level</div>
${byLevel.map(l => `<div class="prog-row">
  <div class="prog-lbl" style="color:${lvColors[l.lv]};font-weight:700">${l.lv}</div>
  <div class="prog-bar"><div class="prog-fill" style="width:${l.pct}%;background:${lvColors[l.lv]}"></div></div>
  <div class="prog-pct" style="color:${lvColors[l.lv]};font-weight:600">${l.pct}%</div>
  <div class="prog-cnt">${l.done}/${l.tot}</div>
</div>`).join('')}

	<div class="stats-sec-hdr">💾 Data</div>
	<div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
	  <button onclick="exportData()" style="flex:1;background:var(--white);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:13px;font-weight:500;cursor:pointer;color:var(--text-2);font-family:'Inter',sans-serif;transition:all 0.15s">📤 Export Backup</button>
  <button onclick="importData()" style="flex:1;background:var(--white);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:13px;font-weight:500;cursor:pointer;color:var(--text-2);font-family:'Inter',sans-serif;transition:all 0.15s">📥 Import Backup</button>
</div>
  </div>`;
}

// ══════════════════════════════════════════════
// ACTIONS
// ══════════════════════════════════════════════
function toggleReveal(id) {
  const en = document.getElementById('en-' + id), hn = document.getElementById('hn-' + id), rd = document.getElementById('rd-' + id), card = document.getElementById('sc-' + id);
  if (!en) return;
  if (en.classList.contains('hid')) {
    en.hidden = false;
    en.setAttribute('aria-hidden', 'false');
    en.classList.remove('hid');
    if (hn) hn.style.display = 'none';
    if (rd) rd.style.display = 'block';
    if (card) card.querySelectorAll('.reveal-btn').forEach(btn => btn.setAttribute('aria-expanded', 'true'));
  } else {
    en.classList.add('hid');
    en.hidden = true;
    en.setAttribute('aria-hidden', 'true');
    if (hn) hn.style.display = 'block';
    if (rd) rd.style.display = 'none';
    if (card) card.querySelectorAll('.reveal-btn').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
  }
}

function toggleLearned(id) {
  const was = DB.learned.has(id);
  if (was) {
    unmarkSentenceLearned(id);
  }
  else {
    markSentenceLearned(id, 'manual');
  }
  const card = document.getElementById('sc-' + id);
  if (card) {
    card.classList.toggle('lrn', DB.learned.has(id));
    const btn = document.getElementById('lrn-btn-' + id);
    if (btn) { btn.className = DB.learned.has(id) ? 'act-btn is-learned' : 'act-btn'; btn.innerHTML = ICO.check + (DB.learned.has(id) ? ' Learned' : ' Mark done'); }
    const badge = card.querySelector('.lrn-badge');
    if (DB.learned.has(id) && !badge) { const top = card.querySelector('.sc-top'); if (top) { const s = document.createElement('span'); s.className = 'lrn-badge'; s.textContent = '✓ Learned'; top.appendChild(s); } }
    else if (!DB.learned.has(id) && badge) badge.remove();
  }
  updateHeader();
}

function toggleFav(id) {
  DB.favorites.has(id) ? DB.favorites.delete(id) : DB.favorites.add(id); save();
  const card = document.getElementById('sc-' + id);
  if (card) {
    card.classList.toggle('fav', DB.favorites.has(id));
    const btn = document.getElementById('fav-btn-' + id);
    if (btn) { btn.className = DB.favorites.has(id) ? 'act-btn is-fav' : 'act-btn'; btn.innerHTML = ICO.star + (DB.favorites.has(id) ? ' Saved' : ' Save'); }
  }
}

function toggleUnderstood(id) {
  if (DB.understood.has(id)) {
    DB.understood.delete(id);
    delete DB.patternSrs[id];
  } else {
    DB.understood.add(id);
    if (!DB.patternSrs[id]) DB.patternSrs[id] = initialSrsState();
    recordPatternAttempt({ id, result: 'got', intervalBefore: 0, intervalAfter: DB.patternSrs[id].interval, wasDue: false });
    recordStudy();
  }
  save();
  const card = document.getElementById('pc-' + id);
  if (card) {
    card.classList.toggle('und', DB.understood.has(id));
    const btn = card.querySelector('.act-btn');
    if (btn) { btn.className = DB.understood.has(id) ? 'act-btn is-learned' : 'act-btn'; btn.innerHTML = ICO.check + (DB.understood.has(id) ? ' Understood ✓' : ' Mark understood'); }
  }
}

function setFilter(f) { V.filter = VALID_FILTERS.has(f) ? f : 'all'; commitState(); }
function setQuery(q) { V.query = q; clearTimeout(window._qt); window._qt = setTimeout(render, 300); }
function refreshQueue() { DB.dailyQueueDate = null; save(); nav('today'); }

// ─── TTS ─────────────────────────────────────
// ── TTS Engine ──────────────────────────────────────────────────────────────
// Strategy:
//   Use external German TTS on desktop by default, falling back to browser
//   Web Speech when remote audio is unavailable. Mobile stays on Web Speech.

const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
// Brave exposes navigator.brave (an object with .isBrave())
const isBrave = !!(navigator.brave);

let _ttsAudio = null;
let _bestVoice = null;
let _voicesLoaded = false;
let _ttsRunId = 0;

// Pick the best available German voice
function pickBestGermanVoice() {
  if (!window.speechSynthesis) return null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  const deVoices = voices.filter(v => v.lang.startsWith('de'));
  if (!deVoices.length) return null;

  const priority = [
    v => /google/i.test(v.name) && /deutsch|german|de/i.test(v.name),
    v => /microsoft.*katja|microsoft.*hedda|microsoft.*stefan/i.test(v.name),
    v => /microsoft/i.test(v.name) && deVoices.includes(v),
    v => /neural|natural|premium|enhanced/i.test(v.name) && deVoices.includes(v),
    v => /anna|german|deutsch/i.test(v.name) && deVoices.includes(v),
    v => deVoices.includes(v),
  ];

  for (const test of priority) {
    const match = deVoices.find(test);
    if (match) return match;
  }
  return deVoices[0];
}

// Pre-load voices; also retry on voiceschanged (Chrome fires it async)
function _initVoices() {
  const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  _bestVoice = pickBestGermanVoice();
  _voicesLoaded = voices.length > 0;
}
if (window.speechSynthesis) {
  speechSynthesis.onvoiceschanged = _initVoices;
  _initVoices(); // synchronous browsers (Firefox, some mobile)
}

// External TTS API cascade. Local file mode keeps the direct browser behavior,
// while deployed HTTPS pages use the same-origin Vercel proxy first.
const TTS_AUDIO_START_TIMEOUT_MS = 3500;
const WEB_SPEECH_VOICE_WAIT_MS = 450;
const TTS_LOCAL_ENGINES = [
  (text) => `https://api.streamelements.com/kappa/v2/speech?voice=de-DE-Wavenet-C&text=${encodeURIComponent(text)}`,
  (text) => `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=de&client=gtx`,
];
const TTS_HOSTED_ENGINES = [
  (text) => `/api/tts?text=${encodeURIComponent(text)}`,
];

function isLocalFilePage() {
  return !window.location || window.location.protocol === 'file:';
}

function ttsEnginesForCurrentPage() {
  return isLocalFilePage() ? TTS_LOCAL_ENGINES : TTS_HOSTED_ENGINES;
}

function waitForGermanVoice(callback) {
  if (!window.speechSynthesis) { callback(); return; }
  _bestVoice = pickBestGermanVoice();
  if (_bestVoice || _voicesLoaded) { callback(); return; }

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    if (speechSynthesis.removeEventListener) speechSynthesis.removeEventListener('voiceschanged', finish);
    _bestVoice = pickBestGermanVoice();
    _voicesLoaded = true;
    callback();
  };
  const timer = setTimeout(finish, WEB_SPEECH_VOICE_WAIT_MS);
  if (speechSynthesis.addEventListener) {
    speechSynthesis.addEventListener('voiceschanged', finish, { once: true });
  } else {
    const previous = speechSynthesis.onvoiceschanged;
    speechSynthesis.onvoiceschanged = () => {
      if (typeof previous === 'function') previous();
      finish();
    };
  }
}

function speak(text, id) {
  // Toggle off if same sentence is already playing
  if (V.speaking === id) {
    _ttsRunId++;
    if (_ttsAudio) { _ttsAudio.pause(); _ttsAudio = null; }
    else if (window.speechSynthesis) speechSynthesis.cancel();
    V.speaking = null; updateSpeakBtns(); return;
  }

  // Cancel whatever is playing
  const runId = ++_ttsRunId;
  if (_ttsAudio) { _ttsAudio.pause(); _ttsAudio = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
  V.speaking = id; updateSpeakBtns();

  let finished = false;
  const done = () => {
    if (finished || runId !== _ttsRunId) return;
    finished = true;
    V.speaking = null; updateSpeakBtns(); _ttsAudio = null;
  };

  function speakWithWebSpeech() {
    if (!window.speechSynthesis) { done(); return; }
    waitForGermanVoice(() => {
      if (runId !== _ttsRunId) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'de-DE';
      u.rate = 0.82;
      u.pitch = 1;
      u.volume = 1;
      if (_bestVoice) u.voice = _bestVoice;
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
    });
  }

  if (isLocalFilePage() && isMobile) {
    speakWithWebSpeech();
    return;
  }

  // ── Desktop: try external APIs, fall back to Web Speech ─────────────────
  function tryEngine(idx) {
    const engines = ttsEnginesForCurrentPage();
    if (idx >= engines.length) {
      speakWithWebSpeech();
      return;
    }
    const audio = new Audio();
    _ttsAudio = audio;
    let errored = false;
    let startTimer = null;
    const clearStartTimer = () => {
      if (startTimer) clearTimeout(startTimer);
      startTimer = null;
    };
    const fail = () => {
      if (errored || finished || runId !== _ttsRunId) return;
      errored = true;
      clearStartTimer();
      _ttsAudio = null;
      tryEngine(idx + 1);
    };
    audio.onplaying = clearStartTimer;
    audio.onended = () => { clearStartTimer(); done(); };
    audio.onerror = fail;
    audio.src = engines[idx](text);
    audio.playbackRate = 0.85;
    startTimer = setTimeout(fail, TTS_AUDIO_START_TIMEOUT_MS);
    audio.play().then(clearStartTimer).catch(fail);
  }
  tryEngine(0);
}
function practiceFav(id) {
  DB.favorites.has(id) ? DB.favorites.delete(id) : DB.favorites.add(id);
  save();
  const btn = document.getElementById('prac-fav-' + id);
  if (btn) {
    const on = DB.favorites.has(id);
    btn.className = 'prac-fav-btn' + (on ? ' on' : '');
    btn.title = on ? 'Remove from saved' : 'Save sentence';
  }
}

function updateSpeakBtns() {
  document.querySelectorAll('.speak-btn').forEach(btn => {
    const id = btn.dataset.id;
    if (V.speaking === id) { btn.className = 'act-btn is-playing speak-btn'; btn.innerHTML = ICO.speak + '<span class="pulse"> Playing…</span>'; }
    else { btn.className = 'act-btn speak-btn'; btn.innerHTML = ICO.speak + ' Listen'; }
  });
}

function openGoalModal() {
  document.getElementById('goal-opts').innerHTML = [5, 8, 10, 12, 15, 20, 25, 30].map(v => `<button class="goal-opt${DB.dailyGoal === v ? ' sel' : ''}" onclick="setGoal(${v})" aria-pressed="${DB.dailyGoal === v}" type="button">${v}</button>`).join('');
  document.getElementById('goal-modal').style.display = 'flex';
  const selected = document.querySelector('.goal-opt.sel');
  if (selected) selected.focus();
}
function closeGoalModal(e) { if (!e || e.target === document.getElementById('goal-modal')) document.getElementById('goal-modal').style.display = 'none'; render(); }
function setGoal(n) {
  DB.dailyGoal = n; DB.dailyQueueDate = null; _sessionGotIt = new Set(); save();
  document.querySelectorAll('.goal-opt').forEach(el => {
    const selected = parseInt(el.textContent) === n;
    el.classList.toggle('sel', selected);
    el.setAttribute('aria-pressed', String(selected));
  });
}

// ==============================
// PRACTICE MODE
// ==============================
let P = { active: false, queue: [], idx: 0, revealed: false, got: 0, again: 0, skipped: 0, isSRS: false, dir: 'de2en', dirChoice: true, answered: {}, missedIds: [], typedFeedback: null };
let PP = { active: false, queue: [], idx: 0, revealed: false, got: 0, again: 0, skipped: 0, answered: {} };

function startPractice(opts) {
  const ids = Array.isArray(opts) ? opts : opts.ids;
  const isSRS = Array.isArray(opts) ? false : (opts.isSRS || false);
  const skipSessionFilter = Array.isArray(opts) ? false : (opts.skipSessionFilter || false);
  let sents = ids.map(id => SENTENCES.find(s => s.id === id)).filter(Boolean);
  // Filter out cards already mastered ("Got it") in this session
  if (!isSRS && !skipSessionFilter) sents = sents.filter(s => !_sessionGotIt.has(s.id));
  if (!sents.length) {
    // All cards already done in this session
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:var(--green);color:white;padding:10px 20px;border-radius:99px;font-size:13px;font-weight:600;z-index:400;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
    toast.textContent = '✅ All cards mastered this session. Review saved phrases or start a new batch when ready.';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
    return;
  }
  P = { active: true, queue: shuffle([...sents]), idx: 0, revealed: false, got: 0, again: 0, skipped: 0, isSRS, dir: 'de2en', dirChoice: true, answered: {}, missedIds: [], typedFeedback: null };
  renderPractice();
}

function setPracticeDir(dir) {
  P.dir = dir;
  P.dirChoice = false;
  renderPractice();
}

function isRecognitionSentence(sentence) {
  return Boolean(sentence && (sentence.recognitionOnly || (sentence.learn && sentence.learn.mode === 'recognition')));
}

function effectivePracticeDirection(sentence) {
  return isRecognitionSentence(sentence) ? 'de2en' : P.dir;
}

function renderPractice() {
  const existing = document.getElementById('practice-overlay');
  if (existing) existing.remove();
  if (!P.active) return;

  const ov = document.createElement('div');
  ov.id = 'practice-overlay';
  ov.className = 'practice-overlay';

  // ── Direction choice screen ──────────────────
  if (P.dirChoice) {
    const total = P.queue.length;
    ov.innerHTML = `
  <div class="practice-hdr">
    <button class="practice-exit" onclick="closePractice()">Exit</button>
    <div style="font-size:15px;font-weight:700;color:var(--text)">${total} card${total !== 1 ? 's' : ''} ready</div>
    <div style="width:44px"></div>
  </div>
  <div class="practice-body">
    <div class="dir-choice-wrap">
      <div class="dir-choice-title">Choose Practice Mode</div>
      <div class="dir-choice-sub">How do you want to drill these cards?</div>
      <button class="dir-btn primary" onclick="setPracticeDir('de2en')">
        <span class="dir-btn-icon">🇩🇪</span>
        <div>
          <div class="dir-btn-title">German → English</div>
          <div class="dir-btn-sub">See German, recall the translation</div>
        </div>
      </button>
      <button class="dir-btn" onclick="setPracticeDir('en2de')">
        <span class="dir-btn-icon">🇬🇧</span>
        <div>
          <div class="dir-btn-title" style="color:var(--text)">English → German</div>
          <div class="dir-btn-sub" style="color:var(--text-3)">See English, recall the German sentence</div>
        </div>
      </button>
      <button class="dir-btn" onclick="setPracticeDir('type')">
        <span class="dir-btn-icon">⌨️</span>
        <div>
          <div class="dir-btn-title" style="color:var(--text)">Type German</div>
          <div class="dir-btn-sub" style="color:var(--text-3)">Write the sentence and get quick feedback</div>
        </div>
      </button>
    </div>
  </div>`;
    document.body.appendChild(ov);
    return;
  }

  // ── Completed screen ─────────────────────────
  if (P.idx >= P.queue.length) {
    const total = P.queue.length;
    const answeredCount = Object.keys(P.answered).length;
    const pct = answeredCount ? Math.round(P.got / answeredCount * 100) : 0;
    const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '😊' : '💪';
    const title = pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good progress!' : 'Keep practicing!';
    const retryIds = JSON.stringify(P.queue.map(s => s.id)).replace(/"/g, "'");
    const missedIds = [...new Set(P.missedIds)];
    const missedBtn = missedIds.length ? `<button class="prac-sum-retry" onclick="startPractice({ids:${idsArg(missedIds)},skipSessionFilter:true})">Review misses</button>` : '';
    const srsMsg = P.isSRS ? `<div style="font-size:12px;color:var(--text-3);margin-bottom:16px">📅 SRS intervals updated - next reviews scheduled.</div>` : '';
    const modeTag = P.dir === 'type'
      ? `<div style="font-size:11px;color:var(--purple);background:var(--purple-bg);border:1px solid var(--purple-border);border-radius:99px;display:inline-block;padding:3px 10px;margin-bottom:12px">⌨️ Typed recall mode</div>`
      : P.dir === 'en2de'
      ? `<div style="font-size:11px;color:var(--blue);background:var(--blue-bg);border:1px solid var(--blue-border);border-radius:99px;display:inline-block;padding:3px 10px;margin-bottom:12px">🇬🇧 English → German mode</div>`
      : `<div style="font-size:11px;color:var(--accent);background:var(--blue-bg);border:1px solid var(--blue-border);border-radius:99px;display:inline-block;padding:3px 10px;margin-bottom:12px">🇩🇪 German → English mode</div>`;
    ov.innerHTML = `
  <div class="practice-hdr"><span style="font-size:16px;font-weight:700;color:var(--text)">Practice Complete</span></div>
  <div class="practice-body">
    <div class="prac-summary">
      <div class="prac-sum-icon">${emoji}</div>
      <div class="prac-sum-title">${title}</div>
      <div class="prac-sum-sub">You reviewed ${total} sentence${total !== 1 ? 's' : ''}</div>
      ${modeTag}
      ${srsMsg}
      <div class="prac-sum-stats">
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--green)">${P.got}</div><div class="prac-sum-l">Got it</div></div>
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--amber)">${P.again}</div><div class="prac-sum-l">Still learning</div></div>
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--text-3)">${P.skipped}</div><div class="prac-sum-l">Skipped</div></div>
      </div>
      <div class="prac-sum-actions">
        ${missedBtn}
        <button class="prac-sum-retry" onclick="startPractice({ids:${retryIds},isSRS:${P.isSRS}})">Practice Again</button>
        <button class="prac-sum-done" onclick="closePractice()">Done</button>
      </div>
    </div>
  </div>`;
  } else {
    // ── Active card ──────────────────────────────
    const s = P.queue[P.idx];
    const topic = TOPICS.find(t => t.id === s.t);
    const total = P.queue.length;
    const pct = Math.round(P.idx / total * 100);
    const gram = grammarTag(s.de);
    const safeDE = jsArg(s.de);
    const recognitionMode = isRecognitionSentence(s);
    const effectiveDir = effectivePracticeDirection(s);

    const dirLabel = recognitionMode
      ? `<span style="font-size:11px;color:var(--purple);background:var(--purple-bg);border:1px solid var(--purple-border);border-radius:99px;padding:2px 9px;font-weight:600">Recognition</span>`
      : P.dir === 'type'
      ? `<span style="font-size:11px;color:var(--purple);background:var(--purple-bg);border:1px solid var(--purple-border);border-radius:99px;padding:2px 9px;font-weight:600">⌨️ Type</span>`
      : P.dir === 'en2de'
      ? `<span style="font-size:11px;color:var(--blue);background:var(--blue-bg);border:1px solid var(--blue-border);border-radius:99px;padding:2px 9px;font-weight:600">🇬🇧→🇩🇪</span>`
      : `<span style="font-size:11px;color:var(--accent);background:var(--blue-bg);border:1px solid var(--blue-border);border-radius:99px;padding:2px 9px;font-weight:600">🇩🇪→🇬🇧</span>`;

    let cardBody;
    if (effectiveDir === 'de2en') {
      // Front: German + phonetics. Back: English + usage
      const isFav0 = DB.favorites.has(s.id);
      const recognitionReply = recognitionMode && s.learn
        ? `<div class="practice-use"><strong>You can answer:</strong> ${esc(s.learn.learnerReply || s.learn.expectedReply)}</div>`
        : '';
      cardBody = `
    <div class="practice-card">
      <button class="prac-fav-btn${isFav0 ? ' on' : ''}" id="prac-fav-${s.id}" onclick="practiceFav('${s.id}')" title="${isFav0 ? 'Remove from saved' : 'Save sentence'}">⭐</button>
      ${topic ? `<div class="practice-topic-lbl">${topic.emoji} ${topic.name} - <span class="lvl-tag l${s.lv}" style="display:inline">${s.lv}</span>${gram ? ` - <span class="gram-tag" style="color:${gram.c};background:${gram.bg}">${gram.t}</span>` : ''}</div>` : ''}
      <div class="practice-de" lang="de">${esc(s.de)}</div>
      <div class="practice-ph">🔊 ${esc(s.ph)}</div>
      ${P.revealed
          ? `<div class="practice-en">${esc(s.en)}</div><div class="practice-use">💬 ${esc(s.use)}</div>${recognitionReply}${(() => { const mp = findMatchingPattern(s); return mp ? `<div style="margin-top:8px;padding:10px 12px;background:var(--purple-bg);border:1px solid var(--purple-border);border-radius:8px"><div style="font-size:12px;font-weight:700;color:var(--purple);margin-bottom:4px">🧩 Pattern: ${esc(mp.template)}</div><div style="font-size:11px;color:var(--text-2);margin-bottom:6px">${esc(mp.meaning)}</div><div style="font-size:11px;color:var(--text-2)">${mp.examples.filter(e => e.de !== s.de).slice(0, 2).map(e => `<div style="padding:2px 0"><strong style="color:var(--text)" lang="de">${esc(e.de)}</strong> — ${esc(e.en)}</div>`).join('')}</div></div>` : '' })()}${renderRevealDetails(s, true, 'pgd-')}`
          : `<button class="practice-reveal-hint" onclick="practiceReveal()" type="button">${recognitionMode ? 'Tap to reveal meaning and response' : 'Tap to reveal translation'}</button>`}
    </div>
    <div style="display:flex;justify-content:center;margin:10px 0">
      <button class="act-btn speak-btn" data-id="prac-${s.id}" onclick="speak(${safeDE},'prac-${s.id}')" style="font-size:13px;padding:8px 18px" type="button">
        ${ICO.speak} <span id="prac-speak-lbl">Listen</span>
      </button>
    </div>
    ${P.revealed ? `
      <div class="practice-btns">
        <button class="prac-again-btn" onclick="practiceAnswer(false)">Still learning</button>
        <button class="prac-got-btn" onclick="practiceAnswer(true)">Got it!</button>
      </div>` : ''}
    <div class="kbd-hint" style="margin-top:10px">
      <span class="kbd">Space</span> show/hide &nbsp;
      <span class="kbd">←</span> prev &nbsp;
      <span class="kbd">→</span> skip
    </div>`;
    } else if (effectiveDir === 'en2de') {
      // en2de — Front: English. Back: German + phonetics + usage
      const isFav1 = DB.favorites.has(s.id);
      cardBody = `
    <div class="practice-card">
      <button class="prac-fav-btn${isFav1 ? ' on' : ''}" id="prac-fav-${s.id}" onclick="practiceFav('${s.id}')" title="${isFav1 ? 'Remove from saved' : 'Save sentence'}">⭐</button>
      ${topic ? `<div class="practice-topic-lbl">${topic.emoji} ${topic.name} - <span class="lvl-tag l${s.lv}" style="display:inline">${s.lv}</span>${gram ? ` - <span class="gram-tag" style="color:${gram.c};background:${gram.bg}">${gram.t}</span>` : ''}</div>` : ''}
      <div class="practice-de" style="font-size:19px;font-weight:700;color:var(--text);letter-spacing:-0.2px">${esc(s.en)}</div>
      ${P.revealed
          ? `<div class="practice-ph" style="margin-bottom:4px">🔊 ${esc(s.ph)}</div><div class="practice-en" style="font-size:22px;font-weight:800;color:var(--text);margin-bottom:6px" lang="de">${esc(s.de)}</div><div class="practice-use">💬 ${esc(s.use)}</div>${(() => { const mp = findMatchingPattern(s); return mp ? `<div style="margin-top:8px;padding:10px 12px;background:var(--purple-bg);border:1px solid var(--purple-border);border-radius:8px"><div style="font-size:12px;font-weight:700;color:var(--purple);margin-bottom:4px">🧩 Pattern: ${esc(mp.template)}</div><div style="font-size:11px;color:var(--text-2);margin-bottom:6px">${esc(mp.meaning)}</div><div style="font-size:11px;color:var(--text-2)">${mp.examples.filter(e => e.de !== s.de).slice(0, 2).map(e => `<div style="padding:2px 0"><strong style="color:var(--text)" lang="de">${esc(e.de)}</strong> — ${esc(e.en)}</div>`).join('')}</div></div>` : '' })()}${renderRevealDetails(s, true, 'pgd-')}`
          : `<button class="practice-reveal-hint" onclick="practiceReveal()" type="button">Tap to reveal German</button>`}
    </div>
    <div style="display:flex;justify-content:center;margin:10px 0">
      <button class="act-btn speak-btn" data-id="prac-${s.id}" onclick="speak(${safeDE},'prac-${s.id}')" style="font-size:13px;padding:8px 18px" type="button">
        ${ICO.speak} <span id="prac-speak-lbl">${P.revealed ? 'Listen' : 'Hint (audio)'}</span>
      </button>
    </div>
    ${P.revealed ? `
      <div class="practice-btns">
        <button class="prac-again-btn" onclick="practiceAnswer(false)">Still learning</button>
        <button class="prac-got-btn" onclick="practiceAnswer(true)">Got it!</button>
      </div>` : ''}
      <div class="kbd-hint" style="margin-top:10px">
      <span class="kbd">Space</span> show/hide &nbsp;
      <span class="kbd">←</span> prev &nbsp;
      <span class="kbd">→</span> skip
    </div>`;
    } else {
      const isFav2 = DB.favorites.has(s.id);
      const feedback = P.typedFeedback ? `<div class="typed-feedback ${P.typedFeedback.ok ? 'ok' : 'warn'}">${P.typedFeedback.messages.map(esc).join('<br>')}</div>` : '';
      cardBody = `
    <div class="practice-card">
      <button class="prac-fav-btn${isFav2 ? ' on' : ''}" id="prac-fav-${s.id}" onclick="practiceFav('${s.id}')" title="${isFav2 ? 'Remove from saved' : 'Save sentence'}">⭐</button>
      ${topic ? `<div class="practice-topic-lbl">${topic.emoji} ${topic.name} - <span class="lvl-tag l${s.lv}" style="display:inline">${s.lv}</span>${gram ? ` - <span class="gram-tag" style="color:${gram.c};background:${gram.bg}">${gram.t}</span>` : ''}</div>` : ''}
      <div class="practice-de" style="font-size:19px;font-weight:700;color:var(--text);letter-spacing:-0.2px">${esc(s.en)}</div>
      ${P.revealed
          ? `${feedback}<div class="practice-ph" style="margin-bottom:4px">🔊 ${esc(s.ph)}</div><div class="practice-en" style="font-size:22px;font-weight:800;color:var(--text);margin-bottom:6px" lang="de">${esc(s.de)}</div><div class="practice-use">💬 ${esc(s.use)}</div>${renderRevealDetails(s, true, 'pgd-')}`
          : `<input id="typed-answer" class="typed-answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the German sentence..." onkeydown="if(event.key==='Enter') checkTypedAnswer()" autofocus>
             <button class="practice-reveal-hint" onclick="checkTypedAnswer()" style="width:100%;margin-top:10px" type="button">Check answer</button>
             <button class="practice-skip-reveal" onclick="practiceReveal()" type="button">Reveal without typing</button>`}
    </div>
    <div style="display:flex;justify-content:center;margin:10px 0">
      <button class="act-btn speak-btn" data-id="prac-${s.id}" onclick="speak(${safeDE},'prac-${s.id}')" style="font-size:13px;padding:8px 18px" type="button">
        ${ICO.speak} <span id="prac-speak-lbl">${P.revealed ? 'Listen' : 'Audio hint'}</span>
      </button>
    </div>
    ${P.revealed ? `
      <div class="practice-btns">
        <button class="prac-again-btn" onclick="practiceAnswer(false)">Still learning</button>
        <button class="prac-got-btn" onclick="practiceAnswer(true)">Got it!</button>
      </div>` : ''}
    <div class="kbd-hint" style="margin-top:10px">
      <span class="kbd">Enter</span> check &nbsp;
      <span class="kbd">←</span> prev &nbsp;
      <span class="kbd">→</span> skip
    </div>`;
    }

    ov.innerHTML = `
  <div class="practice-hdr">
    <button class="practice-exit" onclick="closePractice()">Exit</button>
    <div class="practice-prog-wrap">
      <div class="practice-prog-bar"><div class="practice-prog-fill" style="width:${pct}%"></div></div>
      <div class="practice-prog-lbl">${P.idx + 1}/${total} · ${dirLabel} · Got ${P.got} · Learning ${P.again} · Skipped ${P.skipped}</div>
    </div>
  </div>
  <div class="practice-body">
    ${cardBody}
  </div>`;
  }
  document.body.appendChild(ov);

  // Auto-play audio for new card
  if (P.active && P.idx < P.queue.length && !P.revealed && !P.dirChoice) {
    const s = P.queue[P.idx];
    // German-front cards can safely auto-play. English-front cards keep audio as a hint.
    if (effectivePracticeDirection(s) === 'de2en') {
      if (isMobile) {
        speak(s.de, `prac-${s.id}`);
      } else {
        setTimeout(() => speak(s.de, `prac-${s.id}`), 150);
      }
    }
  }
  const input = document.getElementById('typed-answer');
  if (input) input.focus();
}

function practiceReveal() {
  P.revealed = !P.revealed;
  const currentDirection = P.idx < P.queue.length ? effectivePracticeDirection(P.queue[P.idx]) : P.dir;
  if (P.revealed && currentDirection === 'type' && !P.typedFeedback) {
    P.typedFeedback = { ok: false, messages: ['Revealed without a typed attempt.'] };
  }
  renderPractice();
  // Auto-play German audio when revealing in en2de mode
  if (P.revealed && P.idx < P.queue.length && currentDirection === 'en2de') {
    const s = P.queue[P.idx];
    setTimeout(() => speak(s.de, `prac-${s.id}`), 200);
  }
}

function normalizeTypedAnswerExact(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,!?;:"'()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeGermanNativeFold(text) {
  return normalizeTypedAnswerExact(text)
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss');
}

function normalizeGermanTransliterationFold(text) {
  return normalizeTypedAnswerExact(text)
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

function normalizeTypedAnswer(text) {
  return normalizeGermanNativeFold(text);
}

function hasCloseGermanSpelling(answer, expected) {
  const answerForms = new Set([
    normalizeTypedAnswerExact(answer),
    normalizeGermanNativeFold(answer),
    normalizeGermanTransliterationFold(answer),
  ]);
  return [
    normalizeTypedAnswerExact(expected),
    normalizeGermanNativeFold(expected),
    normalizeGermanTransliterationFold(expected),
  ].some(form => answerForms.has(form));
}

function germanSpellingMarks(text) {
  return [...new Set((String(text || '').match(/[äöüß]/gi) || []).map(ch => ch.toLowerCase()))];
}

function checkTypedAnswer() {
  if (!P.active || P.idx >= P.queue.length) return;
  const input = document.getElementById('typed-answer');
  const answer = input ? input.value : '';
  const expected = P.queue[P.idx].de;
  const exactAnswer = normalizeTypedAnswerExact(answer);
  const exactExpected = normalizeTypedAnswerExact(expected);
  const simpleAnswer = normalizeTypedAnswer(answer);
  const simpleExpected = normalizeTypedAnswer(expected);
  const messages = [];
  const ok = exactAnswer === exactExpected;
  const close = !ok && hasCloseGermanSpelling(answer, expected);
  if (ok) messages.push('Exact match.');
  else if (close) {
    const marks = germanSpellingMarks(expected);
    messages.push(`Close match. ${marks.length ? `Use the exact German spelling: ${marks.join(', ')}.` : 'Check the exact German spelling.'}`);
  }
  else {
    messages.push('Compare your answer with the sentence below.');
    const expectedWords = simpleExpected.split(' ');
    const answerWords = simpleAnswer.split(' ');
    const missingArticles = expectedWords.filter(w => ['der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen', 'einem'].includes(w) && !answerWords.includes(w));
    const missingModals = expectedWords.filter(w => ['kann', 'konnten', 'koennen', 'muss', 'mochte', 'moechte', 'soll', 'darf', 'wurde', 'wuerde'].includes(w) && !answerWords.includes(w));
    if (missingArticles.length) messages.push(`Check articles/cases: ${[...new Set(missingArticles)].join(', ')}.`);
    if (missingModals.length) messages.push(`Check modal verb: ${[...new Set(missingModals)].join(', ')}.`);
    if (expectedWords[0] && answerWords[0] && expectedWords[0] !== answerWords[0]) messages.push('Word order starts differently.');
  }
  P.typedFeedback = { ok, messages };
  P.revealed = true;
  renderPractice();
}

function practiceAnswer(got) {
  const currentCard = P.queue[P.idx];
  if (!currentCard) return;
  const attemptKey = String(P.idx);
  if (P.answered[attemptKey]) {
    P.idx++; P.revealed = false; P.typedFeedback = null; renderPractice();
    return;
  }

  const wasLearned = DB.learned.has(currentCard.id);
  const intervalBefore = DB.srs[currentCard.id] ? DB.srs[currentCard.id].interval || 0 : 0;
  const wasDue = Boolean(DB.srs[currentCard.id] && DB.srs[currentCard.id].nextReview && DB.srs[currentCard.id].nextReview <= today());
  let intervalAfter = intervalBefore;
  recordStudy();
  DB.dailyQueueDone.add(currentCard.id);

  if (got) {
    P.got++;
    P.answered[attemptKey] = 'got';
    _sessionGotIt.add(currentCard.id);
    if (wasLearned) intervalAfter = srsSchedule(currentCard.id, true).intervalAfter;
    else { markSentenceLearned(currentCard.id, 'practice'); intervalAfter = DB.srs[currentCard.id].interval; }
  } else {
    P.again++;
    P.answered[attemptKey] = 'again';
    P.missedIds.push(currentCard.id);
    if (wasLearned) intervalAfter = srsSchedule(currentCard.id, false).intervalAfter;
    if (!P.queue.slice(P.idx + 1).some(s => s.id === currentCard.id)) {
      const insertAt = Math.min(P.queue.length, P.idx + 3);
      P.queue.splice(insertAt, 0, currentCard);
    }
  }
  recordAttempt({ id: currentCard.id, result: got ? 'got' : 'again', mode: 'practice', direction: effectivePracticeDirection(currentCard), sentence: currentCard, intervalBefore, intervalAfter, wasDue });
  save();
  P.idx++; P.revealed = false; P.typedFeedback = null; renderPractice();
  updateHeader();
}

function practiceNext() {
  if (P.idx < P.queue.length) {
    const currentCard = P.queue[P.idx];
    const attemptKey = String(P.idx);
    if (currentCard && !P.answered[attemptKey]) {
      P.answered[attemptKey] = 'skip';
      P.skipped++;
      recordAttempt({ id: currentCard.id, result: 'skip', mode: 'practice', direction: effectivePracticeDirection(currentCard), sentence: currentCard });
      save();
    }
    P.idx++; P.revealed = false; P.typedFeedback = null; renderPractice();
  }
}

function practicePrev() {
  if (P.idx > 0) { P.idx--; P.revealed = false; P.typedFeedback = null; renderPractice(); }
}

function closePractice() { P.active = false; PP.active = false; const ov = document.getElementById('practice-overlay'); if (ov) ov.remove(); render(); }

// ==============================
// PATTERN PRACTICE MODE
// ==============================
function startPatternPractice(opts) {
  const ids = Array.isArray(opts) ? opts : opts.ids;
  const pats = ids.map(id => PATTERNS.find(p => p.id === id)).filter(Boolean);
  if (!pats.length) return;
  PP = { active: true, queue: shuffle([...pats]), idx: 0, revealed: false, got: 0, again: 0, skipped: 0, answered: {} };
  renderPatternPractice();
}

function renderPatternPractice() {
  const existing = document.getElementById('practice-overlay');
  if (existing) existing.remove();
  if (!PP.active) return;

  const ov = document.createElement('div');
  ov.id = 'practice-overlay';
  ov.className = 'practice-overlay';

  // ── Completed screen ─────────────────────────
  if (PP.idx >= PP.queue.length) {
    const total = PP.queue.length;
    const answeredCount = Object.keys(PP.answered).length;
    const pct = answeredCount ? Math.round(PP.got / answeredCount * 100) : 0;
    const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '😊' : '💪';
    const title = pct >= 80 ? 'Pattern master!' : pct >= 50 ? 'Good progress!' : 'Keep practicing!';
    const retryIds = JSON.stringify(PP.queue.map(p => p.id)).replace(/"/g, "'");
    ov.innerHTML = `
  <div class="practice-hdr"><span style="font-size:16px;font-weight:700;color:var(--text)">Pattern Practice Complete</span></div>
  <div class="practice-body">
    <div class="prac-summary">
      <div class="prac-sum-icon">${emoji}</div>
      <div class="prac-sum-title">${title}</div>
      <div class="prac-sum-sub">You reviewed ${total} pattern${total !== 1 ? 's' : ''}</div>
      <div style="font-size:11px;color:var(--purple);background:var(--purple-bg);border:1px solid var(--purple-border);border-radius:99px;display:inline-block;padding:3px 10px;margin-bottom:12px">🧩 Pattern Practice</div>
      <div class="prac-sum-stats">
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--green)">${PP.got}</div><div class="prac-sum-l">Got it</div></div>
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--amber)">${PP.again}</div><div class="prac-sum-l">Still learning</div></div>
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--text-3)">${PP.skipped}</div><div class="prac-sum-l">Skipped</div></div>
      </div>
      <div class="prac-sum-actions">
        <button class="prac-sum-retry" style="background:var(--purple)" onclick="startPatternPractice({ids:${retryIds}})">Practice Again</button>
        <button class="prac-sum-done" onclick="closePractice()">Done</button>
      </div>
    </div>
  </div>`;
  } else {
    // ── Active pattern card ──────────────────────
    const p = PP.queue[PP.idx];
    const cat = PAT_CATS.find(c => c.id === p.cat);
    const total = PP.queue.length;
    const pct = Math.round(PP.idx / total * 100);
    const tpl = esc(p.template).replace(/\[([^\]]+)\]/g, '<span class="pat-blank">[$1]</span>');
    const safeDE = jsArg(p.examples[0].de);

    ov.innerHTML = `
  <div class="practice-hdr">
    <button class="practice-exit" onclick="closePractice()">Exit</button>
    <div class="practice-prog-wrap">
      <div class="practice-prog-bar"><div class="practice-prog-fill" style="width:${pct}%;background:var(--purple)"></div></div>
      <div class="practice-prog-lbl">${PP.idx + 1}/${total} · <span style="color:var(--purple)">🧩 Patterns</span> · Got ${PP.got} · Learning ${PP.again}</div>
    </div>
  </div>
  <div class="practice-body">
    <div class="practice-card">
      ${cat ? `<div class="practice-topic-lbl">${cat.icon} ${cat.label}</div>` : ''}
      <div style="font-size:14px;color:var(--text-3);margin-bottom:12px;font-style:italic">What German pattern would you use for this situation?</div>
      <div style="font-size:17px;font-weight:600;color:var(--text);line-height:1.4;margin-bottom:10px;padding:14px;background:var(--bg);border-radius:10px;border-left:3px solid var(--purple-border)">${esc(p.meaning)}</div>
      ${PP.revealed
        ? `<div style="padding-top:12px;border-top:1px solid var(--border)">
	            <div style="font-size:22px;font-weight:800;color:var(--purple);margin-bottom:6px;letter-spacing:-0.3px" lang="de">${tpl}</div>
	            <div style="font-size:13px;color:var(--text-2);margin-bottom:14px">${esc(p.meaning)}</div>
	            <div style="font-size:12px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px">Examples</div>
	            <div style="display:flex;flex-direction:column;gap:6px">
	              ${p.examples.map((e, ei) => `<div class="pat-ex"><div class="pat-de" lang="de"><button class="pat-ex-speak" onclick="event.stopPropagation();speak(${jsArg(e.de)},'ppex-${p.id}-${ei}')" title="Listen" type="button">🔊</button> ${esc(e.de)}</div><div class="pat-en">${esc(e.en)}</div></div>`).join('')}
	            </div>
	          </div>`
        : `<button class="practice-reveal-hint" onclick="patternPracticeReveal()" style="border-color:var(--purple-border);color:var(--purple)" type="button">Tap to reveal the pattern</button>`}
    </div>
    ${PP.revealed ? `
      <div style="display:flex;justify-content:center;margin:10px 0">
        <button class="act-btn speak-btn" data-id="pprac-${p.id}" onclick="speak(${safeDE},'pprac-${p.id}')" style="font-size:13px;padding:8px 18px" type="button">
          ${ICO.speak} Listen to example
        </button>
      </div>
      <div class="practice-btns">
        <button class="prac-again-btn" onclick="patternPracticeAnswer(false)">Still learning</button>
        <button class="prac-got-btn" onclick="patternPracticeAnswer(true)">Got it!</button>
      </div>` : ''}
    <div class="kbd-hint" style="margin-top:10px">
      <span class="kbd">Space</span> show/hide &nbsp;
      <span class="kbd">←</span> prev &nbsp;
      <span class="kbd">→</span> skip
    </div>
  </div>`;
  }
  document.body.appendChild(ov);
}

function patternPracticeReveal() {
  PP.revealed = !PP.revealed;
  renderPatternPractice();
  // Auto-play the first example when revealing
  if (PP.revealed && PP.idx < PP.queue.length) {
    const p = PP.queue[PP.idx];
    setTimeout(() => speak(p.examples[0].de, `pprac-${p.id}`), 200);
  }
}

function patternPracticeAnswer(got) {
  const p = PP.queue[PP.idx];
  if (!p) return;
  if (PP.answered[p.id]) { PP.idx++; PP.revealed = false; renderPatternPractice(); return; }
  const scheduled = schedulePattern(p.id, got);
  recordStudy();
  if (got) {
    PP.got++;
    PP.answered[p.id] = 'got';
    DB.understood.add(p.id);
  } else {
    PP.again++;
    PP.answered[p.id] = 'again';
    DB.understood.delete(p.id);
  }
  recordPatternAttempt({ id: p.id, result: got ? 'got' : 'again', ...scheduled });
  save();
  PP.idx++; PP.revealed = false; renderPatternPractice();
}

function patternPracticeNext() {
  if (PP.idx < PP.queue.length) {
    const p = PP.queue[PP.idx];
    if (p && !PP.answered[p.id]) {
      PP.answered[p.id] = 'skip';
      PP.skipped++;
      recordPatternAttempt({ id: p.id, result: 'skip' });
      save();
    }
    PP.idx++; PP.revealed = false; renderPatternPractice();
  }
}

function patternPracticePrev() {
  if (PP.idx > 0) { PP.idx--; PP.revealed = false; renderPatternPractice(); }
}

// ─── KEYBOARD SHORTCUTS ───────────────────────
document.addEventListener('keydown', e => {
  const tag = document.activeElement ? document.activeElement.tagName : '';
  const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';
  // Pattern practice keyboard shortcuts
  if (PP.active) {
    if (e.key === 'Escape') { closePractice(); return; }
    if (PP.idx >= PP.queue.length) return;
    if (!isTyping && e.code === 'Space') { e.preventDefault(); patternPracticeReveal(); return; }
    if (e.code === 'ArrowRight') { e.preventDefault(); patternPracticeNext(); return; }
    if (e.code === 'ArrowLeft') { e.preventDefault(); patternPracticePrev(); return; }
    return;
  }
  // Sentence practice keyboard shortcuts
  if (!P.active) return;
  if (e.key === 'Escape') { closePractice(); return; }
  if (P.idx >= P.queue.length) return;
  if (!isTyping && e.code === 'Space') { e.preventDefault(); practiceReveal(); return; }
  if (e.code === 'ArrowRight') { e.preventDefault(); practiceNext(); return; }
  if (e.code === 'ArrowLeft') { e.preventDefault(); practicePrev(); return; }
});

function showAppToast(message, ok = true) {
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:${ok ? '#16A34A' : '#DC2626'};color:white;padding:10px 20px;border-radius:99px;font-size:13px;font-weight:600;z-index:400;box-shadow:0 4px 12px rgba(0,0,0,0.15);max-width:calc(100vw - 32px);text-align:center`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function exportData() {
  const data = backupExportObj();
  const json = JSON.stringify(data, null, 2);

  const existing = document.getElementById('dd-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'dd-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Export Progress');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px';
  modal.innerHTML = `
<div style="background:#fff;border-radius:16px;padding:22px;width:100%;max-width:500px;max-height:85vh;display:flex;flex-direction:column;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2)">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:16px;font-weight:700">📤 Export Progress</div>
    <button onclick="document.getElementById('dd-modal').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#A8A29E;line-height:1">×</button>
  </div>
  <div style="font-size:13px;color:#57534E">Download as a file <strong>or</strong> copy the JSON text to paste anywhere.</div>
  <textarea id="export-ta" readonly style="flex:1;min-height:160px;font-family:monospace;font-size:11px;border:1px solid #E2DFD9;border-radius:8px;padding:10px;resize:none;color:#1C1917;background:#F4F2EE;outline:none"></textarea>
  <div style="display:flex;gap:8px">
    <button onclick="
      const json = document.getElementById('export-ta').value;
      const blob = new Blob([json],{type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'deutschdaily-backup-${new Date().toISOString().slice(0, 10)}.json';
      a.click(); URL.revokeObjectURL(a.href);
    " style="flex:1;background:#2563EB;color:white;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif">💾 Download File</button>
    <button id="copy-export-btn" onclick="
      const btn = document.getElementById('copy-export-btn');
      navigator.clipboard.writeText(document.getElementById('export-ta').value)
        .then(()=>{ if(btn) btn.textContent='✅ Copied!'; setTimeout(()=>{ const b=document.getElementById('copy-export-btn'); if(b) b.textContent='📋 Copy Text'; },2000); })
        .catch(()=>{ document.getElementById('export-ta').select(); document.execCommand('copy'); if(btn) btn.textContent='✅ Copied!'; setTimeout(()=>{ const b=document.getElementById('copy-export-btn'); if(b) b.textContent='📋 Copy Text'; },2000); });
    " style="flex:1;background:#F4F2EE;border:1px solid #E2DFD9;border-radius:8px;padding:10px;font-size:13px;font-weight:500;cursor:pointer;font-family:Inter,sans-serif">📋 Copy Text</button>
  </div>
</div>`;
  document.body.appendChild(modal);
  document.getElementById('export-ta').value = json;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function importData() {
  const existing = document.getElementById('dd-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'dd-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Import Progress');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px';
  modal.innerHTML = `
<div style="background:#fff;border-radius:16px;padding:22px;width:100%;max-width:500px;max-height:85vh;display:flex;flex-direction:column;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2)">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:16px;font-weight:700">📥 Import Progress</div>
    <button onclick="document.getElementById('dd-modal').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#A8A29E;line-height:1">×</button>
  </div>
  <div style="font-size:13px;color:#57534E">Pick a backup file <strong>or</strong> paste JSON text directly below. Your current progress will be <strong>merged</strong> (not overwritten).</div>
  <textarea id="import-ta" placeholder="Paste your backup JSON here..." style="flex:1;min-height:160px;font-family:monospace;font-size:11px;border:1px solid #E2DFD9;border-radius:8px;padding:10px;resize:none;color:#1C1917;background:#F4F2EE;outline:none"></textarea>
  <div id="import-err" style="font-size:12px;color:#DC2626;display:none"></div>
  <div style="display:flex;gap:8px">
    <button onclick="document.getElementById('dd-file-input').click()" style="flex:1;background:#F4F2EE;border:1px solid #E2DFD9;border-radius:8px;padding:10px;font-size:13px;font-weight:500;cursor:pointer;font-family:Inter,sans-serif">📂 Choose File</button>
    <button onclick="applyImport(document.getElementById('import-ta').value)" style="flex:1;background:#2563EB;color:white;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif">✅ Import</button>
  </div>
  <input id="dd-file-input" type="file" accept=".json,application/json" style="display:none" onchange="
    const file = this.files[0]; if(!file) return;
    const r = new FileReader();
    r.onload = ev => { document.getElementById('import-ta').value = ev.target.result; };
    r.readAsText(file);
  ">
</div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function laterDateKey(a, b) {
  const na = normalizeDateKey(a);
  const nb = normalizeDateKey(b);
  if (!na) return nb || null;
  if (!nb) return na;
  return na >= nb ? na : nb;
}

function srsDateRank(card) {
  if (!card || typeof card !== 'object') return '';
  return normalizeDateKey(card.lastReview) || normalizeDateKey(card.nextReview) || '';
}

function mergeSrsMaps(currentMap = {}, importedMap = {}) {
  const merged = {};
  [...new Set([...Object.keys(importedMap || {}), ...Object.keys(currentMap || {})])].forEach(id => {
    const current = currentMap[id];
    const imported = importedMap[id];
    if (!current) merged[id] = imported;
    else if (!imported) merged[id] = current;
    else merged[id] = srsDateRank(imported) > srsDateRank(current) ? imported : current;
  });
  return merged;
}

function mergeAttempts(currentAttempts = [], importedAttempts = []) {
  const byKey = new Map();
  [...importedAttempts, ...currentAttempts].forEach(a => {
    if (!a || typeof a !== 'object') return;
    const key = [
      a.date || '',
      a.id || '',
      a.mode || '',
      a.direction || '',
      a.result || '',
      a.wasDue ? 'due' : 'new',
      a.intervalBefore || 0,
      a.intervalAfter || 0,
    ].join('|');
    byKey.set(key, a);
  });
  return [...byKey.values()].slice(-1000);
}

function applyImport(text) {
  const errEl = document.getElementById('import-err');
  const show = msg => { if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; } };
  if (!text.trim()) { show('❌ Nothing to import — paste or load a file first.'); return; }
  let parsed;
  try { parsed = JSON.parse(text); } catch (e) { show('❌ Invalid JSON. Make sure you copied the full text without changes.'); return; }
  if (!parsed || typeof parsed !== 'object' || (!Array.isArray(parsed.learned) && !parsed.streak && !parsed.srs && !parsed.attempts)) { show('❌ This doesn\'t look like a DeutschDaily backup file.'); return; }
  const imported = normalizeDb(parsed);
  const current = dbToObj();
  const mergeHistoryWords = (a, b) => {
    const out = Object.assign({}, a || {});
    Object.entries(b || {}).forEach(([k, arr]) => { out[k] = [...new Set([...(out[k] || []), ...arr])]; });
    return out;
  };
  const merged = {
    learned: [...new Set([...current.learned, ...imported.learned])],
    favorites: [...new Set([...current.favorites, ...imported.favorites])],
    understood: [...new Set([...current.understood, ...imported.understood])],
    streak: Math.max(current.streak || 0, imported.streak || 0),
    lastStudy: laterDateKey(current.lastStudy, imported.lastStudy),
    dailyGoal: DB.dailyGoal,
    dailyQueue: DB.dailyQueue,
    dailyQueueDate: DB.dailyQueueDate,
    dailyLearned: [...new Set([...current.dailyLearned, ...imported.dailyLearned])],
    dailyQueueDone: [...new Set([...current.dailyQueueDone, ...imported.dailyQueueDone])],
    history: Object.assign({}, imported.history, current.history),
    historyWords: mergeHistoryWords(imported.historyWords, current.historyWords),
    srs: mergeSrsMaps(current.srs, imported.srs),
    patternSrs: mergeSrsMaps(current.patternSrs, imported.patternSrs),
    attempts: mergeAttempts(current.attempts, imported.attempts),
    patternAttempts: mergeAttempts(current.patternAttempts, imported.patternAttempts),
    settings: current.settings,
  };
  objToDB(merged);
  save();
  render();
  document.getElementById('dd-modal').remove();
  // Show success toast
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#16A34A;color:white;padding:10px 20px;border-radius:99px;font-size:13px;font-weight:600;z-index:400;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
  toast.textContent = `✅ Imported! ${merged.learned.length} sentences learned · ${merged.favorites.length} saved`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}




// ─── HISTORY ─────────────────────────────────
function historySentence(id) {
  return SENTENCES.find(s => s.id === id) || null;
}

function historyPattern(id) {
  return PATTERN_BY_ID[id] || PATTERNS.find(p => p.id === id) || null;
}

function historyValidSentenceIds(ids) {
  const validIds = validSentenceIdSet();
  const out = [];
  (ids || []).forEach(id => {
    const sid = String(id);
    if (validIds.has(sid) && !out.includes(sid)) out.push(sid);
  });
  return out;
}

function historyValidPatternIds(ids) {
  const validIds = validPatternIdSet();
  const out = [];
  (ids || []).forEach(id => {
    const sid = String(id);
    if (validIds.has(sid) && !out.includes(sid)) out.push(sid);
  });
  return out;
}

function historyIsPracticeResult(result) {
  return result === 'got' || result === 'again';
}

function getHistoryDaySummary(key, dayIndex = 0) {
  const d = parseDateKey(key) || parseDateKey(today());
  const isToday = key === today();
  const isYesterday = key === addDaysISO(-1);
  const sentenceIds = historyValidSentenceIds(DB.historyWords[key] || []);
  const sentenceAttempts = DB.attempts.filter(a => a.date === key);
  const patternAttempts = DB.patternAttempts.filter(a => a.date === key);
  const answeredSentenceAttempts = sentenceAttempts.filter(a => a.mode === 'practice' && historyIsPracticeResult(a.result));
  const answeredPatternAttempts = patternAttempts.filter(a => historyIsPracticeResult(a.result));
  const answeredAttempts = [...answeredSentenceAttempts, ...answeredPatternAttempts];
  const got = answeredAttempts.filter(a => a.result === 'got').length;
  const again = answeredAttempts.filter(a => a.result === 'again').length;
  const skipped = sentenceAttempts.filter(a => a.result === 'skip').length + patternAttempts.filter(a => a.result === 'skip').length;
  const reviews = sentenceAttempts.filter(a => a.wasDue && historyIsPracticeResult(a.result)).length + patternAttempts.filter(a => a.wasDue && historyIsPracticeResult(a.result)).length;
  const attemptSentenceIds = historyValidSentenceIds(sentenceAttempts.map(a => a.id));
  const missedSentenceIds = historyValidSentenceIds(sentenceAttempts.filter(a => a.result === 'again').map(a => a.id));
  const topicCounts = {};

  [...sentenceIds, ...attemptSentenceIds].forEach(id => {
    const s = historySentence(id);
    if (!s) return;
    topicCounts[s.t] = (topicCounts[s.t] || 0) + 1;
  });

  const topTopics = Object.entries(topicCounts)
    .map(([id, count]) => ({ topic: TOPICS.find(t => t.id === id), count }))
    .filter(r => r.topic)
    .sort((a, b) => b.count - a.count || a.topic.name.localeCompare(b.topic.name));

  return {
    key,
    date: d,
    label: isToday ? 'Today' : isYesterday ? 'Yesterday' : d.toLocaleDateString('en-DE', { weekday: 'long' }),
    shortLabel: isToday ? 'Today' : isYesterday ? 'Yest' : d.toLocaleDateString('en-DE', { weekday: 'short' }),
    dateStr: d.toLocaleDateString('en-DE', { day: 'numeric', month: 'long' }),
    fullDateStr: d.toLocaleDateString('en-DE', { weekday: 'long', day: 'numeric', month: 'long' }),
    isToday,
    dayIndex,
    sentenceIds,
    sentenceAttempts,
    patternAttempts,
    practiceCount: answeredAttempts.length,
    sentencePracticeCount: answeredSentenceAttempts.length,
    patternPracticeCount: answeredPatternAttempts.length,
    got,
    again,
    skipped,
    reviews,
    accuracy: pct(got, got + again),
    activityCount: sentenceIds.length + answeredAttempts.length + skipped,
    missedSentenceIds,
    topTopics,
  };
}

function getHistoryDays(count = 30) {
  return Array.from({ length: count }, (_, i) => getHistoryDaySummary(addDaysISO(-i), i));
}

function historyRecentMissedIds(daysBack = 14, limit = 12) {
  const minKey = addDaysISO(-(daysBack - 1));
  const validIds = validSentenceIdSet();
  const out = [];
  [...DB.attempts].reverse().forEach(a => {
    if (a.date < minKey || a.result !== 'again' || !validIds.has(a.id) || out.includes(a.id)) return;
    out.push(a.id);
  });
  return out.slice(0, limit);
}

function historyRecentMissedPatternIds(daysBack = 14, limit = 8) {
  const minKey = addDaysISO(-(daysBack - 1));
  const validIds = validPatternIdSet();
  const out = [];
  [...DB.patternAttempts].reverse().forEach(a => {
    if (a.date < minKey || a.result !== 'again' || !validIds.has(a.id) || out.includes(a.id)) return;
    out.push(a.id);
  });
  return out.slice(0, limit);
}

function historyTopicPills(topTopics, max = 3) {
  const topics = topTopics.slice(0, max);
  if (!topics.length) return '';
  return `<div class="history-topic-pills">${topics.map(({ topic, count }) => `<span class="history-topic-pill" style="--topic-color:${esc(topic.color)}">${topic.emoji} ${esc(topic.name)}${count > 1 ? ` ${count}` : ''}</span>`).join('')}</div>`;
}

function renderHistoryStat(label, value, sub, color = 'var(--text)') {
  return `<div class="history-stat">
    <div class="history-stat-label">${esc(label)}</div>
    <div class="history-stat-value" style="color:${color}">${esc(value)}</div>
    <div class="history-stat-sub">${esc(sub)}</div>
  </div>`;
}

function renderHistoryHeatmap(days) {
  const chronological = [...days].reverse();
  const maxActivity = Math.max(...days.map(d => d.activityCount), 1);
  const cells = chronological.map(d => {
    const level = d.activityCount === 0 ? 0 : Math.max(1, Math.min(4, Math.ceil(d.activityCount / maxActivity * 4)));
    const detail = d.activityCount
      ? `${d.sentenceIds.length} new, ${d.practiceCount} practice`
      : 'No activity';
    return `<button class="history-heat-cell level-${level}${d.isToday ? ' today' : ''}" onclick="navHistoryDay('${d.key}')" title="${esc(d.fullDateStr)}: ${esc(detail)}" type="button">${d.date.getDate()}</button>`;
  }).join('');
  return `<div class="history-panel">
    <div class="history-panel-title"><strong>30-day activity map</strong><span>Darker days had more learning or practice</span></div>
    <div class="history-heatmap">${cells}</div>
  </div>`;
}

function renderHistoryQuickActions() {
  const dueIds = getSrsReviewIds();
  const patternDueIds = getPatternReviewIds();
  const missedIds = historyRecentMissedIds();
  const missedPatternIds = historyRecentMissedPatternIds();
  const learnedIds = [...DB.learned];
  const actions = [];

  if (dueIds.length) {
    actions.push(`<button class="history-action primary" onclick="startPractice({ids:${idsArg(dueIds)},isSRS:true,skipSessionFilter:true})" type="button"><strong>Review ${dueIds.length} due sentence${dueIds.length !== 1 ? 's' : ''}</strong><span>Scheduled by spaced repetition</span></button>`);
  }
  if (patternDueIds.length) {
    actions.push(`<button class="history-action" onclick="startPatternPractice({ids:${idsArg(patternDueIds)}})" type="button"><strong>Review ${patternDueIds.length} due pattern${patternDueIds.length !== 1 ? 's' : ''}</strong><span>Keep sentence patterns fresh</span></button>`);
  }
  if (missedIds.length) {
    actions.push(`<button class="history-action" onclick="startPractice({ids:${idsArg(missedIds)},skipSessionFilter:true})" type="button"><strong>Retry ${missedIds.length} missed sentence${missedIds.length !== 1 ? 's' : ''}</strong><span>From the last 14 days</span></button>`);
  }
  if (missedPatternIds.length) {
    actions.push(`<button class="history-action" onclick="startPatternPractice({ids:${idsArg(missedPatternIds)}})" type="button"><strong>Retry ${missedPatternIds.length} hard pattern${missedPatternIds.length !== 1 ? 's' : ''}</strong><span>Recent pattern misses</span></button>`);
  }
  if (learnedIds.length && actions.length < 4) {
    actions.push(`<button class="history-action" onclick="startPractice({ids:${idsArg(learnedIds)},skipSessionFilter:true})" type="button"><strong>Practice all learned</strong><span>${learnedIds.length} sentence${learnedIds.length !== 1 ? 's' : ''} available</span></button>`);
  }

  if (!actions.length) {
    return `<div class="history-action-grid">
      <button class="history-action primary" onclick="nav('today')" type="button"><strong>Start today's practice</strong><span>Build history from your daily queue</span></button>
      <button class="history-action" onclick="nav('browse')" type="button"><strong>Browse sentences</strong><span>Pick a topic and mark useful phrases learned</span></button>
    </div>`;
  }
  return `<div class="history-action-grid">${actions.slice(0, 4).join('')}</div>`;
}

function renderHistoryTopicFocus(days) {
  const topicCounts = {};
  days.forEach(day => {
    day.topTopics.forEach(({ topic, count }) => {
      topicCounts[topic.id] = (topicCounts[topic.id] || 0) + count;
    });
  });
  const rows = Object.entries(topicCounts)
    .map(([id, count]) => ({ topic: TOPICS.find(t => t.id === id), count }))
    .filter(r => r.topic)
    .sort((a, b) => b.count - a.count || a.topic.name.localeCompare(b.topic.name))
    .slice(0, 5);
  if (!rows.length) return '';
  const max = Math.max(...rows.map(r => r.count), 1);
  return `<div class="history-panel">
    <div class="history-panel-title"><strong>Recent focus</strong><span>Topics touched in the last 30 days</span></div>
    ${rows.map(r => `<div class="history-topic-row">
      <div class="history-topic-label">${r.topic.emoji} ${esc(r.topic.name)}</div>
      <div class="history-topic-bar"><div class="history-topic-fill" style="--topic-color:${esc(r.topic.color)};width:${Math.max(8, Math.round(r.count / max * 100))}%"></div></div>
      <div class="history-topic-count">${r.count}</div>
    </div>`).join('')}
  </div>`;
}

function renderHistoryDayRow(day) {
  const previewIds = day.sentenceIds.length
    ? day.sentenceIds
    : historyValidSentenceIds(day.sentenceAttempts.filter(a => historyIsPracticeResult(a.result)).map(a => a.id));
  const preview = previewIds.slice(0, 3).map(id => {
    const s = historySentence(id);
    return s ? s.de : '';
  }).filter(Boolean).join(' · ');
  const hasAccuracy = day.got + day.again > 0;
  const metricHtml = day.activityCount
    ? `<div class="history-row-metrics">
        ${day.sentenceIds.length ? `<span class="history-pill green">${day.sentenceIds.length} new</span>` : ''}
        ${day.practiceCount ? `<span class="history-pill blue">${day.practiceCount} practiced</span>` : ''}
        ${day.reviews ? `<span class="history-pill amber">${day.reviews} reviews</span>` : ''}
        ${hasAccuracy ? `<span class="history-pill${day.accuracy < 70 ? ' red' : ''}">${day.accuracy}% recall</span>` : ''}
        ${day.skipped ? `<span class="history-pill">${day.skipped} skipped</span>` : ''}
      </div>`
    : `<div class="history-row-metrics"><span class="history-pill">No activity recorded</span></div>`;
  return `<button class="history-day-row${day.isToday ? ' today' : ''}" onclick="navHistoryDay('${day.key}')" type="button">
    <span class="history-day-top">
      <span>
        <span class="history-day-title">${esc(day.label)}</span>
        <span class="history-day-date">${esc(day.dateStr)}</span>
      </span>
      <span class="history-day-score">${day.activityCount}<span>actions</span></span>
    </span>
    ${metricHtml}
    ${preview ? `<span class="history-preview">${esc(preview)}${previewIds.length > 3 ? ' ...' : ''}</span>` : ''}
    ${historyTopicPills(day.topTopics)}
  </button>`;
}

function renderHistoryPracticeRows(day) {
  const rowsById = {};
  day.sentenceAttempts.filter(a => a.mode === 'practice').forEach(a => {
    if (!rowsById[a.id]) rowsById[a.id] = { got: 0, again: 0, skip: 0, due: false };
    if (a.result === 'got') rowsById[a.id].got++;
    else if (a.result === 'again') rowsById[a.id].again++;
    else if (a.result === 'skip') rowsById[a.id].skip++;
    rowsById[a.id].due = rowsById[a.id].due || Boolean(a.wasDue);
  });

  const rows = Object.entries(rowsById)
    .map(([id, r]) => ({ sentence: historySentence(id), ...r, total: r.got + r.again, accuracy: pct(r.got, r.got + r.again) }))
    .filter(r => r.sentence)
    .sort((a, b) => b.again - a.again || b.total - a.total || a.sentence.de.localeCompare(b.sentence.de));
  if (!rows.length) return '';

  return `<div class="history-panel">
    <div class="history-panel-title"><strong>Sentence practice</strong><span>${rows.length} unique sentence${rows.length !== 1 ? 's' : ''}</span></div>
    ${rows.map(r => `<div class="history-practice-row">
      <div class="history-practice-text">
        <strong lang="de">${esc(r.sentence.de)}</strong>
        <span>${esc(r.sentence.en)}</span>
      </div>
      <div class="history-practice-meta">
        ${r.got ? `<span class="history-pill green">${r.got} got</span>` : ''}
        ${r.again ? `<span class="history-pill red">${r.again} again</span>` : ''}
        ${r.skip ? `<span class="history-pill">${r.skip} skip</span>` : ''}
        ${r.total ? `<span class="history-pill">${r.accuracy}%</span>` : ''}
        ${r.due ? `<span class="history-pill amber">review</span>` : ''}
        <button class="history-mini-btn" onclick="startPractice({ids:${idsArg([r.sentence.id])},skipSessionFilter:true})" type="button">Practice</button>
      </div>
    </div>`).join('')}
  </div>`;
}

function renderHistoryPatternRows(day) {
  const rowsById = {};
  day.patternAttempts.forEach(a => {
    if (!rowsById[a.id]) rowsById[a.id] = { got: 0, again: 0, skip: 0, due: false };
    if (a.result === 'got') rowsById[a.id].got++;
    else if (a.result === 'again') rowsById[a.id].again++;
    else if (a.result === 'skip') rowsById[a.id].skip++;
    rowsById[a.id].due = rowsById[a.id].due || Boolean(a.wasDue);
  });

  const rows = Object.entries(rowsById)
    .map(([id, r]) => ({ pattern: historyPattern(id), ...r, total: r.got + r.again, accuracy: pct(r.got, r.got + r.again) }))
    .filter(r => r.pattern)
    .sort((a, b) => b.again - a.again || b.total - a.total || a.pattern.template.localeCompare(b.pattern.template));
  if (!rows.length) return '';

  return `<div class="history-panel">
    <div class="history-panel-title"><strong>Pattern practice</strong><span>${rows.length} pattern${rows.length !== 1 ? 's' : ''}</span></div>
    ${rows.map(r => `<div class="history-practice-row">
      <div class="history-practice-text">
        <strong lang="de">${esc(r.pattern.template)}</strong>
        <span>${esc(r.pattern.meaning)}</span>
      </div>
      <div class="history-practice-meta">
        ${r.got ? `<span class="history-pill green">${r.got} got</span>` : ''}
        ${r.again ? `<span class="history-pill red">${r.again} again</span>` : ''}
        ${r.skip ? `<span class="history-pill">${r.skip} skip</span>` : ''}
        ${r.total ? `<span class="history-pill">${r.accuracy}%</span>` : ''}
        ${r.due ? `<span class="history-pill amber">review</span>` : ''}
        <button class="history-mini-btn" onclick="startPatternPractice({ids:${idsArg([r.pattern.id])}})" type="button">Practice</button>
      </div>
    </div>`).join('')}
  </div>`;
}

function navHistoryDay(dateKey) {
  V.historyDay = normalizeDateKey(dateKey);
  V.view = V.historyDay ? 'history-day' : 'history';
  commitState({ scroll: true });
}

function renderHistory() {
  const days = getHistoryDays(30);
  const activeDays = days.filter(d => d.activityCount > 0).length;
  const totalNew = days.reduce((acc, d) => acc + d.sentenceIds.length, 0);
  const totalPractice = days.reduce((acc, d) => acc + d.practiceCount, 0);
  const totalGot = days.reduce((acc, d) => acc + d.got, 0);
  const totalAgain = days.reduce((acc, d) => acc + d.again, 0);
  const avgAccuracy = totalGot + totalAgain ? `${pct(totalGot, totalGot + totalAgain)}%` : '0%';
  const timelineDays = days.filter(d => d.activityCount > 0 || d.isToday).slice(0, 14);
  const thisWeekTotal = days.filter(d => d.dayIndex < 7).reduce((acc, d) => acc + d.activityCount, 0);

  return `<div class="history-page">
    <div class="history-head">
      <div>
        <h2 class="page-title">History</h2>
        <p class="page-sub">Your last 30 days of learning, reviews, misses, and topic focus</p>
      </div>
      <div class="history-headline-stat"><strong>${thisWeekTotal}</strong><span>actions this week</span></div>
    </div>
    ${renderHistoryQuickActions()}
    <div class="history-stat-grid">
      ${renderHistoryStat('New learned', totalNew, 'sentences added', 'var(--green)')}
      ${renderHistoryStat('Practice reps', totalPractice, 'sentences and patterns', 'var(--blue)')}
      ${renderHistoryStat('Active days', activeDays, 'out of 30 days', 'var(--amber)')}
      ${renderHistoryStat('Recall', avgAccuracy, 'practice accuracy', totalGot + totalAgain && pct(totalGot, totalGot + totalAgain) < 70 ? 'var(--red)' : 'var(--green)')}
    </div>
    ${renderHistoryHeatmap(days)}
    ${renderHistoryTopicFocus(days)}
    <div class="history-section-label"><span>Recent activity</span><span>${activeDays} active day${activeDays !== 1 ? 's' : ''}</span></div>
    ${timelineDays.length ? timelineDays.map(renderHistoryDayRow).join('') : '<div class="empty-state"><div class="empty-icon">🗓️</div>No history yet.<br><span style="font-size:13px">Complete practice or mark sentences learned to fill this tab.</span></div>'}
  </div>`;
}

function renderHistoryDay() {
  const key = normalizeDateKey(V.historyDay);
  if (!key) return renderHistory();

  const day = getHistoryDaySummary(key);
  const sents = day.sentenceIds.map(id => historySentence(id)).filter(Boolean);
  const missedPatternIds = historyValidPatternIds(day.patternAttempts.filter(a => a.result === 'again').map(a => a.id));
  const hasActivity = day.activityCount > 0 || day.sentenceAttempts.length > 0 || day.patternAttempts.length > 0;
  const accuracyLabel = day.got + day.again ? `${day.accuracy}%` : '0%';
  const dayActions = [
    sents.length ? `<button class="history-inline-btn primary" onclick="startPractice({ids:${idsArg(day.sentenceIds)},skipSessionFilter:true})" type="button">Practice learned (${sents.length})</button>` : '',
    day.missedSentenceIds.length ? `<button class="history-inline-btn" onclick="startPractice({ids:${idsArg(day.missedSentenceIds)},skipSessionFilter:true})" type="button">Retry misses (${day.missedSentenceIds.length})</button>` : '',
    missedPatternIds.length ? `<button class="history-inline-btn" onclick="startPatternPractice({ids:${idsArg(missedPatternIds)}})" type="button">Retry patterns (${missedPatternIds.length})</button>` : '',
  ].filter(Boolean).join('');

  const hero = `<div class="history-day-hero">
    <div class="history-day-hero-label">${esc(day.label)}</div>
    <div class="history-day-hero-title">${esc(day.fullDateStr)}</div>
    <div class="history-row-metrics">
      <span class="history-pill green">${day.sentenceIds.length} new</span>
      <span class="history-pill blue">${day.practiceCount} practiced</span>
      <span class="history-pill amber">${day.reviews} reviews</span>
      <span class="history-pill${day.got + day.again && day.accuracy < 70 ? ' red' : ''}">${accuracyLabel} recall</span>
      ${day.skipped ? `<span class="history-pill">${day.skipped} skipped</span>` : ''}
    </div>
    ${historyTopicPills(day.topTopics, 5)}
  </div>`;

  if (!hasActivity) {
    return `<button class="back-btn" onclick="nav('history')">← History</button>
      ${hero}
      <div class="empty-state"><div class="empty-icon">📭</div>No activity recorded for this day.</div>`;
  }

  return `<button class="back-btn" onclick="nav('history')">← History</button>
    ${hero}
    ${dayActions ? `<div class="history-day-actions">${dayActions}</div>` : ''}
    ${renderHistoryPracticeRows(day)}
    ${renderHistoryPatternRows(day)}
    ${sents.length ? `<div class="history-section-label"><span>New learned</span><span>${sents.length} sentence${sents.length !== 1 ? 's' : ''}</span></div>${sents.map((s, i) => renderSentenceCard(s, i, true)).join('')}` : ''}`;
}

if (window.addEventListener) {
  window.addEventListener('popstate', () => { applyUrlState(); render(); });
}

if (!window.__DD_SKIP_AUTO_INIT) {
  load().then(() => { applyUrlState(); commitState({ replace: true }); });
}
