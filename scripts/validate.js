const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const html = read('DEDaily.html');
const expectedScripts = [
  'src/content.js',
  'src/learning.js',
  'src/vocab.js',
  'src/grammar.js',
  'src/storage.js',
  'src/app.js'
];

const errors = [];
const topicTargets = {
  understand: 20,
  appointments: 18,
  admin: 20,
  housing: 18,
  health: 20,
  phone: 16,
  work: 18,
  transport: 18,
  services: 16,
  money: 16,
  social: 8,
  emergency: 12,
};
const trivialGreeting = /(^|\b)(hallo|hi|guten tag|wie geht|mir geht|i am good|i'm good|nice to meet you|schön,? .*kennenzulernen)(\b|$)/i;

function record(condition, message) {
  if (!condition) errors.push(message);
}

function uniqueNormalized(value) {
  return String(value || '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

for (const script of expectedScripts) {
  const escaped = script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  record(new RegExp(`src="${escaped}(?:\\?[^"]*)?"`).test(html), `DEDaily.html missing ${script}`);
}
record(/href="src\/styles\.css(?:\?[^"]*)?"/.test(html), 'DEDaily.html missing src/styles.css');
record(/rel="icon" href="src\/assets\/logo\.svg" type="image\/svg\+xml"/.test(html), 'DEDaily.html missing SVG favicon');
record(fs.existsSync(path.join(root, 'src/assets/logo.svg')), 'src/assets/logo.svg missing');
record(fs.existsSync(path.join(root, 'api/tts.js')), 'api/tts.js missing');

try {
  const vercelConfig = JSON.parse(read('vercel.json'));
  const rewrites = Array.isArray(vercelConfig.rewrites) ? vercelConfig.rewrites : [];
  const hasRootRewrite = rewrites.some(rewrite => (
    rewrite &&
    rewrite.source === '/' &&
    rewrite.destination === '/DEDaily.html'
  ));
  record(hasRootRewrite, 'vercel.json must rewrite / to /DEDaily.html');
} catch (error) {
  errors.push(`vercel.json invalid or missing: ${error.message}`);
}

const source = [
  read('src/content.js'),
  read('src/learning.js'),
  read('src/vocab.js'),
  read('src/grammar.js'),
  'globalThis.__dd = { TOPICS, PAT_CATS, PATTERNS, PATTERN_BY_ID, SENTENCE_SEEDS, SENTENCES, VOCAB_TOPICS, VOCAB_SOURCE_REFS, VOCAB_CARDS, GRAMMAR_MODULES, GRAMMAR_LESSONS };'
].join('\n');

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'validate-content.vm.js' });

const { TOPICS, PAT_CATS, PATTERNS, SENTENCE_SEEDS, SENTENCES, VOCAB_TOPICS, VOCAB_SOURCE_REFS, VOCAB_CARDS, GRAMMAR_MODULES, GRAMMAR_LESSONS } = sandbox.__dd;
const topicIds = new Set(TOPICS.map(t => t.id));
const catIds = new Set(PAT_CATS.map(c => c.id));
const allPatternIds = new Set(PATTERNS.map(p => p.id));
const activePatterns = PATTERNS.filter(p => p.status !== 'hidden');
const activePatternIds = new Set(activePatterns.map(p => p.id));
const hiddenPatternIds = new Set(PATTERNS.filter(p => p.status === 'hidden').map(p => p.id));
const sentenceIds = new Set();
const germanSentences = new Map();
const vocabTopicIds = new Set(VOCAB_TOPICS.map(t => t.id));
const vocabSourceIds = new Set(Object.keys(VOCAB_SOURCE_REFS));
const vocabIds = new Set();
const grammarModuleIds = new Set();
const grammarLessonIds = new Set();
const grammarLessonTitles = new Set();

record(SENTENCES.length === 200, `expected 200 sentences, found ${SENTENCES.length}`);
record(SENTENCE_SEEDS.length === 200, `expected 200 sentence seeds, found ${SENTENCE_SEEDS.length}`);
record(activePatterns.length === 50, `expected 50 active patterns, found ${activePatterns.length}`);
record(VOCAB_CARDS.length === 500, `expected 500 vocab cards, found ${VOCAB_CARDS.length}`);
record(VOCAB_TOPICS.length === 12, `expected 12 vocab topics, found ${VOCAB_TOPICS.length}`);
record(GRAMMAR_MODULES.length === 3, `expected 3 grammar modules, found ${GRAMMAR_MODULES.length}`);
record(GRAMMAR_LESSONS.length === 48, `expected 48 grammar lessons, found ${GRAMMAR_LESSONS.length}`);

for (const [topicId, expected] of Object.entries(topicTargets)) {
  const actual = SENTENCES.filter(s => s.t === topicId).length;
  record(actual === expected, `topic ${topicId} expected ${expected}, found ${actual}`);
}

for (const sentence of SENTENCES) {
  if (sentenceIds.has(sentence.id)) errors.push(`duplicate sentence id ${sentence.id}`);
  sentenceIds.add(sentence.id);

  for (const key of ['id', 't', 'de', 'en', 'ph', 'use', 'lv', 'register']) {
    record(Boolean(sentence[key]), `${sentence.id} missing ${key}`);
  }

  const normalizedGerman = uniqueNormalized(sentence.de);
  if (germanSentences.has(normalizedGerman)) {
    errors.push(`duplicate German sentence ${sentence.id} and ${germanSentences.get(normalizedGerman)}`);
  } else {
    germanSentences.set(normalizedGerman, sentence.id);
  }

  record(topicIds.has(sentence.t), `${sentence.id} invalid topic ${sentence.t}`);
  record(['A1', 'A2'].includes(sentence.lv), `${sentence.id} invalid level ${sentence.lv}`);
  record(!trivialGreeting.test(sentence.de) && !trivialGreeting.test(sentence.en), `${sentence.id} is trivial greeting/well-being filler`);

  if (!sentence.fixed && (!Array.isArray(sentence.patternIds) || sentence.patternIds.length === 0)) {
    errors.push(`${sentence.id} must have patternIds or fixed:true`);
  }

  for (const patternId of sentence.patternIds || []) {
    record(allPatternIds.has(patternId), `${sentence.id} invalid patternId ${patternId}`);
    record(!hiddenPatternIds.has(patternId), `${sentence.id} references hidden pattern ${patternId}`);
  }

  const learn = sentence.learn;
  if (!learn) {
    errors.push(`${sentence.id} missing learn object`);
    continue;
  }
  record(Boolean(learn.meaning), `${sentence.id} missing learn.meaning`);
  record(Boolean(learn.scenario), `${sentence.id} missing learn.scenario`);
  record(Boolean(learn.grammar && learn.grammar.title && learn.grammar.simple), `${sentence.id} incomplete learn.grammar`);
  record(Boolean(learn.expectedReply) && !/Listen for the key detail/.test(learn.expectedReply), `${sentence.id} has generic expectedReply`);
  record(Boolean(learn.learnerReply), `${sentence.id} missing learn.learnerReply`);
  record(Boolean(learn.practice) && !/Replace one slot in the pattern/.test(learn.practice), `${sentence.id} has generic practice`);

  if (Array.isArray(sentence.vocab)) {
    for (const [index, item] of sentence.vocab.entries()) {
      record(Boolean(item && item.de && item.en), `${sentence.id} vocab item ${index + 1} missing de/en`);
    }
  }
}

for (const topic of TOPICS) {
  record(Object.prototype.hasOwnProperty.call(topicTargets, topic.id), `unexpected topic ${topic.id}`);
}

for (const pattern of PATTERNS) {
  record(catIds.has(pattern.cat), `${pattern.id} invalid category ${pattern.cat}`);
  record(Boolean(pattern.template && pattern.meaning && pattern.grammar && pattern.watchOut), `${pattern.id} missing required pattern text`);
  record(Array.isArray(pattern.examples) && pattern.examples.length >= 2, `${pattern.id} needs at least two examples`);
  record(['A1', 'A2'].includes(pattern.level), `${pattern.id} invalid pattern level ${pattern.level}`);
  record(Number.isFinite(pattern.priority), `${pattern.id} missing numeric priority`);
  record(['active', 'hidden'].includes(pattern.status), `${pattern.id} invalid status ${pattern.status}`);
  record(Boolean(pattern.groupId), `${pattern.id} missing groupId`);
}

for (const pattern of activePatterns) {
  const referenced = SENTENCES.some(sentence => (sentence.patternIds || []).includes(pattern.id));
  record(referenced, `active pattern ${pattern.id} is not referenced`);
}

for (const card of VOCAB_CARDS) {
  if (vocabIds.has(card.id)) errors.push(`duplicate vocab id ${card.id}`);
  vocabIds.add(card.id);

  for (const key of ['id', 'de', 'en', 'pos', 'topic', 'level', 'priority']) {
    record(Boolean(card[key]), `${card.id} missing ${key}`);
  }

  record(vocabTopicIds.has(card.topic), `${card.id} invalid vocab topic ${card.topic}`);
  record(['A1', 'A2'].includes(card.level), `${card.id} invalid vocab level ${card.level}`);
  record(Number.isFinite(card.priority), `${card.id} missing numeric priority`);
  record(card.priority >= 1 && card.priority <= 500, `${card.id} priority out of range`);
  record(card.example && card.example.de && card.example.en, `${card.id} missing complete example`);
  record(Array.isArray(card.sourceRefs) && card.sourceRefs.length > 0, `${card.id} missing sourceRefs`);
  (card.sourceRefs || []).forEach(ref => record(vocabSourceIds.has(ref), `${card.id} invalid sourceRef ${ref}`));

  if (card.pos === 'noun') {
    const expectedGender = { der: 'm', die: 'f', das: 'n' }[card.article];
    record(Boolean(expectedGender), `${card.id} noun missing valid article`);
    record(card.gender === expectedGender, `${card.id} noun article/gender mismatch`);
    record(Boolean(card.plural), `${card.id} noun missing plural`);
  } else {
    record(!card.article && !card.gender, `${card.id} non-noun should not carry article/gender`);
  }
}

const expectedGrammarModules = ['a1', 'a2', 'b1'];
const expectedGrammarLessonCounts = { a1: 13, a2: 17, b1: 18 };
record(JSON.stringify(GRAMMAR_MODULES.map(m => m.id)) === JSON.stringify(expectedGrammarModules), 'grammar modules must run A1, A2, B1 in order');
for (const module of GRAMMAR_MODULES) {
  if (grammarModuleIds.has(module.id)) errors.push(`duplicate grammar module id ${module.id}`);
  grammarModuleIds.add(module.id);
  for (const key of ['id', 'level', 'title', 'subtitle', 'outcome']) {
    record(Boolean(module[key]), `${module.id} missing ${key}`);
  }
  record(Array.isArray(module.lessons) && module.lessons.length === expectedGrammarLessonCounts[module.id], `${module.id} must have ${expectedGrammarLessonCounts[module.id]} lessons`);
  for (const lesson of module.lessons || []) {
    if (grammarLessonIds.has(lesson.id)) errors.push(`duplicate grammar lesson id ${lesson.id}`);
    grammarLessonIds.add(lesson.id);
    const normalizedTitle = uniqueNormalized(lesson.title);
    if (grammarLessonTitles.has(normalizedTitle)) errors.push(`duplicate grammar lesson title ${lesson.title}`);
    grammarLessonTitles.add(normalizedTitle);
    for (const key of ['id', 'title', 'focus', 'explanation', 'tip']) {
      record(Boolean(lesson[key]), `${lesson.id} missing ${key}`);
    }
    record(String(lesson.explanation || '').length >= 100, `${lesson.id} explanation too short`);
    record(Array.isArray(lesson.rules) && lesson.rules.length >= 3, `${lesson.id} needs at least 3 rules`);
    record(Array.isArray(lesson.examples) && lesson.examples.length >= 3, `${lesson.id} needs at least 3 examples`);
    record(Array.isArray(lesson.mistakes) && lesson.mistakes.length >= 2, `${lesson.id} needs at least 2 common mistakes`);
    record(Array.isArray(lesson.practice) && lesson.practice.length >= 2, `${lesson.id} needs at least 2 practice tasks`);
    for (const [index, example] of (lesson.examples || []).entries()) {
      record(Boolean(example && example.de && example.en), `${lesson.id} example ${index + 1} missing de/en`);
    }
    record(new Set((lesson.examples || []).map(example => uniqueNormalized(example.de))).size === lesson.examples.length, `${lesson.id} needs unique German examples for exercises`);
    record(new Set((lesson.examples || []).map(example => uniqueNormalized(example.en))).size === lesson.examples.length, `${lesson.id} needs unique English examples for exercises`);
  }
}

const sentencePatternContracts = [
  ['ask_availability', s => /\bfreie(?:n|r|s)? Termin\b/.test(s.de), 'should only tag available-appointment sentences'],
  ['symptom_since', s => /\bseit\b/i.test(s.de), 'should include seit duration wording'],
  ['call_about', s => /\brufe\b.*\bwegen\b.*\ban\b/i.test(s.de), 'should match calling-about wording'],
  ['permission', s => /^Darf ich\b/.test(s.de), 'should use Darf ich permission wording'],
  ['deadline_until', s => /^Bis wann\b/.test(s.de) && /\bmuss ich\b/.test(s.de), 'should ask by when I must do something'],
  ['problem_with', s => /\bProblem mit\b/.test(s.de), 'should use Problem mit wording'],
  ['submit_send', s => /\bhabe\b.*\b(eingereicht|geschickt|hochgeladen)\b/i.test(s.de), 'should describe submitting or sending'],
  ['want_appointment', s => /^Ich möchte\b.*\bTermin\b/.test(s.de), 'should request making or booking an appointment'],
  ['unable_work', s => /^Ich bin(?: leider)? krank und\b/.test(s.de), 'should use sick-and-unable wording'],
  ['want_polite_action', s => /^Ich möchte\b/.test(s.de), 'should use Ich möchte polite request wording'],
  ['not_working', s => /\bfunktioniert\b.*\bnicht\b/.test(s.de), 'should use funktioniert nicht wording'],
  ['work_clarify', s => /^Können wir kurz klären,/.test(s.de), 'should use kurz klären wording'],
  ['let_know', s => /\bBescheid\b/.test(s.de), 'should use Bescheid wording'],
  ['looking_for', s => /^Ich suche\b/.test(s.de), 'should use Ich suche wording'],
  ['exchange_return', s => /^Ich möchte\b.*\b(umtauschen|zurückgeben)\b/.test(s.de), 'should use Ich möchte exchange/return wording'],
  ['urgent_help', s => /^Ich brauche dringend\b/.test(s.de), 'should use dringend urgent-help wording'],
  ['give_name', s => /\b(heiße|Name)\b/.test(s.de), 'should give a name'],
  ['give_address', s => /\bAdresse\b/.test(s.de) || /\bwohne\b/.test(s.de), 'should give an address'],
  ['give_phone', s => /\bTelefonnummer\b/.test(s.de) || /\bNummer\b/.test(s.de), 'should give a phone number'],
  ['need_moment', s => /\bMoment\b/.test(s.de), 'should ask for a moment'],
  ['spell_detail', s => /\bbuchstabieren\b|\bBuchstabiere\b/i.test(s.de), 'should ask to spell'],
  ['ask_urgent', s => /\bdringend\b/.test(s.de), 'should ask whether it is urgent'],
  ['ask_location', s => /^Wo\b/.test(s.de), 'should ask where something is'],
  ['received_item', s => /\bbekommen\b|\berhalten\b/.test(s.de), 'should say an item was received'],
  ['lost_or_forgot', s => /\bverloren\b|\bvergessen\b/.test(s.de), 'should describe something lost or forgotten'],
];

for (const [patternId, predicate, message] of sentencePatternContracts) {
  for (const sentence of SENTENCES) {
    if ((sentence.patternIds || []).includes(patternId) && !predicate(sentence)) {
      errors.push(`${sentence.id} misleading patternId ${patternId}: ${message}`);
    }
  }
}

const requiredVocabCards = {
  ad26: ['Fristverlängerung'],
  ad27: ['Kopie'],
  ho21: ['Nebenkostenabrechnung'],
  ho22: ['Wohnungsgeberbestätigung'],
  ho23: ['Kaution'],
  mn17: ['Lastschriftmandat'],
  mn18: ['Mahnung'],
};
for (const [id, words] of Object.entries(requiredVocabCards)) {
  const sentence = SENTENCES.find(s => s.id === id);
  record(Boolean(sentence), `${id} missing`);
  if (sentence) {
    const vocab = Array.isArray(sentence.vocab) ? sentence.vocab.map(item => item.de).join(' ') : '';
    for (const word of words) record(vocab.includes(word), `${id} missing reveal vocab ${word}`);
  }
}

const formalInformal = SENTENCES.filter(s => {
  const variants = s.learn && Array.isArray(s.learn.variants) ? s.learn.variants : [];
  return variants.some(v => /formal/i.test(v.label)) && variants.some(v => /informal/i.test(v.label));
});
record(formalInformal.length >= 18, `expected at least 18 formal/informal cards, found ${formalInformal.length}`);

const sourceText = [
  read('src/content.js'),
  read('src/app.js'),
  read('src/styles/cards.css'),
  read('src/styles/enhancements.css'),
].join('\n');
const sentenceSourceText = read('src/content.js');
const grammarSourceText = read('src/grammar.js');
record(!/\bsource(?:Url|Refs)\b/.test(grammarSourceText), 'grammar source metadata remains');
record(!/https?:\/\//.test(grammarSourceText), 'grammar source contains external links');
const legacyLevelClass = '.l' + 'B' + '1';
record(!sourceText.includes(legacyLevelClass), 'legacy level style remains');
const oldRevealCopy = new RegExp('Learn' + ' more', 'i');
record(!oldRevealCopy.test(sourceText), 'old reveal-button copy remains');
const oldRevealFunctions = new RegExp(('toggle' + 'LearnMore') + '|' + ('renderSentence' + 'LearnPanel'));
record(!oldRevealFunctions.test(sourceText), 'old reveal functions remain');
const retiredLevelPattern = new RegExp('(^|[^A-Z0-9])' + 'B' + '1' + '([^A-Z0-9]|$)');
record(!retiredLevelPattern.test(sentenceSourceText), 'advanced level label remains in sentence source');
const oldSentenceUseClass = 'sentence' + '-use';
record(!sourceText.includes(oldSentenceUseClass), 'old sentence class remains');

const topicCounts = Object.fromEntries(TOPICS.map(t => [t.id, SENTENCES.filter(s => s.t === t.id).length]));
const vocabTopicCounts = Object.fromEntries(VOCAB_TOPICS.map(t => [t.id, VOCAB_CARDS.filter(card => card.topic === t.id).length]));
const levelCounts = SENTENCES.reduce((acc, s) => {
  acc[s.lv] = (acc[s.lv] || 0) + 1;
  return acc;
}, {});
const activePatternReferences = Object.fromEntries(activePatterns.map(pattern => [
  pattern.id,
  SENTENCES.filter(sentence => (sentence.patternIds || []).includes(pattern.id)).length,
]));

const report = {
  sentences: SENTENCES.length,
  seeds: SENTENCE_SEEDS.length,
  topics: TOPICS.length,
  activePatterns: activePatterns.length,
  vocabCards: VOCAB_CARDS.length,
  grammarModules: GRAMMAR_MODULES.length,
  grammarLessons: GRAMMAR_LESSONS.length,
  formalInformal: formalInformal.length,
  topicCounts,
  vocabTopicCounts,
  levelCounts,
  activePatternReferences,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exit(1);
