const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const source = [
  read('src/content.js'),
  read('src/learning.js'),
  read('src/vocab.js'),
  read('src/grammar.js'),
  read('src/storage.js'),
  read('src/app.js'),
  'renderPractice = () => {}; updateHeader = () => {}; render = () => {};',
  `globalThis.__test = {
    SENTENCES,
    VOCAB_CARDS,
    GRAMMAR_MODULES,
    GRAMMAR_LESSONS,
    normalizeDb,
    objToDB,
    dbToObj,
    today,
    todayISO,
    addDaysISO,
    load,
    ensureDailyQueue,
    markSentenceLearned,
    srsSchedule,
    schedulePattern,
    scheduleVocab,
    getSrsReviewIds,
    getPatternReviewIds,
    getVocabReviewIds,
    practiceAnswer,
    practiceNext,
    ensureVocabDailyQueue,
    markVocabLearned,
    setGrammarStudied,
    recordGrammarScore,
    grammarSearchText,
    grammarExercisesForLesson,
    renderGrammar,
    setPracticeState: value => { P = value; },
    getPracticeState: () => P,
    DB: () => DB,
    stateFromUrl,
    urlFromState,
    applyUrlState,
    normalizePatternFilter,
    renderRevealDetails,
    applyImport,
    getViewState: () => V,
  };`
].join('\n');

const store = {};
function makeElement() {
  return {
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    dataset: {},
    value: '',
    textContent: '',
    innerHTML: '',
    tagName: 'DIV',
    appendChild: () => {},
    addEventListener: () => {},
    remove: () => {},
    removeAttribute: () => {},
    setAttribute: () => {},
    focus: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}
const rootElement = makeElement();
const sandbox = {
  console,
  setTimeout: () => 0,
  clearTimeout: () => {},
  window: {
    __DD_SKIP_AUTO_INIT: true,
    location: { href: 'http://localhost/DEDaily.html', pathname: '/DEDaily.html', search: '' },
    history: {
      pushState: (_state, _title, url) => {
        const next = new URL(url, 'http://localhost/DEDaily.html');
        sandbox.window.location.href = next.href;
        sandbox.window.location.pathname = next.pathname;
        sandbox.window.location.search = next.search;
      },
      replaceState: (_state, _title, url) => {
        const next = new URL(url, 'http://localhost/DEDaily.html');
        sandbox.window.location.href = next.href;
        sandbox.window.location.pathname = next.pathname;
        sandbox.window.location.search = next.search;
      },
    },
    addEventListener: () => {},
    storage: { set: () => {} },
    speechSynthesis: {
      getVoices: () => [],
      speak: () => {},
      cancel: () => {},
      onvoiceschanged: null,
    },
    scrollTo: () => {},
  },
  navigator: {
    userAgent: 'logic-tests',
    clipboard: { writeText: () => Promise.resolve() },
  },
  document: {
    activeElement: null,
    body: makeElement(),
    addEventListener: () => {},
    createElement: makeElement,
    execCommand: () => true,
    getElementById: id => id === 'root' ? rootElement : makeElement(),
    querySelector: () => null,
    querySelectorAll: () => [],
  },
  URLSearchParams,
  URL: Object.assign(URL, {
    createObjectURL: () => 'blob:logic-test',
    revokeObjectURL: () => {},
  }),
  Blob: function Blob() {},
  Audio: function Audio() {
    return { play: () => Promise.resolve(), pause: () => {}, addEventListener: () => {} };
  },
  SpeechSynthesisUtterance: function SpeechSynthesisUtterance() {},
  speechSynthesis: {
    getVoices: () => [],
    speak: () => {},
    cancel: () => {},
    onvoiceschanged: null,
  },
  localStorage: {
    getItem: key => Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
    setItem: (key, value) => { store[key] = value; },
  },
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'logic-tests.vm.js' });

const t = sandbox.__test;

function reset(raw = {}) {
  t.objToDB(raw);
}

function clearStore() {
  Object.keys(store).forEach(key => { delete store[key]; });
}

reset({ learned: ['un1'], historyWords: {} });
assert(t.DB().learned.has('un1'), 'learned ID without historyWords must be preserved');
assert.strictEqual(t.DB().historyWords[t.today()], undefined, 'unknown learned history should not be fabricated as today');

reset({ learned: ['un1'], lastStudy: '2026-05-02', historyWords: {} });
assert.strictEqual(JSON.stringify(t.DB().historyWords['2026-05-02']), JSON.stringify(['un1']), 'missing learned history should use known lastStudy when available');

reset({
  learned: ['un1', 'bad-id'],
  favorites: 'not-array',
  dailyGoal: 999,
  historyWords: { 'bad-date': ['un1'], '2026-5-2': ['un1', 'bad-id'] },
  srs: { un1: { interval: 'bad', nextReview: 'bad-date' }, missing: { interval: 1 } },
});
assert.strictEqual(JSON.stringify([...t.DB().learned]), JSON.stringify(['un1']), 'normalizer filters invalid sentence IDs');
assert.strictEqual(t.DB().dailyGoal, 50, 'daily goal is clamped');
assert.strictEqual(JSON.stringify(t.DB().historyWords['2026-05-02']), JSON.stringify(['un1']), 'historyWords keys and IDs are normalized');
assert(t.DB().srs.un1, 'valid SRS entry is retained');
assert(!t.DB().srs.missing, 'invalid SRS entry is removed');

reset({
  learned: ['un1'],
  dailyGoal: 5,
  historyWords: { [t.addDaysISO(-10)]: ['un1'] },
  srs: { un1: { interval: 3, ease: 2.5, level: 1, nextReview: t.addDaysISO(-1), lastReview: t.addDaysISO(-4) } },
});
t.ensureDailyQueue();
assert.strictEqual(t.DB().dailyQueue[0], 'un1', 'due reviews should be first in the daily queue');

reset({});
t.markSentenceLearned('un2', 'manual');
assert.strictEqual(t.DB().srs.un2.interval, 3, 'first learned sentence uses one first-review interval');
assert(t.DB().historyWords[t.today()].includes('un2'), 'manual learned sentence is tracked in history');

const scheduled = t.srsSchedule('un2', true);
assert.strictEqual(scheduled.intervalBefore, 3, 'SRS schedule reports interval before review');
assert.strictEqual(t.DB().srs.un2.interval, 7, 'correct first review promotes to 7 days');

reset({});
const retryCard = t.SENTENCES.find(s => s.id === 'un1');
t.setPracticeState({ active: true, queue: [retryCard], idx: 0, revealed: true, got: 0, again: 0, skipped: 0, isSRS: false, dir: 'de2en', dirChoice: false, answered: {}, missedIds: [], typedFeedback: null });
t.practiceAnswer(false);
let practiceState = t.getPracticeState();
assert.strictEqual(practiceState.queue.length, 2, 'missed card should be requeued for another attempt');
assert.strictEqual(practiceState.idx, 1, 'practice should advance to the requeued miss');
assert.strictEqual(practiceState.again, 1, 'missed attempt should count once');
assert.strictEqual(practiceState.answered['0'], 'again', 'first queue position is tracked as answered');
t.practiceAnswer(true);
practiceState = t.getPracticeState();
assert.strictEqual(practiceState.got, 1, 'requeued miss can be answered and scored');
assert.strictEqual(practiceState.answered['1'], 'got', 'requeued queue position is tracked independently');
assert(t.DB().learned.has('un1'), 'correct retry marks the sentence learned');

reset({});
const firstPattern = t.schedulePattern('would_possible', true);
assert.strictEqual(firstPattern.intervalBefore, 0, 'new pattern SRS starts from interval zero');
assert.strictEqual(t.DB().patternSrs.would_possible.interval, 3, 'first understood pattern uses the first-review interval');

reset({
  vocabLearned: ['vb001'],
  vocabFavorites: ['vb002', 'missing'],
  vocabDailyGoal: 500,
  vocabSrs: { vb001: { interval: 3, ease: 2.5, level: 1, nextReview: t.today(), lastReview: t.addDaysISO(-3) }, missing: { interval: 1 } },
});
assert(t.DB().vocabLearned.has('vb001'), 'vocab learned IDs are normalized');
assert(t.DB().vocabFavorites.has('vb002'), 'vocab favorites are normalized');
assert.strictEqual(t.DB().vocabDailyGoal, 50, 'vocab daily goal is clamped');
assert(!t.DB().vocabSrs.missing, 'invalid vocab SRS entry is removed');
assert.strictEqual(JSON.stringify(t.getVocabReviewIds()), JSON.stringify(['vb001']), 'due vocab review IDs are returned');

reset({
  vocabLearned: ['vb001'],
  vocabDailyGoal: 5,
  vocabSrs: { vb001: { interval: 3, ease: 2.5, level: 1, nextReview: t.today(), lastReview: t.addDaysISO(-3) } },
});
t.ensureVocabDailyQueue();
assert.strictEqual(t.DB().vocabDailyQueue[0], 'vb001', 'due vocab reviews should be first in the vocab daily queue');

reset({});
let vocabAgain = t.scheduleVocab('vb002', 'again');
assert.strictEqual(vocabAgain.learned, false, 'new vocab again should not mark learned');
assert(!t.DB().vocabLearned.has('vb002'), 'new vocab again stays unlearned');
let vocabHard = t.scheduleVocab('vb002', 'hard');
assert.strictEqual(vocabHard.intervalAfter, 1, 'new vocab hard schedules one day');
assert(t.DB().vocabLearned.has('vb002'), 'new vocab hard marks learned');

reset({});
let vocabGood = t.scheduleVocab('vb003', 'good');
assert.strictEqual(vocabGood.intervalAfter, 3, 'new vocab good schedules three days');
reset({});
let vocabEasy = t.scheduleVocab('vb004', 'easy');
assert.strictEqual(vocabEasy.intervalAfter, 5, 'new vocab easy schedules five days');

reset({
  vocabLearned: ['vb005'],
  vocabSrs: { vb005: { interval: 10, ease: 2.5, level: 3, nextReview: t.today(), lastReview: t.addDaysISO(-10) } },
});
let reviewedHard = t.scheduleVocab('vb005', 'hard');
assert.strictEqual(reviewedHard.intervalAfter, 12, 'review vocab hard uses a shorter multiplier');
reset({
  vocabLearned: ['vb005'],
  vocabSrs: { vb005: { interval: 10, ease: 2.5, level: 3, nextReview: t.today(), lastReview: t.addDaysISO(-10) } },
});
let reviewedGood = t.scheduleVocab('vb005', 'good');
assert.strictEqual(reviewedGood.intervalAfter, 25, 'review vocab good uses ease multiplier');
reset({
  vocabLearned: ['vb005'],
  vocabSrs: { vb005: { interval: 10, ease: 2.5, level: 3, nextReview: t.today(), lastReview: t.addDaysISO(-10) } },
});
let reviewedEasy = t.scheduleVocab('vb005', 'easy');
assert.strictEqual(reviewedEasy.intervalAfter, 33, 'review vocab easy extends good interval');

reset({});
t.markVocabLearned('vb006', 'manual');
assert(t.DB().vocabLearned.has('vb006'), 'manual vocab learned is tracked');
assert.strictEqual(t.DB().vocabAttempts[0].result, 'manual', 'manual vocab learned records attempt');

reset({
  vocabLearned: ['vb010'],
  vocabFavorites: ['vb011'],
  vocabSrs: { vb010: { interval: 3, ease: 2.5, level: 1, nextReview: t.addDaysISO(3), lastReview: t.today() } },
  vocabAttempts: [{ id: 'vb010', date: t.today(), result: 'good', intervalBefore: 0, intervalAfter: 3 }],
  grammarStudied: ['a1-word-position'],
  grammarScores: { 'a1-word-position': { correct: 5, total: 6, attempts: 1, updatedAt: t.today() } },
});
t.applyImport(JSON.stringify({
  vocabLearned: ['vb012'],
  vocabFavorites: ['vb013'],
  vocabSrs: { vb012: { interval: 5, ease: 2.5, level: 1, nextReview: t.addDaysISO(5), lastReview: t.today() } },
  vocabAttempts: [{ id: 'vb012', date: t.today(), result: 'easy', intervalBefore: 0, intervalAfter: 5 }],
  grammarStudied: ['a2-comparative-form'],
  grammarScores: { 'a2-comparative-form': { correct: 6, total: 6, attempts: 1, updatedAt: t.today() } },
}));
assert(t.DB().vocabLearned.has('vb010') && t.DB().vocabLearned.has('vb012'), 'import merges vocab learned IDs');
assert(t.DB().vocabFavorites.has('vb011') && t.DB().vocabFavorites.has('vb013'), 'import merges vocab favorites');
assert(t.DB().vocabSrs.vb010 && t.DB().vocabSrs.vb012, 'import merges vocab SRS maps');
assert(t.DB().vocabAttempts.some(a => a.id === 'vb012'), 'import merges vocab attempts');
assert(t.DB().grammarStudied.has('a1-word-position') && t.DB().grammarStudied.has('a2-comparative-form'), 'import merges grammar studied IDs');
assert(t.DB().grammarScores['a1-word-position'] && t.DB().grammarScores['a2-comparative-form'], 'import merges grammar scores');

reset({
  grammarStudied: ['a1-word-position', 'missing'],
  grammarScores: {
    'a1-word-position': { correct: 5, total: 6, attempts: 2, updatedAt: t.today() },
    missing: { correct: 1, total: 1, attempts: 1, updatedAt: t.today() },
  },
});
assert(t.DB().grammarStudied.has('a1-word-position'), 'grammar studied IDs are normalized');
assert(!t.DB().grammarStudied.has('missing'), 'invalid grammar studied IDs are removed');
assert.strictEqual(t.DB().grammarScores['a1-word-position'].correct, 5, 'valid grammar score is retained');
assert(!t.DB().grammarScores.missing, 'invalid grammar score is removed');

reset({});
assert.strictEqual(t.setGrammarStudied('a1-word-position'), true, 'valid grammar topic can be marked studied');
assert(t.DB().grammarStudied.has('a1-word-position'), 'studied grammar topic is saved');
assert.strictEqual(t.setGrammarStudied('missing'), false, 'invalid grammar topic cannot be marked studied');
t.recordGrammarScore('a1-word-position', 5, 6);
assert(t.DB().grammarStudied.has('a1-word-position'), 'grammar score of at least 80 percent marks topic studied');
assert.strictEqual(t.DB().grammarScores['a1-word-position'].attempts, 1, 'grammar exercise attempt is counted');
t.recordGrammarScore('a1-word-position', 1, 6);
assert.strictEqual(t.DB().grammarScores['a1-word-position'].correct, 5, 'lower grammar score does not replace best score');
assert.strictEqual(t.DB().grammarScores['a1-word-position'].attempts, 2, 'repeat grammar exercise attempt is counted');

const grammarLesson = t.GRAMMAR_LESSONS.find(lesson => lesson.id === 'a1-word-position');
const grammarExercises = t.grammarExercisesForLesson(grammarLesson);
assert.strictEqual(grammarExercises.length, 6, 'each grammar lesson generates six exercises');
assert(grammarExercises.every(exercise => exercise.options.length === 4 && exercise.options.includes(exercise.answer)), 'grammar exercises have four options including the answer');
const allGrammarExercises = t.GRAMMAR_LESSONS.flatMap(lesson => t.grammarExercisesForLesson(lesson));
assert.strictEqual(allGrammarExercises.length, t.GRAMMAR_LESSONS.length * 6, 'every grammar lesson generates six exercises');
assert(allGrammarExercises.every(exercise => exercise.options.length === 4 && new Set(exercise.options).size === 4), 'all grammar exercises have four unique options');
const grammarSearchMatches = t.GRAMMAR_LESSONS.filter(lesson => {
  const module = t.GRAMMAR_MODULES.find(item => item.id === lesson.moduleId);
  return t.grammarSearchText(lesson, module).includes('word position');
});
assert.strictEqual(grammarSearchMatches.length, 1, 'grammar search targets lesson content without matching every topic in a level');
assert(t.renderGrammar().includes('grammar-index-list'), 'grammar view renders the complete curriculum index');

reset({ settings: { externalTts: false } });
assert.strictEqual(t.DB().settings.externalTts, true, 'external TTS stays enabled after normalizing old settings');

reset({ settings: { focusTopics: ['appointments'], curriculumMode: 'survival' } });
assert.strictEqual(Object.prototype.hasOwnProperty.call(t.DB().settings, 'focusTopics'), false, 'old daily focus topic settings are discarded');
assert.strictEqual(Object.prototype.hasOwnProperty.call(t.DB().settings, 'curriculumMode'), false, 'old curriculum mode setting is discarded');

reset({
  attempts: [{ id: 'un1', date: t.today(), mode: 'practice', direction: 'type', result: 'got' }],
});
assert.strictEqual(t.DB().attempts[0].direction, 'type', 'typed practice direction survives normalization');

reset({
  patternSrs: { would_possible: { interval: 1, ease: 2.5, level: 0, nextReview: t.today(), lastReview: t.today() } },
  understood: [],
});
assert.strictEqual(JSON.stringify(t.getPatternReviewIds()), JSON.stringify(['would_possible']), 'failed patterns with SRS stay eligible for review');

clearStore();
store.dd_v4 = '{bad json';
t.objToDB({ learned: ['un1'] });
t.load();
assert.strictEqual(store.dd_v4, '{bad json', 'corrupt progress must not be overwritten on load');
assert(store.dd_v4_recovery && store.dd_v4_recovery.includes('{bad json'), 'corrupt progress gets a recovery copy');
assert.strictEqual([...t.DB().learned].length, 0, 'unrecoverable corrupt progress loads an empty in-memory DB only');

clearStore();
store.dd_v4 = 'null';
t.objToDB({ learned: ['un1'] });
t.load();
assert.strictEqual(store.dd_v4, 'null', 'non-object stored progress must not be overwritten on load');
assert(store.dd_v4_recovery && store.dd_v4_recovery.includes('Saved progress payload is not an object'), 'non-object stored progress gets a recovery copy');

clearStore();
store.dd_v4 = '{bad json';
store.dd_clean_v1 = JSON.stringify({ learned: ['un1'], lastStudy: '2026-05-02' });
t.objToDB({});
t.load();
assert(t.DB().learned.has('un1'), 'valid legacy progress is recovered when current progress is corrupt');
assert.strictEqual(store.dd_v4, '{bad json', 'recovering from legacy progress must not overwrite corrupt current progress');
assert(store.dd_v4_recovery && store.dd_v4_recovery.includes('{bad json'), 'recovered corrupt current progress keeps a raw recovery copy');


const browseState = t.stateFromUrl('http://localhost/DEDaily.html?view=browse&topic=health&filter=unlearned');
assert.strictEqual(browseState.view, 'browse', 'browse URL state should parse view');
assert.strictEqual(browseState.topicId, 'health', 'browse URL state should parse topic');
assert.strictEqual(browseState.filter, 'unlearned', 'browse URL state should parse filter');

const patternUrl = t.urlFromState({ view: 'patterns', patFilter: 'due' });
assert.strictEqual(patternUrl, '/DEDaily.html?view=patterns&filter=due', 'pattern URL should serialize filter');
const vocabUrl = t.urlFromState({ view: 'vocab', vocabTopicId: 'health', vocabFilter: 'due' });
assert.strictEqual(vocabUrl, '/DEDaily.html?view=vocab&topic=health&filter=due', 'vocab URL should serialize topic and filter');
const grammarUrl = t.urlFromState({ view: 'grammar', grammarModuleId: 'b1' });
assert.strictEqual(grammarUrl, '/DEDaily.html?view=grammar&module=b1', 'grammar URL should serialize selected module');
const grammarLessonUrl = t.urlFromState({ view: 'grammar', grammarModuleId: 'b1', grammarLessonId: 'b1-purpose-clauses' });
assert.strictEqual(grammarLessonUrl, '/DEDaily.html?view=grammar&module=b1&lesson=b1-purpose-clauses', 'grammar URL should serialize selected lesson');
assert.strictEqual(t.normalizePatternFilter('all'), 'all', 'known pattern filters are preserved');
assert.strictEqual(t.normalizePatternFilter('new'), 'learning', 'unknown/legacy pattern filters default to learning');

t.applyUrlState('http://localhost/DEDaily.html?view=patterns');
assert.strictEqual(t.getViewState().view, 'patterns', 'patterns URL opens Patterns tab');
assert.strictEqual(t.getViewState().patFilter, 'learning', 'Patterns tab defaults to Learning');

t.applyUrlState('http://localhost/DEDaily.html?view=library&tab=learned');
assert.strictEqual(t.getViewState().view, 'saved', 'library URL opens Library tab');
assert.strictEqual(t.getViewState().libTab, 'learned', 'library URL selects learned subtab');

t.applyUrlState('http://localhost/DEDaily.html?view=vocab&topic=money&filter=saved');
assert.strictEqual(t.getViewState().view, 'vocab', 'vocab URL opens Vocab tab');
assert.strictEqual(t.getViewState().vocabTopicId, 'money', 'vocab URL selects topic');
assert.strictEqual(t.getViewState().vocabFilter, 'saved', 'vocab URL selects filter');

t.applyUrlState('http://localhost/DEDaily.html?view=grammar&module=a2');
assert.strictEqual(t.getViewState().view, 'grammar', 'grammar URL opens Grammar tab');
assert.strictEqual(t.getViewState().grammarModuleId, 'a2', 'grammar URL selects module');
assert.strictEqual(t.GRAMMAR_MODULES.length, 3, 'grammar curriculum has three modules');
assert.strictEqual(t.GRAMMAR_LESSONS.length, 48, 'grammar curriculum has 48 lessons');

t.applyUrlState('http://localhost/DEDaily.html?view=grammar&module=b1&lesson=b1-purpose-clauses');
assert.strictEqual(t.getViewState().grammarLessonId, 'b1-purpose-clauses', 'grammar URL selects a lesson in the selected module');

t.applyUrlState('http://localhost/DEDaily.html?view=grammar&module=a2.2');
assert.strictEqual(t.getViewState().grammarModuleId, 'a2', 'legacy grammar URLs map to level sections');

t.applyUrlState('http://localhost/DEDaily.html?view=history&day=2026-05-02');
assert.strictEqual(t.getViewState().view, 'history-day', 'dated history URL opens History day view');
assert.strictEqual(t.getViewState().historyDay, '2026-05-02', 'history URL selects normalized day');

const revealCard = t.SENTENCES.find(sentence => Array.isArray(sentence.vocab) && sentence.vocab.length > 0);
const revealHtml = t.renderRevealDetails(revealCard, true, 'logic-');
assert(!revealHtml.includes('Meaning'), 'revealed details should not repeat the already visible translation');
assert(revealHtml.includes('Sentence vocab'), 'revealed details should include sentence vocab');
assert(!revealHtml.includes('Expected reply'), 'revealed details should not include expected reply guidance');
assert(!revealHtml.includes('Why it works'), 'revealed details should not include grammar guidance');
assert(!revealHtml.includes('Practice:'), 'revealed details should not include practice prompts');
const variantCard = t.SENTENCES.find(sentence => sentence.learn && Array.isArray(sentence.learn.variants) && sentence.learn.variants.length > 0);
const variantRevealHtml = t.renderRevealDetails(variantCard, true, 'variant-');
assert(variantRevealHtml.includes('Formal / informal'), 'revealed details should include formal/informal variants when available');
const missingSentenceVocabIds = Array.from(t.SENTENCES)
  .filter(sentence => !t.renderRevealDetails(sentence, true, 'all-').includes('Sentence vocab'))
  .map(sentence => sentence.id);
assert.deepStrictEqual(missingSentenceVocabIds, [], 'every sentence should render useful sentence vocab');
assert(!revealHtml.includes('Learn' + ' more'), 'revealed details must not contain old reveal-button copy');

console.log('logic-tests passed');
