// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
let V = { view: 'today', topicId: null, filter: 'all', query: '', speaking: null, libTab: 'saved', patFilter: 'learning', vocabTopicId: null, vocabFilter: 'all', vocabPage: 1, grammarModuleId: 'a1', grammarLessonId: null, historyDay: null, progressTab: 'overview', freqFilter: 'all', freqRange: 'all', freqPage: 1, freqRevealed: {} };

const PAGE_SIZE = 50;

// ══════════════════════════════════════════════
// PATTERN DETECTION FOR SENTENCES
// ══════════════════════════════════════════════
function findMatchingPattern(sentence) {
  const explicit = (sentence.patternIds || []).map(id => PATTERN_BY_ID[id]).find(Boolean);
  if (explicit) return explicit;
  return null;
}
const VALID_VIEWS = new Set(['today', 'browse', 'vocab', 'grammar', 'frequency', 'patterns', 'saved', 'progress', 'history-day']);
const VALID_PROGRESS_TABS = new Set(['overview', 'activity']);
const VALID_FILTERS = new Set(['all', 'unlearned', 'learned', 'favorites']);
const VALID_VOCAB_FILTERS = new Set(['all', 'new', 'due', 'learned', 'saved']);
const VALID_FREQ_FILTERS = new Set(['all', 'new', 'due', 'learned', 'saved']);
const VALID_FREQ_RANGES = new Set(['all', '1-500', '501-1000', '1001-1500', '1501-2000', '2001-2525']);
const VALID_PATTERN_FILTERS = new Set(['learning', 'due', 'understood', 'all']);
const VALID_LIBRARY_TABS = new Set(['saved', 'learned']);
const TOPIC_IDS = new Set(TOPICS.map(t => t.id));
const VOCAB_TOPIC_IDS = new Set(VOCAB_TOPICS.map(t => t.id));
const GRAMMAR_MODULE_IDS = new Set(GRAMMAR_MODULES.map(m => m.id));
const GRAMMAR_LESSON_BY_ID = Object.fromEntries(GRAMMAR_LESSONS.map(lesson => [lesson.id, lesson]));
const GRAMMAR_LESSON_IDS = new Set(GRAMMAR_LESSONS.map(lesson => lesson.id));
const DEFAULT_GRAMMAR_MODULE_ID = GRAMMAR_MODULES[0] ? GRAMMAR_MODULES[0].id : 'a1';
const GRAMMAR_MODULE_ALIASES = {
  'a1.1': 'a1',
  'a1.2': 'a1',
  'a2.1': 'a2',
  'a2.2': 'a2',
  'b1.1': 'b1',
  'b1.2': 'b1',
};

function normalizeViewName(view) {
  const raw = String(view || 'today');
  if (raw === 'library') return 'saved';
  if (raw === 'stats' || raw === 'history') return 'progress';
  return VALID_VIEWS.has(raw) ? raw : 'today';
}
function normalizeProgressTab(value) {
  const raw = String(value || 'overview');
  return VALID_PROGRESS_TABS.has(raw) ? raw : 'overview';
}
function normalizePatternFilter(value) {
  const raw = String(value || 'learning');
  if (raw === 'new') return 'learning';
  return VALID_PATTERN_FILTERS.has(raw) ? raw : 'learning';
}
function normalizeGrammarModuleId(value) {
  const raw = String(value || '').toLowerCase();
  if (GRAMMAR_MODULE_IDS.has(raw)) return raw;
  return GRAMMAR_MODULE_ALIASES[raw] || DEFAULT_GRAMMAR_MODULE_ID;
}
function normalizeGrammarLessonId(moduleId, value) {
  const module = GRAMMAR_MODULE_BY_ID[normalizeGrammarModuleId(moduleId)] || GRAMMAR_MODULES[0];
  const lessonId = String(value || '');
  if (GRAMMAR_LESSON_IDS.has(lessonId) && GRAMMAR_LESSON_BY_ID[lessonId].moduleId === module.id) return lessonId;
  return module.lessons[0] ? module.lessons[0].id : null;
}
function stateFromUrl(href) {
  const fallback = { view: 'today', topicId: null, filter: 'all', query: '', libTab: 'saved', patFilter: 'learning', vocabTopicId: null, vocabFilter: 'all', grammarModuleId: DEFAULT_GRAMMAR_MODULE_ID, grammarLessonId: null, historyDay: null, progressTab: 'overview', freqFilter: 'all', freqRange: 'all' };
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
  const module = params.get('module');
  const lesson = params.get('lesson');
  const filter = params.get('filter');
  const range = params.get('range');
  const tab = params.get('tab');
  const day = normalizeDateKey(params.get('day'));

  if (view === 'browse') {
    fallback.view = 'browse';
    fallback.topicId = topic && TOPIC_IDS.has(topic) ? topic : null;
    fallback.filter = VALID_FILTERS.has(filter) ? filter : 'all';
  } else if (view === 'vocab') {
    fallback.view = 'vocab';
    fallback.vocabTopicId = topic && VOCAB_TOPIC_IDS.has(topic) ? topic : null;
    fallback.vocabFilter = VALID_VOCAB_FILTERS.has(filter) ? filter : 'all';
  } else if (view === 'frequency') {
    fallback.view = 'frequency';
    fallback.freqFilter = VALID_FREQ_FILTERS.has(filter) ? filter : 'all';
    fallback.freqRange = VALID_FREQ_RANGES.has(range) ? range : 'all';
  } else if (view === 'grammar') {
    fallback.view = 'grammar';
    fallback.grammarModuleId = normalizeGrammarModuleId(module);
    fallback.grammarLessonId = normalizeGrammarLessonId(fallback.grammarModuleId, lesson);
  } else if (view === 'patterns') {
    fallback.view = 'patterns';
    fallback.patFilter = normalizePatternFilter(filter);
  } else if (view === 'saved') {
    fallback.view = 'saved';
    fallback.libTab = VALID_LIBRARY_TABS.has(tab) ? tab : 'saved';
  } else if (view === 'progress' || view === 'history-day') {
    if (day) {
      fallback.view = 'history-day';
      fallback.historyDay = day;
    } else {
      fallback.view = 'progress';
      fallback.progressTab = normalizeProgressTab(tab || (viewParam === 'history' ? 'activity' : 'overview'));
    }
  } else {
    fallback.view = view;
  }
  return fallback;
}
function urlFromState(state = V) {
  const params = new URLSearchParams();
  const view = normalizeViewName(state.view);
  const publicView = view === 'saved' ? 'library' : (view === 'history-day' || view === 'progress') ? 'progress' : view;
  if (publicView !== 'today') params.set('view', publicView);
  if (view === 'browse') {
    if (state.topicId && TOPIC_IDS.has(state.topicId)) params.set('topic', state.topicId);
    if (state.filter && state.filter !== 'all') params.set('filter', state.filter);
  } else if (view === 'vocab') {
    if (state.vocabTopicId && VOCAB_TOPIC_IDS.has(state.vocabTopicId)) params.set('topic', state.vocabTopicId);
    if (state.vocabFilter && state.vocabFilter !== 'all') params.set('filter', state.vocabFilter);
  } else if (view === 'frequency') {
    if (state.freqFilter && state.freqFilter !== 'all') params.set('filter', state.freqFilter);
    if (state.freqRange && state.freqRange !== 'all') params.set('range', state.freqRange);
  } else if (view === 'grammar') {
    const moduleId = normalizeGrammarModuleId(state.grammarModuleId);
    if (moduleId !== DEFAULT_GRAMMAR_MODULE_ID) params.set('module', moduleId);
    const lessonId = normalizeGrammarLessonId(moduleId, state.grammarLessonId);
    const firstLessonId = GRAMMAR_MODULE_BY_ID[moduleId] && GRAMMAR_MODULE_BY_ID[moduleId].lessons[0] ? GRAMMAR_MODULE_BY_ID[moduleId].lessons[0].id : null;
    if (lessonId && lessonId !== firstLessonId) params.set('lesson', lessonId);
  } else if (view === 'patterns') {
    params.set('filter', normalizePatternFilter(state.patFilter));
  } else if (view === 'saved') {
    if (state.libTab && state.libTab !== 'saved') params.set('tab', state.libTab);
  } else if (view === 'progress') {
    if (state.progressTab && state.progressTab !== 'overview') params.set('tab', state.progressTab);
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
  V.vocabTopicId = next.vocabTopicId;
  V.vocabFilter = next.vocabFilter;
  V.freqFilter = next.freqFilter;
  V.freqRange = next.freqRange;
  V.grammarModuleId = next.grammarModuleId;
  V.grammarLessonId = next.grammarLessonId;
  V.historyDay = next.historyDay;
  V.progressTab = next.progressTab;
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
  V.vocabTopicId = nextView === 'vocab' && extra && VOCAB_TOPIC_IDS.has(extra) ? extra : null;
  V.grammarModuleId = nextView === 'grammar' ? normalizeGrammarModuleId(extra || V.grammarModuleId) : V.grammarModuleId || DEFAULT_GRAMMAR_MODULE_ID;
  V.grammarLessonId = nextView === 'grammar' ? normalizeGrammarLessonId(V.grammarModuleId, null) : V.grammarLessonId;
  V.filter = 'all';
  V.vocabFilter = 'all';
  V.freqFilter = 'all';
  V.freqRange = 'all';
  V.freqPage = 1;
  V.vocabPage = 1;
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
  else if (V.view === 'vocab') root.innerHTML = renderVocab();
  else if (V.view === 'frequency') root.innerHTML = renderFrequency();
  else if (V.view === 'grammar') root.innerHTML = renderGrammar();
  else if (V.view === 'patterns') root.innerHTML = renderPatterns();
  else if (V.view === 'saved') root.innerHTML = renderSaved();
  else if (V.view === 'progress') root.innerHTML = renderProgress();
  else if (V.view === 'history-day') root.innerHTML = renderHistoryDay();
  root.querySelectorAll('.sc,.pc,.vc,.grammar-card').forEach((el, i) => el.style.animationDelay = i * 25 + 'ms');
}

function updateHeader() {
  const tot = SENTENCES.length, done = DB.learned.size, pct = tot ? Math.round(done / tot * 100) : 0;
  document.getElementById('hpf').style.width = pct + '%';
  document.getElementById('hpl').textContent = `${done} / ${tot} sentences learned`;
  document.getElementById('stk-n').textContent = DB.streak;
}
function updateNavBtns() {
  ['today', 'browse', 'grammar', 'patterns'].forEach(v => {
    const el = document.getElementById('nb-' + v);
    if (el) el.className = 'nb' + (V.view === v ? ' on' : '');
    const mel = document.getElementById('mnb-' + v);
    if (mel) mel.className = 'mnb' + (V.view === v ? ' on' : '');
  });
  const wordsActive = V.view === 'vocab' || V.view === 'frequency';
  const wordsBtn = document.getElementById('nb-words');
  if (wordsBtn) wordsBtn.className = 'nb' + (wordsActive ? ' on' : '');
  const mWordsBtn = document.getElementById('mnb-words');
  if (mWordsBtn) mWordsBtn.className = 'mnb' + (wordsActive ? ' on' : '');
  const libBtn = document.getElementById('nb-library');
  if (libBtn) libBtn.className = 'nb' + (V.view === 'saved' ? ' on' : '');
  const mLibBtn = document.getElementById('mnb-library');
  if (mLibBtn) mLibBtn.className = 'mnb' + (V.view === 'saved' ? ' on' : '');
  const progressActive = V.view === 'progress' || V.view === 'history-day';
  const progBtn = document.getElementById('nb-progress');
  if (progBtn) progBtn.className = 'nb' + (progressActive ? ' on' : '');
  const mProgBtn = document.getElementById('mnb-progress');
  if (mProgBtn) mProgBtn.className = 'mnb' + (progressActive ? ' on' : '');
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
	<h2 class="page-title">Sentences</h2>
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

// ─── VOCAB ───────────────────────────────────
function vocabTopicById(id) {
  return VOCAB_TOPICS.find(topic => topic.id === id) || null;
}
function vocabDisplay(card) {
  return card && card.article ? `${card.article} ${card.de}` : (card ? card.de : '');
}
function vocabSpeakText(card) {
  return vocabDisplay(card);
}
function vocabMetaLabel(card) {
  if (!card) return '';
  if (card.pos === 'noun') return `${card.article} · ${card.gender}${card.plural ? ` · plural: ${card.plural}` : ''}`;
  return VOCAB_POS_LABELS[card.pos] || card.pos;
}
function vocabCardsForView() {
  const due = new Set(getVocabReviewIds());
  const q = V.query.trim().toLowerCase();
  return VOCAB_CARDS.filter(card => {
    if (V.vocabTopicId && card.topic !== V.vocabTopicId) return false;
    if (V.vocabFilter === 'new' && DB.vocabLearned.has(card.id)) return false;
    if (V.vocabFilter === 'due' && !due.has(card.id)) return false;
    if (V.vocabFilter === 'learned' && !DB.vocabLearned.has(card.id)) return false;
    if (V.vocabFilter === 'saved' && !DB.vocabFavorites.has(card.id)) return false;
    if (!q) return true;
    const topic = vocabTopicById(card.topic);
    return [vocabDisplay(card), card.de, card.en, card.pos, card.article, card.gender, card.plural, topic && topic.name, topic && topic.german]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(q));
  }).sort((a, b) => a.priority - b.priority);
}
function renderLoadMore(shown, total, action) {
  if (total <= shown) return '';
  const remaining = total - shown;
  const next = Math.min(remaining, PAGE_SIZE);
  return `<div class="load-more-wrap">
    <span class="load-more-info">Showing ${shown} of ${total}</span>
    <button class="load-more-btn" onclick="${action}" type="button">Load ${next} more</button>
  </div>`;
}

function loadMoreFreq() { V.freqPage = (V.freqPage || 1) + 1; render(); }
function loadMoreVocab() { V.vocabPage = (V.vocabPage || 1) + 1; render(); }

function renderVocab() {
  ensureVocabDailyQueue();
  const dueIds = getVocabReviewIds();
  const dueCards = dueIds.map(id => VOCAB_BY_ID[id]).filter(Boolean);
  const queueCards = DB.vocabDailyQueue.map(id => VOCAB_BY_ID[id]).filter(Boolean);
  const queueDone = queueCards.filter(card => DB.vocabDailyQueueDone.has(card.id) || (DB.vocabSrs[card.id] && DB.vocabSrs[card.id].lastReview === today())).length;
  const learned = DB.vocabLearned.size;
  const saved = DB.vocabFavorites.size;
  const remaining = VOCAB_CARDS.length - learned;
  const queuePct = queueCards.length ? Math.min(100, Math.round(queueDone / queueCards.length * 100)) : 0;
  const visibleCards = vocabCardsForView();
  const visibleIds = visibleCards.map(card => card.id);
  const queueIds = queueCards.map(card => card.id);
  const dueIdsJson = idsArg(dueIds);
  const queueIdsJson = idsArg(queueIds);
  const visibleIdsJson = idsArg(visibleIds);
  const selectedTopic = vocabTopicById(V.vocabTopicId);
  const dueSection = dueCards.length ? `<div class="review-section vocab-review-section">
  <div class="review-section-hdr">
    <div class="review-section-title">🔁 Due Vocab Review <span class="review-count-badge">${dueCards.length}</span></div>
    <button class="review-practice-btn" onclick="startVocabPractice({ids:${dueIdsJson},isSRS:true})">Practice Now</button>
  </div>
  <div class="review-section-sub">These vocabulary cards are scheduled for spaced review today.</div>
</div>` : '';
  const goalOptions = [5, 10, 15, 20, 25, 30].map(n => `<button class="vocab-goal-opt${DB.vocabDailyGoal === n ? ' on' : ''}" onclick="setVocabGoal(${n})" aria-pressed="${DB.vocabDailyGoal === n}" type="button">${n}</button>`).join('');
  const topicChips = [`<button class="filter-chip${!V.vocabTopicId ? ' on' : ''}" onclick="setVocabTopic(null)" aria-pressed="${!V.vocabTopicId}" type="button">All topics</button>`]
    .concat(VOCAB_TOPICS.map(topic => `<button class="filter-chip${V.vocabTopicId === topic.id ? ' on' : ''}" onclick="setVocabTopic('${topic.id}')" aria-pressed="${V.vocabTopicId === topic.id}" type="button">${topic.emoji} ${topic.name}</button>`))
    .join('');
  const cardsTitle = V.query
    ? `Search Results (${visibleCards.length})`
    : selectedTopic
    ? `${selectedTopic.emoji} ${selectedTopic.name} (${visibleCards.length})`
    : V.vocabFilter === 'all'
    ? `All Vocab Cards (${visibleCards.length})`
    : `${V.vocabFilter.charAt(0).toUpperCase() + V.vocabFilter.slice(1)} Cards (${visibleCards.length})`;

  return `<div style="padding-top:14px">
<h2 class="page-title">Vocabulary</h2>
<p class="page-sub">Build your German vocabulary with spaced repetition.</p>
${dueSection}

<div class="goal-card vocab-goal-card">
  <div class="goal-top">
    <div><div class="goal-title">🗂️ Today's Vocab Queue</div><div class="goal-date">${queueCards.length} card${queueCards.length !== 1 ? 's' : ''} ready</div></div>
    <button class="goal-btn" onclick="refreshVocabQueue()" type="button">New batch</button>
  </div>
  <div class="goal-nums">
    <div><div class="gnum-v" style="color:var(--green)">${queueDone}</div><div class="gnum-l">Queue done</div></div>
    <div><div class="gnum-v" style="color:var(--amber)">${dueIds.length}</div><div class="gnum-l">Due</div></div>
    <div><div class="gnum-v" style="color:var(--accent)">${learned}</div><div class="gnum-l">Learned</div></div>
    <div><div class="gnum-v" style="color:var(--pink)">${saved}</div><div class="gnum-l">Saved</div></div>
    <div><div class="gnum-v" style="color:var(--text-3)">${remaining}</div><div class="gnum-l">Remaining</div></div>
  </div>
  <div class="goal-bar-bg"><div class="goal-bar-fill" style="width:${queuePct}%"></div></div>
  <div class="vocab-goal-row">
    <span>Daily vocab goal</span>
    <div class="vocab-goal-options">${goalOptions}</div>
  </div>
</div>

<div class="vocab-action-row">
  ${queueCards.length ? `<button class="learned-practice-btn" onclick="startVocabPractice({ids:${queueIdsJson}})">🎯 Practice Today's ${queueCards.length}</button>` : ''}
  ${dueCards.length ? `<button class="review-practice-btn" onclick="startVocabPractice({ids:${dueIdsJson},isSRS:true})">🔁 Practice Due ${dueCards.length}</button>` : ''}
  ${visibleCards.length ? `<button class="act-btn vocab-visible-practice" onclick="startVocabPractice({ids:${visibleIdsJson},skipSessionFilter:true})">Practice Visible</button>` : ''}
</div>

${queueCards.length ? `<div class="sec-lbl">Today's New / Due Queue</div>${queueCards.map((card, i) => renderVocabCard(card, i)).join('')}` : ''}

<div class="search-wrap" style="margin:16px 0"><span class="search-icon">🔍</span><input class="search-input" placeholder="Search vocab, English meaning, topic, article, plural..." value="${esc(V.query)}" oninput="setQuery(this.value)" type="text"></div>
<div class="filter-row vocab-topic-row">${topicChips}</div>
<div class="filter-row">
  ${['all', 'new', 'due', 'learned', 'saved'].map(f => `<button class="filter-chip${V.vocabFilter === f ? ' on' : ''}" onclick="setVocabFilter('${f}')" aria-pressed="${V.vocabFilter === f}" type="button">${f === 'all' ? 'All' : f === 'new' ? 'New' : f === 'due' ? 'Due' : f === 'learned' ? '✓ Learned' : '⭐ Saved'}</button>`).join('')}
</div>
<div class="sec-lbl">${cardsTitle}</div>
${visibleCards.length ? visibleCards.slice(0, (V.vocabPage || 1) * PAGE_SIZE).map((card, i) => renderVocabCard(card, i)).join('') + renderLoadMore(Math.min(visibleCards.length, (V.vocabPage || 1) * PAGE_SIZE), visibleCards.length, 'loadMoreVocab()') : `<div class="empty-state"><div class="empty-icon">🔍</div>No vocab cards match.</div>`}
  </div>`;
}
function renderVocabCard(card, i) {
  const topic = vocabTopicById(card.topic);
  const learned = DB.vocabLearned.has(card.id);
  const saved = DB.vocabFavorites.has(card.id);
  const nextLabel = vocabSrsNextLabel(card.id);
  const srsLvl = getVocabSrsLevel(card.id);
  const srsDots = learned ? `<span class="srs-dots" title="${esc(nextLabel)}">${SRS_INTERVALS.map((_, dot) => `<span class="srs-dot${dot < srsLvl ? ' filled' : ''}"></span>`).join('')}</span>${nextLabel ? `<span class="srs-next">${esc(nextLabel)}</span>` : ''}` : '';
  const gender = card.pos === 'noun' ? `<span class="vocab-gender g-${card.gender}">${card.article} · ${card.gender}</span>` : `<span class="vocab-gender">${esc(VOCAB_POS_LABELS[card.pos] || card.pos)}</span>`;
  return `<div class="vc${learned ? ' lrn' : ''}${saved ? ' fav' : ''}" id="vc-${card.id}">
<div class="sc-top">
  ${topic ? `<span class="topic-label">${topic.emoji} ${topic.name}</span>` : ''}
  <span class="lvl-tag l${card.level}">${card.level}</span>
  ${gender}
  ${learned ? `<span class="lrn-badge">✓ Learned</span>${srsDots}` : ''}
</div>
<button class="vocab-term reveal-btn" onclick="toggleVocabReveal('${card.id}')" aria-expanded="false" type="button" lang="de">${esc(vocabDisplay(card))}</button>
<div class="vocab-meta">${esc(vocabMetaLabel(card))}</div>
<div class="reveal-hint" id="vhn-${card.id}">👆 Tap to reveal meaning and example</div>
<button class="vocab-en hid reveal-btn" id="ven-${card.id}" onclick="toggleVocabReveal('${card.id}')" aria-hidden="true" hidden type="button">${esc(card.en)}</button>
<div class="vocab-details" id="vrd-${card.id}" style="display:none">
  ${card.plural ? `<div class="vocab-detail-row"><strong>Plural</strong><span lang="de">${esc(card.plural)}</span></div>` : ''}
  <div class="vocab-example"><strong>Example</strong><span lang="de">${esc(card.example.de)}</span><em>${esc(card.example.en)}</em></div>
</div>
<div class="card-actions">
  <button class="act-btn speak-btn" data-id="vocab-${card.id}" onclick="speak(${jsArg(vocabSpeakText(card))},'vocab-${card.id}')" type="button">
    ${ICO.speak} Listen
  </button>
  <button class="act-btn${learned ? ' is-learned' : ''}" id="vlrn-btn-${card.id}" onclick="toggleVocabLearned('${card.id}')">
    ${ICO.check} ${learned ? 'Learned' : 'Mark learned'}
  </button>
  <button class="act-btn${saved ? ' is-fav' : ''}" id="vfav-btn-${card.id}" onclick="toggleVocabFav('${card.id}')">
    ${ICO.star} ${saved ? 'Saved' : 'Save'}
  </button>
  <button class="act-btn" onclick="startVocabPractice({ids:['${card.id}'],skipSessionFilter:true})">Practice</button>
</div>
  </div>`;
}

// ══════════════════════════════════════════════
// FREQUENCY DICTIONARY
// ══════════════════════════════════════════════
function freqDisplay(entry) {
  return entry ? entry.german : '';
}
function freqPosLabel(entry) {
  if (!entry || !entry.pos) return '';
  return entry.pos.split(/[;,]/).map(p => p.trim()).filter(Boolean).join(' · ');
}
function freqSentenceWithHighlight(entry) {
  if (!entry || !entry.germanSentence) return '';
  const word = esc(entry.german).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^\\p{L}])(${word})(?=[^\\p{L}]|$)`, 'giu');
  return esc(entry.germanSentence).replace(regex, '$1<strong lang="de">$2</strong>');
}
function freqCardsForView() {
  const due = new Set(getFreqReviewIds());
  const q = V.query.trim().toLowerCase();
  const [rangeMin, rangeMax] = V.freqRange === 'all' ? [0, Infinity] : V.freqRange.split('-').map(Number);
  if (typeof FREQUENCY_DICTIONARY === 'undefined') return [];
  const filtered = FREQUENCY_DICTIONARY.filter(entry => {
    const id = String(entry.rank);
    if (V.freqRange !== 'all' && (entry.rank < rangeMin || entry.rank > rangeMax)) return false;
    if (V.freqFilter === 'new' && DB.freqLearned.has(id)) return false;
    if (V.freqFilter === 'due' && !due.has(id)) return false;
    if (V.freqFilter === 'learned' && !DB.freqLearned.has(id)) return false;
    if (V.freqFilter === 'saved' && !DB.freqFavorites.has(id)) return false;
    if (!q) return true;
    return [entry.german, entry.english, entry.pos, entry.germanSentence, entry.englishSentence]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(q));
  });
  return filtered.sort((a, b) => a.rank - b.rank);
}
function renderFrequency() {
  if (!V.freqRange || !VALID_FREQ_RANGES.has(V.freqRange)) V.freqRange = 'all';
  if (!V.freqFilter || !VALID_FREQ_FILTERS.has(V.freqFilter)) V.freqFilter = 'all';
  ensureFreqDailyQueue();
  const dueIds = getFreqReviewIds().sort((a, b) => Number(a) - Number(b));
  const dueEntries = dueIds.map(id => freqById(id)).filter(Boolean).sort((a, b) => a.rank - b.rank);
  const queueEntries = DB.freqDailyQueue.map(id => freqById(id)).filter(Boolean).sort((a, b) => a.rank - b.rank);
  const queueDone = queueEntries.filter(e => DB.freqDailyQueueDone.has(String(e.rank)) || (DB.freqSrs[String(e.rank)] && DB.freqSrs[String(e.rank)].lastReview === today())).length;
  const learned = DB.freqLearned.size;
  const saved = DB.freqFavorites.size;
  const total = typeof FREQUENCY_DICTIONARY === 'undefined' ? 0 : FREQUENCY_DICTIONARY.length;
  const remaining = total - learned;
  const queuePct = queueEntries.length ? Math.min(100, Math.round(queueDone / queueEntries.length * 100)) : 0;
  const visibleEntries = freqCardsForView();
  const visibleIds = visibleEntries.map(e => String(e.rank));
  const queueIds = queueEntries.map(e => String(e.rank));
  const dueIdsJson = idsArg(dueIds);
  const queueIdsJson = idsArg(queueIds);
  const visibleIdsJson = idsArg(visibleIds);
  const rangeChips = [['all', 'All'], ['1-500', '1–500'], ['501-1000', '501–1000'], ['1001-1500', '1001–1500'], ['1501-2000', '1501–2000'], ['2001-2525', '2001–2525']]
    .map(([r, label]) => `<button class="filter-chip${V.freqRange === r ? ' on' : ''}" onclick="setFreqRange('${r}')" aria-pressed="${V.freqRange === r}" type="button">${esc(label)}</button>`).join('');
  const dueSection = dueEntries.length ? `<div class="review-section vocab-review-section">
  <div class="review-section-hdr">
    <div class="review-section-title">🔁 Due Frequency Review <span class="review-count-badge">${dueEntries.length}</span></div>
    <button class="review-practice-btn" onclick="startFrequencyPractice({ids:${dueIdsJson},isSRS:true})">Practice Now</button>
  </div>
  <div class="review-section-sub">These frequency cards are scheduled for spaced review today.</div>
</div>` : '';
  const goalOptions = [5, 10, 15, 20, 25, 30].map(n => `<button class="vocab-goal-opt${DB.freqDailyGoal === n ? ' on' : ''}" onclick="setFreqGoal(${n})" aria-pressed="${DB.freqDailyGoal === n}" type="button">${n}</button>`).join('');
  const cardsTitle = V.query
    ? `Search Results (${visibleEntries.length})`
    : V.freqRange === 'all'
    ? `All Frequency Cards (${visibleEntries.length})`
    : `Rank ${esc(V.freqRange)} (${visibleEntries.length})`;

  return `<div style="padding-top:14px">
<h2 class="page-title">Vocabulary</h2>
<p class="page-sub">The 2,525 most common German words, ranked by frequency — with example sentences and spaced review.</p>
${dueSection}

<div class="goal-card vocab-goal-card">
  <div class="goal-top">
    <div><div class="goal-title">🔤 Today's Frequency Queue</div><div class="goal-date">${queueEntries.length} card${queueEntries.length !== 1 ? 's' : ''} ready</div></div>
    <button class="goal-btn" onclick="refreshFreqQueue()" type="button">New batch</button>
  </div>
  <div class="goal-nums">
    <div><div class="gnum-v" style="color:var(--green)">${queueDone}</div><div class="gnum-l">Queue done</div></div>
    <div><div class="gnum-v" style="color:var(--amber)">${dueIds.length}</div><div class="gnum-l">Due</div></div>
    <div><div class="gnum-v" style="color:var(--accent)">${learned}</div><div class="gnum-l">Learned</div></div>
    <div><div class="gnum-v" style="color:var(--pink)">${saved}</div><div class="gnum-l">Saved</div></div>
    <div><div class="gnum-v" style="color:var(--text-3)">${remaining}</div><div class="gnum-l">Remaining</div></div>
  </div>
  <div class="goal-bar-bg"><div class="goal-bar-fill" style="width:${queuePct}%"></div></div>
  <div class="vocab-goal-row">
    <span>Daily frequency goal</span>
    <div class="vocab-goal-options">${goalOptions}</div>
  </div>
</div>

<div class="vocab-action-row">
  ${queueEntries.length ? `<button class="learned-practice-btn" onclick="startFrequencyPractice({ids:${queueIdsJson}})">🎯 Practice Today's ${queueEntries.length}</button>` : ''}
  ${dueEntries.length ? `<button class="review-practice-btn" onclick="startFrequencyPractice({ids:${dueIdsJson},isSRS:true})">🔁 Practice Due ${dueEntries.length}</button>` : ''}
</div>

${queueEntries.length ? `<details class="freq-queue-preview" open>
  <summary class="freq-queue-summary"><span class="sec-lbl freq-queue-lbl">Today's New / Due Queue</span><span class="freq-queue-toggle">Show words</span></summary>
  <div class="freq-chip-row">${queueEntries.map(e => `<button class="freq-chip" onclick="startFrequencyPractice({ids:['${String(e.rank)}'],skipSessionFilter:true})" type="button"><span class="freq-chip-rank">#${e.rank}</span> <span lang="de">${esc(freqDisplay(e))}</span></button>`).join('')}</div>
</details>` : ''}

<div class="freq-browse-section">
<div class="sec-lbl freq-browse-lbl">📚 Browse Dictionary</div>
<div class="search-wrap" style="margin:12px 0"><span class="search-icon">🔍</span><input class="search-input" placeholder="Search German word, English meaning, or sentence..." value="${esc(V.query)}" oninput="setQuery(this.value)" type="text"></div>
<div class="filter-row vocab-topic-row">${rangeChips}</div>
<div class="filter-row">
  ${['all', 'new', 'due', 'learned', 'saved'].map(f => `<button class="filter-chip${V.freqFilter === f ? ' on' : ''}" onclick="setFreqFilter('${f}')" aria-pressed="${V.freqFilter === f}" type="button">${f === 'all' ? 'All' : f === 'new' ? 'New' : f === 'due' ? 'Due' : f === 'learned' ? '✓ Learned' : '⭐ Saved'}</button>`).join('')}
</div>
<div class="freq-browse-hdr">
  <div class="sec-lbl freq-browse-results-lbl">${cardsTitle}</div>
  ${visibleEntries.length ? `<button class="act-btn vocab-visible-practice" onclick="startFrequencyPractice({ids:${visibleIdsJson},skipSessionFilter:true})">🎯 Practice These</button>` : ''}
</div>
${visibleEntries.length ? visibleEntries.slice(0, (V.freqPage || 1) * PAGE_SIZE).map((e, i) => renderFreqCard(e, i)).join('') + renderLoadMore(Math.min(visibleEntries.length, (V.freqPage || 1) * PAGE_SIZE), visibleEntries.length, 'loadMoreFreq()') : `<div class="empty-state"><div class="empty-icon">🔍</div>No frequency cards match.</div>`}
</div>
  </div>`;
}
function renderFreqCard(entry, i) {
  const id = String(entry.rank);
  const learned = DB.freqLearned.has(id);
  const saved = DB.freqFavorites.has(id);
  const nextLabel = freqSrsNextLabel(id);
  const srsLvl = getFreqSrsLevel(id);
  const srsDots = learned ? `<span class="srs-dots" title="${esc(nextLabel)}">${SRS_INTERVALS.map((_, dot) => `<span class="srs-dot${dot < srsLvl ? ' filled' : ''}"></span>`).join('')}</span>${nextLabel ? `<span class="srs-next">${esc(nextLabel)}</span>` : ''}` : '';
  return `<div class="vc freq-card${learned ? ' lrn' : ''}${saved ? ' fav' : ''}" id="fc-${id}">
<div class="sc-top">
  <span class="topic-label">#${entry.rank}</span>
  <span class="lvl-tag">${esc(freqPosLabel(entry))}</span>
  ${learned ? `<span class="lrn-badge">✓ Learned</span>${srsDots}` : ''}
</div>
<button class="vocab-term reveal-btn" onclick="toggleFreqReveal('${id}')" aria-expanded="false" type="button" lang="de">${esc(freqDisplay(entry))}</button>
<div class="freq-sentence" lang="de">${freqSentenceWithHighlight(entry)}</div>
<div class="reveal-hint" id="fhn-${id}">👆 Tap to reveal English translation</div>
<button class="vocab-en hid reveal-btn" id="fen-${id}" onclick="toggleFreqReveal('${id}')" aria-hidden="true" hidden type="button">
  <span class="freq-en-word">${esc(entry.english)}</span>
  <span class="freq-en-sentence">${esc(entry.englishSentence)}</span>
</button>
<div class="freq-ipa hid" id="fipa-${id}" hidden>${entry.ipa ? esc(entry.ipa) : ''}</div>
<div class="card-actions">
  <button class="act-btn speak-btn" data-id="freq-${id}" onclick="speak(${jsArg(entry.germanSentence || entry.german)},'freq-${id}')" type="button">
    ${ICO.speak} Listen
  </button>
  <button class="act-btn${learned ? ' is-learned' : ''}" id="flrn-btn-${id}" onclick="toggleFreqLearned('${id}')">
    ${ICO.check} ${learned ? 'Learned' : 'Mark learned'}
  </button>
  <button class="act-btn${saved ? ' is-fav' : ''}" id="ffav-btn-${id}" onclick="toggleFreqFav('${id}')">
    ${ICO.star} ${saved ? 'Saved' : 'Save'}
  </button>
  <button class="act-btn" onclick="startFrequencyPractice({ids:['${id}'],skipSessionFilter:true})">Practice</button>
</div>
  </div>`;
}
function toggleFreqReveal(id) {
  const en = document.getElementById('fen-' + id);
  const hn = document.getElementById('fhn-' + id);
  const ipa = document.getElementById('fipa-' + id);
  const card = document.getElementById('fc-' + id);
  if (!en) return;
  if (en.classList.contains('hid')) {
    en.hidden = false;
    en.setAttribute('aria-hidden', 'false');
    en.classList.remove('hid');
    if (hn) hn.style.display = 'none';
    if (ipa) { ipa.hidden = false; ipa.classList.remove('hid'); }
    if (card) card.querySelectorAll('.reveal-btn').forEach(btn => btn.setAttribute('aria-expanded', 'true'));
  } else {
    en.classList.add('hid');
    en.hidden = true;
    en.setAttribute('aria-hidden', 'true');
    if (hn) hn.style.display = 'block';
    if (ipa) { ipa.hidden = true; ipa.classList.add('hid'); }
    if (card) card.querySelectorAll('.reveal-btn').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
  }
}
function setFreqFilter(filter) {
  V.freqFilter = VALID_FREQ_FILTERS.has(filter) ? filter : 'all';
  V.freqPage = 1;
  commitState();
}
function setFreqRange(range) {
  V.freqRange = VALID_FREQ_RANGES.has(range) ? range : 'all';
  V.freqPage = 1;
  commitState();
}
function setFreqGoal(n) {
  DB.freqDailyGoal = clampNumber(n, 1, 50, DEFAULT_FREQ_DAILY_GOAL);
  save();
  render();
}
function refreshFreqQueue() {
  DB.freqDailyQueue = [];
  ensureFreqDailyQueue();
  render();
}

// ─── GRAMMAR ─────────────────────────────────
let GQ = { lessonId: null, questions: [], index: 0, selected: null, correct: 0, complete: false };

function grammarSearchText(lesson, module) {
  return [
    module.level,
    lesson.title, lesson.focus, lesson.explanation, lesson.tip,
    ...(lesson.rules || []),
    ...(lesson.mistakes || []),
    ...(lesson.practice || []),
    ...(lesson.examples || []).flatMap(example => [example.de, example.en]),
  ].filter(Boolean).join(' ').toLowerCase();
}

function grammarScorePercent(lessonId) {
  const score = DB.grammarScores[lessonId];
  return score && score.total ? Math.round(score.correct / score.total * 100) : 0;
}

function grammarLessonStatus(lessonId) {
  const score = DB.grammarScores[lessonId];
  if (score && score.total && score.correct / score.total >= 0.8) return 'mastered';
  if (DB.grammarStudied.has(lessonId)) return 'studied';
  if (score && score.total) return 'practicing';
  return 'new';
}

function grammarStatusLabel(status) {
  return status === 'mastered' ? 'Mastered' : status === 'studied' ? 'Studied' : status === 'practicing' ? 'Practicing' : 'New';
}

function grammarModuleStats(module) {
  const studied = module.lessons.filter(lesson => DB.grammarStudied.has(lesson.id)).length;
  const mastered = module.lessons.filter(lesson => grammarLessonStatus(lesson.id) === 'mastered').length;
  return {
    studied,
    mastered,
    total: module.lessons.length,
    percent: module.lessons.length ? Math.round(studied / module.lessons.length * 100) : 0,
  };
}

function setGrammarModule(moduleId) {
  V.grammarModuleId = normalizeGrammarModuleId(moduleId);
  V.grammarLessonId = normalizeGrammarLessonId(V.grammarModuleId, null);
  V.query = '';
  GQ = { lessonId: null, questions: [], index: 0, selected: null, correct: 0, complete: false };
  commitState({ scroll: true });
}

function setGrammarLesson(lessonId) {
  const lesson = GRAMMAR_LESSON_BY_ID[lessonId];
  if (!lesson) return;
  V.grammarModuleId = lesson.moduleId;
  V.grammarLessonId = lesson.id;
  V.query = '';
  GQ = { lessonId: null, questions: [], index: 0, selected: null, correct: 0, complete: false };
  commitState();
  setTimeout(() => {
    const detail = document.getElementById('grammar-lesson-detail');
    if (detail && typeof detail.scrollIntoView === 'function') detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 0);
}

function toggleGrammarStudied(lessonId) {
  setGrammarStudied(lessonId, !DB.grammarStudied.has(lessonId));
  render();
}

function grammarExerciseOptions(correct, pool, offset) {
  const distractors = [...new Set(pool.filter(value => value && value !== correct))];
  const chosen = [];
  for (let i = 0; i < distractors.length && chosen.length < 3; i++) {
    chosen.push(distractors[(i + offset) % distractors.length]);
  }
  const options = [correct, ...chosen];
  const rotation = options.length ? offset % options.length : 0;
  return [...options.slice(rotation), ...options.slice(0, rotation)];
}

function grammarQuizOptions(item, index) {
  const options = [item.a, ...(item.d || [])];
  const rotation = options.length ? (index + 1) % options.length : 0;
  return [...options.slice(rotation), ...options.slice(0, rotation)];
}

function grammarQuestionCount(lesson) {
  return (lesson.quiz && lesson.quiz.length) ? lesson.quiz.length : (lesson.examples || []).length * 2;
}

function grammarExercisesForLesson(lesson) {
  if (lesson.quiz && lesson.quiz.length) {
    return lesson.quiz.map((item, index) => ({
      prompt: item.q,
      options: grammarQuizOptions(item, index),
      answer: item.a,
      lang: 'de',
    }));
  }
  const module = GRAMMAR_MODULE_BY_ID[lesson.moduleId];
  const moduleExamples = module.lessons.flatMap(item => item.examples || []);
  return (lesson.examples || []).flatMap((example, index) => [
    {
      prompt: `Choose the German sentence for: ${example.en}`,
      options: grammarExerciseOptions(example.de, moduleExamples.map(item => item.de), index + 1),
      answer: example.de,
      lang: 'de',
    },
    {
      prompt: `Choose the meaning of: ${example.de}`,
      options: grammarExerciseOptions(example.en, moduleExamples.map(item => item.en), index + 2),
      answer: example.en,
    },
  ]);
}

function startGrammarExercises(lessonId) {
  const lesson = GRAMMAR_LESSON_BY_ID[lessonId];
  if (!lesson) return;
  GQ = { lessonId, questions: grammarExercisesForLesson(lesson), index: 0, selected: null, correct: 0, complete: false };
  render();
  setTimeout(() => {
    const panel = document.getElementById('grammar-exercise-panel');
    if (panel && typeof panel.scrollIntoView === 'function') panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 0);
}

function answerGrammarExercise(optionIndex) {
  if (GQ.complete || GQ.selected !== null) return;
  const question = GQ.questions[GQ.index];
  if (!question || optionIndex < 0 || optionIndex >= question.options.length) return;
  GQ.selected = optionIndex;
  if (question.options[optionIndex] === question.answer) GQ.correct++;
  render();
}

function nextGrammarExercise() {
  if (GQ.selected === null || GQ.complete) return;
  if (GQ.index >= GQ.questions.length - 1) {
    GQ.complete = true;
    recordGrammarScore(GQ.lessonId, GQ.correct, GQ.questions.length);
  } else {
    GQ.index++;
    GQ.selected = null;
  }
  render();
}

function renderGrammarIndexItem(lesson, module, index, selected) {
  const status = grammarLessonStatus(lesson.id);
  const score = grammarScorePercent(lesson.id);
  return `<button class="grammar-index-item${selected ? ' on' : ''}" onclick="setGrammarLesson('${lesson.id}')" type="button">
  <span class="grammar-index-number">${String(index + 1).padStart(2, '0')}</span>
  <span class="grammar-index-copy">
    <strong>${esc(lesson.title)}</strong>
    <span>${esc(lesson.focus)}</span>
  </span>
  <span class="grammar-index-status ${status}">${status === 'mastered' ? `${score}%` : grammarStatusLabel(status)}</span>
</button>`;
}

function renderGrammarExercisePanel(lesson) {
  const score = DB.grammarScores[lesson.id];
  const questionCount = grammarQuestionCount(lesson);
  if (GQ.lessonId !== lesson.id) {
    return `<section class="grammar-exercise-panel" id="grammar-exercise-panel">
  <div>
    <div class="grammar-box-title">Quick check</div>
    <h3>${questionCount} practice questions</h3>
    <p>Fill the gaps and choose the correct forms to lock in this topic.</p>
  </div>
  <div class="grammar-exercise-actions">
    ${score ? `<span class="grammar-best-score">Best ${grammarScorePercent(lesson.id)}%</span>` : ''}
    <button class="grammar-primary-btn" onclick="startGrammarExercises('${lesson.id}')" type="button">${score ? 'Practice again' : 'Start exercises'}</button>
  </div>
</section>`;
  }
  if (GQ.complete) {
    const percent = GQ.questions.length ? Math.round(GQ.correct / GQ.questions.length * 100) : 0;
    return `<section class="grammar-exercise-panel complete" id="grammar-exercise-panel">
  <div>
    <div class="grammar-box-title">Quick check complete</div>
    <h3>${GQ.correct} / ${GQ.questions.length} correct</h3>
    <p>${percent >= 80 ? 'This topic is now marked mastered.' : 'Review the rules and examples, then try once more.'}</p>
  </div>
  <div class="grammar-exercise-actions">
    <span class="grammar-best-score">${percent}%</span>
    <button class="grammar-primary-btn" onclick="startGrammarExercises('${lesson.id}')" type="button">Practice again</button>
  </div>
</section>`;
  }
  const question = GQ.questions[GQ.index];
  const answered = GQ.selected !== null;
  return `<section class="grammar-exercise-panel active" id="grammar-exercise-panel">
  <div class="grammar-quiz-progress">
    <span>Question ${GQ.index + 1} of ${GQ.questions.length}</span>
    <strong>${GQ.correct} correct</strong>
  </div>
  <div class="grammar-quiz-bar"><span style="width:${Math.round((GQ.index + (answered ? 1 : 0)) / GQ.questions.length * 100)}%"></span></div>
  <h3 class="grammar-quiz-prompt">${esc(question.prompt)}</h3>
  <div class="grammar-quiz-options">
    ${question.options.map((option, index) => {
      const isCorrect = option === question.answer;
      const isSelected = GQ.selected === index;
      const state = answered ? isCorrect ? ' correct' : isSelected ? ' wrong' : ' muted' : '';
      const mark = answered ? (isCorrect ? '<span class="grammar-quiz-mark" aria-hidden="true">\u2713</span>' : (isSelected ? '<span class="grammar-quiz-mark" aria-hidden="true">\u2717</span>' : '')) : '';
      return `<button class="grammar-quiz-option${state}" onclick="answerGrammarExercise(${index})" ${answered ? 'disabled' : ''}${question.lang ? ` lang="${question.lang}"` : ''} type="button"><span class="grammar-quiz-key" aria-hidden="true">${index + 1}</span>${esc(option)}${mark}</button>`;
    }).join('')}
  </div>
  ${answered ? `<div class="grammar-quiz-feedback ${question.options[GQ.selected] === question.answer ? 'correct' : 'wrong'}" role="status">
    ${question.options[GQ.selected] === question.answer ? '\u2713 Correct.' : `\u2717 Correct answer: ${esc(question.answer)}`}
  </div>
  <button class="grammar-primary-btn grammar-next-question" onclick="nextGrammarExercise()" type="button">${GQ.index >= GQ.questions.length - 1 ? 'Finish' : 'Next question'}</button>` : ''}
</section>`;
}

function renderGrammar() {
  const selected = GRAMMAR_MODULE_BY_ID[V.grammarModuleId] || GRAMMAR_MODULES[0];
  const selectedLessonId = normalizeGrammarLessonId(selected.id, V.grammarLessonId);
  V.grammarLessonId = selectedLessonId;
  const selectedLesson = GRAMMAR_LESSON_BY_ID[selectedLessonId];
  const q = V.query.trim().toLowerCase();
  const rows = q
    ? GRAMMAR_LESSONS
      .map(lesson => ({ lesson, module: GRAMMAR_MODULE_BY_ID[lesson.moduleId] }))
      .filter(row => row.module && grammarSearchText(row.lesson, row.module).includes(q))
    : selected.lessons.map(lesson => ({ lesson, module: selected }));
  const moduleCards = GRAMMAR_MODULES.map(module => {
    const stats = grammarModuleStats(module);
    const on = module.id === selected.id && !q;
    return `<button class="grammar-module-chip${on ? ' on' : ''}" onclick="setGrammarModule('${module.id}')" aria-pressed="${on}" type="button">
  <span class="grammar-module-chip-top"><strong>${esc(module.level)}</strong><em>${stats.studied}/${stats.total}</em></span>
  <span>${esc(module.title)}</span>
  <span class="grammar-module-progress"><i style="width:${stats.percent}%"></i></span>
</button>`;
  }).join('');
  const selectedStats = grammarModuleStats(selected);
  return `<div style="padding-top:14px">
<div class="grammar-page-heading">
  <div>
    <h2 class="page-title">Grammar</h2>
    <p class="page-sub">Complete A1-B1 curriculum with focused lessons, progress tracking, and exercises.</p>
  </div>
  <div class="grammar-total-progress">
    <strong>${DB.grammarStudied.size}/${GRAMMAR_LESSONS.length}</strong>
    <span>topics studied</span>
  </div>
</div>

<div class="grammar-module-row">${moduleCards}</div>

<section class="grammar-index-panel">
  <div class="grammar-index-head">
    <div>
      <div class="grammar-hero-label">${q ? 'Search results' : `${esc(selected.level)} curriculum index`}</div>
      <h3>${q ? `${rows.length} matching topics` : `${selected.lessons.length} topics · ${selectedStats.mastered} mastered`}</h3>
      ${q ? '' : `<p>${esc(selected.subtitle)}</p>`}
    </div>
    ${q ? '' : `<div class="grammar-level-progress"><strong>${selectedStats.percent}%</strong><span>studied</span></div>`}
  </div>
  <div class="search-wrap grammar-search"><span class="search-icon">🔍</span><input class="search-input" placeholder="Search all grammar topics..." value="${esc(V.query)}" oninput="setQuery(this.value)" type="text"></div>
  <div class="grammar-index-list">
    ${rows.length ? rows.map((row, index) => renderGrammarIndexItem(row.lesson, row.module, index, !q && row.lesson.id === selectedLessonId)).join('') : `<div class="empty-state"><div class="empty-icon">🔍</div>No grammar topic matches.</div>`}
  </div>
</section>

${q ? '' : renderGrammarLesson(selectedLesson, selected)}
  </div>`;
}

function renderGrammarLesson(lesson, module) {
  const examples = (lesson.examples || []).map((example, i) => `<div class="grammar-example">
  <button class="pat-ex-speak" onclick="event.stopPropagation();speak(${jsArg(example.de)},'gr-${lesson.id}-${i}')" title="Listen" type="button">🔊</button>
  <div><strong lang="de">${esc(example.de)}</strong><span>${esc(example.en)}</span></div>
</div>`).join('');
  const lessonIndex = module.lessons.findIndex(item => item.id === lesson.id);
  const previous = module.lessons[lessonIndex - 1];
  const next = module.lessons[lessonIndex + 1];
  const status = grammarLessonStatus(lesson.id);
  return `<section class="grammar-lesson-detail" id="grammar-lesson-detail">
<div class="grammar-card-top">
  <div>
    <div class="grammar-level-tag">${esc(module.level)} · Topic ${lessonIndex + 1} of ${module.lessons.length}</div>
    <h2>${esc(lesson.title)}</h2>
    <span class="grammar-focus">${esc(lesson.focus)}</span>
  </div>
  <button class="grammar-study-btn ${DB.grammarStudied.has(lesson.id) ? 'done' : ''}" onclick="toggleGrammarStudied('${lesson.id}')" type="button">
    ${DB.grammarStudied.has(lesson.id) ? `${ICO.check} Studied` : 'Mark studied'}
  </button>
</div>
<p class="grammar-explanation">${esc(lesson.explanation)}</p>
<div class="grammar-grid">
  <div class="grammar-box">
    <div class="grammar-box-title">Rules</div>
    ${(lesson.rules || []).map(rule => `<div class="grammar-rule">${esc(rule)}</div>`).join('')}
  </div>
  <div class="grammar-box">
    <div class="grammar-box-title">Examples</div>
    ${examples}
  </div>
</div>
<div class="grammar-note"><strong>Remember</strong><span>${esc(lesson.tip)}</span></div>
<div class="grammar-grid">
  <div class="grammar-box warn">
    <div class="grammar-box-title">Common mistakes</div>
    ${(lesson.mistakes || []).map(item => `<div class="grammar-rule">${esc(item)}</div>`).join('')}
  </div>
  <div class="grammar-box practice">
    <div class="grammar-box-title">Practice</div>
    ${(lesson.practice || []).map(item => `<div class="grammar-rule">${esc(item)}</div>`).join('')}
  </div>
</div>
${renderGrammarExercisePanel(lesson)}
<div class="grammar-lesson-nav">
  ${previous ? `<button onclick="setGrammarLesson('${previous.id}')" type="button"><span>Previous</span><strong>${esc(previous.title)}</strong></button>` : '<span></span>'}
  ${next ? `<button class="next" onclick="setGrammarLesson('${next.id}')" type="button"><span>Next</span><strong>${esc(next.title)}</strong></button>` : '<span></span>'}
</div>
<div class="grammar-status-line">Status: <strong>${grammarStatusLabel(status)}</strong>${DB.grammarScores[lesson.id] ? ` · Best exercise score: ${grammarScorePercent(lesson.id)}%` : ''}</div>
  </section>`;
}

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SENTENCE_VOCAB_GLOSSARY = [
  { de: 'Könnten Sie', en: 'could you (formal)', note: 'polite request' },
  { de: 'Können Sie', en: 'can you (formal)', note: 'polite request' },
  { de: 'Können wir', en: 'can we' },
  { de: 'Kann ich', en: 'can I' },
  { de: 'Haben Sie', en: 'do you have', note: 'formal question' },
  { de: 'Darf ich', en: 'may I' },
  { de: 'Muss ich', en: 'do I have to' },
  { de: 'Möchten Sie', en: 'would you like', note: 'formal' },
  { de: 'Möchtest du', en: 'would you like', note: 'informal' },
  { de: 'Ich möchte', en: 'I would like to' },
  { de: 'Ich würde gern', en: 'I would like to', note: 'polite form' },
  { de: 'Ich brauche', en: 'I need' },
  { de: 'Ich habe', en: 'I have' },
  { de: 'Ich bin', en: 'I am' },
  { de: 'Ich kann', en: 'I can / I am able to' },
  { de: 'Ich komme', en: 'I am coming / I will arrive' },
  { de: 'Ich suche', en: 'I am looking for' },
  { de: 'Soll ich', en: 'should I' },
  { de: 'Ich rufe wegen', en: 'I am calling about' },
  { de: 'Ich schicke', en: 'I will send' },
  { de: 'Ich melde mich', en: 'I will get back to you' },
  { de: 'Mir ist schwindelig', en: 'I feel dizzy', note: 'fixed phrase' },
  { de: 'Mir fehlen', en: 'I am missing / I still need', note: 'useful phrase' },
  { de: 'Es gibt', en: 'there is / there are' },
  { de: 'Gibt es', en: 'is there / are there' },
  { de: 'Bis wann', en: 'by when', note: 'deadline question' },
  { de: 'Wie oft', en: 'how often' },
  { de: 'Wie lange', en: 'how long' },
  { de: 'Wie hoch', en: 'how high / how much' },
  { de: 'Welche', en: 'which' },
  { de: 'Auf welchem', en: 'on which' },
  { de: 'Auf welchen Namen', en: 'under which name' },
  { de: 'Wer ist', en: 'who is' },
  { de: 'Wo ist', en: 'where is' },
  { de: 'Wo sind', en: 'where are' },
  { de: 'Wo stehen', en: 'where are standing / located' },
  { de: 'Wo fährt', en: 'where does it leave' },
  { de: 'Wo muss ich', en: 'where do I have to' },
  { de: 'Was bedeutet', en: 'what does it mean' },
  { de: 'Meinen Sie', en: 'do you mean' },
  { de: 'Nehmen Sie', en: 'do you accept / take', note: 'formal question' },
  { de: 'Passt Ihnen', en: 'does it work for you', note: 'formal' },
  { de: 'Passt dir', en: 'does it work for you', note: 'informal' },
  { de: 'Sagen Sie mir bitte Bescheid', en: 'please let me know', note: 'formal' },
  { de: 'Sag mir Bescheid', en: 'let me know', note: 'informal' },
  { de: 'noch einmal', en: 'one more time' },
  { de: 'sagen', en: 'to say', note: 'verb' },
  { de: 'langsamer sprechen', en: 'to speak more slowly' },
  { de: 'verstanden', en: 'understood' },
  { de: 'Wort', en: 'word' },
  { de: 'Abkürzung', en: 'abbreviation' },
  { de: 'aufschreiben', en: 'to write down', note: 'verb' },
  { de: 'Beispiel', en: 'example' },
  { de: 'geben', en: 'to give', note: 'verb' },
  { de: 'einfacher', en: 'simpler / easier' },
  { de: 'Deutsch', en: 'German' },
  { de: 'zeigen', en: 'to show', note: 'verb' },
  { de: 'steht', en: 'is written / stands', note: 'verb' },
  { de: 'schicken', en: 'to send', note: 'verb' },
  { de: 'Termin', en: 'appointment' },
  { de: 'vereinbaren', en: 'to arrange / make', note: 'verb' },
  { de: 'buchen', en: 'to book', note: 'verb' },
  { de: 'verschieben', en: 'to move / reschedule', note: 'verb' },
  { de: 'absagen', en: 'to cancel', note: 'verb' },
  { de: 'bestätigen', en: 'to confirm', note: 'verb' },
  { de: 'anmelden', en: 'to register', note: 'verb' },
  { de: 'Anmeldung', en: 'registration' },
  { de: 'Warteliste', en: 'waiting list' },
  { de: 'Bestätigung', en: 'confirmation' },
  { de: 'Unterlagen', en: 'documents / paperwork' },
  { de: 'mitbringen', en: 'to bring along', note: 'verb' },
  { de: 'fehlen', en: 'to be missing', note: 'verb' },
  { de: 'Antrag', en: 'application / request form' },
  { de: 'einreichen', en: 'to submit', note: 'verb' },
  { de: 'geschickt', en: 'sent' },
  { de: 'schriftlich', en: 'in writing' },
  { de: 'Bescheinigung', en: 'certificate / official confirmation' },
  { de: 'Formular', en: 'form' },
  { de: 'Adresse', en: 'address' },
  { de: 'Telefonnummer', en: 'phone number' },
  { de: 'heiße', en: 'am called / my name is', note: 'verb' },
  { de: 'Namen', en: 'name' },
  { de: 'buchstabieren', en: 'to spell', note: 'verb' },
  { de: 'ändern', en: 'to change', note: 'verb' },
  { de: 'Kopie', en: 'copy' },
  { de: 'erhalten', en: 'to receive', note: 'verb' },
  { de: 'bekommen', en: 'to get / receive', note: 'verb' },
  { de: 'Steuer-ID', en: 'tax ID' },
  { de: 'Ausweis', en: 'ID document' },
  { de: 'dabei', en: 'with me / on me' },
  { de: 'falsch geschrieben', en: 'spelled / written incorrectly' },
  { de: 'Fehler', en: 'error' },
  { de: 'korrigieren', en: 'to correct', note: 'verb' },
  { de: 'Schreiben', en: 'official letter / notice' },
  { de: 'erklären', en: 'to explain', note: 'verb' },
  { de: 'worum es geht', en: 'what it is about' },
  { de: 'nächsten Schritte', en: 'next steps' },
  { de: 'Wohnung', en: 'apartment' },
  { de: 'Heizung', en: 'heating' },
  { de: 'Internet', en: 'internet' },
  { de: 'Rechnung', en: 'bill / invoice' },
  { de: 'Reparatur', en: 'repair' },
  { de: 'vorbeikommen', en: 'to come by', note: 'verb' },
  { de: 'Hausmeister', en: 'caretaker' },
  { de: 'informieren', en: 'to inform', note: 'verb' },
  { de: 'ausgesperrt', en: 'locked out' },
  { de: 'Schlüsseldienst', en: 'locksmith' },
  { de: 'Schlüssel', en: 'key' },
  { de: 'steckt', en: 'is stuck / is inserted', note: 'verb' },
  { de: 'von innen', en: 'from the inside' },
  { de: 'Schimmel', en: 'mold' },
  { de: 'Bad', en: 'bathroom' },
  { de: 'entdeckt', en: 'discovered' },
  { de: 'ansehen', en: 'to look at', note: 'verb' },
  { de: 'Nachbarn', en: 'neighbors' },
  { de: 'laut', en: 'loud' },
  { de: 'leiser', en: 'quieter' },
  { de: 'Müll', en: 'trash / rubbish' },
  { de: 'abgeholt', en: 'picked up / collected' },
  { de: 'Mülltonnen', en: 'trash bins' },
  { de: 'Warmmiete', en: 'rent including utilities' },
  { de: 'Vermieter', en: 'landlord' },
  { de: 'Dokument', en: 'document' },
  { de: 'Vertrag', en: 'contract' },
  { de: 'prüfen', en: 'to check / review', note: 'verb' },
  { de: 'beenden', en: 'to end', note: 'verb' },
  { de: 'Geld zurück', en: 'money back / refund' },
  { de: 'dringend', en: 'urgent / urgently' },
  { de: 'Kopfschmerzen', en: 'headache' },
  { de: 'Fieber', en: 'fever' },
  { de: 'Bauchschmerzen', en: 'stomach pain' },
  { de: 'gesetzlich versichert', en: 'publicly insured' },
  { de: 'krankschreiben', en: 'to issue a sick note', note: 'verb' },
  { de: 'Rezept', en: 'prescription' },
  { de: 'ausstellen', en: 'to issue', note: 'verb' },
  { de: 'nehmen', en: 'to take', note: 'verb' },
  { de: 'vor oder nach dem Essen', en: 'before or after eating' },
  { de: 'Nebenwirkungen', en: 'side effects' },
  { de: 'täglich', en: 'daily' },
  { de: 'Medikamente', en: 'medication' },
  { de: 'allergisch', en: 'allergic' },
  { de: 'verletzt', en: 'injured' },
  { de: 'Überweisung', en: 'referral' },
  { de: 'Facharzt', en: 'specialist doctor' },
  { de: 'Apotheke', en: 'pharmacy' },
  { de: 'geöffnet', en: 'open' },
  { de: 'Medikament', en: 'medicine' },
  { de: 'bestellen', en: 'to order', note: 'verb' },
  { de: 'Gesundheitskarte', en: 'health insurance card' },
  { de: 'vergessen', en: 'forgotten', note: 'verb' },
  { de: 'neue Patienten', en: 'new patients' },
  { de: 'Verbindung', en: 'connection' },
  { de: 'WLAN', en: 'Wi-Fi' },
  { de: 'funktioniert nicht', en: 'is not working' },
  { de: 'schlecht', en: 'bad / poor' },
  { de: 'zurückrufen', en: 'to call back', note: 'verb' },
  { de: 'später', en: 'later' },
  { de: 'einloggen', en: 'to log in', note: 'verb' },
  { de: 'Passwort', en: 'password' },
  { de: 'zurücksetzen', en: 'to reset', note: 'verb' },
  { de: 'telefonieren', en: 'to talk on the phone', note: 'verb' },
  { de: 'Kundennummer', en: 'customer number' },
  { de: 'nennen', en: 'to give / state', note: 'verb' },
  { de: 'Code', en: 'code' },
  { de: 'App', en: 'app' },
  { de: 'krankgeschrieben', en: 'on sick leave' },
  { de: 'Aufgabe', en: 'task' },
  { de: 'fertig', en: 'finished' },
  { de: 'Datei', en: 'file' },
  { de: 'Bescheid', en: 'notice / update' },
  { de: 'zuständig', en: 'responsible' },
  { de: 'Meeting', en: 'meeting' },
  { de: 'Feedback', en: 'feedback' },
  { de: 'Gehaltsabrechnung', en: 'payslip' },
  { de: 'Urlaubstage', en: 'vacation days' },
  { de: 'Bahn', en: 'train / tram' },
  { de: 'Hauptbahnhof', en: 'main station' },
  { de: 'Bus', en: 'bus' },
  { de: 'Bürgerbüro', en: 'citizen services office' },
  { de: 'umsteigen', en: 'to transfer', note: 'verb' },
  { de: 'Gleis', en: 'platform / track' },
  { de: 'fährt ab', en: 'departs', note: 'verb' },
  { de: 'fällt aus', en: 'is cancelled', note: 'verb' },
  { de: 'Verspätung', en: 'delay' },
  { de: 'stattdessen', en: 'instead' },
  { de: 'Ticket', en: 'ticket' },
  { de: 'gültig', en: 'valid' },
  { de: 'entwerten', en: 'to validate a ticket', note: 'verb' },
  { de: 'gekauft', en: 'bought' },
  { de: 'zurückgeben', en: 'to return', note: 'verb' },
  { de: 'Ersatzbus', en: 'replacement bus' },
  { de: 'dauert', en: 'takes / lasts', note: 'verb' },
  { de: 'Fahrt', en: 'journey / ride' },
  { de: 'falsche Richtung', en: 'wrong direction' },
  { de: 'Aufzug', en: 'lift / elevator' },
  { de: 'Taxi', en: 'taxi' },
  { de: 'Deutschlandticket', en: 'Germany public transport pass' },
  { de: 'zurückbekommen', en: 'to get back', note: 'verb' },
  { de: 'Paket', en: 'parcel' },
  { de: 'abholen', en: 'to pick up', note: 'verb' },
  { de: 'Benachrichtigung', en: 'notification' },
  { de: 'Sendung', en: 'shipment / parcel' },
  { de: 'Filiale', en: 'branch / shop' },
  { de: 'Packstation', en: 'parcel locker' },
  { de: 'Retourenpaket', en: 'return parcel' },
  { de: 'abgeben', en: 'to drop off / hand in', note: 'verb' },
  { de: 'Rücksendeetikett', en: 'return label' },
  { de: 'Artikel', en: 'item' },
  { de: 'kaputt', en: 'broken' },
  { de: 'angekommen', en: 'arrived' },
  { de: 'umtauschen', en: 'to exchange', note: 'verb' },
  { de: 'Größe', en: 'size' },
  { de: 'ähnlich', en: 'similar' },
  { de: 'günstiger', en: 'cheaper' },
  { de: 'mit Karte zahlen', en: 'pay by card' },
  { de: 'Quittung', en: 'receipt' },
  { de: 'Lieferung', en: 'delivery' },
  { de: 'Abholcode', en: 'pickup code' },
  { de: 'Konto', en: 'account' },
  { de: 'eröffnen', en: 'to open', note: 'verb' },
  { de: 'überweisen', en: 'to transfer money', note: 'verb' },
  { de: 'Betrag', en: 'amount' },
  { de: 'Lastschrift', en: 'direct debit' },
  { de: 'Zahlung', en: 'payment' },
  { de: 'stoppen', en: 'to stop', note: 'verb' },
  { de: 'Karte', en: 'card' },
  { de: 'sperren', en: 'to block / freeze', note: 'verb' },
  { de: 'bezahlt', en: 'paid' },
  { de: 'Mahnung', en: 'payment reminder' },
  { de: 'Schaden melden', en: 'to report a claim / damage' },
  { de: 'Nachbarschaft', en: 'neighborhood' },
  { de: 'vorstellen', en: 'to introduce oneself', note: 'verb' },
  { de: 'Kaffee trinken', en: 'to have coffee' },
  { de: 'morgen Abend', en: 'tomorrow evening' },
  { de: 'anderes Mal', en: 'another time' },
  { de: 'annehmen', en: 'to accept / receive', note: 'verb' },
  { de: 'Hilfe', en: 'help' },
  { de: 'Unfall', en: 'accident' },
  { de: 'Handy', en: 'mobile phone' },
  { de: 'weg', en: 'gone / missing' },
  { de: 'unwohl', en: 'unwell' },
  { de: 'Notaufnahme', en: 'emergency department' },
  { de: 'sofort', en: 'immediately' },
  { de: 'Arzt', en: 'doctor' },
  { de: 'sicher', en: 'safe' },
  { de: 'brennt', en: 'is burning / there is a fire' },
  { de: 'noch', en: 'still / yet' },
  { de: 'heute', en: 'today' },
  { de: 'morgen', en: 'tomorrow' },
  { de: 'diese Woche', en: 'this week' },
  { de: 'ungefähr', en: 'approximately' },
  { de: 'zehn Minuten', en: 'ten minutes' },
  { de: 'per E-Mail', en: 'by email' },
  { de: 'online', en: 'online' },
  { de: 'bitte', en: 'please' }
];

function hasGermanTerm(text, term) {
  const escaped = String(term).normalize('NFC')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
  return new RegExp(`(^|[^\\p{L}])${escaped}([^\\p{L}]|$)`, 'iu').test(String(text || '').normalize('NFC'));
}

function revealVocabItems(s) {
  const items = [];
  const add = (de, en, note = '') => {
    const key = String(de || '').normalize('NFC').toLowerCase();
    if (!de || items.some(item => item.key === key)) return;
    items.push({ key, de, en, note });
  };
  (s.vocab || []).forEach(item => add(item.de, item.en, item.note));
  (s.chunks || []).forEach(chunk => add(chunk[0], chunk[1]));
  SENTENCE_VOCAB_GLOSSARY.forEach(item => {
    if (hasGermanTerm(s.de, item.de)) add(item.de, item.en, item.note);
  });
  return items.slice(0, 6);
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
function renderProgressOverview() {
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
    const cnt = DB.attempts.filter(a => a.date === key && a.result !== 'skip').length
      + DB.patternAttempts.filter(a => a.date === key && a.result !== 'skip').length
      + DB.vocabAttempts.filter(a => a.date === key).length;
    const d = parseDateKey(key);
    const label = i === 0 ? 'Today' : i === 1 ? 'Yest' : d.toLocaleDateString('en-DE', { weekday: 'short' });
    histRows.push({ label, cnt, isToday: i === 0 });
  }
  const maxH = Math.max(...histRows.map(r => r.cnt), 1);
  const studiedDates = new Set([...DB.attempts, ...DB.patternAttempts, ...DB.vocabAttempts].filter(a => a.result !== 'skip').map(a => a.date));
  Object.keys(DB.historyWords).forEach(k => studiedDates.add(k));
  const reviewDue = getSrsReviewIds().length;
  const patternDue = getPatternReviewIds().length;
  const vocabDue = getVocabReviewIds().length;
  const vocabDone = DB.vocabLearned.size;
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

  return `<div class="progress-body">
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
  <div class="stat-box"><div class="stat-lbl">Vocab</div><div class="stat-num" style="color:var(--blue)">${vocabDone}</div><div class="stat-sub">${vocabDue} due of ${VOCAB_CARDS.length}</div></div>
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

function toggleVocabReveal(id) {
  const en = document.getElementById('ven-' + id);
  const hint = document.getElementById('vhn-' + id);
  const details = document.getElementById('vrd-' + id);
  const card = document.getElementById('vc-' + id);
  if (!en) return;
  if (en.classList.contains('hid')) {
    en.hidden = false;
    en.setAttribute('aria-hidden', 'false');
    en.classList.remove('hid');
    if (hint) hint.style.display = 'none';
    if (details) details.style.display = 'block';
    if (card) card.querySelectorAll('.reveal-btn').forEach(btn => btn.setAttribute('aria-expanded', 'true'));
  } else {
    en.classList.add('hid');
    en.hidden = true;
    en.setAttribute('aria-hidden', 'true');
    if (hint) hint.style.display = 'block';
    if (details) details.style.display = 'none';
    if (card) card.querySelectorAll('.reveal-btn').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
  }
}

function toggleVocabLearned(id) {
  if (DB.vocabLearned.has(id)) unmarkVocabLearned(id);
  else markVocabLearned(id, 'manual');
  render();
}

function toggleVocabFav(id) {
  DB.vocabFavorites.has(id) ? DB.vocabFavorites.delete(id) : DB.vocabFavorites.add(id);
  save();
  render();
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
function setVocabFilter(f) { V.vocabFilter = VALID_VOCAB_FILTERS.has(f) ? f : 'all'; V.vocabPage = 1; commitState(); }
function setVocabTopic(topicId) {
  V.vocabTopicId = topicId && VOCAB_TOPIC_IDS.has(topicId) ? topicId : null;
  V.vocabPage = 1;
  commitState();
}
function setVocabGoal(n) {
  DB.vocabDailyGoal = clampNumber(n, 1, 50, DEFAULT_VOCAB_DAILY_GOAL);
  DB.vocabDailyQueueDate = null;
  save();
  commitState();
}
function setQuery(q) { V.query = q; V.freqPage = 1; V.vocabPage = 1; clearTimeout(window._qt); window._qt = setTimeout(render, 300); }
function refreshQueue() { DB.dailyQueueDate = null; save(); nav('today'); }
function refreshVocabQueue() { DB.vocabDailyQueueDate = null; save(); nav('vocab'); }

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
let VP = { active: false, queue: [], idx: 0, revealed: false, again: 0, hard: 0, good: 0, easy: 0, skipped: 0, isSRS: false, dir: 'de2en', dirChoice: true, answered: {}, missedIds: [] };
let FP = { active: false, queue: [], idx: 0, revealed: false, again: 0, hard: 0, good: 0, easy: 0, skipped: 0, isSRS: false, answered: {}, missedIds: [] };

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

function closePractice() { P.active = false; PP.active = false; VP.active = false; FP.active = false; const ov = document.getElementById('practice-overlay'); if (ov) ov.remove(); render(); }

// ==============================
// VOCAB PRACTICE MODE
// ==============================
function startVocabPractice(opts) {
  const ids = Array.isArray(opts) ? opts : opts.ids;
  const isSRS = Array.isArray(opts) ? false : Boolean(opts.isSRS);
  const requestedDir = Array.isArray(opts) ? '' : String(opts.dir || '');
  const dir = ['de2en', 'en2de'].includes(requestedDir) ? requestedDir : 'de2en';
  const cards = ids.map(id => VOCAB_BY_ID[id]).filter(Boolean);
  if (!cards.length) return;
  P.active = false;
  PP.active = false;
  VP = { active: true, queue: shuffle([...cards]), idx: 0, revealed: false, again: 0, hard: 0, good: 0, easy: 0, skipped: 0, isSRS, dir, dirChoice: !requestedDir, answered: {}, missedIds: [] };
  renderVocabPractice();
}

function setVocabPracticeDir(dir) {
  VP.dir = ['de2en', 'en2de'].includes(dir) ? dir : 'de2en';
  VP.dirChoice = false;
  renderVocabPractice();
}

function renderVocabPractice() {
  const existing = document.getElementById('practice-overlay');
  if (existing) existing.remove();
  if (!VP.active) return;

  const ov = document.createElement('div');
  ov.id = 'practice-overlay';
  ov.className = 'practice-overlay';

  if (VP.dirChoice) {
    const total = VP.queue.length;
    ov.innerHTML = `
  <div class="practice-hdr">
    <button class="practice-exit" onclick="closePractice()">Exit</button>
    <div style="font-size:15px;font-weight:700;color:var(--text)">${total} vocab card${total !== 1 ? 's' : ''} ready</div>
    <div style="width:44px"></div>
  </div>
  <div class="practice-body">
    <div class="dir-choice-wrap">
      <div class="dir-choice-title">Choose Vocab Direction</div>
      <div class="dir-choice-sub">Pick which side appears first.</div>
      <button class="dir-btn primary" onclick="setVocabPracticeDir('de2en')">
        <span class="dir-btn-icon">🇩🇪</span>
        <div>
          <div class="dir-btn-title">German → English</div>
          <div class="dir-btn-sub">See the German word, recall the meaning</div>
        </div>
      </button>
      <button class="dir-btn" onclick="setVocabPracticeDir('en2de')">
        <span class="dir-btn-icon">🇬🇧</span>
        <div>
          <div class="dir-btn-title" style="color:var(--text)">English → German</div>
          <div class="dir-btn-sub" style="color:var(--text-3)">See the meaning, recall the German word and article</div>
        </div>
      </button>
    </div>
  </div>`;
    document.body.appendChild(ov);
    return;
  }

  if (VP.idx >= VP.queue.length) {
    const total = VP.queue.length;
    const answeredCount = Object.keys(VP.answered).filter(key => VP.answered[key] !== 'skip').length;
    const strong = VP.good + VP.easy;
    const pct = answeredCount ? Math.round(strong / answeredCount * 100) : 0;
    const retryIds = idsArg(VP.queue.map(card => card.id));
    const missedIds = [...new Set(VP.missedIds)];
    const missedBtn = missedIds.length ? `<button class="prac-sum-retry" onclick="startVocabPractice({ids:${idsArg(missedIds)},skipSessionFilter:true,dir:'${VP.dir}'})">Review Again</button>` : '';
    const modeTag = VP.dir === 'en2de'
      ? `<div style="font-size:11px;color:var(--blue);background:var(--blue-bg);border:1px solid var(--blue-border);border-radius:99px;display:inline-block;padding:3px 10px;margin-bottom:12px">🇬🇧 English → German</div>`
      : `<div style="font-size:11px;color:var(--accent);background:var(--blue-bg);border:1px solid var(--blue-border);border-radius:99px;display:inline-block;padding:3px 10px;margin-bottom:12px">🇩🇪 German → English</div>`;
    ov.innerHTML = `
  <div class="practice-hdr"><span style="font-size:16px;font-weight:700;color:var(--text)">Vocab Practice Complete</span></div>
  <div class="practice-body">
    <div class="prac-summary">
      <div class="prac-sum-icon">🗂️</div>
      <div class="prac-sum-title">${pct >= 80 ? 'Strong recall' : pct >= 50 ? 'Good progress' : 'Keep reviewing'}</div>
      <div class="prac-sum-sub">You reviewed ${total} vocab card${total !== 1 ? 's' : ''}</div>
      ${modeTag}
      <div class="prac-sum-stats vocab-sum-stats">
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--red)">${VP.again}</div><div class="prac-sum-l">Again</div></div>
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--amber)">${VP.hard}</div><div class="prac-sum-l">Hard</div></div>
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--green)">${VP.good}</div><div class="prac-sum-l">Good</div></div>
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--blue)">${VP.easy}</div><div class="prac-sum-l">Easy</div></div>
      </div>
      <div class="prac-sum-actions">
        ${missedBtn}
        <button class="prac-sum-retry" onclick="startVocabPractice({ids:${retryIds},isSRS:${VP.isSRS},dir:'${VP.dir}'})">Practice Again</button>
        <button class="prac-sum-done" onclick="closePractice()">Done</button>
      </div>
    </div>
  </div>`;
    document.body.appendChild(ov);
    return;
  }

  const card = VP.queue[VP.idx];
  const topic = vocabTopicById(card.topic);
  const total = VP.queue.length;
  const pct = Math.round(VP.idx / total * 100);
  const germanFront = VP.dir === 'de2en';
  const dirLabel = germanFront ? '🇩🇪→🇬🇧' : '🇬🇧→🇩🇪';
  const frontHtml = germanFront
    ? `<div class="practice-de vocab-practice-term" lang="de">${esc(vocabDisplay(card))}</div><div class="practice-ph">${esc(vocabMetaLabel(card))}</div>`
    : `<div class="practice-de vocab-practice-term">${esc(card.en)}</div><div class="practice-ph">Recall the German term${card.pos === 'noun' ? ', article, and gender' : ''}</div>`;
  const revealedHtml = germanFront
    ? `<div class="practice-en">${esc(card.en)}</div>`
    : `<div class="practice-en" lang="de">${esc(vocabDisplay(card))}</div><div class="practice-use">${esc(vocabMetaLabel(card))}</div>`;
  const listenHtml = germanFront || VP.revealed
    ? `<div style="display:flex;justify-content:center;margin:10px 0">
      <button class="act-btn speak-btn" data-id="vprac-${card.id}" onclick="speak(${jsArg(vocabSpeakText(card))},'vprac-${card.id}')" style="font-size:13px;padding:8px 18px" type="button">
        ${ICO.speak} Listen
      </button>
    </div>`
    : '';
  const ratingHelp = DB.vocabLearned.has(card.id)
    ? 'Again = 1 day · Hard = shorter interval · Good = normal interval · Easy = longer interval'
    : 'Again requeues · Hard = 1 day · Good = 3 days · Easy = 5 days';
  ov.innerHTML = `
  <div class="practice-hdr">
    <button class="practice-exit" onclick="closePractice()">Exit</button>
      <div class="practice-prog-wrap">
      <div class="practice-prog-bar"><div class="practice-prog-fill" style="width:${pct}%"></div></div>
      <div class="practice-prog-lbl">${VP.idx + 1}/${total} · ${dirLabel} · Again ${VP.again} · Hard ${VP.hard} · Good ${VP.good} · Easy ${VP.easy}</div>
    </div>
  </div>
  <div class="practice-body">
    <div class="practice-card vocab-practice-card">
      ${topic ? `<div class="practice-topic-lbl">${topic.emoji} ${topic.name} - <span class="lvl-tag l${card.level}" style="display:inline">${card.level}</span></div>` : ''}
      ${frontHtml}
      ${VP.revealed ? `
        ${revealedHtml}
        <div class="vocab-practice-example"><strong>Example</strong><span lang="de">${esc(card.example.de)}</span><em>${esc(card.example.en)}</em></div>
        ${card.plural ? `<div class="practice-use"><strong>Plural:</strong> <span lang="de">${esc(card.plural)}</span></div>` : ''}
      ` : `<button class="practice-reveal-hint" onclick="vocabPracticeReveal()" type="button">${germanFront ? 'Tap to reveal meaning' : 'Tap to reveal German'}</button>`}
    </div>
    ${listenHtml}
    ${VP.revealed ? `
      <div class="vocab-rating-help">${esc(ratingHelp)}</div>
      <div class="vocab-rating-btns">
        <button class="vocab-rate again" onclick="vocabPracticeAnswer('again')">Again</button>
        <button class="vocab-rate hard" onclick="vocabPracticeAnswer('hard')">Hard</button>
        <button class="vocab-rate good" onclick="vocabPracticeAnswer('good')">Good</button>
        <button class="vocab-rate easy" onclick="vocabPracticeAnswer('easy')">Easy</button>
      </div>` : ''}
    <div class="kbd-hint" style="margin-top:10px">
      <span class="kbd">Space</span> reveal &nbsp;
      <span class="kbd">→</span> skip
    </div>
  </div>`;
  document.body.appendChild(ov);
  if (!VP.revealed && germanFront) {
    if (isMobile) speak(vocabSpeakText(card), `vprac-${card.id}`);
    else setTimeout(() => speak(vocabSpeakText(card), `vprac-${card.id}`), 150);
  }
}

function vocabPracticeReveal() {
  VP.revealed = !VP.revealed;
  renderVocabPractice();
  if (VP.revealed && VP.dir === 'en2de' && VP.idx < VP.queue.length) {
    const card = VP.queue[VP.idx];
    setTimeout(() => speak(vocabSpeakText(card), `vprac-${card.id}`), 200);
  }
}

function vocabPracticeAnswer(rating) {
  const currentCard = VP.queue[VP.idx];
  if (!currentCard) return;
  const attemptKey = String(VP.idx);
  if (VP.answered[attemptKey]) {
    VP.idx++;
    VP.revealed = false;
    renderVocabPractice();
    return;
  }
  const intervalBefore = DB.vocabSrs[currentCard.id] ? DB.vocabSrs[currentCard.id].interval || 0 : 0;
  const scheduled = scheduleVocab(currentCard.id, rating);
  const intervalAfter = scheduled.intervalAfter;
  VP.answered[attemptKey] = rating;
  if (rating === 'again') VP.again++;
  else if (rating === 'hard') VP.hard++;
  else if (rating === 'easy') VP.easy++;
  else VP.good++;

  if (rating === 'again') {
    VP.missedIds.push(currentCard.id);
    if (!scheduled.learned && !VP.queue.slice(VP.idx + 1).some(card => card.id === currentCard.id)) {
      const insertAt = Math.min(VP.queue.length, VP.idx + 3);
      VP.queue.splice(insertAt, 0, currentCard);
    }
  }
  recordVocabAttempt({ id: currentCard.id, result: rating, intervalBefore, intervalAfter, wasDue: scheduled.wasDue });
  save();
  VP.idx++;
  VP.revealed = false;
  renderVocabPractice();
}

function vocabPracticeNext() {
  if (VP.idx < VP.queue.length) {
    const currentCard = VP.queue[VP.idx];
    const attemptKey = String(VP.idx);
    if (currentCard && !VP.answered[attemptKey]) {
      VP.answered[attemptKey] = 'skip';
      VP.skipped++;
      recordVocabAttempt({ id: currentCard.id, result: 'again', intervalBefore: 0, intervalAfter: 0, wasDue: false });
      save();
    }
    VP.idx++;
    VP.revealed = false;
    renderVocabPractice();
  }
}

// ==============================
// FREQUENCY PRACTICE MODE
// ==============================
function startFrequencyPractice(opts) {
  const ids = Array.isArray(opts) ? opts : opts.ids;
  const isSRS = Array.isArray(opts) ? false : Boolean(opts.isSRS);
  const entries = ids.map(id => freqById(id)).filter(Boolean);
  if (!entries.length) return;
  P.active = false;
  PP.active = false;
  VP.active = false;
  FP = { active: true, queue: [...entries], idx: 0, revealed: false, again: 0, hard: 0, good: 0, easy: 0, skipped: 0, isSRS, answered: {}, missedIds: [] };
  renderFrequencyPractice();
}
function renderFrequencyPractice() {
  const existing = document.getElementById('practice-overlay');
  if (existing) existing.remove();
  if (!FP.active) return;

  const ov = document.createElement('div');
  ov.id = 'practice-overlay';
  ov.className = 'practice-overlay';

  if (FP.idx >= FP.queue.length) {
    const total = FP.queue.length;
    const answeredCount = Object.keys(FP.answered).filter(key => FP.answered[key] !== 'skip').length;
    const strong = FP.good + FP.easy;
    const pct = answeredCount ? Math.round(strong / answeredCount * 100) : 0;
    const retryIds = idsArg(FP.queue.map(e => String(e.rank)));
    const missedIds = [...new Set(FP.missedIds)];
    const missedBtn = missedIds.length ? `<button class="prac-sum-retry" onclick="startFrequencyPractice({ids:${idsArg(missedIds)},skipSessionFilter:true})">Review Again</button>` : '';
    ov.innerHTML = `
  <div class="practice-hdr"><span style="font-size:16px;font-weight:700;color:var(--text)">Frequency Practice Complete</span></div>
  <div class="practice-body">
    <div class="prac-summary">
      <div class="prac-sum-icon">🔤</div>
      <div class="prac-sum-title">${pct >= 80 ? 'Strong recall' : pct >= 50 ? 'Good progress' : 'Keep reviewing'}</div>
      <div class="prac-sum-sub">You reviewed ${total} frequency card${total !== 1 ? 's' : ''}</div>
      <div class="prac-sum-stats vocab-sum-stats">
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--red)">${FP.again}</div><div class="prac-sum-l">Again</div></div>
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--amber)">${FP.hard}</div><div class="prac-sum-l">Hard</div></div>
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--green)">${FP.good}</div><div class="prac-sum-l">Good</div></div>
        <div class="prac-sum-stat"><div class="prac-sum-n" style="color:var(--blue)">${FP.easy}</div><div class="prac-sum-l">Easy</div></div>
      </div>
      <div class="prac-sum-actions">
        ${missedBtn}
        <button class="prac-sum-retry" onclick="startFrequencyPractice({ids:${retryIds},isSRS:${FP.isSRS})">Practice Again</button>
        <button class="prac-sum-done" onclick="closePractice()">Done</button>
      </div>
    </div>
  </div>`;
    document.body.appendChild(ov);
    return;
  }

  const entry = FP.queue[FP.idx];
  const id = String(entry.rank);
  const total = FP.queue.length;
  const pct = Math.round(FP.idx / total * 100);
  const ratingHelp = DB.freqLearned.has(id)
    ? 'Again = 1 day · Hard = shorter interval · Good = normal interval · Easy = longer interval'
    : 'Again requeues · Hard = 1 day · Good = 3 days · Easy = 5 days';
  ov.innerHTML = `
  <div class="practice-hdr">
    <button class="practice-exit" onclick="closePractice()">Exit</button>
      <div class="practice-prog-wrap">
      <div class="practice-prog-bar"><div class="practice-prog-fill" style="width:${pct}%"></div></div>
      <div class="practice-prog-lbl">${FP.idx + 1}/${total} · Again ${FP.again} · Hard ${FP.hard} · Good ${FP.good} · Easy ${FP.easy}</div>
    </div>
  </div>
  <div class="practice-body">
    <div class="practice-card freq-practice-card">
      <div class="practice-topic-lbl">#${entry.rank} · ${esc(freqPosLabel(entry))}</div>
      <div class="practice-de freq-practice-word" lang="de">${esc(entry.german)}</div>
      ${FP.revealed ? `
        <div class="freq-practice-sentence" lang="de">${freqSentenceWithHighlight(entry)}</div>
        <div class="practice-en freq-practice-en">${esc(entry.english)}</div>
        <div class="vocab-practice-example"><strong>Example</strong><span lang="de">${esc(entry.germanSentence)}</span><em>${esc(entry.englishSentence)}</em></div>
        ${entry.ipa ? `<div class="practice-use"><strong>IPA:</strong> ${esc(entry.ipa)}</div>` : ''}
      ` : `<button class="practice-reveal-hint" onclick="frequencyPracticeReveal()" type="button">Tap to reveal the example sentence and meaning</button>`}
    </div>
    <div style="display:flex;justify-content:center;margin:10px 0">
      <button class="act-btn speak-btn" data-id="fprac-${id}" onclick="speak(${jsArg(entry.germanSentence || entry.german)},'fprac-${id}')" style="font-size:13px;padding:8px 18px" type="button">
        ${ICO.speak} Listen
      </button>
    </div>
    ${FP.revealed ? `
      <div class="vocab-rating-help">${esc(ratingHelp)}</div>
      <div class="vocab-rating-btns">
        <button class="vocab-rate again" onclick="frequencyPracticeAnswer('again')">Again</button>
        <button class="vocab-rate hard" onclick="frequencyPracticeAnswer('hard')">Hard</button>
        <button class="vocab-rate good" onclick="frequencyPracticeAnswer('good')">Good</button>
        <button class="vocab-rate easy" onclick="frequencyPracticeAnswer('easy')">Easy</button>
      </div>` : ''}
    <div class="kbd-hint" style="margin-top:10px">
      <span class="kbd">Space</span> reveal &nbsp;
      <span class="kbd">→</span> skip
    </div>
  </div>`;
  document.body.appendChild(ov);
  if (!FP.revealed) {
    if (isMobile) speak(entry.germanSentence || entry.german, `fprac-${id}`);
    else setTimeout(() => speak(entry.germanSentence || entry.german, `fprac-${id}`), 150);
  }
}
function frequencyPracticeReveal() {
  FP.revealed = !FP.revealed;
  renderFrequencyPractice();
}
function frequencyPracticeAnswer(rating) {
  const current = FP.queue[FP.idx];
  if (!current) return;
  const attemptKey = String(FP.idx);
  if (FP.answered[attemptKey]) {
    FP.idx++;
    FP.revealed = false;
    renderFrequencyPractice();
    return;
  }
  const id = String(current.rank);
  const intervalBefore = DB.freqSrs[id] ? DB.freqSrs[id].interval || 0 : 0;
  const scheduled = scheduleFreq(id, rating);
  const intervalAfter = scheduled.intervalAfter;
  FP.answered[attemptKey] = rating;
  if (rating === 'again') FP.again++;
  else if (rating === 'hard') FP.hard++;
  else if (rating === 'easy') FP.easy++;
  else FP.good++;

  if (rating === 'again') {
    FP.missedIds.push(id);
    if (!scheduled.learned && !FP.queue.slice(FP.idx + 1).some(e => String(e.rank) === id)) {
      const insertAt = Math.min(FP.queue.length, FP.idx + 3);
      FP.queue.splice(insertAt, 0, current);
    }
  }
  recordFreqAttempt({ id, result: rating, intervalBefore, intervalAfter, wasDue: scheduled.wasDue });
  save();
  FP.idx++;
  FP.revealed = false;
  renderFrequencyPractice();
}
function frequencyPracticeNext() {
  if (FP.idx < FP.queue.length) {
    const current = FP.queue[FP.idx];
    const attemptKey = String(FP.idx);
    if (current && !FP.answered[attemptKey]) {
      FP.answered[attemptKey] = 'skip';
      FP.skipped++;
      recordFreqAttempt({ id: String(current.rank), result: 'again', intervalBefore: 0, intervalAfter: 0, wasDue: false });
      save();
    }
    FP.idx++;
    FP.revealed = false;
    renderFrequencyPractice();
  }
}

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
  // Grammar quiz keyboard shortcuts
  if (GQ.lessonId && !GQ.complete && GQ.questions.length) {
    if (!isTyping) {
      const question = GQ.questions[GQ.index];
      if (GQ.selected === null && question && ['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (idx < question.options.length) { e.preventDefault(); answerGrammarExercise(idx); return; }
      }
      if (GQ.selected !== null && (e.key === 'Enter' || e.code === 'ArrowRight')) { e.preventDefault(); nextGrammarExercise(); return; }
    }
  }
  // Pattern practice keyboard shortcuts
  if (PP.active) {
    if (e.key === 'Escape') { closePractice(); return; }
    if (PP.idx >= PP.queue.length) return;
    if (!isTyping && e.code === 'Space') { e.preventDefault(); patternPracticeReveal(); return; }
    if (e.code === 'ArrowRight') { e.preventDefault(); patternPracticeNext(); return; }
    if (e.code === 'ArrowLeft') { e.preventDefault(); patternPracticePrev(); return; }
    return;
  }
  // Vocab practice keyboard shortcuts
  if (VP.active) {
    if (e.key === 'Escape') { closePractice(); return; }
    if (VP.idx >= VP.queue.length) return;
    if (!isTyping && e.code === 'Space') { e.preventDefault(); vocabPracticeReveal(); return; }
    if (e.code === 'ArrowRight') { e.preventDefault(); vocabPracticeNext(); return; }
    if (VP.revealed && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      vocabPracticeAnswer({ 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' }[e.key]);
      return;
    }
    return;
  }
  // Frequency practice keyboard shortcuts
  if (FP.active) {
    if (e.key === 'Escape') { closePractice(); return; }
    if (FP.idx >= FP.queue.length) return;
    if (!isTyping && e.code === 'Space') { e.preventDefault(); frequencyPracticeReveal(); return; }
    if (e.code === 'ArrowRight') { e.preventDefault(); frequencyPracticeNext(); return; }
    if (FP.revealed && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      frequencyPracticeAnswer({ 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' }[e.key]);
      return;
    }
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

function mergeGrammarScores(currentScores = {}, importedScores = {}) {
  const merged = {};
  [...new Set([...Object.keys(importedScores || {}), ...Object.keys(currentScores || {})])].forEach(id => {
    const current = currentScores[id];
    const imported = importedScores[id];
    if (!current) merged[id] = imported;
    else if (!imported) merged[id] = current;
    else {
      const currentRate = current.total ? current.correct / current.total : 0;
      const importedRate = imported.total ? imported.correct / imported.total : 0;
      const best = currentRate >= importedRate ? current : imported;
      merged[id] = { ...best, attempts: (current.attempts || 0) + (imported.attempts || 0) };
    }
  });
  return merged;
}

function applyImport(text) {
  const errEl = document.getElementById('import-err');
  const show = msg => { if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; } };
  if (!text.trim()) { show('❌ Nothing to import — paste or load a file first.'); return; }
  let parsed;
  try { parsed = JSON.parse(text); } catch (e) { show('❌ Invalid JSON. Make sure you copied the full text without changes.'); return; }
  if (!parsed || typeof parsed !== 'object' || (!Array.isArray(parsed.learned) && !Array.isArray(parsed.vocabLearned) && !Array.isArray(parsed.grammarStudied) && !parsed.streak && !parsed.srs && !parsed.vocabSrs && !parsed.grammarScores && !parsed.attempts && !parsed.vocabAttempts)) { show('❌ This doesn\'t look like a DeutschDaily backup file.'); return; }
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
    vocabLearned: [...new Set([...current.vocabLearned, ...imported.vocabLearned])],
    vocabFavorites: [...new Set([...current.vocabFavorites, ...imported.vocabFavorites])],
    vocabSrs: mergeSrsMaps(current.vocabSrs, imported.vocabSrs),
    vocabAttempts: mergeAttempts(current.vocabAttempts, imported.vocabAttempts),
    vocabDailyGoal: DB.vocabDailyGoal,
    vocabDailyQueue: DB.vocabDailyQueue,
    vocabDailyQueueDate: DB.vocabDailyQueueDate,
    vocabDailyQueueDone: [...new Set([...current.vocabDailyQueueDone, ...imported.vocabDailyQueueDone])],
    grammarStudied: [...new Set([...current.grammarStudied, ...imported.grammarStudied])],
    grammarScores: mergeGrammarScores(current.grammarScores, imported.grammarScores),
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
  toast.textContent = `✅ Imported! ${merged.learned.length} sentences · ${merged.vocabLearned.length} vocab · ${merged.grammarStudied.length} grammar topics`;
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
  V.view = V.historyDay ? 'history-day' : 'progress';
  commitState({ scroll: true });
}

function backToActivity() {
  V.historyDay = null;
  V.progressTab = 'activity';
  V.view = 'progress';
  commitState({ scroll: true });
}

function setProgressTab(tab) {
  V.progressTab = normalizeProgressTab(tab);
  commitState({ scroll: false });
}

function renderProgress() {
  const tab = normalizeProgressTab(V.progressTab);
  return `<div style="padding-top:14px">
    <h2 class="page-title">Progress</h2>
    <p class="page-sub">Stats, streaks, and your day-by-day learning history in one place</p>
    <div class="progress-tabs" role="tablist" aria-label="Progress sections">
      <button class="progress-tab${tab === 'overview' ? ' on' : ''}" role="tab" aria-selected="${tab === 'overview'}" onclick="setProgressTab('overview')" type="button">📊 Overview</button>
      <button class="progress-tab${tab === 'activity' ? ' on' : ''}" role="tab" aria-selected="${tab === 'activity'}" onclick="setProgressTab('activity')" type="button">🗓️ Activity</button>
    </div>
    ${tab === 'activity' ? renderProgressActivity() : renderProgressOverview()}
  </div>`;
}

function renderProgressActivity() {
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
  if (!key) { V.progressTab = 'activity'; return renderProgress(); }

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
    return `<button class="back-btn" onclick="backToActivity()">← Progress</button>
      ${hero}
      <div class="empty-state"><div class="empty-icon">📭</div>No activity recorded for this day.</div>`;
  }

  return `<button class="back-btn" onclick="backToActivity()">← Progress</button>
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
